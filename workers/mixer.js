const { ethers } = require('ethers')
const { parentPort, workerData } = require('node:worker_threads')
const abiERC20 = require("../abi/ERC20.json")
const abiMixer = require("../abi/Mixer.json")

const { id, privateKey, srcChainId, dstChainId, srcChain, dstChain, token, amount, recipient } = workerData

const schedule = async () => {
    try {
        const srcProvider = new ethers.providers.JsonRpcProvider(srcChain.url, srcChain.id)
        const signer = new ethers.Wallet(privateKey, srcProvider)
        const isNative = token.native
        const ethBalance = await signer.getBalance()
        const tokenContract = isNative ? undefined : new ethers.Contract(token.address, abiERC20, signer)
        const tokenBalance = isNative
            ? ethBalance
            : await tokenContract.balanceOf(signer.address)
        const mixerContract = new ethers.Contract(srcChain.mixer, abiMixer, signer)
        const value = ethers.utils.parseUnits(amount, token.decimals)
        if(!isNative) 
            await (await tokenContract.approve(mixerContract.address, value.mul(2))).wait()
        const [ccipFee, platformFee] = await mixerContract.buildMessage(
            dstChainId, 
            recipient, 
            isNative ? ethers.constants.AddressZero : token.address, 
            value,
        )
        const EVENT_SENT = '0xe7ec12acc6c8756a0ff8430f1b8f176852d6ef9ac30d00bfde04936c6d998b0b'
        let tx = undefined
        if(isNative) {
            if(tokenBalance.lt(value.add(ccipFee).add(platformFee)))
                throw Error('Insufficient balance')
            tx = await mixerContract.ccipSend(
                dstChainId, 
                recipient, 
                ethers.constants.AddressZero, 
                value, 
                { value: value.add(ccipFee).add(platformFee) }
            )
        } else {
            if(tokenBalance.lt(value.add(platformFee)))
                throw Error(`Insufficient ${token.symbol} balance`)
            if(ethBalance.lt(ccipFee))
                throw Error(`Insufficient gas`)
            tx = await mixerContract.ccipSend(
                dstChainId, 
                recipient, 
                token.address, 
                value, 
                { value: ccipFee }
            )
        }
        if(tx) {
            const recept = await tx.wait()
            const messageId = recept.logs.find(log => log.address==srcChain.mixer && log.topics[0]==EVENT_SENT)?.topics[1]
            const message = {
                id: messageId,
                hash: recept.transactionHash,
                srcChainId, 
                dstChainId, 
                token: token.symbol, 
                amount, 
                recipient,
                sentAt: Date.now(),
                state: 1
            }
            parentPort.postMessage({
                id,
                event: 'done',
                data: message
            })
        } else
            throw Error("Reverted")
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