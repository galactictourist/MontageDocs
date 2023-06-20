import { useContext, useEffect, useState } from 'react'
import '../../../css/table.scss'
import FontIcon from '../../../fontIcon/FontIcon'
import TradeContext from '../../../ctx/Trade'
import { NumWithChange } from './helper/NumWithChange'
import { WalletAddrWithItemsCount } from './helper/WalletAddrWithItemsCount'
import { TimeAgo } from './helper/TimeAgo'
import { TxOpener } from './helper/TxOpener'
import { LoadingInline } from '../../prompts/Loading'
import { NoActionHereYet } from '../TextPhrase'

// eslint-disable-next-line
const DemoRows = [
	{ price: 1.0345, priceChange: 33, fromAddr: '0xa458D6f7362cf42c51Bb506Fd34b46a127FCdc58', fromItemsCountOfSameCollection: 1, timeAgo: 43, timeAgoLabel: 'min', tx: '0x29785dd3fda15acbc81a611f272c1806919d7a4431b5660cb3d06cd83680aa83' },
	{ price: 1.0345, priceChange: 33, fromAddr: '0xa458D6f7362cf42c51Bb506Fd34b46a127FCdc58', fromItemsCountOfSameCollection: 1, timeAgo: 43, timeAgoLabel: 'min', tx: '0x29785dd3fda15acbc81a611f272c1806919d7a4431b5660cb3d06cd83680aa83' },
	{ price: 1.0345, priceChange: 33, fromAddr: '0xa458D6f7362cf42c51Bb506Fd34b46a127FCdc58', fromItemsCountOfSameCollection: 1, timeAgo: 43, timeAgoLabel: 'min', tx: '0x29785dd3fda15acbc81a611f272c1806919d7a4431b5660cb3d06cd83680aa83' },
	{ price: 1.0345, priceChange: 33, fromAddr: '0xa458D6f7362cf42c51Bb506Fd34b46a127FCdc58', fromItemsCountOfSameCollection: 1, timeAgo: 43, timeAgoLabel: 'min', tx: '0x29785dd3fda15acbc81a611f272c1806919d7a4431b5660cb3d06cd83680aa83' },
	{ price: 1.0345, priceChange: 33, fromAddr: '0xa458D6f7362cf42c51Bb506Fd34b46a127FCdc58', fromItemsCountOfSameCollection: 1, timeAgo: 43, timeAgoLabel: 'min', tx: '0x29785dd3fda15acbc81a611f272c1806919d7a4431b5660cb3d06cd83680aa83' },
]

export default function ItemOffersActivityTable({ address, tokenId }) {
	const { quoteCurrency } = useContext(TradeContext)
	const [rows, setRows] = useState([])
	const [loading, setLoading] = useState(false)

	const doLoadDetail = async () => {
		setLoading(true)
		await new Promise(resolve => setTimeout(() => {
			// setRows(DemoRows)
			console.log('TODO: load item offers')
			setRows([])
			setLoading(false)
			resolve()
		}, 500))
	}

	useEffect(() => {
		if (address && tokenId) doLoadDetail()
		// eslint-disable-next-line
	}, [address, tokenId])

	if (loading) return <LoadingInline />
	if (rows?.length === 0) return <NoActionHereYet />

	return (
		<>
			<div className="table-row header-row pt-2 c4">
				<span>Price</span>
				<span>From</span>
				<span>Time</span>
				<span></span>
			</div>
			{rows.map((row, idx) => {
				return (
					<div key={idx} className="table-row c4 non-clickable">
						<span>
							<FontIcon name="offer" inline={true} nonClickable={true} />
							<NumWithChange icon={quoteCurrency} num={row.price} changePercent={row.priceChange} />
						</span>
						<span><WalletAddrWithItemsCount addr={row.fromAddr} itemsCount={row.fromItemsCountOfSameCollection} /></span>
						<span><TimeAgo value={row.timeAgo} label={row.timeAgoLabel} /></span>
						<span className="jc-e"><TxOpener tx={row.tx} /></span>
					</div>
				)
			})}
		</>
	)
}
