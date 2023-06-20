import callFunc from './callFunc'

const { REACT_APP_ALLOW_ALL_USERS_CREATE_COLLECTION } = process.env

export async function loadReferrals(collectionId) {
	return await callFunc("loadReferrals", { collectionId })
}

export async function getUserIdByAddy(address) {
	return (await getOrCreateUserId(address, false)).userId || 0
}

export async function getOrCreateUserId(walletAddress, createNewIfNotExists = true, mayAddCollection, wasInvited, invitingUserId = null) {
	if (REACT_APP_ALLOW_ALL_USERS_CREATE_COLLECTION) mayAddCollection = true
	return walletAddress ? (await callFunc("getUserId", { walletAddress, createNewIfNotExists, mayAddCollection, wasInvited, invitingUserId })) || {} : {}
}

export async function loadUserProfile(userId) {
	return userId ? (await callFunc("loadUserProfile", { userId })) || {} : {}
}

export async function loadMayAddCollection(userId) {
	return userId ? (await callFunc("loadMayAddCollection", { userId })) || {} : {}
}

export async function createUser(data, wasInvited = true) {
	if (data && Object.keys(data).length > 0) {
		if (REACT_APP_ALLOW_ALL_USERS_CREATE_COLLECTION) data.mayAddCollection = true
		return (await callFunc("createUser", { ...data, wasInvited }))?.userId
	}
}

export async function updateUser(userId, fields) {
	if (userId && fields && Object.keys(fields).length > 0) {
		await callFunc("updateUser", { userId, fields })
	}
}

export async function searchUsers(query, userId, accounts, offsetCount, fetchCount, mayAddCollection) {
	return await callFunc("searchUsers", { query, userId, accounts, offsetCount, fetchCount, mayAddCollection })
}

export async function findUserByWalletAddress(walletAddress) {
	return (await callFunc("findUserByWalletAddress", { walletAddress })) || []
}

export function loadAdminForNotifications() {
	return {
		email: process.env.REACT_APP_ADMIN_NOTIFY_EMAIL,
		name: process.env.REACT_APP_ADMIN_NOTIFY_NAME
	}
}