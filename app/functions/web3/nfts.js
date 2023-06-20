const functions = require('firebase-functions')
const { isValidAuthToken } = require("../crypto")
const { HttpsError } = require("firebase-functions/v1/auth");
const { blockspan } = require("./blockspan")
const { Moralis, getMultipleNFTsImpl } = require("./moralis")
const { getCollectionSalesTotals } = require("./reservoir")

const runtimeOptions = { minInstances: 1 }

exports.getCollectionSalesTotals = createHttpsFunction(async (data, context) => {
	const { nftAddress, tokenIDs } = data
	return await getCollectionSalesTotals(nftAddress, tokenIDs)
})

// get the nft details using blockspan
exports.getNFTDetails = createHttpsFunction(async (data, context) => {
	const { address, chain, traitfilter, limit, cursor } = data
	return await blockspan.getNFTsByCollection({
		trait_filter: traitfilter,
		chain: 'eth-main',
		cursor: cursor || '',
		page_size: limit,
		contract_address: address
	})
})

// get collection summery including current floor price
exports.getCollectionSummery = createHttpsFunction(async (data, context) => {
	const { address, chain, days } = data
	const [summery, curr_floor, old_floor] = await Promise.all([
		blockspan.getCollection({ chain: 'eth-main', contract_address: address }),
		Moralis.EvmApi.nft.getNFTLowestPrice({ address, chain, days }),
		Moralis.EvmApi.nft.getNFTLowestPrice({ address, chain, days: 2 * days })
	])

	let floor_change
	let { price: currFloor } = (curr_floor || {})?.data || { price: '0' }
	let { price: oldFloor } = (old_floor || {})?.data || { price: '0' }
	if (currFloor === '0' && oldFloor === '0') {
		floor_change = 0
	} else if (currFloor === '0' && oldFloor !== '0') {
		floor_change = -100
	} else if (currFloor !== '0' && oldFloor === '0') {
		floor_change = 100
	} else if (currFloor !== '0' && oldFloor !== '0') {
		floor_change = Number(((currFloor - oldFloor) / oldFloor * 100).toFixed(2))
	}
	return { ...summery, "curr_floor": curr_floor?.data, "old_floor": old_floor?.data, floor_change }
})

// get all nfts in the specific wallet
// exports.getAllNFTsInWallet = createHttpsFunction(async (data, context) => {
// 	const { address, chain, limit, cursor } = data

// 	return await blockspan.getNFTsByOwner({
// 		chain: 'eth-main',
// 		cursor: cursor || '',
// 		page_size: limit,
// 		owner_address: address
// 	})
// })

// get detail of collection metadata
exports.getMetadataDetail = createHttpsFunction(async (data, context) => {
	const { address, chain, id } = data

	return await blockspan.getNFTMetadata({
		chain: 'eth-main',
		contract_address: address,
		token_id: id
	})
})

// get transaction histry of collection
exports.getCollectionTxHistory = createHttpsFunction(async (data, context) => {
	const { address, transferType, chain, limit, cursor } = data
	return await blockspan.getTransfersByCollection({
		chain: 'eth-main',
		transfer_type: transferType,
		cursor: cursor || '',
		page_size: limit,
		contract_address: address
	})
})

// get transaction history of nft token 
exports.getTokenTxHistory = createHttpsFunction(async (data, context) => {
	const { address, chain, limit, tokenId, cursor } = data
	return await blockspan.getTransfersByTokenId({
		chain: 'eth-main',
		cursor: cursor || '',
		page_size: limit,
		contract_address: address,
		token_id: tokenId
	})
})

//////////////////////////////////////////////////////////
// get nfts in the wallet with Moralis
exports.getWalletNFTs = createHttpsFunction(async (data, context) => {
	const { address, chain, limit, cursor } = data
	return await Moralis.EvmApi.nft.getWalletNFTs({
		address,
		chain,
		limit,
		cursor
	})
})

async function getNFTContractTransfersImpl(address, chain, from_block, cursor, disable_total = true) {
	return await Moralis.EvmApi.nft.getNFTContractTransfers({ address, chain, from_block, cursor, disable_total })
}
exports.getNFTContractTransfersImpl = getNFTContractTransfersImpl

exports.getMultipleNFTs = createHttpsFunction(async (data) => {
	const { chain, tokens } = data
	const r = chain && tokens?.length > 0 ? await getMultipleNFTsImpl(chain, tokens) : {}
	return r
})

async function getAllOwnersImpl(address, chain) {
	const listOfOwners = []
	let cursor
	do {
		const res = await Moralis.EvmApi.nft.getNFTOwners({ address, chain, cursor })
		cursor = res?.data?.cursor
		res?.data?.result.map(i => listOfOwners.push(i.owner_of))
	} while (cursor)
	return listOfOwners
}
exports.getAllOwnersImpl = getAllOwnersImpl

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
			console.error(e)
			if (e.status && e.statusText) {
				return { err: { message: e.status + ' ' + e.statusText } }
			}
			return { err: { message: e.message, stack: e.stack, e } }
		}
	})
}