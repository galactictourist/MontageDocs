import { getExchangeStats } from '../util/getExchangeProp'
import callFunc from './callFunc'

const ignoreNotFoundFromBlockspan = err => err?.message === "404 Not Found"

export async function getCollectionSalesTotals(nftAddress, tokenIDs) {
	return await callFunc("getCollectionSalesTotals", { nftAddress, tokenIDs })
}

export async function getMultipleNFTs(chain, tokens) {
	return chain && tokens?.length > 0 ? (await callFunc("getMultipleNFTs", { chain, tokens }, { errorHandler: ignoreNotFoundFromBlockspan })) || [] : []
}

export async function getWalletNFTs(address, chain, limit, cursor) {
	return (await callFunc("getWalletNFTs", { address, chain, limit, cursor }, { errorHandler: ignoreNotFoundFromBlockspan })) || {}
}

export async function getNFTDetails(address, chain, traitfilter, limit, cursor, useLocalMarket) {
	return (await callFunc(useLocalMarket ? "getNFTDetailsLocal" : "getNFTDetails", { address, chain, traitfilter, limit, cursor }, { errorHandler: ignoreNotFoundFromBlockspan })) || {}
}

export async function getCollectionSummery(address, chain, limit, days, useLocalMarket) {
	const [smm, localSmm] = await Promise.all([
		callFunc("getCollectionSummery", { address, chain, limit, days }, { errorHandler: ignoreNotFoundFromBlockspan }),
		useLocalMarket ? callFunc("getCollectionSummeryLocal", { address, chain, limit, days }, { errorHandler: ignoreNotFoundFromBlockspan }) : new Promise(resolve => resolve()),
	])
	if (useLocalMarket) {
		localSmm.exchange_data[0].stats = getExchangeStats(smm)
		localSmm.total_tokens = smm.total_tokens
		return localSmm
	}
	return smm
}

export async function getMetadataDetail(address, chain, id) {
	return await callFunc("getMetadataDetail", { address, chain, id }, { errorHandler: ignoreNotFoundFromBlockspan })
}

export async function getCollectionTxHistory(address, transferType, chain, limit, cursor) {
	return (await callFunc("getCollectionTxHistory", { address, transferType, chain, limit, cursor }, { errorHandler: ignoreNotFoundFromBlockspan })) || {}
}

export async function getTokenTxHistory(address, chain, limit, tokenId, cursor) {
	return (await callFunc("getTokenTxHistory", { address, chain, limit, tokenId, cursor }, { errorHandler: ignoreNotFoundFromBlockspan })) || {}
}
