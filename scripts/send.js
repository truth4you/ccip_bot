const { ethers, network } = require('hardhat')
const config = require('../config.json')

async function main() {
    const [deployer] = await ethers.getSigners()

    const {MIXER_ADDRESS, USDC_ADDRESS, BnM_ADDRESS, LnM_ADDRESS} = config[network.name]

    const USDC = await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        USDC_ADDRESS
    )
    const BnM = await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        BnM_ADDRESS
    )
    const LnM = await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        LnM_ADDRESS
    )
    const Mixer = await ethers.getContractAt("Mixer", MIXER_ADDRESS)
    const chainSelector = network.name == "sepolia" ? config.basesepolia.CHAIN_SELECTOR : config.sepolia.CHAIN_SELECTOR
    {
        const value = ethers.utils.parseEther("0.05")
        const [ccipFee, platformFee] = await Mixer.buildMessage(
            chainSelector,
            deployer.address,
            LnM.address,
            value
        )
        await (await LnM.approve(Mixer.address, value.add(platformFee))).wait()
        const tx = await (await Mixer.ccipSend(chainSelector, deployer.address, LnM.address, value, { value: ccipFee })).wait()
        const TOPIC_EXECUTE = '0xe7ec12acc6c8756a0ff8430f1b8f176852d6ef9ac30d00bfde04936c6d998b0b'
        const messageId = tx.logs.find(log => log.address==Mixer.address && log.topics[0]==TOPIC_EXECUTE)?.topics[1]
        console.log('message', messageId)
    }
    // {
    //     const value = ethers.utils.parseEther("0.1")
    //     const [ccipFee, platformFee] = await Mixer.buildMessage(
    //         chainSelector,
    //         deployer.address,
    //         ethers.constants.AddressZero,
    //         value
    //     )
    //     const tx = await (await Mixer.ccipSend(chainSelector, deployer.address, ethers.constants.AddressZero, value, { value: value.add(ccipFee).add(platformFee) })).wait()
    //     const TOPIC_EXECUTE = '0xe7ec12acc6c8756a0ff8430f1b8f176852d6ef9ac30d00bfde04936c6d998b0b'
    //     const messageId = tx.logs.find(log => log.address==Mixer.address && log.topics[0]==TOPIC_EXECUTE)?.topics[1]
    //     console.log('message', messageId)
    // }
}

main()