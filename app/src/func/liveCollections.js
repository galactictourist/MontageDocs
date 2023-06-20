import callFunc from './callFunc'

export async function loadCreatorMintedTokenIds(collectionId, creatorId) {
	return collectionId && creatorId ? (await callFunc("loadCreatorMintedTokenIds", { collectionId, creatorId })) || [] : []
}

export async function loadUserLiveCollections(userId, groupAddress) {
	return userId || groupAddress ? await callFunc("loadUserLiveCollections", { userId, groupAddress }) : []
}

export async function getMyListedItems() {
	return await callFunc("getMyListedItems")
}

export async function listCollectionItems(collectionId, firstTokenId, qty, status, salePrice, seller) {
	return await callFunc("listCollectionItems", { collectionId, firstTokenId, qty, status, salePrice, seller })
}

export async function loadTotalItemsToMint(collectionId) {
	return await callFunc("loadTotalItemsToMint", { collectionId })
}

export async function loadItemsToMint(collectionId, priceField, offset = 0, ofCreatorId = 0, exceptItemId = 0, fetchCount = 8) {
	return await callFunc("loadItemsToMint", { collectionId, priceField, offset, ofCreatorId, exceptItemId, fetchCount })
}

export async function getMintPriceETH(collectionId, stage, mintNFTQty) {
	return await callFunc("getMintPriceETH", { collectionId, stage, mintNFTQty })
}

export async function loadCollectionIdByNFTAddress(nftAddress, tokenId) {
	return nftAddress ? (await callFunc("loadCollectionIdByNFTAddress", { nftAddress, tokenId })) || { collectionId: 0, itemId: 0 } : { collectionId: 0, itemId: 0 }
}

export async function updateLiveCollectionConductKey(collectionId, conductKey) {
	if (collectionId && conductKey) {
		await callFunc("updateLiveCollectionConductKey", { collectionId, conductKey })
	}
}

export async function uploadApprovedItemsMetadata(collectionId) {
	const r = collectionId ? (await callFunc("uploadApprovedItemsMetadata", { collectionId })) || {} : {}
	console.log("uploadApprovedItemsMetadata: r", r)
	return r
}

export async function loadNonMintedItemsCount(collectionId) {
	return collectionId ? (await callFunc("loadNonMintedItemsCount", { collectionId })) || 0 : 0
}

export async function updateBoughtItems(boughtItems) {
	if (boughtItems?.length > 0) {
		await callFunc("updateBoughtItems", { boughtItems })
	}
}

export async function createLiveCollection(fields) {
	if (Object.keys(fields).length > 0) {
		await callFunc("createLiveCollection", { fields })
	}
}

export async function loadLiveCollection(collectionId) {
	return collectionId ? (await callFunc("loadLiveCollection", { collectionId })) || {} : {}
}

export async function getUserSplitterAddresses(address) {
	return address ? (await callFunc("getUserSplitterAddresses", { address })) || [] : []
}

export async function getEarnings(address) {
	return address ? (await callFunc("getEarnings", { address })) || [] : []
}

export async function loadArtistAddresses(collectionId, qty) {
	return collectionId ? (await callFunc("loadArtistAddresses", { collectionId, qty })) || [] : []
}