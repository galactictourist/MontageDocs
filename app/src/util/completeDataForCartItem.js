import { ethToUsd } from './converter'
import { CardImageSpecs, CartItemImageSpecs, getOptimizeImgUrl } from './optimizedImages'

export function completeDataForCartItem(item) {
	const priceETH = item?.recent_price?.price > 0 ? Number(parseFloat(item.recent_price.price).toFixed(4)) : 0
	const priceUSD = Number(ethToUsd(priceETH).toFixed(2))
	if (item) {
		item.priceETH = priceETH
		item.priceUSD = priceUSD
		if (!item.token_name && item.id) item.token_name = `#${item.id}`
		if (item.metadata?.image && !item.cached_images?.small_250_250) {
			item.cached_images = {
				small_250_250: getOptimizeImgUrl(item.metadata.image, CardImageSpecs, item.mimeType, item.keepAspectRatio, item.originalCID),
				tiny_100_100: getOptimizeImgUrl(item.metadata.image, CartItemImageSpecs, item.mimeType, item.keepAspectRatio, item.originalCID)
			}
			item.image = item.metadata.image
		} else {
			item.image = getOptimizeImgUrl(item.file, CartItemImageSpecs, item.mimeType, item.keepAspectRatio, item.originalCID)
		}
	}
	return item
}
