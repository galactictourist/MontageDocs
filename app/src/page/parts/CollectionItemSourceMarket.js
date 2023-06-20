import './collection-item-source-market.scss'
import montage from '../../img/source-market/montage.svg'
import opensea from '../../img/source-market/opensea.svg'
import x2y2 from '../../img/source-market/x2y2.svg'
import looksrare from '../../img/source-market/looksrare.svg'

export const SOURCE_MARKETS = {
	MONTAGE: 1,
	OPENSEA: 2,
	X2Y2: 3,
	LOOKSRARE: 4,
}

export const DEFAULT_SOURCE_MARKET = SOURCE_MARKETS.OPENSEA

const markets = {
	[SOURCE_MARKETS.MONTAGE]: { src: montage, title: process.env.REACT_APP_NAME },
	[SOURCE_MARKETS.OPENSEA]: { src: opensea, title: 'OpenSea' },
	[SOURCE_MARKETS.X2Y2]: { src: x2y2, title: 'X2Y2' },
	[SOURCE_MARKETS.LOOKSRARE]: { src: looksrare, title: 'Looksrare' },
}

export default function CollectionItemSourceMarket({ sourceMarket }) {
	const { src, title } = markets[sourceMarket || DEFAULT_SOURCE_MARKET]
	return <img src={src} alt="" title={title} className="collection-item-source-market" />
}

export function exchangeToSourceMarket(exchange) {
	switch (exchange) {
		case "opensea": return SOURCE_MARKETS.OPENSEA
		case "looksrare": return SOURCE_MARKETS.LOOKSRARE
		case "x2y2": return SOURCE_MARKETS.X2Y2
		case "montage": return SOURCE_MARKETS.MONTAGE
		default: return DEFAULT_SOURCE_MARKET
	}
}