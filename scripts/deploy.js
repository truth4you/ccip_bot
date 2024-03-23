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
    const {SWAP_ROUTER_ADDRESS, SWAP_ROUTER_VERSION, CCIP_ADDRESS} = config[network.name]

    const args = [CCIP_ADDRESS, SWAP_ROUTER_ADDRESS, SWAP_ROUTER_VERSION]
    const Mixer = await deploy("contracts/Mixer.sol:Mixer", ...args)
    config[network.name].MIXER_ADDRESS = Mixer.address
    writeFileSync('./config.json', JSON.stringify(config, undefined, 4))
    await sleep(10)
    await verify(Mixer.address, args, "contracts/Mixer.sol:Mixer")
}

main()