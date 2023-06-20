const functions = require('firebase-functions')
const crypto = require('crypto')

const algorithm = 'aes-256-cbc' //Using AES encryption
const { key, iv } = functions.config().crypto
const keyBuffer = Buffer.from(key, 'hex')
const ivBuffer = Buffer.from(iv, 'hex')

function encryptImpl(text) {
	try {
		const cipher = crypto.createCipheriv(algorithm, keyBuffer, ivBuffer)
		let encrypted = cipher.update(text)
		encrypted = Buffer.concat([encrypted, cipher.final()])
		return encrypted.toString('hex')
	} catch (e) {
		console.error(e)
		return { err: e }
	}
}

const runtimeOptions = { minInstances: 1, memory: '256MB' }

exports.encryptImpl = encryptImpl

function checkInviteJson(jsonText) {
	let isValid = !!jsonText
	if (isValid) {
		const obj = JSON.parse(jsonText)
		isValid = !!obj
		if (isValid) {
			isValid = !!obj.inviteeRole && (!!obj.invitingUserId || !!obj.inviteeUserId || !!obj.collectionId)
		}
	}
	if (!isValid) {
		throw new HttpsError("unauthenticated", "Invalid invite data")
	}
}

exports.encryptForInviteLink = functions.runWith(runtimeOptions).https.onCall(({ text }) => {
	checkInviteJson(text)
	return encryptImpl(text)
})

function decryptImpl(encryptedData) {
	try {
		const encryptedText = Buffer.from(encryptedData, 'hex')
		const decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer)
		let decrypted = decipher.update(encryptedText)
		decrypted = Buffer.concat([decrypted, decipher.final()])
		return decrypted.toString()
	} catch (e) {
		console.error(e)
		return { err: e }
	}
}
exports.decryptImpl = decryptImpl

// Decrypting text
exports.decrypt = functions.runWith(runtimeOptions).https.onCall(({ encryptedData }) => decryptImpl(encryptedData))

exports.getAuthToken = function (userId, walletAddress, isAdmin) {
	const s = encryptImpl([userId, walletAddress, new Date().getTime(), isAdmin ? '1' : ''].join('-'))
	if (typeof s === "string") return s
	const { err } = s
	throw err
}

exports.parseAuthToken = function (authToken) {
	if (authToken && typeof authToken === "string") {
		const [userId, walletAddress, date, isAdmin] = decryptImpl(authToken)?.split('-') || []
		return { userId: parseInt(userId), walletAddress, date, isAdmin: isAdmin === '1' }
	}
	return {}
}

exports.isValidAuthToken = function (authToken, adminOnly) {
	const s = decryptImpl(authToken)
	let isValid = false
	if (typeof s === "string") {
		isValid = !adminOnly || s.split('-')[3] === '1'
		if (isValid) {
			// TODO more granular write access - 
			// for example: allow user with userId to update collection with collectionId only if he is the curator of that collection
		}
	}
	return isValid
}