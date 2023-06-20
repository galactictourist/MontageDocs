import { isAudio, isDataUrl, isBlockspan, isImage, isVideo, isStaticMedia } from "./mimeTypes"
import audioSrc from '../img/audio.png'
import { cidToUrl } from "./uploadToIPFS"

export const getThumbImageSpecs = (imageSize) => imageSize.width > imageSize.height ? { height: 90 } : { width: 90 }
export const StoryPageImageSpecs = { width: 453, height: 453 }
export const CoverImageSpecs = { width: 1440, height: 350 }
export const ProfileImageSpecs = { width: 48, height: 48 }
export const CardImageSpecs = { width: 254, height: 254 }
export const CartItemImageSpecs = { width: 56, height: 56 }
export const NFTSpecs = { width: 1024, height: 1024 }
export const PopupSpecs = { width: 94, height: 94 }
export const NFTCardImageSpecs = { width: 508, height: 508 }

export const imageSizeSpec = (specs) => `(recommended ${specs.width} x ${specs.height} px)`

export default function setOptimizedUrls(arr, keys, options, mimeTypeKeys, settings) {
	const qs = getOptionsQueryString(options)
	for (let i = 0; i < arr.length; i++) {
		const obj = arr[i]
		if (obj) {
			for (let j = 0; j < keys.length; j++) {
				const key = keys[j]
				if (key) {
					const mimeTypeKey = mimeTypeKeys && mimeTypeKeys[j]
					obj[key] = cloudImageUrl(obj[key], qs, mimeTypeKey && obj[mimeTypeKey])
				}
			}
		}
	}
}


export function getOptimizedBucketFullSrc(path, options) {
	return getOptimizeImgUrl(bucketFullSrc(path), options)
}

export function bucketFullSrc(path) {
	return `https://storage.googleapis.com/prod-montage.appspot.com${path}`
}

export function getOptimizeImgUrl(src, options, mimeType, keepAspectRatio, originalCID) {
	if (src) {
		const qs = getOptionsQueryString(options, keepAspectRatio)
		return cloudImageUrl((keepAspectRatio && cidToUrl(originalCID)) || src, qs, mimeType)
	}
}

const cloudimgHost = `afvwhmgeyr.cloudimg.io`

function cloudImageUrl(url, qs, mimeType) {
	if (url) {
		if (isStaticMedia(url)) return url
		if (isDataUrl(url)) return url
		if (isVideo(mimeType)) return url
		if (isImage(mimeType)) return isBlockspan(url) ? url : `https://${cloudimgHost}/${stripProtocol(url)}${qs ? '?' + qs : ''}`
		if (isAudio(mimeType)) return audioSrc
	}
	return ''
}

function stripProtocol(url) {
	return url.startsWith("https://") ? url.substr("https://".length) : url.startsWith("http://") ? url.substr("http://".length) : url
}

function getOptionsQueryString(options, keepAspectRatio) {
	if (keepAspectRatio && options?.width) {
		options = { height: options.height }
	}
	return options && Object.keys(options).length > 0 ? new URLSearchParams(options).toString() : ''
}


export function unsetOptimizedUrls(arr, keys) {
	for (let i = 0; i < arr.length; i++) {
		const obj = arr[i]
		if (obj) {
			for (let j = 0; j < keys.length; j++) {
				const key = keys[j]
				if (key) {
					obj[key] = getOriginalUrl(obj[key])
				}
			}
		}
	}
}

export function getOriginalUrl(url) {
	return url?.replace(cloudimgHost + '/', '').split('?')[0]
}