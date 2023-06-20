import { ItemStatus } from '../util/itemStatus'
import { RolesMap } from '../util/roles'
import callFunc from './callFunc'

export async function updateMintedStatus(collectionId, firstTokenId, mintNFTQty, userId) {
	if (collectionId && mintNFTQty > 0 && userId) {
		await callFunc("updateMintedStatus", { collectionId, firstTokenId, mintNFTQty, userId })
	}
}

export async function setMintingStatus(userId, collectionId, mintNFTQty, itemId) {
	return userId && collectionId && mintNFTQty > 0 ? (await callFunc("setMintingStatus", { userId, collectionId, mintNFTQty, status: ItemStatus.approved, newStatus: ItemStatus.minting, itemId: itemId || 0 })) || 0 : 0
}

export async function revertMintingStatus(userId, collectionId, mintNFTQty, itemId) {
	return userId && collectionId && mintNFTQty > 0 ? (await callFunc("setMintingStatus", { userId, collectionId, mintNFTQty, status: ItemStatus.minting, newStatus: ItemStatus.approved, itemId: itemId || 0 })) || 0 : 0
}

export async function approveAllItems(collectionId) {
	if (collectionId) {
		await callFunc("approveAllItems", { collectionId })
	}
}

export async function deleteItem(itemId) {
	if (itemId) {
		await updateItem(itemId, { isDeleted: true })
	}
}

export async function loadItemDetails({ collectionId, itemId, collectionAddress, tokenId }) {
	return (collectionId && itemId) || (collectionAddress && tokenId) ? (await callFunc("loadItemDetails", { collectionId, itemId, collectionAddress, tokenId })) || {} : {}
}

export async function loadItem(itemId) {
	return itemId ? (await callFunc("loadItem", { itemId })) || {} : {}
}

export async function createItem(data) {
	if (data && Object.keys(data).length > 0) {
		return (await callFunc("createItem", { data, roles: RolesMap.creator }))?.itemId
	}
}

export async function updateItem(itemId, fields) {
	if (itemId && fields && Object.keys(fields).length > 0) {
		await callFunc("updateItem", { itemId, fields })
	}
}

export async function loadItemsCreatedByMe(userId, offsetCount, fetchCount, status) {
	return userId ? (await callFunc("loadItemsCreatedByMe", { userId, offsetCount, fetchCount, status })) || [] : []
}

export async function loadMyFollowing(userId, offsetCount, fetchCount, roles, status) {
	return userId ? (await callFunc("loadMyFollowing", { userId, offsetCount, fetchCount, roles, status })) || [] : []
}
export async function assignTokenIdToItem(collectionId, tokenId) {
	if (collectionId && tokenId) {
		return await callFunc("assignTokenIdToItem", { collectionId, tokenId, status: ItemStatus.approved })?.itemId
	}
}

export async function loadCollectionItems(userId, collectionId, roles, offsetCount, fetchCount) {
	return collectionId ? (await callFunc("loadCollectionItems", { userId, collectionId, roles, offsetCount, fetchCount })) || [] : []
}
export async function loadCollectionMyItems(userId, collectionId, roles, offsetCount, fetchCount) {
	return userId && collectionId && roles ? (await callFunc("loadCollectionMyItems", { userId, collectionId, roles, offsetCount, fetchCount })) || [] : []
}

export async function addUserItemRoles(userId, itemId, roles, tokenId, collectionId) {
	if (userId && (itemId || tokenId) && roles) {
		await callFunc("addUserItemRoles", { userId, itemId, roles, tokenId, collectionId })
	}
}
export async function removeUserItemRoles(userId, itemId, roles) {
	if (userId && itemId && roles) {
		await callFunc("removeUserItemRoles", { userId, itemId, roles })
	}
}