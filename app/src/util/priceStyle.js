export const PriceStylesMap = {
	prices: 1,
	offers: 2,
	pricesWithOffers: 1 | 2,
	bids: 4
}

export const PriceStyleOptions = [
	{ value: PriceStylesMap.prices, text: 'Set price and don\'t allow offers' },
	{ value: PriceStylesMap.pricesWithOffers, text: 'Set price and allow offers' },
	{ value: PriceStylesMap.bids, text: 'Set auction' }
]


export function acceptOffers(priceStyle) {
	return priceStyle > 0 && (priceStyle & PriceStylesMap.offers) > 0
}

export function isAuction(priceStyle) {
	return priceStyle > 0 && (priceStyle & PriceStylesMap.bids) > 0
}

export function acceptOffersOrBids(priceStyle) {
	return priceStyle > 0 && ((priceStyle & PriceStylesMap.bids) > 0 || (priceStyle & PriceStylesMap.offers) > 0)
}
