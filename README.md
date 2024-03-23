# CCIP Telegram bot

## Install packages
```shell
npm install
```
## Deploy contracts
1) Configuration
- .env
  define 2 items
  ```
  BOT_TOKEN=...
  DEPLOYER_KEY=...
  ```
- hardhat.config.js
  Add mainnet configurations.
  ```javascript
  ethereum: {
      url: 'https://rpc.ankr.com/eth',
      chainId: 1,
      accounts: [pvkey]
  },
  ```
  Remember to describe api key to verify contracts.
- config.json
  ```json
  "ethereum": {
        "CHAIN_SELECTOR": "5009297550715157269",
        "SWAP_ROUTER_ADDRESS": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        "SWAP_ROUTER_VERSION": 0,
        "CCIP_ADDRESS": "0x80226fc0Ee2b096224EeAc085Bb9a8cba1146f7D",
        "USDC_ADDRESS": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  }
  ```
  You can find these values of CHAIN_SELECTOR, CCIP_ADDRESS, USDC_ADDRESS from [CCIP Docs](https://docs.chain.link/ccip/supported-networks/v1_2_0/mainnet)
  SWAP_ROUTER_VERSION is one of 0~3(0: UNISWAP_V2, 1: UNISWAP_V3, 2: TRADERJOE, 3: UNIVERSAL), but now only UNISWAP_V2 and TRADERJOE are available.
2) Deploy
- Run deploy.js script for all chains
  ```shell
  npx hardhat run scripts/deploy.js --network ethereum
  ```
- Run verify.js script if contract has not been verified
  ```shell
  npx hardhat run scripts/deploy.js --network ethereum
  ```
- Update destination config of contract after all deployment done
  After deployment you can see that MIXER_ADDRESS field was added to config.json file.
  I did not prepare script for this transaction.
  So you can execute this method using block explorer.
  ```solidity
  Mixer.setDestinationChain(uint64 _chainSelector, address _receiver, address _token)
  ```
  * _chainSelector is CHAIN_SELECTOR value of target chain to bridge
  * _receiver is MIXER_ADDRESS value of target chain to bridge
  * _token is bridge token (maybe USDC) of source chain
## Deploy bot
1) Configuration config.js
```js
[CHAIN_FUJI]: {
    id: 43113,
    name: 'Avalanche Fuji',
    url: 'https://api.avax-test.network/ext/bc/C/rpc',
    mixer: '0x4bD4687e7cCc56C62A5a2AeC1a201b32492D1b04',
    tokens: [
        { symbol: 'AVAX', native: true, decimals: 18 },
        { symbol: 'CCIP-BnM', address: '0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4', decimals: 18, limit: 100_000 },
        { symbol: 'CCIP-LnM', address: '0x70F5c5C40b873EA597776DA2C21929A8282A3b35', decimals: 18, limit: 100_000 },
        { symbol: 'USDC', address: '0x5425890298aed601595a70AB815c96711a31Bc65', decimals: 6 },
    ],
    supports: {
        [CHAIN_SEPOLIA]: [ 'AVAX', 'CCIP-BnM', 'CCIP-LnM', 'USDC' ],
        [CHAIN_BASE_SEPOLIA]: [ 'AVAX', 'CCIP-BnM', 'CCIP-LnM', 'USDC' ],
    }
},
```
2) Run bot
```shell
node index.js
```
