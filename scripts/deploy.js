const { ethers, network } = require('hardhat')
const { writeFileSync } = require('fs')
const config = require('../config.json')

async function deploy(artifact, ...args) {
    const factory = await ethers.getContractFactory(artifact)
    const contract = await factory.deploy(...args)
    await contract.deployed()
    console.log('deployed', contract.address, [artifact, '(', args.join(','), ')'].join(''))
    return contract
}

async function verify(contractAddress, args, artifact = undefined, retry = 3) {
    if (["hardhat", "localhost"].includes(network.name)) 
        return
    console.log("/********************************************************")
    for (let i = 0; i < retry; i++) {
        try {
            await hre.run("verify:verify", {
                address: contractAddress,
                constructorArguments: args,
                contract: artifact
            })
            break
        } catch (ex) {
            console.log("\t* Failed verify", args?.join(','), ex)
            await sleep(5)
        }
    }
    console.log("********************************************************/")
}

async function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

async function main() {
    const [deployer] = await ethers.getSigners()

    const {UNISWAP_ADDRESS, CCIP_ADDRESS, USDC_ADDRESS, BnM_ADDRESS, LnM_ADDRESS} = config[network.name]

    // const UniswapRouter = await ethers.getContractAt(
    //     "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol:IUniswapV2Router02", 
    //     UNISWAP_ADDRESS
    // )
    // const USDC = await ethers.getContractAt(
    //     "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    //     USDC_ADDRESS
    // )
    // const BnM = await ethers.getContractAt(
    //     "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    //     BnM_ADDRESS
    // )
    // const LnM = await ethers.getContractAt(
    //     "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    //     LnM_ADDRESS
    // )
    // await (await USDC.approve(UniswapRouter.address, ethers.utils.parseEther('1000000000'))).wait()
    // await (await UniswapRouter.addLiquidityETH(
    //     USDC.address,
    //     ethers.utils.parseEther('3'),
    //     0,
    //     0,
    //     deployer.address,
    //     '999999999999999',
    //     { value: ethers.utils.parseEther('0.5') }
    // )).wait()
    // await (await BnM.approve(UniswapRouter.address, ethers.utils.parseEther('1000000000'))).wait()
    // await (await UniswapRouter.addLiquidityETH(
    //     BnM.address,
    //     ethers.utils.parseEther('5'),
    //     0,
    //     0,
    //     deployer.address,
    //     '999999999999999',
    //     { value: ethers.utils.parseEther('2') }
    // )).wait()
    const args = [CCIP_ADDRESS, UNISWAP_ADDRESS, 2]
    const Mixer = await deploy("contracts/Mixer.sol:Mixer", ...args)
    config[network.name].MIXER_ADDRESS = Mixer.address
    writeFileSync('./config.json', JSON.stringify(config, undefined, 4))
    await sleep(10)
    await verify(Mixer.address, args, "contracts/Mixer.sol:Mixer")
}

main()