const { HttpsError } = require("firebase-functions/v1/auth")
const { runQuery } = require("./db")

async function checkCollectionOwner(auth, collectionId, allowedForCreator = false) {
	if (!auth.isAdmin) {
		const { userId } = await runQuery('select userId from userCollections where collectionId=@collectionId and roles&1>0 -- RolesMap.curator', { collectionId }, false, true)
		if (parseInt(auth.userId) !== parseInt(userId)) {
			if (allowedForCreator) {
				const { creatorId } = await runQuery('select userId as creatorId from creators where collectionId=@collectionId and userId=@userId', { collectionId, userId: auth.userId }, false, true, () => 0)
				// eslint-disable-next-line
				if (creatorId == auth.userId) {
					return
				}
			}
			throw new HttpsError("unauthenticated", "User has no access")
		}
	}
}
exports.checkCollectionOwner = checkCollectionOwner

exports.checkItemOwner = async function (auth, itemId) {
	if (!auth.isAdmin) {
		const { collectionId, status } = await runQuery('select collectionId, status from items where itemId=@itemId', { itemId }, false, true)
		// eslint-disable-next-line
		if (status == 3 || status == 4 || status == 5) { // ItemStatus.minted || ItemStatus.onSale || ItemStatus.bought
			const { userId: itemOwnerId } = await runQuery('select userId from userItems where itemId=@itemId and roles&@ownerRole>0', {
				itemId,
				ownerRole: 64, // RolesMap.owner
			}, false, true)
			if (parseInt(auth.userId) !== parseInt(itemOwnerId)) {
				throw new HttpsError("unauthenticated", "User has no access")
			}
		} else {
			await checkCollectionOwner(auth, collectionId, true)
		}
	}
}

exports.checkUserItemRoles = function (roles) {
	return parseInt(roles) === 16 // RolesMap.follower
}

exports.checkUserCollectionRoles = function (roles) {
	return parseInt(roles) === 16 // RolesMap.follower
}

exports.checkWalletOwner = function (auth, address) {
	if (auth.walletAddress.toLowerCase() !== address.toLowerCase()) {
		throw new HttpsError("unauthenticated", "User has no access")
	}
}

exports.checkUser = function (auth, userId) {
	if (!auth.isAdmin) {
		if (parseInt(auth.userId) !== parseInt(userId)) {
			throw new HttpsError("unauthenticated", "User has no access")
		}
	}
}