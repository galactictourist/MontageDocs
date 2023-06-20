import appLogo from '../img/logo.svg'
import defaultProfileImage from '../img/default-profile-image.svg';
import './collection-page.scss'
import { lazy, Suspense, useCallback, useContext, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import CollectionContext from "../ctx/Collection"
import { checkAllowList, createMember, createUserCollection, loadCollectionPies, loadCurrentSchedule, loadMyCollectionStory, loadTeamForStory, mintStagePieIndex, saleStagePieIndex } from "../func/collections"
import setOptimizedUrls, { CardImageSpecs, CoverImageSpecs, getOptimizeImgUrl, NFTCardImageSpecs, ProfileImageSpecs } from "../util/optimizedImages"
import StickyButtonContainer from './parts/StickyButtonContainer'
import CardsFluidGrid from './parts/CardsFluidGrid'
import FontIcon from '../fontIcon/FontIcon'
import getFullUrl from '../util/fullUrl'
import { ImageTextBlock, ImageTextBlockTitle } from './parts/ImageTextBlock'
import { ScheduleStages } from '../util/scheduleStages'
import { PAGE_TABS as TABS } from './parts/Tabs'
import CollectionMarketplace from './CollectionMarketplace'
import Loading from './prompts/Loading'
import EnterPassword from './prompts/EnterPassword'
import { LookNFeelMap } from '../util/lookNfeel'
import { loadArtShowcase } from '../func/artShowcase';
import Spinner from '../util/Spinner';
import { PageSectionStyleMap, PageSectionTypeMap } from '../util/pageSection';
import { loadLiveCollection, loadNonMintedItemsCount, loadItemsToMint, loadCollectionIdByNFTAddress } from '../func/liveCollections';
import { MintCard } from './parts/MintCard';
import { presaleStage, publicMintStage } from '../web3/util/stages';
import { ImageVAlignMap } from '../util/imageVAlign';
import MyBalance from './MyBalance';
import imagePlaceholder from '../img/image-placeholder.svg'
import TxFailedContext from "../ctx/TxFailedContext";
import { MintSuccessPopup } from './MintSuccessPopup';
import AuthContext from '../ctx/Auth';
import { RolesMap } from '../util/roles';
import InviteContext from '../ctx/Invite';
import { getCollectionPageTabButtons } from './getCollectionPageTabButtons';
import CollectionPageContext from '../ctx/CollectionPageContext';
import { LoopPopup } from './LoopPopup';
import { LoopCongratsPopup } from './LoopCongratsPopup';
import { getTimerRenderer } from './parts/timerRenderer';
import { ConnectWalletButton } from './parts/ConnectWalletButton';
import { canBeMintedOrBought } from '../util/itemStatus';
import { setColorMode } from './setColorMode';
import InfiniteScroll from 'react-infinite-scroller';
import { ShowMarketMode } from '../util/showMarketMode';
import FightingBots from './parts/FightingBots';
import CartContext from '../ctx/Cart';
import { nftLink } from '../util/nftLink';
import { getContractType } from '../util/contractTypes';
import MyEarnings from './MyEarnings';

const Countdown = lazy(() => import('react-countdown'))

const INIT_NON_MINTED_ITEMS_COUNT = -1

export default function CollectionPage({ aCollectionId, isPreview }) {
	const { setCartMarketFee } = useContext(CartContext)
	const { userId, isAdmin, openWalletConnectPopup } = useContext(AuthContext)
	const { setCollectionPageValues, setMoreMainCls } = useContext(CollectionPageContext)
	const [itemsToMint, setItemsToMint] = useState([])
	const [mayHaveMoreItemsToMint, setMayHaveMoreItemsToMint] = useState(true)
	const [itemsToMintOffset, setItemsToMintOffset] = useState(0)

	const { setTxFailedData } = useContext(TxFailedContext)

	const [mintSuccessOpen, setMintSuccessOpen] = useState(false)
	const [mintResult, setMintResult] = useState(null)

	const [loading, setLoading] = useState(false)
	const { setCollectionName } = useContext(CollectionContext)
	const [data, setData] = useState({})
	const [team, setTeam] = useState([])
	const collectionIdOrAddress = useParams().collectionId || aCollectionId
	const [collectionId, setCollectionId] = useState(0)
	const { demoStageOrTabContentId, demoStage, demoTabContentId } = useParams()
	const demoStageInt = isPreview ? parseInt(demoStage) : demoStageOrTabContentId ? parseInt(demoStageOrTabContentId) || 0 : 0
	const tabContentId = isPreview ? demoTabContentId : demoStageInt > 0 ? null : demoStageOrTabContentId
	const [currentSchedule, setCurrentSchedule] = useState(null)
	const [validPwdEnteredYet, setValidPwdEnteredYet] = useState(false)
	const [arts, setArts] = useState(null)
	const [nftAddress, setNFTAddress] = useState('')
	const [isExternalCollection, setIsExternalCollection] = useState(false)
	const [selfMinted, setSelfMinted] = useState(false)
	const [samePriceForAllNFT, setSamePriceForAllNFT] = useState(false)
	const isDynamicPricing = useCallback(() => !selfMinted && !samePriceForAllNFT, [selfMinted, samePriceForAllNFT])
	const [nonMintedItemsCount, setNonMintedItemsCount] = useState(INIT_NON_MINTED_ITEMS_COUNT)
	const [privateMintLaunchAt, setPrivateMintLaunchAt] = useState(null)
	const [publicMintLaunchAt, setPublicMintLaunchAt] = useState(null)
	const [pies, setPies] = useState([])
	const [showEarnings, setShowEarnings] = useState(false)
	const { inviteArgs } = useContext(InviteContext)
	const [isInAllowList, setIsInAllowList] = useState(false)

	useEffect(() => {
		if (collectionIdOrAddress?.startsWith('0x')) {
			loadCollectionIdByNFTAddress(collectionIdOrAddress).then(({ collectionId }) => {
				if (collectionId > 0) {
					setCollectionId(collectionId)
				} else {
					setIsExternalCollection(true)
				}
				setNFTAddress(collectionIdOrAddress)
			})
		} else if (collectionIdOrAddress?.length > 0) {
			const collectionId = parseInt(collectionIdOrAddress)
			if (collectionId > 0) {
				setCollectionId(collectionId)
				if (!demoStageInt) {
					loadLiveCollection(collectionId).then(({ nftAddress }) => {
						if (nftAddress) {
							setNFTAddress(nftAddress)
						}
					})
				}
			}
		}
	}, [collectionIdOrAddress, demoStageInt])

	useEffect(() => {
		if (collectionId && userId && currentSchedule?.stage === ScheduleStages.premint) {
			checkAllowList(collectionId, userId).then(setIsInAllowList)
		}
	}, [currentSchedule, collectionId, userId])

	const doLoadItemsToMint = async (offset) => {
		const fetchCount = 8
		const loadedItems = await loadItemsToMint(collectionId, tabContentId === TABS.PREMINT.id ? "premintPrice" : "mintPrice", offset, inviteArgs?.invitingUserId, 0, fetchCount)
		setItemsToMint(items => offset > 0 ? [...items, ...loadedItems] : loadedItems)
		setItemsToMintOffset(itemsToMint.length + loadedItems.length)
		setMayHaveMoreItemsToMint(loadedItems.length === fetchCount)
	}

	useEffect(() => {
		if (collectionId) {
			if (tabContentId === TABS.MINT.id || tabContentId === TABS.PREMINT.id) {
				if (isDynamicPricing()) {
					doLoadItemsToMint()
				}
			}
		}
		// eslint-disable-next-line
	}, [isDynamicPricing, tabContentId, collectionId])

	useEffect(() => {
		if (collectionId) {
			loadNonMintedItemsCount(collectionId).then(setNonMintedItemsCount)
		}
	}, [collectionId])

	useEffect(() => {
		if (collectionId) {
			setLoading(true)
			loadMyCollectionStory(collectionId).then(data => {
				setCollectionName(data.name || 'Collection')
				setCartMarketFee(data.marketFee)
				setSelfMinted(data.selfMinted)
				setSamePriceForAllNFT(data.samePriceForAllNFT)
				setData(data)
				setColorMode(data.lookNfeel, data.myOwnBGColor, data.myOwnNavBGColor, setMoreMainCls)
				loadCurrentSchedule(collectionId, demoStageInt).then(r => {
					setCurrentSchedule(r)
					if (r?.privateMintLaunchAt !== undefined) {
						setPrivateMintLaunchAt(r.privateMintLaunchAt ? new Date(r.privateMintLaunchAt) : demoStageInt ? new Date(Date.now() + 1000000) : undefined)
					}
					if (r?.publicMintLaunchAt !== undefined) {
						setPublicMintLaunchAt(r.publicMintLaunchAt ? new Date(r.publicMintLaunchAt) : demoStageInt ? new Date(Date.now() + 1000000) : undefined)
					}
					setLoading(false)
				})
				loadCollectionPies(collectionId, data.manyArtists).then(setPies)
			})
			loadTeamForStory(collectionId).then(team => {
				setOptimizedUrls(team, ["profileImage"], ProfileImageSpecs)
				setTeam(team)
			})
			loadArtShowcase(collectionId).then(setArts)
		}
	}, [collectionId, setCollectionName, demoStageInt, setMoreMainCls, setCartMarketFee])

	const onMint = async (mintResult) => {
		setNonMintedItemsCount(nonMintedItemsCount => nonMintedItemsCount - mintResult.qty)
		setMintResult(mintResult)
		setMintSuccessOpen(true)
	}

	const onMintFailed = () => setTxFailedData('Mint could not be completed', data.profileImage ? getOptimizeImgUrl(data.profileImage, CardImageSpecs) : imagePlaceholder)

	const socialIconLink = (data, key, iconName) => {
		if (key === "discord") {
			const discordUserName = data && data[key]
			return discordUserName ? <FontIcon name="discord" title={discordUserName} /> : null
		}
		const url = getFullUrl(data && data[key], key)
		if (url) {
			return <a href={url} target="_blank" rel="noreferrer"><FontIcon name={iconName || key} /></a>
		}
		return null
	}


	const [isInLoopFlow, setIsInLoopFlow] = useState(false)
	const [loopPopupOpen, setLoopPopupOpen] = useState(false)
	const [joinedLoop, setJoinedLoop] = useState(false)
	const [willConfirmEmail, setWillConfirmEmail] = useState(false)
	const [loopCongratsPopupOpen, setLoopCongratsPopupOpen] = useState(false)

	const joinAllowlistClick = () => {
		if (userId) {
			setLoopPopupOpen(true)
		} else {
			setIsInLoopFlow(true)
			openWalletConnectPopup()
		}
	}
	useEffect(() => {
		if (isInLoopFlow && userId) {
			setIsInLoopFlow(false)
			setLoopPopupOpen(true)
		}
	}, [isInLoopFlow, userId])
	useEffect(() => {
		if (userId && collectionId) {
			if (joinedLoop) {
				createUserCollection(userId, collectionId, RolesMap.invited)
				createMember(userId, collectionId)
				setJoinedLoop(false)
				setLoopCongratsPopupOpen(true)
			}
		}
	}, [joinedLoop, userId, collectionId])


	const navigate = useNavigate()
	useEffect(() => {
		if (!tabContentId && (isExternalCollection || (currentSchedule !== null && nonMintedItemsCount > INIT_NON_MINTED_ITEMS_COUNT))) {
			let tabSegment = ''
			if (isExternalCollection) {
				tabSegment = TABS.TRADE.id
			} else {
				const stage = demoStageInt || currentSchedule.stage || ScheduleStages.teaser
				switch (stage) {
					case ScheduleStages.premint: tabSegment = TABS.PREMINT.id; break
					case ScheduleStages.mint: tabSegment = nonMintedItemsCount > 0 || demoStageInt ? TABS.MINT.id : TABS.TRADE.id; break
					default: tabSegment = TABS.ABOUT.id; break
				}
			}
			navigate(`${window.location.pathname}/${tabSegment}${window.location.search}`)
		}
	}, [navigate, tabContentId, demoStageInt, currentSchedule, nonMintedItemsCount, isExternalCollection])

	const getPageButtons = () => {
		switch (tabContentId) {
			case TABS.ROYALTIES.id: return showEarnings ? null : <button className="primary" onClick={() => setShowEarnings(true)}>See earnings</button>
			default: break
		}

		const stage = demoStageInt || currentSchedule?.stage || ScheduleStages.teaser

		let btn
		switch (stage) {
			case ScheduleStages.teaser: btn = !tabContentId || tabContentId === TABS.ABOUT.id ? <ConnectWalletButton onClick={joinAllowlistClick} /> : null; break
			default: btn = null; break
		}
		return btn
	}

	const getTeamBlock = () => <>
		<ImageTextBlockTitle title="Team" pageSectionType={PageSectionTypeMap.story} data={data} className="ta-c" />
		<CardsFluidGrid
			list={team}
			fullSizeImage={false}
			smallImageOnFooter={true}
			defaultImage={defaultProfileImage}
			moreGridCls={team?.length === 1 ? "single-card" : team?.length === 2 ? "two-card" : null}
			moreFooter={(_teammateId, data) => (
				<div className="card-footer-sub-line-column">
					{data.desc && <div className="card-footer-sub-line">{data.desc}</div>}
					{data.videoLink && <div className="card-footer-sub-line">check out my&nbsp;<a href={data.videoLink} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>video</a></div>}
					<div className="card-footer-sub-line has-social-icons">
						{socialIconLink(data, "twitter")}
						{socialIconLink(data, "discord")}
						{socialIconLink(data, "tiktok")}
						{socialIconLink(data, "youtube")}
						{socialIconLink(data, "instagram")}
					</div>
				</div>
			)} />
	</>

	const bgBlock = (children, condition = true, moreCls) => condition && children ? <div className={"bg-block" + (moreCls ? " " + moreCls : "")}>{typeof children === "function" ? children() : children}</div> : null
	const twoHalfs = (content1, content2, alignItems = "ai-fs", content2Cls = "") => <div className={"flex-row jc-se " + alignItems}><div className="f-1">{content1}</div><div className={"f-1 " + content2Cls}>{content2}</div></div>

	const getAboutTabContent = () => (<>
		{bgBlock(<ImageTextBlock title="Story" data={data} pageSectionType={PageSectionTypeMap.story} />)}
		{bgBlock(<ImageTextBlock title="Roadmap" data={data} pageSectionType={PageSectionTypeMap.roadmap} reverse={true} />)}
		{bgBlock(<ImageTextBlock title="Utility" data={data} pageSectionType={PageSectionTypeMap.utility} />)}
		{bgBlock(getTeamBlock, team?.length > 0, "py-4")}
		{bgBlock(<ArtShowcase arts={arts} />, arts?.length > 0, "py-4")}
		{bgBlock(<ImageTextBlock data={data} pageSectionType={PageSectionTypeMap.aboutCustom1} isCustom={true} />)}
		{bgBlock(<ImageTextBlock data={data} pageSectionType={PageSectionTypeMap.aboutCustom2} isCustom={true} />)}
		{bgBlock(<ImageTextBlock data={data} pageSectionType={PageSectionTypeMap.aboutCustom3} isCustom={true} />)}
		{bgBlock(<ImageTextBlock data={data} pageSectionType={PageSectionTypeMap.aboutCustom4} isCustom={true} />)}
		{bgBlock(<ImageTextBlock data={data} pageSectionType={PageSectionTypeMap.aboutCustom5} isCustom={true} />)}
		{bgBlock(<ImageTextBlock data={data} pageSectionType={PageSectionTypeMap.aboutCustom6} isCustom={true} />)}
		{bgBlock(<ImageTextBlock data={data} pageSectionType={PageSectionTypeMap.aboutCustom7} isCustom={true} />)}
		{bgBlock(<ImageTextBlock data={data} pageSectionType={PageSectionTypeMap.aboutCustom8} isCustom={true} />)}
		{bgBlock(<ImageTextBlock data={data} pageSectionType={PageSectionTypeMap.aboutCustom9} isCustom={true} />)}
	</>)
	const getNoMintYetSectionData = () => {
		return {
			...data,
			[`pageSectionStyle-${PageSectionTypeMap.noMintYet}`]: PageSectionStyleMap.text | PageSectionStyleMap.image,
			[`desc-${PageSectionTypeMap.noMintYet}`]: `If you are on the allow-list
we’ll keep you in the loop`,
			[`imageVAlign-${PageSectionTypeMap.noMintYet}`]: ImageVAlignMap.centerOfText,
			[`image-${PageSectionTypeMap.noMintYet}`]: appLogo,
			[`imageNoOptimize-${PageSectionTypeMap.noMintYet}`]: appLogo,
		}
	}
	const getCountdownRenderer = () => getTimerRenderer(() => window.location.href = `/collection-page/${collectionIdOrAddress}`)
	const getPrivateMintCountdownSectionData = () => {
		return {
			...data,
			[`pageSectionStyle-${PageSectionTypeMap.noMintYet}`]: PageSectionStyleMap.text | PageSectionStyleMap.image,
			[`desc-${PageSectionTypeMap.noMintYet}`]: `Private mint will start in`,
			[`imageVAlign-${PageSectionTypeMap.noMintYet}`]: ImageVAlignMap.centerOfText,
			[`image-${PageSectionTypeMap.noMintYet}`]: appLogo,
			[`imageNoOptimize-${PageSectionTypeMap.noMintYet}`]: appLogo,
			[`moreToRender-${PageSectionTypeMap.noMintYet}`]:
				<Suspense fallback={<Spinner />}>
					<Countdown date={privateMintLaunchAt} renderer={getCountdownRenderer()} />
				</Suspense>,
		}
	}
	const getNoMintYetTabContent = () => <ImageTextBlock title="Minting soon..." isColumn={true} data={getNoMintYetSectionData()} pageSectionType={PageSectionTypeMap.noMintYet} imageCls="semi-transparent" imageStyle={{ width: 180 }} descStyle={{ textAlign: 'center' }} reverse={true} />
	const getPrivateMintCountdownTabContent = () => <ImageTextBlock title="Minting soon..." isColumn={true} data={getPrivateMintCountdownSectionData()} pageSectionType={PageSectionTypeMap.noMintYet} imageCls="semi-transparent" imageStyle={{ width: 180 }} descStyle={{ textAlign: 'center' }} reverse={true} moreTitleDescCls="ta-c" />
	const getNoTradeYetSectionData = () => {
		return {
			...data,
			[`pageSectionStyle-${PageSectionTypeMap.noTradeYet}`]: PageSectionStyleMap.text | PageSectionStyleMap.image,
			[`desc-${PageSectionTypeMap.noTradeYet}`]: `Our smart contract and API power the creation of beautiful, meaningful, long-lasting, curated NFT collections in which every piece is a part of the whole.`,
			[`imageVAlign-${PageSectionTypeMap.noTradeYet}`]: ImageVAlignMap.centerOfText,
			[`image-${PageSectionTypeMap.noTradeYet}`]: appLogo,
			[`imageNoOptimize-${PageSectionTypeMap.noTradeYet}`]: appLogo,
		}
	}
	const getNoTradeYetContent = () => <ImageTextBlock title="Not trading yet" data={getNoTradeYetSectionData()} pageSectionType={PageSectionTypeMap.noTradeYet} imageCls="semi-transparent" />
	const getMintingTimeImageTextBlock = (pageSectionType) => <ImageTextBlock title="It’s minting time" data={data} pageSectionType={pageSectionType} isColumn={!isDynamicPricing()} />
	const getNotInAllowListSectionData = () => {
		return {
			...data,
			[`pageSectionStyle-${PageSectionTypeMap.noMintYet}`]: PageSectionStyleMap.text | PageSectionStyleMap.image,
			[`desc-${PageSectionTypeMap.noMintYet}`]: userId > 0 ? `Your wallet address is not on our allow-list` : `So we can check if you are on our allow-list`,
			[`imageVAlign-${PageSectionTypeMap.noMintYet}`]: ImageVAlignMap.centerOfText,
			[`image-${PageSectionTypeMap.noMintYet}`]: appLogo,
			[`imageNoOptimize-${PageSectionTypeMap.noMintYet}`]: appLogo,
			[`moreToRender-${PageSectionTypeMap.noMintYet}`]:
				userId > 0 ? <Suspense fallback={<Spinner />}>
					<Countdown date={publicMintLaunchAt} renderer={getCountdownRenderer()} />
				</Suspense> : <button onClick={openWalletConnectPopup} className="primary">Connect</button>,
		}
	}
	const getNotInAllowListTabContent = () => <ImageTextBlock title={userId > 0 ? "We're sorry!" : "Please connect your wallet"} isColumn={true} data={getNotInAllowListSectionData()} pageSectionType={PageSectionTypeMap.noMintYet} imageCls="semi-transparent" imageStyle={{ width: 180 }} descStyle={{ textAlign: 'center' }} reverse={true} moreTitleDescCls="ta-c" />
	const getInfiniteGrid = () => (<InfiniteScroll
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
	</InfiniteScroll>)
	function getPremintTabContent() {
		const imageTextBlock = getMintingTimeImageTextBlock(PageSectionTypeMap.premint)
		if (isDynamicPricing()) {
			return <>
				{imageTextBlock}
				{getInfiniteGrid()}
			</>
		}
		return twoHalfs(
			imageTextBlock,
			<MintCard
				collectionId={collectionId}
				targetDate={publicMintLaunchAt}
				nftAddress={nftAddress}
				canGrow={data.canGrow}
				onMint={onMint}
				maxItemsPerMinter={data.maxItemsPerMinter}
				onMintFailed={onMintFailed}
				stage={presaleStage}
				enforceAllowList={true}
				isInAllowList={isInAllowList}
				demoStage={demoStageInt}
				selfMinted={selfMinted}
				contractType={getContractType(data)} />)
	}
	function getMintTabContent() {
		const imageTextBlock = getMintingTimeImageTextBlock(PageSectionTypeMap.mint)
		if (isDynamicPricing()) {
			return <>
				{imageTextBlock}
				{getInfiniteGrid()}
			</>
		}
		return twoHalfs(
			imageTextBlock,
			<MintCard
				collectionId={collectionId}
				nftAddress={nftAddress}
				canGrow={data.canGrow}
				maxItemsPerMinter={data.maxItemsPerMinter}
				onMint={onMint}
				onMintFailed={onMintFailed}
				stage={publicMintStage}
				enforceAllowList={false}
				demoStage={demoStageInt}
				selfMinted={selfMinted}
				contractType={getContractType(data)} />)
	}
	const getRoyaltiesSectionData = () => {
		const allHoldersMintShare = pies[mintStagePieIndex]?.allOwners || "x"
		const allHoldersSalesShare = pies[saleStagePieIndex]?.allOwners || "x"
		return {
			...data,
			[`pageSectionStyle-${PageSectionTypeMap.royalties}`]: PageSectionStyleMap.text,
			[`desc-${PageSectionTypeMap.royalties}`]: `
We split ${allHoldersMintShare}% of each mint & ${allHoldersSalesShare}% of the creator's fee of each secondary sale between all artists in the collection.

We also split ${allHoldersMintShare}% of each mint & ${allHoldersSalesShare}% of the creator's fee of each secondary sale between all holders at the time of the transaction*

Those funds accumulate, and you as a holder can decide who to donate it to by choosing from our list or adding a wallet to your selected causet. The more you hold, the more you can give away

Connect your wallet to withdraw your royalties or donate and set up automatic withdrawal when reaching a certain threshold (we don’t do it automatically because the gas fee might be higher than the amount)

Make sure your email is up to date so we can keep you in the loop

*according to our terms of use and chain data`
		}
	}
	const getRoyaltiesTabContent = () => <ImageTextBlock title="Royalties & donations" data={getRoyaltiesSectionData()} pageSectionType={PageSectionTypeMap.royalties} isColumn={true} />
	const showMarketModeIsOk = () => {
		// eslint-disable-next-line 
		if (data?.showMarketMode == ShowMarketMode.anyone) return true
		// eslint-disable-next-line 
		if (data?.showMarketMode == ShowMarketMode.teamOnly) return userId > 0 && isAdmin // TODO || isTeamMember(userId, collectionId))
		// if (data.showMarketMode === ShowMarketMode.nobody) return false
		return false
	}
	const isArtIsNFT = (nftAddress) => {
		return nftAddress?.toLowerCase() === process.env.REACT_APP_ARTIS_NFT_ADDR?.toLowerCase()
	}
	const getSelectedTabContent = () => {
		switch (tabContentId) {
			case TABS.NO_MINT_YET.id: return privateMintLaunchAt ? getPrivateMintCountdownTabContent() : getNoMintYetTabContent()
			case TABS.PREMINT.id: return process.env.REACT_APP_MINT_DISABLED === '1' ? <FightingBots /> : privateMintLaunchAt && privateMintLaunchAt > new Date() ? getPrivateMintCountdownTabContent() : userId > 0 && isInAllowList ? getPremintTabContent() : getNotInAllowListTabContent()
			case TABS.MINT.id: return process.env.REACT_APP_MINT_DISABLED === '1' ? <FightingBots /> : getMintTabContent()
			case TABS.TRADE.id: return nftAddress && (isExternalCollection || ((selfMinted || currentSchedule?.stage >= ScheduleStages.mint) && showMarketModeIsOk())) ? <CollectionMarketplace nftAddress={nftAddress} isExternalCollection={isExternalCollection} /> : getNoTradeYetContent()
			case TABS.ROYALTIES.id: return showEarnings ? (isArtIsNFT(nftAddress) ? <MyBalance /> : <MyEarnings />) : getRoyaltiesTabContent()
			default: return getAboutTabContent()
		}
	}

	useEffect(() => {
		if (demoStageInt > 0 || currentSchedule?.stage > 0) {
			setCollectionPageValues({ demoStageInt, currentScheduleStage: currentSchedule?.stage, selfMinted, lookNfeel: data.lookNfeel, myOwnNavBGColor: data.myOwnNavBGColor })
		}
		// eslint-disable-next-line 
	}, [demoStageInt, currentSchedule, selfMinted, data.lookNfeel, data.myOwnNavBGColor])

	if (loading) return <Loading />
	if (data.pagesPassword && currentSchedule?.passwordProtected && !validPwdEnteredYet) return <EnterPassword validPwd={data.pagesPassword} setValidPwdEnteredYet={setValidPwdEnteredYet} />

	const coverImage = (url) => url ? <div className="cover-image" style={{ backgroundImage: `url(${getOptimizeImgUrl(url, CoverImageSpecs)})` }}></div> : null

	return (
		<div className="collection-page mx-auto">
			{coverImage(data.coverImage)}
			{getCollectionPageTabButtons({ isExternalCollection, demoStageInt, currentScheduleStage: currentSchedule?.stage, selfMinted, lookNfeel: data.lookNfeel, myOwnNavBGColor: data.myOwnNavBGColor, tabContentId, getBasePath: () => `/collection-page/${collectionIdOrAddress}` })}
			<div className="tab-body">
				<div className="tab-content no-gradient">{getSelectedTabContent()}</div>
			</div>
			<StickyButtonContainer style={data.lookNfeel === LookNFeelMap.myOwn ? ({ backgroundColor: `rgba(${rgbToTripple(hexToRgb(data.myOwnBGColor || '#000000'))}, .5)` }) : null}>{getPageButtons()}</StickyButtonContainer>

			<MintSuccessPopup visible={mintSuccessOpen} setVisible={setMintSuccessOpen} mintResult={mintResult}
				collectionProfileImage={data.profileImage} />

			{loopPopupOpen && <LoopPopup visible={loopPopupOpen} setVisible={setLoopPopupOpen} setCompleted={setJoinedLoop} setWillConfirmEmail={setWillConfirmEmail} collectionName={data.name} collectionId={collectionId} />}
			{loopCongratsPopupOpen && <LoopCongratsPopup visible={loopCongratsPopupOpen} setVisible={setLoopCongratsPopupOpen} collectionName={data.name} hasConfirmation={willConfirmEmail} />}
		</div>
	)
}

function rgbToTripple({ r, g, b }) {
	return `${r},${g},${b}`
}

function hexToRgb(hex) {
	// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	hex = hex.replace(shorthandRegex, function (m, r, g, b) {
		return r + r + g + g + b + b;
	});

	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

function ArtShowcase({ arts }) {
	const [sliderModule, setSliderModule] = useState(null)
	useEffect(() => {
		if (arts?.length > 0) {
			import('slick-carousel/slick/slick.css')
			import('slick-carousel/slick/slick-theme.css')
			import('react-slick').then(setSliderModule)
		}
	}, [arts])

	if (arts === null || (arts.length > 0 && sliderModule === null)) {
		return <div className="ta-c pt-2"><Spinner /></div>
	}

	const settings = {
		infinite: true,
		slidesToShow: 3,
		slidesToScroll: 1,
		autoplay: true,
		speed: 2000,
		autoplaySpeed: 3000,
		arrows: false,
		cssEase: "ease-in-out",
		// centerMode: true,
		centerPadding: 64
	}
	const Slider = sliderModule.default
	return <div style={{ width: 890 }} className="mx-auto"><Slider {...settings}>{arts.map(({ artImage }, idx) => <div key={idx} style={{ width: 254, height: 254 }}><img src={artImage} alt="" style={{ borderRadius: 4 }} /></div>)}</Slider></div>
}
