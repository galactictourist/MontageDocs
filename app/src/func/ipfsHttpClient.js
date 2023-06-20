import callFunc from './callFunc'

export async function unpinFromIPFS(cids) {
	return cids?.length > 0 ? await callFunc("unpinFromIPFS", { cids }) : null
}

export async function sendToIPFS(url) {
	return url ? await callFunc("sendToIPFS", { url }) : null
}