import { LoadingInline } from '../../prompts/Loading'
import { useContext, useEffect, useState } from 'react'
import '../../../css/table.scss'
import TradeContext from '../../../ctx/Trade'
import CollectionContext from '../../../ctx/Collection'
import FontIcon from '../../../fontIcon/FontIcon'
import { ItemCt } from './helper/ItemCt'
import { NumWithChange } from './helper/NumWithChange'
import { TimeAgo } from './helper/TimeAgo'
import { TxOpener } from './helper/TxOpener'
import { WalletAddrWithItemsCount } from './helper/WalletAddrWithItemsCount'
import { getCollectionTxHistory, getCollectionSummery } from '../../../func/nfts'
import { timeConvert } from '../../../util/timeConverter'
import { NoActionHereYet } from '../TextPhrase'

const chain = process.env.REACT_APP_CHAINID
const limit = 6;
const transferType = "mint"
const getPriceQuote = (price, quoteCurrency) => {
	if (price?.length > 0) {
		if (quoteCurrency === "eth") return price[0].price
		if (quoteCurrency === "usd" || quoteCurrency === "dollar") return price[0].price_usd
	}
	return 0
}

export default function MintsActivityTable({ collectionAddress }) {
	const [loading, setLoading] = useState(false)
	const { quoteCurrency } = useContext(TradeContext)
	const { collectionName } = useContext(CollectionContext)
	const [loadedItems, setLoadedItems] = useState([]);
	const [rows, setRows] = useState([])
	const [cursor, setCursor] = useState('')
	const [showMore, setShowMore] = useState(false)
	const [imageURL, setImageURL] = useState()

	const doLoadSummery = async () => {
		const r = await getCollectionSummery(collectionAddress, process.env.REACT_APP_CHAINID, 0, 1)
		if (r?.exchange_data) {
			const [d0, d1] = r.exchange_data
			const exchange_data = Object.keys(d1).length > 0 ? d1 : Object.keys(d0).length > 0 ? d0 : null
			if (exchange_data) {
				setImageURL(exchange_data.image_url)
			}
		}
	}

	const doLoadDetail = async () => {
		const { cursor: newCursor, results: items } = await getCollectionTxHistory(collectionAddress, transferType, chain, limit, cursor)
		setCursor(newCursor)
		setShowMore(!!newCursor)
		setLoadedItems(items)
	}

	useEffect(() => {
		if (loadedItems?.length) {
			let currentTime = new Date();
			const tmp = loadedItems.map(item => {
				let lastSale = new Date(item?.block_timestamp);
				let secs = (currentTime - lastSale) / 1000;
				const convertedTime = timeConvert(secs)
				return {
					itemName: item.id,
					mintPrice: getPriceQuote(item.price, "eth"),
					mintPriceUSD: getPriceQuote(item.price, "dollar"),
					byAddr: item.to_address,
					byItemsCountOfSameCollection: 0, // TODO: get this from API (holders of 1)
					timeAgo: convertedTime.value,
					timeAgoLabel: convertedTime.units,
					tx: item.transaction_hash
				}
			})
			setRows(rows => [...rows, ...tmp])
		}
		// eslint-disable-next-line
	}, [loadedItems])

	useEffect(() => {
		if (collectionAddress) {
			setLoading(true)
			doLoadDetail().finally(() => setLoading(false))
		}
		// eslint-disable-next-line 
	}, [collectionAddress])

	useEffect(() => {
		doLoadSummery()
		// eslint-disable-next-line 
	}, [])

	if (loading) return <LoadingInline />
	if (rows?.length === 0) return <NoActionHereYet />

	return (
		<>
			<div className="table-row header-row pt-2 c5-2fr">
				<span>Item</span>
				<span>By</span>
				<span>Price</span>
				<span>Time</span>
				<span></span>
			</div>
			{rows.map((row, idx) => {
				return (
					<div key={idx} className="table-row c5-2fr non-clickable">
						<span>
							<FontIcon name="mint" inline={true} nonClickable={true} />
							<ItemCt image={imageURL} itemName={row.itemName} collectionName={collectionName} />
						</span>
						<span><WalletAddrWithItemsCount addr={row.byAddr} itemsCount={row.byItemsCountOfSameCollection} /></span>
						<span><NumWithChange icon={quoteCurrency} num={row.mintPrice} numUSD={row.mintPriceUSD} isCurrency={true} /></span>
						<span><TimeAgo value={row.timeAgo} label={row.timeAgoLabel} /></span>
						<span className="jc-e"><TxOpener tx={row.tx} /></span>
					</div>
				)
			})}
			<div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
				{
					showMore ? <button className="primary" onClick={doLoadDetail}>Show more</button> : <></>
				}
			</div>
		</>
	)
}