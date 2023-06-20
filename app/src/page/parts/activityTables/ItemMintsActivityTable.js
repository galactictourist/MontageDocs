import { useContext, useEffect, useState } from 'react'
import '../../../css/table.scss'
import TradeContext from '../../../ctx/Trade'
import FontIcon from '../../../fontIcon/FontIcon'
import { NumWithChange } from './helper/NumWithChange'
import { TimeAgo } from './helper/TimeAgo'
import { TxOpener } from './helper/TxOpener'
import { WalletAddrWithItemsCount } from './helper/WalletAddrWithItemsCount'
import { getTokenTxHistory } from '../../../func/nfts'
import { LoadingInline } from '../../prompts/Loading'
import { timeConvert } from '../../../util/timeConverter'
import { NoActionHereYet } from '../TextPhrase'

const chain = process.env.REACT_APP_CHAINID

export default function MintsActivityTable({ address, tokenId }) {
	const { quoteCurrency } = useContext(TradeContext)
	const [cursor, setCursor] = useState('')
	const [rows, setRows] = useState([])
	const [loading, setLoading] = useState(false)

	const doLoadDetail = async () => {
		let currentTime = new Date();
		setLoading(true)
		await getTokenTxHistory(address, chain, 100, tokenId, cursor).then(r => {
			const len = r?.total;
			setCursor(r?.cursor)

			if (r?.results[len - 1].transfer_type === 'mint') {
				const mintInfo = r?.results[len - 1];
				let lastSale = new Date(mintInfo?.block_timestamp);
				let secs = (currentTime - lastSale) / 1000;
				const convertedTime = timeConvert(secs)
				const row = {
					mintPrice: mintInfo?.price ? parseFloat(mintInfo.price[0].price).toFixed(4) : 0,
					byAddr: mintInfo?.to_address,
					byItemsCountOfSameCollection: mintInfo?.quantity,
					timeAgo: convertedTime.value,
					timeAgoLabel: convertedTime.units,
					tx: mintInfo?.transaction_hash
				}
				setRows([row])
				console.log("detail", mintInfo, row)
			}
		})
		setLoading(false)
	}

	useEffect(() => {
		if (address && tokenId) {
			doLoadDetail()
		}
		// eslint-disable-next-line 
	}, [address, tokenId])

	if (loading) return <LoadingInline />
	if (rows?.length === 0) return <NoActionHereYet />

	return (
		<>
			<div className="table-row header-row pt-2 c4">
				<span>Price</span>
				<span>By</span>
				<span>Time</span>
				<span></span>
			</div>
			{rows.map((row, idx) => {
				return (
					<div key={idx} className="table-row c4 non-clickable">
						<span>
							<FontIcon name="mint" inline={true} nonClickable={true} />
							<NumWithChange icon={quoteCurrency} num={row.mintPrice} />
						</span>
						<span><WalletAddrWithItemsCount addr={row.byAddr} itemsCount={row.byItemsCountOfSameCollection} /></span>
						<span><TimeAgo value={row.timeAgo} label={row.timeAgoLabel} /></span>
						<span className="jc-e"><TxOpener tx={row.tx} /></span>
					</div>
				)
			})}
		</>
	)
}