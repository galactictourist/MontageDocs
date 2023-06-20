import callFunc from "./callFunc";
import { cidToUrl, urlToCID } from '../util/uploadToIPFS'

export async function saveOriginalImage(croppedUrl, originalUrl) {
	if (croppedUrl && originalUrl) {
		await callFunc("saveOriginalImage", { croppedCID: urlToCID(croppedUrl), originalCID: urlToCID(originalUrl) })
	}
}

export async function loadOriginalImage(croppedUrl) {
	return croppedUrl ? cidToUrl(await callFunc("loadOriginalImage", { croppedCID: urlToCID(croppedUrl) })) : null
}