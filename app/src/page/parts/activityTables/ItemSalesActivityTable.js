import { useContext, useEffect, useState } from 'react'
import '../../../css/table.scss'
import FontIcon from '../../../fontIcon/FontIcon'
import TradeContext from '../../../ctx/Trade'
import { NumWithChange } from './helper/NumWithChange'
// import { WalletAddrWithItemsCount } from './helper/WalletAddrWithItemsCount'
import { TimeAgo } from './helper/TimeAgo'
import { TxOpener } from './helper/TxOpener'
import { getTokenTxHistory } from '../../../func/nfts'
import { LoadingInline } from '../../prompts/Loading'
import { timeConvert } from '../../../util/timeConverter'
import { EtherScanLink } from './helper/EtherScanLink'
import { NoActionHereYet } from '../TextPhrase'

const chain = process.env.REACT_APP_CHAINID_DEMO

export default function ItemSalesActivityTable({ address, tokenId }) {
	const { quoteCurrency } = useContext(TradeContext)
	const [cursor, setCursor] = useState('')
	const [rows, setRows] = useState([])
	const [loading, setLoading] = useState(false)

	const doLoadDetail = async () => {
		setLoading(true)
		let currentTime = new Date();
		await getTokenTxHistory(address, chain, 100, tokenId, cursor).then(r => {
			setCursor(r?.cursor)

			if (r?.results) {
				const tempRows = []
				r?.results.forEach(item => {
					if (item.transfer_type === 'transfer' && item.price) {
						let lastSale = new Date(item?.block_timestamp);
						let secs = (currentTime - lastSale) / 1000;
						const convertedTime = timeConvert(secs)
						let row = {
							price: parseFloat(item.price[0].price).toFixed(4),
							priceChange: 23,
							items: item.quantity,
							fromAddr: item?.from_address,
							fromItemsCountOfSameCollection: 1,
							toAddr: item?.to_address,
							toItemsCountOfSameCollection: 1,
							timeAgo: convertedTime.value,
							timeAgoLabel: convertedTime.units,
							tx: item.transaction_hash
						}
						tempRows.push(row)
					}
				})

				console.log("transfer", r?.results)
				setRows(tempRows)
			}
		})
		setLoading(false)
	}

	useEffect(() => {
		if (address && tokenId) doLoadDetail()
		// eslint-disable-next-line
	}, [address, tokenId])

	if (loading) return <LoadingInline />
	if (rows?.length === 0) return <NoActionHereYet />

	return (
		<>
			<div className="table-row header-row pt-2 c6">
				<span>Price</span>
				<span>Items</span>
				<span>From</span>
				<span>To</span>
				<span>Time</span>
				<span></span>
			</div>
			{rows.map((row, idx) => {
				return (
					<div key={idx} className="table-row c6 non-clickable">
						<span>
							<FontIcon name="cart" inline={true} nonClickable={true} />
							<NumWithChange icon={quoteCurrency} num={row.price} changePercent={row.priceChange} />
						</span>
						<span className="bold">{row.items}</span>
						<span><EtherScanLink address={row.fromAddr} className="primary" /></span>
						<span><EtherScanLink address={row.toAddr} className="primary" /></span>
						<span><TimeAgo value={row.timeAgo} label={row.timeAgoLabel} /></span>
						<span className="jc-e"><TxOpener tx={row.tx} /></span>
					</div>
				)
			})}
		</>
	)
}

