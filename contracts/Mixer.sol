// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {IJoeRouter02} from "@traderjoe-xyz/core/contracts/traderjoe/interfaces/IJoeRouter02.sol";
// import {IUniversalRouter} from "@uniswap/universal-router/contracts/interfaces/IUniversalRouter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

enum SWAP_ROUTER_VERSION {
    UNISWAP_V2, UNISWAP_V3, TRADERJOE, UNIVERSAL
}

struct DestinationChain {
    address receiver;
    address token;
}

struct SwapRouter {
    address router;
    SWAP_ROUTER_VERSION version;
}

library SwapLibrary {
    error UnsupportedSwapRouter(SWAP_ROUTER_VERSION);

    function _WETH(SwapRouter storage swapRouter) private view returns (address) {
        if(swapRouter.version == SWAP_ROUTER_VERSION.UNISWAP_V2) {
            return IUniswapV2Router02(swapRouter.router).WETH();
        } else if(swapRouter.version == SWAP_ROUTER_VERSION.TRADERJOE) {
            return IJoeRouter02(swapRouter.router).WAVAX();
        }
        revert UnsupportedSwapRouter(swapRouter.version);
    }

    function getAmountOut(SwapRouter storage swapRouter, address token, uint256 amountIn) internal view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = _WETH(swapRouter);
        path[1] = token;
        if(swapRouter.version == SWAP_ROUTER_VERSION.UNISWAP_V2) {
            uint256[] memory amounts = IUniswapV2Router02(swapRouter.router).getAmountsOut(amountIn, path);
            return amounts[1];
        } else if(swapRouter.version == SWAP_ROUTER_VERSION.TRADERJOE) {
            uint256[] memory amounts = IJoeRouter02(swapRouter.router).getAmountsOut(amountIn, path);
            return amounts[1];
        }
        revert UnsupportedSwapRouter(swapRouter.version);
    }

    function buy(SwapRouter storage swapRouter, address token, uint256 amount) internal {
        address[] memory path = new address[](2);
        path[0] = _WETH(swapRouter);
        path[1] = token;
        if(swapRouter.version == SWAP_ROUTER_VERSION.UNISWAP_V2) {
            IUniswapV2Router02(swapRouter.router).swapExactETHForTokensSupportingFeeOnTransferTokens{value: amount}(
                0, path, address(this), block.timestamp
            );
        } else if(swapRouter.version == SWAP_ROUTER_VERSION.TRADERJOE) {
            IJoeRouter02(swapRouter.router).swapExactAVAXForTokensSupportingFeeOnTransferTokens{value: amount}(
                amount, path, address(this), block.timestamp
            );
        } else {
            revert UnsupportedSwapRouter(swapRouter.version);
        }
    }

    function sell(SwapRouter storage swapRouter, address token, uint256 amount, address receiver) internal {
        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = _WETH(swapRouter);
        IERC20(token).approve(swapRouter.router, amount);
        if(swapRouter.version == SWAP_ROUTER_VERSION.UNISWAP_V2) {
            IUniswapV2Router02(swapRouter.router).swapExactTokensForETHSupportingFeeOnTransferTokens(
                amount, 0, path, receiver, block.timestamp
            );
        } else if(swapRouter.version == SWAP_ROUTER_VERSION.TRADERJOE) {
            IJoeRouter02(swapRouter.router).swapExactTokensForAVAXSupportingFeeOnTransferTokens(
                amount, 0, path, receiver, block.timestamp
            );
        } else {
            revert UnsupportedSwapRouter(swapRouter.version);
        }
    }
}

