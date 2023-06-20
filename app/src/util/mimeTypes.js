import imagePlaceholder from '../img/image-placeholder.svg'

export const isImage = (mimeType) => !mimeType || mimeType?.startsWith("image/")
export const isGifImage = (mimeType) => mimeType?.startsWith("image/") && mimeType?.endsWith("gif")
export const isAudio = (mimeType) => mimeType?.startsWith("audio/")
export const isVideo = (mimeType) => mimeType?.startsWith("video/")
export const isDataUrl = (url) => url?.startsWith("data:")
export const isBlockspan = (url) => url?.startsWith("https://cdn.blockspan.com")
export const isStaticMedia = (url) => url?.startsWith("/static/media/")

export async function fetchTokenURI(tokenURI, includeMimeType = true) {
	const tokenData = await fetch(tokenURI).then(r => r.json()).catch(() => ({ image: imagePlaceholder, name: 'Unknown', mimeType: 'image/svg' }))
	const mimeType = includeMimeType ? tokenData?.mime_type || (await fetchMimeType(tokenData?.image)) : undefined
	return { ...tokenData, mimeType }
}

export async function fetchMimeType(image) {
	return image ? await fetch(image, { method: 'HEAD' }).then(r => r.headers.get('content-type')) : undefined
}
