import { LoadingInline } from './prompts/Loading'
import './collection-marketplace.scss'
import { useParams } from 'react-router'
import CardsFluidGrid from './parts/CardsFluidGrid'
import { useContext, useEffect, useState } from 'react'
import { getNFTDetails, getCollectionSummery } from '../func/nfts'
import CollectionContext from '../ctx/Collection'
import FontIcon from '../fontIcon/FontIcon'
import getFullUrl from '../util/fullUrl'
import PropOptionFilter from './parts/PropOptionFilter'
import { AppControl } from './parts/AppControl'
import { TradeControlButtons } from './parts/TradeControlButtons'
import toShortAmountStr from '../util/toShortestAmountStr'
import TabButtons, { TRADE_TABS as TABS } from './parts/Tabs'
import CartContext from '../ctx/Cart'
import ManageCartItemButton from './parts/ManageCartItemButton'
import CardButtonOverlay from './parts/CardButtonOverlay'
import CollectionItemSourceMarket, { exchangeToSourceMarket } from './parts/CollectionItemSourceMarket'
import TradeContext from '../ctx/Trade'
import CollectionCharts from './parts/CollectionCharts'
import { getExchangeProp } from '../util/getExchangeProp';

import SalesActivityTable from './parts/activityTables/SalesActivityTable'
import OffersActivityTable from './parts/activityTables/OffersActivityTable'
import TransfersActivityTable from './parts/activityTables/TransfersActivityTable'
import MintsActivityTable from './parts/activityTables/MintsActivityTable'
import AppPopup from './parts/AppPopup'
import { NoActionHereYet } from './parts/TextPhrase'
import { completeDataForCartItem } from '../util/completeDataForCartItem'
import InfiniteScroll from 'react-infinite-scroller'
import Spinner from '../util/Spinner'

const chain = process.env.REACT_APP_CHAINID
const limit = 6 // 6 items per load

