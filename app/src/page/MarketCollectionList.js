import { useContext, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import '../css/table.scss'
import TradeContext from '../ctx/Trade'
import FontIcon from '../fontIcon/FontIcon'
import toShortAmountStr from '../util/toShortestAmountStr'
import { NumWithChange } from './parts/activityTables/helper/NumWithChange'
import { AppControl } from './parts/AppControl'
import { TradeControlButtons } from './parts/TradeControlButtons'
import { getCollectionSummery } from '../func/nfts'
import topCollectionDemo from '../demoData/nftCollectionListDemo.json'
import Loading from './prompts/Loading'
import { timeConvert } from '../util/timeConverter'

export default function MarketCollectionList() {
	const { quoteCurrency } = useContext(TradeContext)
	const [rows, setRows] = useState([])
	const [loading, setLoading] = useState(false)

	const listItemClick = () => {
		toast('TODO list item')
	}

	const doLoadSummery = async () => {
		let tempArr = [];
		let currentTime = new Date();
		setLoading(true)

		for (let i = 0; i < 3; i++) {

			await getCollectionSummery(topCollectionDemo[i].address, process.env.REACT_APP_CHAINID_DEMO, 0, 1).then(r => {
				if (r?.exchange_data) {
					const [d0, d1] = r.exchange_data
					const exchange_data = Object.keys(d1).length > 0 ? d1 : Object.keys(d0).length > 0 ? d0 : null
					const { stats } = exchange_data;

					let lastSale = new Date(exchange_data?.update_at);
					let secs = (currentTime - lastSale) / 1000;
					const convertedTime = timeConvert(secs);

					var tmp = {};
					tmp = {
						image: exchange_data.image_url,
						collectionName: exchange_data.name,
						itemsCount: parseInt(r.total_tokens),
						ownersCount: parseInt(stats?.num_owners),
						listingsCount: 334,
						floorPrice: parseFloat(r?.curr_floor?.price / 1e18).toFixed(4) || 0,
						floorPriceChange: r.floor_change,
						avgPrice: parseFloat(parseFloat(stats?.one_day_average_price).toFixed(2) || 0),
						avgPriceChange: parseFloat(((stats?.one_day_average_price - stats?.seven_day_average_price) / stats?.seven_day_average_price * 100).toFixed(2) || 0),
						bestOffer: parseFloat(parseFloat(stats?.one_day_average_price).toFixed(2) || 0),
						bestOfferChange: parseFloat(((stats?.one_day_average_price - stats?.seven_day_average_price) / stats?.seven_day_average_price * 100).toFixed(2) || 0),
						volume: parseFloat(parseFloat(stats?.market_cap).toFixed(2) || 0),
						volumeChange: parseFloat(parseFloat(stats?.one_day_volume_change / stats?.one_day_volume * 100).toFixed(2) || 0),
						sales: parseFloat(stats?.one_day_sales),
						salesChange: parseFloat(((stats?.one_day_sales - stats?.seven_day_sales / 7) / (stats?.seven_day_sales / 7) * 100).toFixed(2) || 0),
						timeAgo: convertedTime.value,
						timeAgoLabel: convertedTime.units
					}
				}
				tempArr.push(tmp)
			})
		}
		setRows(tempArr)
		setLoading(false)
	}

	useEffect(() => {
		doLoadSummery();
	}, [])

	if (loading) return <Loading />

	return (
		<>
			<div className="pt-2" style={{ textAlign: 'right', marginRight: '2em' }}>
				<button className="primary" onClick={listItemClick}>List</button>
			</div>
			<div className="table-row header-row pt-2" style={{ gridTemplateColumns: '1fr 280px' }}>
				<AppControl placeholder="Find collections" />
				<TradeControlButtons />
			</div>
			<div className="table-row header-row pt-2 c7-3fr">
				<span>Collection</span>
				<span>Floor</span>
				<span>Avg.</span>
				<span>B. offer</span>
				<span>Vol.</span>
				<span>Sales</span>
				<span>Time</span>
			</div>
			{rows.map((row, idx) => {
				return (
					<div key={idx} className="table-row c7-3fr non-clickable">
						<span>
							<span className="item-ct">
								<img src={row.image} className="item-image" alt="" />
								<span className="flex-column jc-se">
									<span className="bold">{row.collectionName}</span>
									<span className="num-icon-pair-list">
										<NumIconPair num={row.itemsCount} icon="nft" />
										<NumIconPair num={row.ownersCount} icon="user2" />
										{/* <NumIconPair num={row.listingsCount} icon="store" /> */}
									</span>
								</span>
							</span>
						</span>
						<span><NumWithChange icon={quoteCurrency} num={row.floorPrice} changePercent={row.floorPriceChange} /></span>
						<span><NumWithChange icon={quoteCurrency} num={row.avgPrice} changePercent={row.avgPriceChange} /></span>
						<span><NumWithChange icon={quoteCurrency} num={row.bestOffer} changePercent={row.bestOfferChange} /></span>
						<span><NumWithChange icon={quoteCurrency} num={row.volume} changePercent={row.volumeChange} /></span>
						<span><NumWithChange num={row.sales} changePercent={row.salesChange} /></span>
						<span className="smm">
							<span className="flex-column">
								<span className="bold">{row.timeAgo}</span>
								<span>{row.timeAgoLabel}</span>
							</span>
						</span>
					</div>
				)
			})}
		</>
	)
}

function NumIconPair({ num, icon }) {
	return (
		<span className="num-icon-pair">
			{toShortAmountStr(num)}
			<FontIcon name={icon} inline={true} nonClickable={true} />
		</span>
	)
}

