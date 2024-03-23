const { network } = require('hardhat')
const config = require('../config.json')

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
    const {UNISWAP_ADDRESS, CCIP_ADDRESS, MIXER_ADDRESS} = config[network.name]

    await verify(MIXER_ADDRESS, [CCIP_ADDRESS, UNISWAP_ADDRESS, 2], "contracts/Mixer.sol:Mixer")
}

main()