require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()

const pvkey = process.env.DEPLOYER_KEY

module.exports = {
  networks: {
    ethereum: {
      url: 'https://rpc.ankr.com/eth',
      chainId: 1,
      accounts: [pvkey]
    },
    sepolia: {
      url: `https://rpc.ankr.com/eth_sepolia`,
      accounts: [pvkey],
      chainId: 11155111,
    },
    basesepolia: {
      url: 'https://base-sepolia.publicnode.com',
      chainId: 84532,
      accounts: [pvkey],
    },
    fuji: {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      chainId: 43113,
      accounts: [pvkey],
    },
  },
  etherscan: {
    apiKey: {
      ethereum: "C7MSIMK1FXRGYMB39IHUURH68KIEVDPUH2",
      sepolia: "C7MSIMK1FXRGYMB39IHUURH68KIEVDPUH2",
      basesepolia: "625N7GC5238WP837PCH6D9QI6TE1USBPDT",
      avalancheFujiTestnet: 'ZGR21YGDGQSIVXI5B2NR5K73MFCDI4QPH8',
    },
    customChains: [
      {
        network: "basesepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      },
    ]
  },
  solidity: {
    compilers: [
      {
        version: "0.5.16",
      },
      {
        version: "0.6.6",
      },
      {
        version: "0.8.19",
      },
      {
        version: "0.8.20",
      },
    ],
  },
};
