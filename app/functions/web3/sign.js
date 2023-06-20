const { isValidAuthToken } = require("../crypto")
const functions = require("firebase-functions")
const Web3 = require('web3')
const HDWalletProvider = require("@truffle/hdwallet-provider")
const abi = require("./abi/Splitter.json")
const { artis_buffer_addr: bufferAddr } = functions.config().web3
const ipfs = functions.config().ipfs

const runtimeOptions = { minInstances: 1, maxInstances: 1, timeoutSeconds: 540, secrets: ["WEB3_PK", "INFURA_API_KEY"] }

exports.signMessage = createHttpsFunction(async (data) => {
	const web3Endpoint = `https://${ipfs.network_name}.infura.io/v3/${process.env.INFURA_API_KEY}`
	const signerPK = process.env.WEB3_PK
	const localKeyProvider = new HDWalletProvider({ privateKeys: [signerPK], providerOrUrl: web3Endpoint })
	const web3 = new Web3(localKeyProvider)
	// https://web3js.readthedocs.io/en/v1.8.2/web3-eth-accounts.html#sign
	const { signature } = web3.eth.accounts.sign(data.hash, signerPK)
	return signature
})

exports.addValidPayee = createHttpsFunction(async (data) => {
	const web3Endpoint = `https://${ipfs.network_name}.infura.io/v3/${process.env.INFURA_API_KEY}`
	const adminPK = process.env.WEB3_PK
	// console.log('adminPK', adminPK)
	const localKeyProvider = new HDWalletProvider({ privateKeys: [adminPK], providerOrUrl: web3Endpoint })
	const web3 = new Web3(localKeyProvider)
	const adminAccount = web3.eth.accounts.privateKeyToAccount(adminPK)
	const contract = new web3.eth.Contract(abi, bufferAddr)
	console.log('Transaction signer account is', adminAccount.address, ', smart contract is', bufferAddr)
	const validDest = web3.utils.soliditySha3(data.shareAmount, data.dest)
	const txCount = parseInt(await web3.eth.getTransactionCount(adminAccount.address))
	// const gasPrice = await web3.eth.getGasPrice()
	console.log('Current nonce is', txCount)
	console.log('Starting transaction now')
	const receipt = await contract.methods.addValidPayee(data.address, validDest, data.dest).send({
		from: adminAccount.address,
		nonce: web3.utils.toHex(txCount),
		// gas: 1000000,
		// gasPrice: Math.round(gasPrice * 1.101)
	})
	console.log('TX receipt', JSON.stringify(receipt))
	return true
})

function createHttpsFunction(fn, options = { hasPublicAccess: false, adminOnly: false }) {
	const { hasPublicAccess, adminOnly } = options
	return functions.runWith(runtimeOptions).https.onCall(async ({ authToken, ...data }, context) => {
		const hasAccess = hasPublicAccess || (authToken && isValidAuthToken(authToken, adminOnly))
		if (!hasAccess) {
			throw new HttpsError("unauthenticated", "Request had invalid authToken")
		}
		try {
			return await fn(data)
		} catch (e) {
			console.error(e)
			if (e.status && e.statusText) {
				return { err: { message: e.status + ' ' + e.statusText } }
			}
			return { err: { message: e.message, stack: e.stack, e } }
		}
	})
}