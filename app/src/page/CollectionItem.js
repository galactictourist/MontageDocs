import './collection-item.scss'
import { lazy, Suspense, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Loading from './prompts/Loading';
import CollectionContext from '../ctx/Collection';
import FontIcon from '../fontIcon/FontIcon';
import { toast } from 'react-toastify';
import TabButtons, { TRADE_TABS as TABS } from './parts/Tabs'
import { EtherScanLink } from './parts/activityTables/helper/EtherScanLink';
import CartContext from '../ctx/Cart';
import CollectionCharts from './parts/CollectionCharts';
import toShortAmountStr from '../util/toShortestAmountStr'
import { ethToUsd } from '../util/converter';
import { getExchangeProp } from '../util/getExchangeProp';
import { loadItemDetails } from '../func/items';
import { CardImageSpecs, CoverImageSpecs, getOptimizeImgUrl, NFTCardImageSpecs } from '../util/optimizedImages';
import ItemSalesActivityTable from './parts/activityTables/ItemSalesActivityTable';
import ItemOffersActivityTable from './parts/activityTables/ItemOffersActivityTable';
import ItemTransfersActivityTable from './parts/activityTables/ItemTransfersActivityTable';
import ItemMintsActivityTable from './parts/activityTables/ItemMintsActivityTable';
import AppPopup from './parts/AppPopup';
import AuthContext from '../ctx/Auth';
import { SaveButton } from './parts/SaveButton';
import { mintWithID } from '../web3/mintWithID';
import { loadCurrentMintStage, loadCurrentSchedule } from '../func/collections';
import { loadItemsToMint } from '../func/liveCollections';
import { ScheduleStages } from '../util/scheduleStages';
import { presaleStage, publicMintStage } from '../web3/util/stages';
import { canBeMintedOrBought, ItemStatus } from '../util/itemStatus';
import { MintSuccessPopup } from './MintSuccessPopup';
import getFullUrl from '../util/fullUrl';
import CardsFluidGrid from './parts/CardsFluidGrid';
import TextPhrase from './parts/TextPhrase';
import { getCollectionPageTabButtons } from './getCollectionPageTabButtons';
import CollectionPageContext from '../ctx/CollectionPageContext';
import { isVideo } from '../util/mimeTypes';
import { cidToUrl } from '../util/uploadToIPFS';
import { setColorMode } from './setColorMode';
import TxFailedContext from '../ctx/TxFailedContext';
import imagePlaceholder from '../img/image-placeholder.svg'
import InfiniteScroll from 'react-infinite-scroller';
import Spinner from '../util/Spinner';
import FightingBots from './parts/FightingBots';
import { completeDataForCartItem } from '../util/completeDataForCartItem';
import { appConfig } from '../app-config';
import { MakeOfferPopup } from './MakeOfferPopup';
import { OfferSentPopup } from './OfferSentPopup';
import { loadUserProfile } from '../func/users';
import { isValidEmail } from '../util/isValidEmail';
import { sendOfferToSeller } from '../func/emails';
import { nftLink } from '../util/nftLink';
import { acceptOffers, acceptOffersOrBids, isAuction } from '../util/priceStyle';
import { getTimerRenderer } from './parts/timerRenderer';
import last4 from '../util/last4';
const Countdown = lazy(() => import('react-countdown'))

export default function CollectionItem({ isPreviewOrMint, isMint }) {
	const { collectionPageValues, setCollectionPageValues, setMoreMainCls } = useContext(CollectionPageContext)
	const [mintSuccessOpen, setMintSuccessOpen] = useState(false)
	const [mintSuccess, setMintSuccess] = useState(false)
	const [mintResult, setMintResult] = useState(null)
	const [minting, setMinting] = useState(false)
	const { userId, accounts: accountAddress } = useContext(AuthContext)

	const [tabContentId, setTabContentId] = useState(TABS.INFO.id)
	const { setCollectionName, setCollectionItemName } = useContext(CollectionContext)
	const { collectionId, itemId, collectionIdOrAddress, tokenId } = useParams()
	const collectionAddress = isPreviewOrMint ? null : collectionIdOrAddress
	const [collection, setCollection] = useState(null)
	const [isExternalCollection, setIsExternalCollection] = useState(false)
	const [loading, setLoading] = useState(false)
	// eslint-disable-next-line
	const [itemData, setItemData] = useState(null)
	// eslint-disable-next-line
	const isOnSale = itemData?.status == ItemStatus.onSale
	const [totalTokens, setTotalTokens] = useState(0)
	const [chartsOpen, setChartsOpen] = useState(false)

	const [itemsToMint, setItemsToMint] = useState([])
	const [itemsToMintLoading, setItemsToMintLoading] = useState(false)
	const [mayHaveMoreItemsToMint, setMayHaveMoreItemsToMint] = useState(true)
	const [itemsToMintOffset, setItemsToMintOffset] = useState(0)

	const { setTxFailedData } = useContext(TxFailedContext)
	const onMintFailed = () => setTxFailedData('Mint could not be completed', collection?.profileImage ? getOptimizeImgUrl(collection.profileImage, CardImageSpecs) : imagePlaceholder)

	const doLoadItemsToMint = async (offset) => {
		if (!offset) setItemsToMintLoading(true)
		const fetchCount = 8
		loadItemsToMint(collectionId, "currentMintPrice", offset, null, itemId, fetchCount).then(loadedItems => {
			setItemsToMint(items => offset > 0 ? [...items, ...loadedItems] : loadedItems)
			setItemsToMintOffset(itemsToMint.length + loadedItems.length)
			setMayHaveMoreItemsToMint(loadedItems.length === fetchCount)
		}).finally(() => !offset && setItemsToMintLoading(false))
	}

	useEffect(() => {
		if (isPreviewOrMint) {
			doLoadItemsToMint()
		}
		// eslint-disable-next-line
	}, [isPreviewOrMint])

	const receiveItemData = (itemData, isExternalCollection, collection) => {
		if (!itemData) return

		if (isExternalCollection) {
			itemData.name = itemData.token_name
			itemData.file = itemData.cached_images.medium_500_500
			// TODO handle video mime type from itemData.cached_videos
			itemData.desc = itemData.token_description
			itemData.attributes = itemData.metadata?.attributes
			const { trait_rarity_counts: counts } = collection
			itemData.attributes?.forEach(a => {
				a.count = counts?.find(c => c.trait === a.trait_type)?.rarity_counts?.find(c => c.value === a.value)?.count || 0
				a.traitType = a.trait_type
			})
			itemData.tokenId = itemData.id
			itemData.tokenType = itemData.token_type
			itemData.blockchain = "Ethereum"
		}
		if (itemData?.originalCID) itemData.originalFile = cidToUrl(itemData.originalCID)
		setItemData(itemData)
		if (isExternalCollection || !canBeMintedOrBought(itemData.status)) setMintSuccess(true)
		setCollectionItemName(itemData.name)
	}

	const receiveCollection = (r, isExternalCollection) => {
		if (isExternalCollection) {
			r.contractAddress = r.contract_address
			r.totalTokens = parseInt(r.total_tokens)
		}
		setCollection(r)
		setColorMode(r?.lookNfeel, r?.myOwnBGColor, r?.myOwnNavBGColor, setMoreMainCls)
		setCollectionName(r?.name)
		setTotalTokens(r?.totalTokens)
	}

	useEffect(() => {
		if ((collectionId && itemId) || (collectionAddress && tokenId)) {
			setLoading(true)
			loadItemDetails({ collectionId, itemId, collectionAddress, tokenId }).then(({ collection, itemData, isExternalCollection }) => {
				setIsExternalCollection(isExternalCollection)
				receiveCollection(collection, isExternalCollection)
				receiveItemData(itemData, isExternalCollection, collection)
			}).finally(() => setLoading(false))
		}
		// eslint-disable-next-line 
	}, [collectionId, itemId, collectionAddress, tokenId, collectionPageValues])

	useEffect(() => {
		if (collectionId && collection && !collectionPageValues) {
			loadCurrentSchedule(collectionId).then(currentSchedule => {
				setCollectionPageValues({ demoStageInt: 0, currentScheduleStage: currentSchedule?.stage, selfMinted: false, lookNfeel: collection.lookNfeel, myOwnNavBGColor: collection.myOwnNavBGColor })
			})
		}
		// eslint-disable-next-line 
	}, [collectionId, collectionPageValues, collection])

	const { indexOfItemInCart, addToCart } = useContext(CartContext)
	const addToCartClick = () => {
		if (!itemData) return
		console.log('addToCartClick', itemData)
		const ix = indexOfItemInCart(tokenId)
		if (ix > -1) toast('Item already in cart')
		else {
			const item = completeDataForCartItem({ ...itemData })
			addToCart({
				...item,
				collectionId: collectionAddress
			})
		}
	}

	const itemPriceETH = isExternalCollection ? parseFloat(itemData?.recent_price?.price) || 0 : itemData?.salePrice || itemData?.mintPrice || 0
	const itemPriceUSD = isExternalCollection ? parseFloat(itemData?.recent_price?.price_usd) || 0 : ethToUsd(itemPriceETH)

	const mintItem = async () => {
		const { stage: scheduleStage } = await loadCurrentMintStage(collectionId)
		const mintStage = scheduleStage === ScheduleStages.mint ? publicMintStage : presaleStage
		const tokenId = itemData?.tokenId
		if (!tokenId) {
			throw new Error(`NFT should have tokenId; itemId: ${itemData?.itemId}}`)
		}

		try {
			const mintResult = await mintWithID(itemData.creatorAddress, tokenId, accountAddress, setMinting, collectionId, mintStage, itemPriceETH)
			if (mintResult) {
				setMintResult(mintResult)
				setMintSuccess(true)
				setMintSuccessOpen(true)
			} else {
				onMintFailed()
			}
		} catch (e) {
			// check if the error is a known error type
			if (e.message?.includes("revert")) {
				// extract the specific error message from the contract
				const revertType = e.message.replace("VM Exception while processing transaction: revert ", "")
				// check if the error message matches the specific error type
				if (revertType === "MintNotAvailable") {
					// handle MintNotAvailable error
					console.log("Mint is not available")
				} else {
					// handle unknown revert error
					console.log("Unknown revert error:", revertType)
				}
			} else if (e.message.includes("out of gas")) {
				// handle out of gas error
				console.log("Transaction ran out of gas")
			} else {
				// handle unknown error
				console.error(e)
			}
			onMintFailed()
		}
	}

	function DataPoint({ label, value, labelIsBold, valueIsNotBold, valuePostfix = "" }) {
		return (
			<div className="collection-item--data-point">
				<label className={labelIsBold ? "bold" : ""}>{label}</label>
				<span className={valueIsNotBold ? "normal" : ""}>{value}{valuePostfix}</span>
			</div>
		)
	}

	const getInfoTabContent = () => {
		return (
			<div className="collection-item--info jc-sa">
				<div className="collection-item--data-point-table">
					<DataPoint label="PROPERTIES" value={toShortAmountStr(itemData?.attributes?.length || 0)} labelIsBold={true} />
					{itemData?.attributes?.map((p, idx) => {
						return (
							<div className="flex-column" key={idx}>
								<DataPoint label={p.traitType} value={(totalTokens > 0 ? p.count / totalTokens * 100 : 100).toFixed(2) + '%'} labelIsBold={true} />
								<DataPoint label={p.value} value={p.count} valueIsNotBold={true} />
							</div>
						)
					})}
				</div>
				<div className="collection-item--data-point-table">
					<DataPoint label="Contract address" value={<EtherScanLink address={collection?.contractAddress} className="primary" />} />
					<DataPoint label="Token ID" value={<EtherScanLink address={collection?.contractAddress} tokenId={itemData?.tokenId} className="primary" />} />
					<DataPoint label="Token Standard" value={itemData?.tokenType} />
					<DataPoint label="Blockchain" value={itemData?.blockchain} />
					{/* <DataPoint label="Last updated" value={itemData?.recent_price ? itemData?.recent_price.date : itemData?.minted_at} /> */}
					{/* <DataPoint label="Creator earnings" value={itemData?.creatorRoyalties || collection?.creatorRoyalties || '---'} valuePostfix={itemData?.creatorRoyalties > 0 || collection?.creatorRoyalties > 0 ? "%" : ""} /> */}
					{/* <div className="ta-c" style={{ marginLeft: 'auto' }}><FontIcon name="graph" asFabButton={true} inline={true} onClick={() => setChartsOpen(true)} /></div> */}
				</div>
			</div>
		)
	}
	const getSelectedTabContent = () => {
		switch (tabContentId) {
			case TABS.INFO.id: return getInfoTabContent()
			case TABS.SALES.id: return <ItemSalesActivityTable address={collectionAddress} tokenId={tokenId} />
			case TABS.OFFERS.id: return <ItemOffersActivityTable address={collectionAddress} tokenId={tokenId} />
			case TABS.TRANSFERS.id: return <ItemTransfersActivityTable address={collectionAddress} tokenId={tokenId} />
			case TABS.MINTS.id: return <ItemMintsActivityTable address={collectionAddress} tokenId={tokenId} />
			default:
				console.error("unknown tabContentId at getSelectedTabContent", tabContentId)
				return null
		}
	}

	const toWiderImageFormat = (url) => {
		if (url) {
			if (url.startsWith('https://montage.') || url.startsWith('https://montage-dev.')) {
				return getOptimizeImgUrl(url, CoverImageSpecs)
			}
			const spl = url.split('?')
			return spl[0] + '?w=1440&auto=format'
		}
		return url
	}
	const banner_image_url = () => toWiderImageFormat(getExchangeProp(collection, "banner_image_url"))
	const coverImage = (url) => url ? <div className="cover-image" style={{ backgroundImage: `url(${url})` }}></div> : null

	const [makeAnOfferOpen, setMakeAnOfferOpen] = useState(false)
	const [offerSentOpen, setOfferSentOpen] = useState(false)
	const makeAnOfferClick = () => {
		setMakeAnOfferOpen(true)
	}
	const onOfferMade = (offer) => {
		console.log("offer made", offer)
		loadUserProfile(userId).then((user) => {
			if (isValidEmail(user.email)) {
				sendOfferToSeller(user.email, offer)
			}
		})
		// TODO [offers] - create offer
		setOfferSentOpen(true)
	}
	const getCountdownRenderer = () => getTimerRenderer(() => window.location.reload(), "x-small")

	if (process.env.REACT_APP_MINT_DISABLED === '1') return <FightingBots />

	if (isPreviewOrMint && (!collectionId || !itemId)) return null
	if (!isPreviewOrMint && (!collectionAddress || !tokenId)) return null
	if (loading) return <Loading />

	return (
		<div className="collection-item mx-auto">
			{coverImage(banner_image_url())}
			{getCollectionPageTabButtons({ ...collectionPageValues, isExternalCollection, getBasePath: () => isPreviewOrMint ? `/collection-page/${collectionId}` : `/collection-page/${collectionAddress}` })}
			<div className="collection-item-inner mx-auto">
				<div className="collection-item-details">
					<div>
						<div className={canBeMintedOrBought(itemData?.status) ? "" : "has-status-overlay d-ib"}>
							{isVideo(itemData?.mimeType) ?
								<video src={itemData?.file} autoPlay={true} controls={true} muted={true} loop={true} className="collection-item--file" />
								:
								<img src={getOptimizeImgUrl(itemData?.file, NFTCardImageSpecs, itemData?.mimeType, itemData?.keepAspectRatio, itemData?.originalCID)} alt="" className={"collection-item--file" + (itemData?.keepAspectRatio ? " keep-aspect-ratio" : "")} />
							}
							{canBeMintedOrBought(itemData?.status) ? null : <div className="collection-item-sold-overlay"></div>}
						</div>
					</div>
					<div className="flex-column">
						<div className="collection-item-names">
							<div className="fw-500">{itemData?.name}</div>
							<div className="flex-row ai-c" style={{ columnGap: 16 }}>
								{itemData?.creatorName ? <span>by {itemData?.creatorName}</span> : null}
								{itemData?.creatorTwitter ? <a href={getFullUrl(itemData.creatorTwitter, 'twitter')} target="_blank" rel="noreferrer"><FontIcon name="twitter" inline={true} /></a> : null}
							</div>
							<div>of {collection?.name}</div>
						</div>
						<div className="collection-item--desc">
							{itemData?.desc}
						</div>
						<div className="flex-column jc-sb" style={{ marginTop: 'auto' }}>
							{!(appConfig.offers && isAuction(itemData?.priceStyle)) ?
								<div className="flex-row jc-sb ai-c">
									<div className="collection-item-price-small">
										<FontIcon name="dollar" inline={true} nonClickable={true} />
										{toShortAmountStr(itemPriceUSD)}
									</div>
									<div className="collection-item-price fw-500">
										<FontIcon name="eth" inline={true} nonClickable={true} />
										{toShortAmountStr(itemPriceETH)}
									</div>
								</div> : null}
							<div className="mint-btn-ct">
								<SaveButton saving={minting}
									disabled={(isPreviewOrMint && !isMint) || minting || mintSuccess}
									onClick={isMint && !isOnSale ? mintItem : addToCartClick} style={{ width: '100%' }}
									text={mintSuccess ? "Sold already" : isMint && !isOnSale ? "Mint now" : "Add to cart"}
									doRender={!(appConfig.offers && isAuction(itemData?.priceStyle))}
								/>
								{appConfig.offers && isAuction(itemData?.priceStyle) && itemData?.bidEndTime ?
									<div className="flex-row">
										<span className="f-1">Time left:</span>
										<span><Suspense fallback={<Spinner />}><Countdown date={new Date(itemData.bidEndTime)} renderer={getCountdownRenderer()} /></Suspense></span>
									</div> : null}
								{appConfig.offers && isAuction(itemData?.priceStyle) && itemData?.bidMinPrice > 0 ?
									<div className="flex-row jc-sb ai-c">
										<span>Minimal bid:</span>
										<span className="collection-item-price-small">
											<FontIcon name="dollar" inline={true} nonClickable={true} />
											{toShortAmountStr(ethToUsd(itemData.bidMinPrice))}
										</span>
										<span className="collection-item-price fw-500">
											<FontIcon name="eth" inline={true} nonClickable={true} />
											{toShortAmountStr(itemData.bidMinPrice)}
										</span>
									</div> : null}
								<SaveButton doRender={appConfig.offers && (acceptOffers(itemData?.priceStyle) || isAuction(itemData?.priceStyle))}
									// disabled={isPreviewOrMint && !isMint}
									className={acceptOffers(itemData?.priceStyle) ? "secondary" : "primary"}
									onClick={makeAnOfferClick}
									style={{ width: '100%', marginTop: 24 }}
									text={mintSuccess ? "Sold already" : acceptOffers(itemData?.priceStyle) ? "Make an offer" : isPreviewOrMint && !isOnSale ? "Bid to mint" : "Bid now"} />
								{appConfig.offers && isAuction(itemData?.priceStyle) && itemData?.topBid > 0 && itemData?.topBidderWallet ?
									<div className="flex-row jc-sb ai-c">
										<span>Winning bid so far:</span>
										<span className="collection-item-price-small">
											<FontIcon name="eth" inline={true} nonClickable={true} />
											{/* TODO [offers] - topBid */}
											{/* TODO no db field for topBid - planning to get it from the contract? */}
											{toShortAmountStr(itemData.topBid)}
										</span>
										<span className="collection-item-price-small">
											<span>Wallet:</span>
											{/* TODO [offers] - topBidderWallet */}
											{/* TODO no db field for topBidderWallet - planning to get it from the contract? */}
											{last4(itemData.topBidderWallet)}
										</span>
									</div> : null}
							</div>
						</div>
					</div>
				</div>

				{isPreviewOrMint ? null : <TabButtons buttons={[TABS.INFO, TABS.SALES, TABS.OFFERS, TABS.TRANSFERS, TABS.MINTS]} tabContentId={tabContentId} setTabContentId={setTabContentId} />}
			</div>
			{isPreviewOrMint ?
				(itemsToMintLoading ?
					<Loading />
					:
					itemsToMint.length === 0 ?
						null
						:
						<>
							<TextPhrase isSubTitle={true} padTop1={true}>Other items in collection</TextPhrase>
							<InfiniteScroll
								initialLoad={false}
								loadMore={() => doLoadItemsToMint(itemsToMintOffset)}
								hasMore={mayHaveMoreItemsToMint}
								loader={<div className="ta-c" key={0}><Spinner /></div>}
							>
								<CardsFluidGrid
									target="_blank"
									list={itemsToMint}
									cardImageSpecs={NFTCardImageSpecs}
									cardTo={nftLink}
									srcKey="file" srcMimeType="mimeType" idKey="itemId"
									beforeFavButton={(_itemId, item) => <span className="collection-item-price collection-item-price-small"><FontIcon name="eth" inline={true} nonClickable={true} />{Number(parseFloat(item.price).toFixed(4))}</span>}
									moreGridCls="two-big-cards"
									cardImgCtStatusOverlay={({ status }) => canBeMintedOrBought(status) ? null : <div className="collection-item-sold-overlay"></div>}
									cardImgCtHasStatusOverlay={({ status }) => !canBeMintedOrBought(status)}
									footerKey={(item) => {
										return (<div className="flex-column">
											<div>{item.name} <span className="by-creator">by {item.creatorName}</span></div>
											<div>{item.collectionName}</div>
										</div>)
									}}
								/>
							</InfiniteScroll>
						</>)
				:
				(<>
					<div className="tab-body">
						<div className="tab-content no-gradient pb-4" style={{ minHeight: 400 }}>{getSelectedTabContent()}</div>
					</div>
					<AppPopup visible={chartsOpen} setVisible={() => setChartsOpen(false)}>
						<div className="collection-charts-popup-content"><CollectionCharts /></div>
					</AppPopup>
				</>
				)}
			<MintSuccessPopup visible={mintSuccessOpen} setVisible={setMintSuccessOpen} mintResult={mintResult} />
			<MakeOfferPopup visible={appConfig.offers && acceptOffersOrBids(itemData?.priceStyle) && makeAnOfferOpen} priceStyle={itemData?.priceStyle} setVisible={setMakeAnOfferOpen} item={itemData} onOfferMade={onOfferMade} />
			<OfferSentPopup visible={appConfig.offers && acceptOffersOrBids(itemData?.priceStyle) && offerSentOpen} priceStyle={itemData?.priceStyle} setVisible={setOfferSentOpen} />
		</div>
	)
}
