const Moralis = require('moralis').default
const fetch = require('node-fetch')

const MORALIS_API_KEY = "eMW489AUWGZesUDpmnj5CIZauGlxJcNvlrRMoUCcnfzCluuKUTPfA2uyRKzxjNWA";

(async () => { await Moralis.start({ apiKey: MORALIS_API_KEY }) })()

exports.Moralis = Moralis

const getOptions = (body = null, method = "POST", accept = "application/json", contentType = "application/json") => ({
	method,
	headers: {
		accept,
		'content-type': contentType,
		'X-API-Key': MORALIS_API_KEY
	},
	body: JSON.stringify(body)
})
const getNFTMethodUrl = (methodName, chain) => `https://deep-index.moralis.io/api/v2/nft/${methodName}?chain=${chain}`

exports.getMultipleNFTsImpl = async (chain, tokens) => {
	return await fetch(getNFTMethodUrl("getMultipleNFTs", chain), getOptions({ tokens, normalizeMetadata: false }))
		.then(r => r.json())
}