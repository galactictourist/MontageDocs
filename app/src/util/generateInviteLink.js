import { encryptForInviteLink } from "../func/crypto"

export default async function generateInviteLink(props, path = '/invite') {
	const l = window.location
	let link = l.protocol + '//' + l.host + path
	const cipher = await encryptForInviteLink(JSON.stringify(props))
	return `${link}?key=${cipher}`
}