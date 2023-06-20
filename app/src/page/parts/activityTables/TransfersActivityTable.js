import { useContext, useEffect, useState } from 'react'
import '../../../css/table.scss'
import FontIcon from '../../../fontIcon/FontIcon'
// import demoMoonbird from '../../../img/demo-moonbird.png'
import { ItemCt } from './helper/ItemCt'
import { TimeAgo } from './helper/TimeAgo'
import { TxOpener } from './helper/TxOpener'
// import { WalletAddrWithItemsCount } from './helper/WalletAddrWithItemsCount'
import CollectionContext from '../../../ctx/Collection'
import { LoadingInline } from '../../prompts/Loading'
import { getCollectionTxHistory, getCollectionSummery } from '../../../func/nfts'
import { timeConvert } from '../../../util/timeConverter'
import { EtherScanLink } from './helper/EtherScanLink'
import { NoActionHereYet } from '../TextPhrase'

const chain = process.env.REACT_APP_CHAINID
const limit = 6;
const transferType = "transfer"

export default function TransfersActivityTable({ collectionAddress }) {
	const [loading, setLoading] = useState(false)
	const { collectionName } = useContext(CollectionContext)
	const [loadedItems, setLoadedItems] = useState([]);
	const [rows, setRows] = useState([])
	const [index, setIndex] = useState(1)
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

	const indexCheck = async () => {
		if ((index + 1) * limit > rows.length) {
			await doLoadDetail()
		} else {
			setIndex(index + 1);
		}
	}

	const doLoadDetail = async () => {
		const { cursor: newCursor, results: items } = await getCollectionTxHistory(collectionAddress, transferType, chain, 100, cursor)
		setCursor(newCursor)
		setLoadedItems(items)
		console.log(items)
	}

	useEffect(() => {
		if (loadedItems?.length) {
			if (cursor) setShowMore(true)
			let currentTime = new Date();
			let tmp = [];
			loadedItems.forEach(item => {
				let lastSale = new Date(item?.block_timestamp);
				let secs = (currentTime - lastSale) / 1000;
				const convertedTime = timeConvert(secs)
				if (item.price === null) {
					tmp.push({
						itemName: `# ${item.id}`,
						collectionName: collectionName,
						items: item.quantity,
						fromAddr: item.from_address,
						fromItemsCountOfSameCollection: 1,
						toAddr: item.to_address,
						toItemsCountOfSameCollection: 1,
						timeAgo: convertedTime.value,
						timeAgoLabel: convertedTime.units,
						tx: item.transaction_hash
					})
				}
			})
			console.log('filtered data', tmp)
			if (tmp?.length) {
				setRows(rows => [...rows, ...tmp])
			}
		}
	}, [loadedItems, cursor, collectionName])

	useEffect(() => {
		if (collectionAddress) {
			setLoading(true);
			(async () => {
				await doLoadDetail()
				setLoading(false)
			})()
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
			<div className="table-row header-row pt-2 c6-2fr">
				<span>Item</span>
				<span>Items</span>
				<span>From</span>
				<span>To</span>
				<span>Time</span>
				<span></span>
			</div>
			{rows.map((row, idx) => {
				if (idx < index * limit) {
					return (
						<div key={idx} className="table-row c6-2fr non-clickable">
							<span>
								<FontIcon name="transfer" inline={true} nonClickable={true} />
								<ItemCt image={imageURL} itemName={row.itemName} collectionName={row.collectionName} />
							</span>
							<span className="bold">{row.items}</span>
							<span><EtherScanLink address={row.fromAddr} className="primary" /></span>
							<span><EtherScanLink address={row.toAddr} className="primary" /></span>
							<span><TimeAgo value={row.timeAgo} label={row.timeAgoLabel} /></span>
							<span className="jc-e"><TxOpener tx={row.tx} /></span>
						</div>
					)
				}
				return undefined
			})}
			<div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
				{
					showMore ? <button className="primary" onClick={indexCheck}>Show more</button> : <></>
				}
			</div>
		</>
	)
}