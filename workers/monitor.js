const { ethers } = require('ethers')
const { parentPort, workerData } = require('node:worker_threads')
const abiMixer = require("../abi/Mixer.json")

const { id, dstChain, sentAt } = workerData

const schedule = async () => {
    try {
        const dstProvider = new ethers.providers.JsonRpcProvider(dstChain.url, dstChain.id)
        const mixerContract = new ethers.Contract(dstChain.mixer, abiMixer, dstProvider)
        const filter = mixerContract.filters.TokenReceived(id)
        dstProvider.on(filter, () => {
            parentPort.postMessage({
                id,
                event: 'done'
            })
            clearInterval(timer)
        })
        let lastBlock = "latest"
        const timer = setInterval(async () => {
            const block = await dstProvider.getBlock(lastBlock)
            if(block.timestamp * 1000 > sentAt) {
                lastBlock = block.number - 300
                const events = await mixerContract.queryFilter(
                    filter, lastBlock, block.number
                )
                if(events && events.length) {
                    clearInterval(timer)            
                    parentPort.postMessage({
                        id,
                        event: 'done'
                    })
                }
            } else {
                clearInterval(timer)
            }
        }, 5000)
        setInterval(() => {
            parentPort.postMessage({
                id,
                event: 'update'
            })
        }, 30 * 1000)
    } catch(ex) {
        parentPort.postMessage({
            id,
            event: 'error',
            data: ex.message
        })
    }
}

schedule()

parentPort.once('message', () => {
    parentPort.postMessage({
        id,
        event: 'exit',
    })
})