contract Mixer is CCIPReceiver, OwnerIsCreator {
    using SwapLibrary for SwapRouter;

    address private s_ccipRouter;
    SwapRouter private s_swapRouter;

    uint32 public feeRate = 100;
    mapping(uint64 => DestinationChain) public destinationChains;

    error CannotSendETH();
    error InsufficientETH();
    error UnsupportedDestinationChain(uint64);
    error UnsupportedDestinationToken(address);

    event TokenTransferred(
        bytes32 indexed messageId,
        uint256 indexed destinationChainSelector,
        address token,
        address receiver,
        uint256 amount
    );

    event TokenReceived(
        bytes32 indexed messageId,
        uint256 indexed sourceChainSelector,
        address token,
        address sender,
        address receiver,
        uint256 amount
    );

    constructor(address _ccipRouter, address _swapRouter, SWAP_ROUTER_VERSION _swapVersion) CCIPReceiver(_ccipRouter) {
        s_ccipRouter = _ccipRouter;
        s_swapRouter = SwapRouter({
            router: _swapRouter,
            version: _swapVersion
        });
    }

    receive() external payable {}

    function buildMessage(
        uint64 _destinationChainSelector,
        address _receiver,
        address _token,
        uint256 _amount
    ) public view returns (uint256, uint256, Client.EVM2AnyMessage memory) {
        if(!IRouterClient(s_ccipRouter).isChainSupported(_destinationChainSelector))
            revert UnsupportedDestinationChain(_destinationChainSelector);

        uint256 platformFee = _amount * feeRate / 10000;

        DestinationChain memory dstChain = destinationChains[_destinationChainSelector];
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);

        if(_token==address(0)) {
            tokenAmounts[0] = Client.EVMTokenAmount({
                token: dstChain.token,
                amount: s_swapRouter.getAmountOut(dstChain.token, _amount)
            });
        } else {
            tokenAmounts[0] = Client.EVMTokenAmount({
                token: _token,
                amount: _amount
            });
        }

        address[] memory availableTokens = IRouterClient(s_ccipRouter).getSupportedTokens(_destinationChainSelector);
        bool found = false;
        for(uint256 i = 0; i < availableTokens.length; i++) {
            if(availableTokens[i]==tokenAmounts[0].token) {
                found = true;
                break;
            }
        }
        if(!found)
            revert UnsupportedDestinationToken(_token);

        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(dstChain.receiver),
            data: abi.encode(_token==address(0), _receiver),
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: address(0)
        });

        uint256 ccipFee = IRouterClient(s_ccipRouter).getFee(
            _destinationChainSelector,
            evm2AnyMessage
        );

        return (
            ccipFee,
            platformFee,
            evm2AnyMessage
        );
    }

    function ccipSend(
        uint64 _destinationChainSelector,
        address _receiver,
        address _token,
        uint256 _amount
    ) public payable {
        (uint256 ccipFee, uint256 platformFee, Client.EVM2AnyMessage memory evm2AnyMessage) = buildMessage(
            _destinationChainSelector,
            _receiver,
            _token,
            _amount
        );

        if(_token == address(0)) {
            if(_amount + platformFee + ccipFee > msg.value)
                revert InsufficientETH();
            else if(_amount + platformFee + ccipFee < msg.value) {
                (bool success, ) = payable(msg.sender).call{value: msg.value - _amount - platformFee - ccipFee}("");
                if(!success)
                    revert CannotSendETH();
            }

            address token = evm2AnyMessage.tokenAmounts[0].token;
            uint256 amount = evm2AnyMessage.tokenAmounts[0].amount;

            s_swapRouter.buy(token, _amount);

            IERC20(token).approve(s_ccipRouter, amount);
        } else {
            if(ccipFee > msg.value)
                revert InsufficientETH();
            else if(ccipFee < msg.value) {
                (bool success, ) = payable(msg.sender).call{value: msg.value - ccipFee}("");
                if(!success)
                    revert CannotSendETH();
            }
            
            IERC20(_token).transferFrom(msg.sender, address(this), _amount + platformFee);
            IERC20(_token).approve(s_ccipRouter, _amount);
        }

        bytes32 messageId = IRouterClient(s_ccipRouter).ccipSend{value: ccipFee}(
            _destinationChainSelector,
            evm2AnyMessage
        );

        emit TokenTransferred(
            messageId,
            _destinationChainSelector,
            _token,
            _receiver,
            _amount
        );
    }

    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    ) internal override {
        (bool asETH, address receiver) = abi.decode(any2EvmMessage.data, (bool, address));
        address token = any2EvmMessage.destTokenAmounts[0].token;
        uint256 amount = any2EvmMessage.destTokenAmounts[0].amount;

        if(asETH) {
            uint256 balance = address(receiver).balance;
            s_swapRouter.sell(token, amount, receiver);
            emit TokenReceived(
                any2EvmMessage.messageId,
                any2EvmMessage.sourceChainSelector,
                address(0),
                abi.decode(any2EvmMessage.sender, (address)),
                receiver,
                address(receiver).balance - balance
            );
        } else {
            IERC20(token).transfer(receiver, amount);
            emit TokenReceived(
                any2EvmMessage.messageId,
                any2EvmMessage.sourceChainSelector,
                token,
                abi.decode(any2EvmMessage.sender, (address)),
                receiver,
                amount
            );
        }
    }

    function setDestinationChain(uint64 _chainSelector, address _receiver, address _token) public onlyOwner {
        destinationChains[_chainSelector] = DestinationChain({
            receiver: _receiver,
            token: _token
        });
    }

    function withdraw(address _token, address _recipient) public onlyOwner {
        if(_token==address(0)) {
            (bool success, ) = payable(_recipient).call{ value: address(this).balance }("");
            if(!success)
                revert CannotSendETH();
        } else {
            IERC20(_token).transfer(_recipient, IERC20(_token).balanceOf(address(this)));
        }
    }
}