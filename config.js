
const CHAIN_SEPOLIA = '16015286601757825753'
const CHAIN_BASE_SEPOLIA = '10344971235874465080'
const CHAIN_FUJI = '14767482510784806043'

const CHAINS = {
    [CHAIN_SEPOLIA]: {
        id: 11155111,
        name: 'Sepolia',
        url: 'https://rpc.ankr.com/eth_sepolia',
        testnet: true,
        mixer: '0x0866027A11f68e2Cc57326d01F5827Bb6e8001a8',
        tokens: [
            { symbol: 'ETH', native: true, decimals: 18 },
            { symbol: 'CCIP-BnM', address: '0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05', decimals: 18, limit: 100_000 },
            { symbol: 'CCIP-LnM', address: '0x466D489b6d36E7E3b824ef491C225F5830E81cC1', decimals: 18, limit: 100_000 },
            { symbol: 'USDC', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6 },
        ],
        supports: {
            [CHAIN_BASE_SEPOLIA]: [ 'ETH', 'CCIP-BnM', 'CCIP-LnM', 'USDC' ],
            [CHAIN_FUJI]: [ 'ETH', 'CCIP-BnM', 'CCIP-LnM', 'USDC' ],
        }
    },
    [CHAIN_BASE_SEPOLIA]: {
        id: 84532,
        name: 'Base Sepolia',
        url: 'https://base-sepolia.publicnode.com',
        testnet: true,
        mixer: '0x4D321e44e57bEd781f96936413BBcD54c8f5d255',
        tokens: [
            { symbol: 'ETH', native: true, decimals: 18 },
            { symbol: 'CCIP-BnM', address: '0x88A2d74F47a237a62e7A51cdDa67270CE381555e', decimals: 18, limit: 100_000 },
            { symbol: 'CCIP-LnM', address: '0xA98FA8A008371b9408195e52734b1768c0d1Cb5c', decimals: 18, limit: 100_000 },
            { symbol: 'USDC', address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', decimals: 6 },
        ],
        supports: {
            [CHAIN_SEPOLIA]: [ 'ETH', 'CCIP-BnM', 'CCIP-LnM', 'USDC' ],
            [CHAIN_FUJI]: [ 'ETH', 'CCIP-BnM', 'CCIP-LnM', 'USDC' ],
        }
    },
    [CHAIN_FUJI]: {
        id: 43113,
        name: 'Avalanche Fuji',
        url: 'https://api.avax-test.network/ext/bc/C/rpc',
        mixer: '0x4bD4687e7cCc56C62A5a2AeC1a201b32492D1b04',
        testnet: true,
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
}

module.exports = {
    CHAIN_SEPOLIA,
    CHAIN_BASE_SEPOLIA,
    CHAIN_FUJI,
    CHAINS,
}