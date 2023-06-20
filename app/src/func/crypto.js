import callFunc from './callFunc'

export async function encryptForInviteLink(text) {
	if (text) {
		return await callFunc("encryptForInviteLink", { text })
	}
}

export async function decrypt(encryptedData) {
	if (encryptedData) {
		return await callFunc("decrypt", { encryptedData })
	}
}
