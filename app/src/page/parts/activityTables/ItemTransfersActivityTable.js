import { useEffect, useState } from 'react'
import '../../../css/table.scss'
import FontIcon from '../../../fontIcon/FontIcon'
import { TimeAgo } from './helper/TimeAgo'
import { TxOpener } from './helper/TxOpener'
// import { WalletAddrWithItemsCount } from './helper/WalletAddrWithItemsCount'
import { getTokenTxHistory } from '../../../func/nfts'
import { LoadingInline } from '../../prompts/Loading'
import { timeConvert } from '../../../util/timeConverter'
import { EtherScanLink } from './helper/EtherScanLink'
import { NoActionHereYet } from '../TextPhrase'

const chain = process.env.REACT_APP_CHAINID_DEMO

export default function ItemTransfersActivityTable({ address, tokenId }) {
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
					if (item.transfer_type === 'transfer' && item.price === null) {
						let lastSale = new Date(item?.block_timestamp);
						let secs = (currentTime - lastSale) / 1000;
						const convertedTime = timeConvert(secs)
						let row = {
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
			<div className="table-row header-row pt-2 c5">
				<span>Items</span>
				<span>From</span>
				<span>To</span>
				<span>Time</span>
				<span></span>
			</div>
			{rows.map((row, idx) => {
				return (
					<div key={idx} className="table-row c5 non-clickable">
						<span className="bold"><FontIcon name="transfer" inline={true} nonClickable={true} />{row.items}</span>
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