export default function CollectionMarketplace({ selectedTabContentId, nftAddress, hasItemsTab = true, isExternalCollection = false }) {
	const [loading, setLoading] = useState(false)
	const [tabContentId, setTabContentId] = useState(selectedTabContentId || (hasItemsTab ? TABS.ITEMS.id : TABS.SALES.id))
	const { setCollectionName } = useContext(CollectionContext)
	const { collectionIdOrAddress } = useParams() // is undefined when called from MyCollectionActivity; nftAddress passed for live montage collection
	const collectionAddress = nftAddress || collectionIdOrAddress
	const useLocalMarket = nftAddress?.length > 0 && !isExternalCollection
	const [collectionProfile, setCollectionProfile] = useState(null)
	const [items, setItems] = useState([])
	const [cursor, setCursor] = useState('')
	const [collectionProps, setCollectionProps] = useState([])
	const [mayHaveMore, setMayHaveMore] = useState(true)
	const [chartsOpen, setChartsOpen] = useState(false)
	const [propsFilterOpen, setPropsFilterOpen] = useState(false)
	// eslint-disable-next-line
	const [traitFilter, setTraitFilter] = useState('')
	const [stats, setStats] = useState({
		total: 0,
		available: 0, availableChange: 0,
		avgOwner: 0, avgOwnerChange: 0,
		owners: 0, ownersChange: 0,

		floorPrice: 0, floorPriceChange: 0,
		avgPrice: 0, avgPriceChange: 0,
		bestOffer: 0, bestOfferChange: 0,

		totalVol: 0, totalVolChange: 0,
		availVol: 0, availVolChange: 0,
		salesNum: 0, salesNumChange: 0,
		salesSpeed: '0 min', salesSpeedChange: 0,
	})

	const [itemFilters, setItemFilters] = useState({ buyNow: true, minPrice: null, maxPrice: null })
	const [propsFilter, setPropsFilter] = useState({}) // { [propId]: { [optionId]: true|false|undefined } }
	const [propsFilterText, setPropsFilterText] = useState('')

	useEffect(() => {
		const optionNames = []
		Object.keys(propsFilter).forEach(propId => {
			// eslint-disable-next-line
			const p = collectionProps.find(p => p.id == propId)
			if (p) {
				Object.keys(propsFilter[propId]).forEach(optionId => {
					if (propsFilter[propId][optionId]) {
						// eslint-disable-next-line
						const o = p.options.find(o => o.id == optionId)
						if (o.name) optionNames.push(o.name)
					}
				})
			}
		})
		setPropsFilterText(optionNames.length ? optionNames.join(', ') : '')
	}, [propsFilter, collectionProps])

	const doLoadItems = async (cursor) => {
		if (!collectionAddress) return
		const { cursor: newCursor, results } = await getNFTDetails(collectionAddress, chain, traitFilter, limit, cursor, useLocalMarket)
		setCursor(newCursor)
		setMayHaveMore(!!newCursor && results?.length === limit)
		const loadedItems = results?.map(item => completeDataForCartItem(item)) || []
		const doAppendLoadedItems = !!cursor
		if (doAppendLoadedItems) {
			setItems(items => [...items, ...loadedItems])
		} else {
			setItems(loadedItems)
		}
	}

	const doLoadSummery = async () => {
		if (!collectionAddress) return
		const r = await getCollectionSummery(collectionAddress, chain, 0, 1, useLocalMarket)
		if (r?.exchange_data) {
			const [d0, d1] = r.exchange_data
			const exchange_data = Object.keys(d1 || {}).length > 0 ? d1 : Object.keys(d0 || {}).length > 0 ? d0 : null

			let count = 1, optionId = 1;
			let result = [];
			if (r?.trait_rarity_counts) {
				r?.trait_rarity_counts.forEach(item => {
					let options = [];
					let temp = item?.rarity_counts?.sort((a, b) => a.value.localeCompare(b.value));
					temp?.forEach(item => {
						options.push({ id: optionId++, name: item.value })
					})
					result.push({ id: count++, name: item.trait, options: options });
				})
			}
			setCollectionProps(result)

			if (exchange_data) {
				setCollectionName(exchange_data.name)
				setCollectionProfile({
					collectionProfileName: exchange_data.name,
					collectionProfileImage: exchange_data.image_url,
					collectionProfileBannerImage: exchange_data.banner_image_url,
					collectionSlug: exchange_data.key,
					collectionDiscordURL: exchange_data.discord_url,
					collectionTelegramURL: exchange_data.telegram_url,
					collectionInstagramName: exchange_data.instagram_username,
					collectionTwitterName: exchange_data.twitter_username,
					collectionSourceMarket: exchangeToSourceMarket(exchange_data.exchange),
				})
				const { stats } = exchange_data
				if (stats) {
					setStats({
						total: parseInt(r.total_tokens),
						available: (r?.total_tokens - stats?.total_minted) || 0,
						availableChange: 0,
						avgOwner: Number(((stats.total_minted || 0) / stats.num_owners).toFixed(2)) || 0,
						avgOwnerChange: 0,
						owners: stats.num_owners,
						ownersChange: 0,
						floorPrice: Number(getExchangeProp(r, "stats", "floor_price")?.toFixed(4)) || 0,
						floorPriceChange: r.floor_change,
						avgPrice: Number(stats.one_day_average_price.toFixed(4)) || 0,
						avgPriceChange: Number(((stats.one_day_average_price - stats.seven_day_average_price) / stats.seven_day_average_price * 100).toFixed(2)) || 0,
						bestOffer: Number(stats.one_day_average_price.toFixed(4)) || 0,
						bestOfferChange: Number(((stats.one_day_average_price - stats.seven_day_average_price) / stats.seven_day_average_price * 100).toFixed(2)) || 0,
						totalVol: Number(stats.total_volume.toFixed(2)) || 0,
						totalVolChange: Number((stats.one_day_volume_change / stats.total_volume * 100).toFixed(2)) || 0,
						availVol: Number(stats.market_cap.toFixed(4)) || 0,
						availVolChange: Number((stats.one_day_volume_change / stats.one_day_volume * 100).toFixed(2)) || 0,
						salesNum: stats.one_day_sales,
						salesNumChange: Number(((stats.one_day_sales - stats.seven_day_sales / 7) / (stats.seven_day_sales / 7) * 100).toFixed(2)) || 0,
						salesSpeed: `${Number((1440.0 / stats.one_day_sales).toFixed(1))} min`,
						salesSpeedChange: Number(((1440.0 / stats.one_day_sales - 10080.0 / stats.seven_day_sales) / (10080.0 / stats.seven_day_sales) * 100).toFixed(2)) || 0
					})
				}
			}
		}
	}

	const doLoadSummaryWithItems = () => {
		setLoading(true)
		Promise.all([doLoadSummery(), doLoadItems()]).finally(() => setLoading(false))
	}

	const { indexOfItemInCart, toggleItemInCart, isAfterPurchase, setIsAfterPurchase } = useContext(CartContext)

	useEffect(() => {
		if (collectionAddress) {
			doLoadSummaryWithItems()
		}
		// eslint-disable-next-line
	}, [collectionAddress])

	useEffect(() => {
		if (isAfterPurchase) {
			setIsAfterPurchase(false)
			doLoadSummaryWithItems()
		}
		// eslint-disable-next-line
	}, [isAfterPurchase])

	const getItemCardOverlays = (id, _item) => {
		return (<>
			<ManageCartItemButton isInCart={indexOfItemInCart(id) > -1} />
			<CardButtonOverlay collectionIdOrAddress={collectionAddress} tokenId={id} />
			<CollectionItemSourceMarket sourceMarket={collectionProfile.collectionSourceMarket} />
		</>)
	}
	const isItemInSelected = (id, _item) => (indexOfItemInCart(id) > -1 ? 'selected' : '') + ' interactive'
	const { quoteCurrency } = useContext(TradeContext)
	const getItemPrice = (_id, item) => item.priceETH ? <span className="collection-item-price bold"><FontIcon name={quoteCurrency} inline={true} />{quoteCurrency === "eth" ? item.priceETH : item.priceUSD}</span> : null
	const getItemsTabContent = () => (<>
		{items?.length > 0 ? <div className="item-filters-row">
			{/* <AppControl type="checkbox" setData={setItemFilters} name="buyNow" toggleTitle="Buy now" noLabel={true} value={itemFilters.buyNow} /> */}
			<div className="flex-row" style={{ columnGap: 8 }}>
				<AppControl type="number" subtype="price" setData={setItemFilters} placeholder="Min price" name="minPrice" noLabel={true} value={itemFilters.minPrice} noSpinners={true} disabled={true} />
				<AppControl type="number" subtype="price" setData={setItemFilters} placeholder="Max price" name="maxPrice" noLabel={true} value={itemFilters.maxPrice} noSpinners={true} disabled={true} />
			</div>
			<div className="flex-row" style={{ columnGap: 8 }}>
				<AppControl placeholder="Properties" noLabel={true} value={propsFilterText} setValue={setPropsFilterText} disabled={true} />
				<FontIcon name="options" asFabButton={true} inline={true} onClick={() => setPropsFilterOpen(true)} disabled={true} />
			</div>
			<FontIcon name="graph" asFabButton={true} inline={true} onClick={() => setChartsOpen(true)} />
		</div> : null}
		<InfiniteScroll
			initialLoad={false}
			loadMore={() => doLoadItems(cursor)}
			hasMore={mayHaveMore}
			loader={<div className="ta-c" key={0}><Spinner /></div>}
		>
			<CardsFluidGrid
				list={items}
				appendToCard={getItemCardOverlays}
				cardClick={toggleItemInCart}
				moreCardCls={isItemInSelected}
				beforeFavButton={getItemPrice}
				onEmpty={<NoActionHereYet />}
				srcKey="image"
				srcCachedImages="cached_images"
				srcCacheKey="small_250_250"
				idKey="id"
				footerKey="token_name"
				// hasFavToggleButton={true}
				// onFavToggleClick={onFavToggleClick}
				// isFav={data => (data.roles & RolesMap.follower) > 0}
				// isFav={_data => false}
				moreFooter={(_itemId, _data) => <div className="card-footer-sub-line">{collectionProfile.collectionProfileName}</div>}
			/>
		</InfiniteScroll>
	</>)
	const getSelectedTabContent = () => {
		switch (tabContentId) {
			case TABS.ITEMS.id: return getItemsTabContent()
			case TABS.SALES.id: return <SalesActivityTable collectionAddress={collectionAddress} />
			case TABS.OFFERS.id: return <OffersActivityTable collectionAddress={collectionAddress} />
			case TABS.TRANSFERS.id: return <TransfersActivityTable collectionAddress={collectionAddress} />
			case TABS.MINTS.id: return <MintsActivityTable collectionAddress={collectionAddress} />
			default:
				console.error("unknown tabContentId at getSelectedTabContent", tabContentId)
				return null
		}
	}

	if (!collectionProfile) return null
	if (loading) return <LoadingInline />

	return (
		<>
			<div className="collection-marketplace mx-auto">
				<div className="collection-header">
					<div className="collection-details">
						<div className="collection-details--top-header">
							<img src={collectionProfile?.collectionProfileImage} alt="" className="collection-profile-image" />
							<span className="collection-name">{collectionProfile?.collectionProfileName}</span>
							<span className="collection-details--social-links">
								<SocialIconLink url={collectionProfile?.collectionTwitterName} icon="twitter" />
								<SocialIconLink url={collectionProfile?.collectionDiscordURL} icon="discord" />
								{/* <SocialIconLink url={data.tiktok} icon="tiktok" /> */}
								{/* <SocialIconLink url={data.youtube} icon="youtube" /> */}
								<SocialIconLink url={collectionProfile?.collectionInstagramName} icon="instagram" />
							</span>
							<TradeControlButtons />
						</div>
						<div className="collection-details--stats-summary">
							<LabeledStatsValue label="Ttl volume" value={toShortAmountStr(stats.totalVol)} eth={true} />
							<LabeledStatsValue label="Floor price" value={stats.floorPrice} eth={true} />
							<LabeledStatsValue label="Best offer" value={stats.bestOffer || "TBD"} eth={true} />
							<LabeledStatsValue label="Owners" value={toShortAmountStr(stats.owners)} />
							<LabeledStatsValue label="Unique owners" value={stats.total > 0 ? Math.round(stats.owners * 100 / stats.total) : "TBD"} pecrent={stats.total > 0} />
						</div>
					</div>

					<TabButtons buttons={[hasItemsTab ? TABS.ITEMS : null, TABS.SALES, TABS.OFFERS, TABS.TRANSFERS, TABS.MINTS]} tabContentId={tabContentId} setTabContentId={setTabContentId} moreCls="jc-c" />
				</div>
				<div className="tab-body">
					<div className="tab-content no-gradient">{getSelectedTabContent()}</div>
				</div>
			</div>
			<AppPopup visible={chartsOpen} setVisible={() => setChartsOpen(false)}>
				<div className="collection-charts-popup-content"><CollectionCharts collectionAddress={collectionAddress} /></div>
			</AppPopup>
			<AppPopup visible={propsFilterOpen} setVisible={() => setPropsFilterOpen(false)} insideCls="props-filter-popup-content">
				<div className="props-filter-popup-content">
					{collectionProps.map((prop, idx) => <PropOptionFilter key={idx} prop={prop} propsFilter={propsFilter} setPropsFilter={setPropsFilter} />)}
				</div>
			</AppPopup>
		</>
	)
}

function LabeledStatsValue({ label, value, eth = false, pecrent = false }) {
	return (<div>
		<div className="labeled-stats-value--value">{value}{eth ? <FontIcon name="eth" inline={true} nonClickable={true} /> : null}{pecrent ? "%" : ""}</div>
		<div className="labeled-stats-value--label">{label}</div>
	</div>)
}

function SocialIconLink({ url, icon }) {
	const fullUrl = getFullUrl(url, icon)
	return fullUrl ? <a href={fullUrl} target="_blank" rel="noreferrer"><FontIcon name={icon} /></a> : null
}
