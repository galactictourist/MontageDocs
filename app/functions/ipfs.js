const functions = require('firebase-functions')
const cfg = functions.config().ipfs
const { isValidAuthToken } = require("./crypto")
const { HttpsError } = require("firebase-functions/v1/auth")

const runtimeOptions = { minInstances: 1, memory: '256MB', secrets: ["PROJECT_SECRET"], timeoutSeconds: 540 }

const cidToUrl = (cid) => cid ? `https://${cfg.project_gateway}.infura-ipfs.io/ipfs/${cid.toString()}` : null

async function sendMetadatasToIPFSImpl(source) {
	const { client } = await getIPFSClient()
	let result
	for await (result of client.addAll(source, { wrapWithDirectory: true })) {
		console.log(result, result.cid.toString())
	}
	return cidToUrl(result.cid)
}
exports.sendMetadatasToIPFSImpl = sendMetadatasToIPFSImpl

exports.unpinFromIPFS = createHttpsFunction(async ({ cids }, context) => {
	const { client, CID } = await getIPFSClient()
	const source = cids.map(cid => CID.parse(cid))
	for await (const cid of client.pin.rmAll(source)) {
		console.log(cid)
	}
	// prints the CIDs that were unpinned
	// CID('QmWATWQ7fVPP2EFGu71UkfnqhYXDYH566qy47CnJDgvs8u')
}, { hasPublicAccess: false })

exports.sendToIPFS = createHttpsFunction(async ({ url }, context) => {
	const { urlSource, client } = await getIPFSClient()
	const { cid } = await client.add({ ...urlSource(url), path: '' })
	return cidToUrl(cid)
}, { hasPublicAccess: false })


function createHttpsFunction(fn, options = { hasPublicAccess: true, adminOnly: false }) {
	const { hasPublicAccess, adminOnly } = options
	return functions.runWith(runtimeOptions).https.onCall(async ({ authToken, ...data }, context) => {
		const hasAccess = hasPublicAccess || (authToken && isValidAuthToken(authToken, adminOnly))
		if (!hasAccess) {
			throw new HttpsError("unauthenticated", "Request had invalid authToken")
		}
		try {
			return await fn(data)
		} catch (e) {
			if (e.status && e.statusText) {
				return { err: { message: e.status + ' ' + e.statusText } }
			}
			console.error(e)
			return { err: { message: e.message, stack: e.stack, e } }
		}
	})
}

async function getIPFSClient() {
	const { create, urlSource, CID } = await import('ipfs-http-client')
	const auth = cfg.project_id + ':' + (process.env.PROJECT_SECRET || cfg.project_secret)
	const header = Buffer.from(auth).toString('base64')
	return {
		CID,
		urlSource,
		client: create({
			host: 'ipfs.infura.io',
			port: 5001,
			protocol: 'https',
			headers: {
				authorization: 'Basic ' + header
			}
		})
	}
}

/*
export const uploadMetadataToIPNS = async (progress, data, tokenId) => {
	const entry = data && tokenId ? { path: `${tokenId}.json`, content: JSON.stringify(data) } : { path: '1.json', content: JSON.stringify({ type: 'initializer' }) }
	const res1 = await client.add(entry, { progress, wrapWithDirectory: true })
	// https://docs.ipfs.tech/concepts/ipns/#example-ipns-setup-with-js-sdk-api
	const addr = `/ipfs/${res1.cid.toString()}`
	const res2 = await client.name.publish(addr)
	return `https://${projectGateway}.infura-ipfs.io/ipns/${res2.name}`
}

export const createCollectionDir = async (collectionId) => {
	const path = `/${collectionId}`
	await client.files.mkdir(path)
	return `https://${projectGateway}.infura-ipfs.io${path}`
}

export const uploadItemMetadataToMFS = async (collectionId, data, tokenId) => {
	const path = `/${collectionId}/${tokenId}.json`
	// https://docs.ipfs.tech/concepts/file-systems/#mutable-file-system-mfs
	await client.files.write(path, JSON.stringify(data), { create: true })
	return `https://${projectGateway}.infura-ipfs.io${path}`
}
*/