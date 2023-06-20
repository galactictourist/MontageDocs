import './parts/collapser.scss'
import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Loading from './prompts/Loading';
import StickyButtonContainer from './parts/StickyButtonContainer';
import { AppControl } from './parts/AppControl';
import { SaveButton } from './parts/SaveButton';
import FormContainer from './parts/FormContainer';
import AuthContext from '../ctx/Auth'
import { loadCollectionPies, loadCollectionSettings, loadCuratorAddress, loadMyCollectionStory, loadSchedule, mergeSchedule, saleStagePieIndex, updateCollection } from '../func/collections';
import { RolesMap } from '../util/roles';
import { getFileRemovedHandler, unpinRemovedFiles } from '../util/uploadToIPFS';
import { CardImageSpecs, StoryPageImageSpecs } from '../util/optimizedImages';
import MyCollectionContext from '../ctx/MyCollection';
import { toastSaved } from '../util/toasts';
import { Collapser } from './parts/Collapser';
import { Collapsee } from './parts/Collapsee';
import TabButtons, { PAGE_TABS, STORY_TABS as TABS } from './parts/Tabs';
import TextPhrase from './parts/TextPhrase';
import { ScheduleStages, ScheduleStagesTexts, ScheduleStatuses } from '../util/scheduleStages';
import { PreviewPopup } from './parts/AppPopup';
import { useNVarcharLimits } from '../util/useNVarcharLimits';
import { LookNFeelMap, LookNFeelOptions } from '../util/lookNfeel';
import LookNFeelContext from '../ctx/LookNFeel';
import { ImageVAlignOptions } from '../util/imageVAlign';
import Spinner from '../util/Spinner';
import { loadArtShowcase, updateArtShowcase } from '../func/artShowcase';
import { PageSectionStyleMap, PageSectionStyleOptions, PageSectionStyleOptions_ColumnView, PageSectionTypeMap } from '../util/pageSection';
import CollectionProgressBarContext from '../ctx/CollectionProgressBarContext';
import { PAGES_STAGE_IDX, SCHEDULE_STAGE_IDX } from './parts/CollectionProgressBar';
import { AllowlistJoinFlowTypeOptions } from '../util/allowlistJoinFlowTypes';
import { ShowMarketMode } from '../util/showMarketMode';
import { getMarketContract } from '../frontend/contractsData/addresses';
import { getContractType } from '../util/contractTypes';
import CollectionStatusMap from '../util/collectionStatus';
import { loadLiveCollection } from '../func/liveCollections';

const defaultRows = [
	{ stage: ScheduleStages.teaser, launchAt: null, passwordProtected: false, status: ScheduleStatuses.waiting },
	{ stage: ScheduleStages.premint, launchAt: null, passwordProtected: false, status: ScheduleStatuses.waiting },
	{ stage: ScheduleStages.mint, launchAt: null, passwordProtected: false, status: ScheduleStatuses.waiting },
]
export default function MyCollectionStory({ setSidebarState }) {
	const { myCollectionStatus } = useContext(MyCollectionContext)
	const { setProgressStageState } = useContext(CollectionProgressBarContext)
	const [tabContentId, setTabContentId] = useState(TABS.ABOUT.id)
	const { userId, isImpersonating, accounts: accountAddress } = useContext(AuthContext)
	const { myCollectionRoles } = useContext(MyCollectionContext)
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [savingForPreview, setSavingForPreview] = useState(false)
	const [data, setData] = useState({})
	const [isViewMode, setIsViewMode] = useState(null)
	const [removedFiles, setRemovedFiles] = useState({})
	const { collectionId } = useParams()
	const [popupVisible, setPopupVisible] = useState(false)
	const [iframeSrc, setIframeSrc] = useState('')
	const navigate = useNavigate()
	const isNewDoc = !collectionId
	const { nvarcharLimits } = useNVarcharLimits("collections")
	const [arts, setArts] = useState(null)
	const [rows, setRows] = useState([])
	const [persistedRows, setPersistedRows] = useState([])
	const [collectionSettings, setCollectionSettings] = useState({})

	const [storyCollapsed, setStoryCollapsed] = useState(true)
	const [roadmapCollapsed, setRoadmapCollapsed] = useState(true)
	const [utilityCollapsed, setUtilityCollapsed] = useState(true)
	const [artShowcaseCollapsed, setArtShowcaseCollapsed] = useState(true)
	const [allowlistFlowCollapsed, setAllowlistFlowCollapsed] = useState(true)
	const [premintScheduleCollapsed, setPremintScheduleCollapsed] = useState(true)
	const [premintAccessCollapsed, setPremintAccessCollapsed] = useState(true)
	const [premintPriceCollapsed, setPremintPriceCollapsed] = useState(true)
	const [mintScheduleCollapsed, setMintScheduleCollapsed] = useState(true)
	const [mintPriceCollapsed, setMintPriceCollapsed] = useState(true)

	const [aboutCustomCollapsed1, setAboutCustomCollapsed1] = useState(true)
	const [aboutCustomCollapsed2, setAboutCustomCollapsed2] = useState(true)
	const [aboutCustomCollapsed3, setAboutCustomCollapsed3] = useState(true)
	const [aboutCustomCollapsed4, setAboutCustomCollapsed4] = useState(true)
	const [aboutCustomCollapsed5, setAboutCustomCollapsed5] = useState(true)
	const [aboutCustomCollapsed6, setAboutCustomCollapsed6] = useState(true)
	const [aboutCustomCollapsed7, setAboutCustomCollapsed7] = useState(true)
	const [aboutCustomCollapsed8, setAboutCustomCollapsed8] = useState(true)
	const [aboutCustomCollapsed9, setAboutCustomCollapsed9] = useState(true)

	const [selfMinted, setSelfMinted] = useState(false)
	const [samePriceForAllNFT, setSamePriceForAllNFT] = useState(false)
	const [premintPrice, setPremintPrice] = useState(0)
	const [mintPrice, setMintPrice] = useState(0)
	const [manyArtists, setManyArtists] = useState(false)
	const isDynamicPricing = () => !selfMinted && !samePriceForAllNFT
	const aboutPrompt = useMemo(() => <p className="ta-c pt-2">Create a landing page where you can showcase your collection's story, team, utility, and roadmap.<br />Complete the sections and fields you want created, any sections left empty will not show.</p>, [])
	// const fillOutPrompt = useMemo(() => <p className="ta-c pt-2">Fill out only the sections you want,<br />the ones you leave empty will not show</p>, [])
	const premintPrompt = useMemo(() => <p className="ta-c pt-2">This page will be shown in your premint phase as a tab on your site.<br />You can talk about the premint and give more information.</p>, [])
	const mintPrompt = useMemo(() => <p className="ta-c pt-2">This page will be shown during your mint phase as a tab on your site.<br />You can talk about the mint and give more information.</p>, [])

	const isCurator = () => (myCollectionRoles & RolesMap.curator) > 0
	// eslint-disable-next-line
	const isMyOwn = () => data.lookNfeel == LookNFeelMap.myOwn

	useEffect(() => {
		if (collectionId) {
			loadCollectionSettings(collectionId).then(collectionSettings => {
				setCollectionSettings(collectionSettings)
				const { selfMinted, samePriceForAllNFT, premintPrice, mintPrice, manyArtists } = collectionSettings
				setSelfMinted(selfMinted)
				setSamePriceForAllNFT(samePriceForAllNFT)
				setPremintPrice(premintPrice)
				setMintPrice(mintPrice)
				setManyArtists(manyArtists)
			})
			loadSchedule(collectionId).then(rows => {
				setRows(rows?.length > 0 ? rows : defaultRows)
				setPersistedRows(rows?.length > 0 ? rows : defaultRows)
			})
		}
	}, [collectionId])

	useEffect(() => {
		if (collectionId && !artShowcaseCollapsed && arts === null) {
			loadArtShowcase(collectionId).then(setArts)
		}
	}, [artShowcaseCollapsed, arts, collectionId])

	useEffect(() => {
		let src
		if (popupVisible && tabContentId && collectionId) {
			switch (tabContentId) {
				case TABS.ABOUT.id: src = `/collection-page-preview/${collectionId}/${ScheduleStages.teaser}/${PAGE_TABS.ABOUT.id}`; break
				case TABS.PREMINT.id: src = `/collection-page-preview/${collectionId}/${ScheduleStages.premint}/${PAGE_TABS.PREMINT.id}`; break
				case TABS.MINT.id: src = `/collection-page-preview/${collectionId}/${ScheduleStages.mint}/${PAGE_TABS.MINT.id}`; break
				case TABS.MARKET.id: src = `/collection-page-preview/${collectionId}/${ScheduleStages.mint}/${PAGE_TABS.TRADE.id}`; break
				default: src = ''; break
			}
		} else {
			src = ''
		}
		setIframeSrc(src)
	}, [popupVisible, tabContentId, collectionId])

	useEffect(() => {
		if (myCollectionRoles) {
			if (userId) {
				if (collectionId) {
					setLoading(true)
					loadMyCollectionStory(collectionId, true).then(data => {
						setData(data)
						setLoading(false)
						const isEditMode = (myCollectionRoles & RolesMap.curator) > 0
						setIsViewMode(!isEditMode)
					})
				} else {
					setIsViewMode(false)
				}
			}
		}
	}, [userId, collectionId, myCollectionRoles, isNewDoc])

	useEffect(() => {
		if (setSidebarState) {
			setSidebarState(2)
		}
		// eslint-disable-next-line
	}, [])

	if (loading || nvarcharLimits === null) return <Loading />
	if (!userId || isViewMode === null) return null

	const toJSONDate = (dt) => dt ? new Date(dt).toJSON() : null
	const scheduleChanged = () => -1 < rows.findIndex((r, idx) => toJSONDate(persistedRows[idx]?.launchAt) !== toJSONDate(r.launchAt))

	const postDataToStorage = async (collectionId, doPreview) => {
		if (isViewMode) return
		setSaving(true)
		setSavingForPreview(doPreview)
		try {
			const promises = []
			const isScheduleChanged = scheduleChanged()
			if (isScheduleChanged) {
				promises.push(mergeSchedule(collectionId, rows.map(row => ({ ...row, launchAt: toJSONDate(row.launchAt) }))))
				setProgressStageState(SCHEDULE_STAGE_IDX, true)
			}

			const d = { ...data }
			if (!selfMinted && samePriceForAllNFT) Object.assign(d, { premintPrice, mintPrice })
			promises.push(updateCollection(collectionId, d, true), updateArtShowcase(collectionId, arts))
			await Promise.all(promises)
			if (isImpersonating) {
				// eslint-disable-next-line
				if (myCollectionStatus == CollectionStatusMap.live) {
					// eslint-disable-next-line
					if (d.showMarketMode == ShowMarketMode.anyone) {
						const contractType = getContractType(Object.assign({}, collectionSettings, d))
						const marketFee100 = Math.round((d.marketFee || 0) * 100)
						const pies = await loadCollectionPies(collectionId, manyArtists)
						const feePercent = pies[saleStagePieIndex].creatorRoyalties * 100
						const curatorAddress = await loadCuratorAddress(collectionId)
						const { nftAddress, groupAddress } = await loadLiveCollection(collectionId)
						const market = await getMarketContract(contractType)
						await market.methods.setFeeInfo(nftAddress, marketFee100, feePercent, groupAddress, curatorAddress).send({ from: accountAddress })
					}
				}
			}
			if (isScheduleChanged) setPersistedRows([...rows])
			unpinRemovedFiles(removedFiles, d)
			setRemovedFiles({})
			if (doPreview) setPopupVisible(true)
			else if (isCurator()) {
				switch (tabContentId) {
					case TABS.ABOUT.id: setTabContentId(TABS.PREMINT.id); break
					case TABS.PREMINT.id: setTabContentId(TABS.MINT.id); break
					case TABS.MINT.id: setTabContentId(TABS.MARKET.id); break
					case TABS.MARKET.id:
						setProgressStageState(PAGES_STAGE_IDX, true)
						navigate(`/my-collection-community/${collectionId}`)
						break
					default: break
				}
			}
			else toastSaved()
		} finally {
			setSaving(false)
			setSavingForPreview(false)
		}
	}

	const onFileRemoved = (name, ipfsPath) => setRemovedFiles(getFileRemovedHandler(name, ipfsPath))
	const control = ({ name, disabled, value: valueOverride, setData: setDataOverride, ...props }) => <AppControl maxLength={nvarcharLimits[name]} name={name} value={valueOverride || data[name]} setData={setDataOverride || setData} {...props} readOnly={isViewMode || disabled} disabled={isViewMode || disabled} />

	const getArtShowcaseEditor = () => <ArtShowcaseEditor arts={arts} setArts={setArts} isViewMode={isViewMode} />
	const getAllowlistFlowControls = () => <>
		{control({ toggleTitle: "Show JOIN ALLOWLIST button", name: "showJoinAllowlistButton", underFieldLabel: "The JOIN ALLOWLIST button will be added to the bottom of the About page of your collection", type: "checkbox", checked: true, disabled: true })}
		{control({ name: "allowlistJoinFlowType", type: "select", label: "Allow list join flow", options: AllowlistJoinFlowTypeOptions, disabled: true })}
		{control({ name: "allowlistPremintXYZLink", type: "text", label: "Send user to this link at premint.xyz", placeholder: "Premint url link", disabled: true })}
	</>
	const getPremintScheduleControls = () => <>
		{control({ name: "launchAt", type: "datetime-local", rowIdx: 1, value: rows[1]?.launchAt, setData: setRows })}
		{control({ name: "mintPaused", type: "checkbox", disabled: true, toggleTitle: "Pause private mint", underFieldLabel: "You can pause/stop private mint at any time even when public mint haven’t started yet or not all items are minted" })}
	</>
	const getPremintAccessControls = () => <>
		<TextPhrase evenSmallerText={true}>Teammembers, artists and admins will always have access</TextPhrase>
		{control({ name: "allowByWallet", type: "checkbox", disabled: true, toggleTitle: "Allowlist wallets", underFieldLabel: "The user must login with a wallet registered in allow list" })}
		{control({ name: "allowByPassword", type: "checkbox", disabled: true, toggleTitle: "With password", underFieldLabel: "If the user is not logged in with allowed wallet it will ask for password" })}
		{control({ name: "pagesPassword", type: "text", label: "Password", disabled: true })}
		{control({ name: "premintXYZLink", type: "text", label: "Approved from premint.xyz", placeholder: "Premint url link", disabled: true })}
	</>
	const getPremintPriceControls = () => <>
		{control({ name: "premintPrice", type: "number", value: premintPrice, setValue: setPremintPrice, subtype: "price", label: "Private mint all items price" })}
	</>
	const getMintScheduleControls = () => <>
		<TextPhrase evenSmallerText={true}>When public mint starts it will automatically stop and replace the private mint page</TextPhrase>
		{control({ name: "launchAt", type: "datetime-local", rowIdx: 2, value: rows[2]?.launchAt, setData: setRows })}
		{control({ name: "mintPaused", type: "checkbox", disabled: true, toggleTitle: "Pause public mint" })}
	</>
	const getMintPriceControls = () => <>
		{control({ name: "mintPrice", type: "number", value: mintPrice, setValue: setMintPrice, subtype: "price", label: "Public mint all items price" })}
	</>

	const about = () => (<>
		{aboutPrompt}
		<PageSection title="Story" pageSectionType={PageSectionTypeMap.story} key={0} control={control} onFileRemoved={onFileRemoved} collapsed={storyCollapsed} setCollapsed={setStoryCollapsed} descLabel="Add an image/video and text to tell the story, background, lore, idea, and concept of your collection." />
		<PageSection title="Roadmap" pageSectionType={PageSectionTypeMap.roadmap} key={1} control={control} onFileRemoved={onFileRemoved} collapsed={roadmapCollapsed} setCollapsed={setRoadmapCollapsed} />
		<PageSection title="Utility" pageSectionType={PageSectionTypeMap.utility} key={2} control={control} onFileRemoved={onFileRemoved} collapsed={utilityCollapsed} setCollapsed={setUtilityCollapsed} />
		<PageSection title="Featured" key={3} collapsed={artShowcaseCollapsed} setCollapsed={setArtShowcaseCollapsed} getFormChildren={getArtShowcaseEditor} />
		<PageSection title="Allow list flow & button" key={4} collapsed={allowlistFlowCollapsed} setCollapsed={setAllowlistFlowCollapsed} getFormChildren={getAllowlistFlowControls} />

		<PageSection title="Custom1" isCustom={true} columnView={data[`columnView-${PageSectionTypeMap.aboutCustom1}`]} pageSectionType={PageSectionTypeMap.aboutCustom1} key={101} control={control} onFileRemoved={onFileRemoved} collapsed={aboutCustomCollapsed1} setCollapsed={setAboutCustomCollapsed1} />
		<PageSection title="Custom2" isCustom={true} columnView={data[`columnView-${PageSectionTypeMap.aboutCustom2}`]} pageSectionType={PageSectionTypeMap.aboutCustom2} key={102} control={control} onFileRemoved={onFileRemoved} collapsed={aboutCustomCollapsed2} setCollapsed={setAboutCustomCollapsed2} />
		<PageSection title="Custom3" isCustom={true} columnView={data[`columnView-${PageSectionTypeMap.aboutCustom3}`]} pageSectionType={PageSectionTypeMap.aboutCustom3} key={103} control={control} onFileRemoved={onFileRemoved} collapsed={aboutCustomCollapsed3} setCollapsed={setAboutCustomCollapsed3} />
		<PageSection title="Custom4" isCustom={true} columnView={data[`columnView-${PageSectionTypeMap.aboutCustom4}`]} pageSectionType={PageSectionTypeMap.aboutCustom4} key={104} control={control} onFileRemoved={onFileRemoved} collapsed={aboutCustomCollapsed4} setCollapsed={setAboutCustomCollapsed4} />
		<PageSection title="Custom5" isCustom={true} columnView={data[`columnView-${PageSectionTypeMap.aboutCustom5}`]} pageSectionType={PageSectionTypeMap.aboutCustom5} key={105} control={control} onFileRemoved={onFileRemoved} collapsed={aboutCustomCollapsed5} setCollapsed={setAboutCustomCollapsed5} />
		<PageSection title="Custom6" isCustom={true} columnView={data[`columnView-${PageSectionTypeMap.aboutCustom6}`]} pageSectionType={PageSectionTypeMap.aboutCustom6} key={106} control={control} onFileRemoved={onFileRemoved} collapsed={aboutCustomCollapsed6} setCollapsed={setAboutCustomCollapsed6} />
		<PageSection title="Custom7" isCustom={true} columnView={data[`columnView-${PageSectionTypeMap.aboutCustom7}`]} pageSectionType={PageSectionTypeMap.aboutCustom7} key={107} control={control} onFileRemoved={onFileRemoved} collapsed={aboutCustomCollapsed7} setCollapsed={setAboutCustomCollapsed7} />
		<PageSection title="Custom8" isCustom={true} columnView={data[`columnView-${PageSectionTypeMap.aboutCustom8}`]} pageSectionType={PageSectionTypeMap.aboutCustom8} key={108} control={control} onFileRemoved={onFileRemoved} collapsed={aboutCustomCollapsed8} setCollapsed={setAboutCustomCollapsed8} />
		<PageSection title="Custom9" isCustom={true} columnView={data[`columnView-${PageSectionTypeMap.aboutCustom9}`]} pageSectionType={PageSectionTypeMap.aboutCustom9} key={109} control={control} onFileRemoved={onFileRemoved} collapsed={aboutCustomCollapsed9} setCollapsed={setAboutCustomCollapsed9} />
	</>)
	const premint = () => <>
		{premintPrompt}
		<PageSection title={`${ScheduleStagesTexts[ScheduleStages.premint]} page`} pageSectionType={PageSectionTypeMap.premint} key={5} control={control} onFileRemoved={onFileRemoved} noCollapse={true} isColumn={!isDynamicPricing()} />
		<PageSection title="Private mint schedule" key={6} collapsed={premintScheduleCollapsed} setCollapsed={setPremintScheduleCollapsed} getFormChildren={getPremintScheduleControls} />
		<PageSection title="Private mint access" key={7} collapsed={premintAccessCollapsed} setCollapsed={setPremintAccessCollapsed} getFormChildren={getPremintAccessControls} />
		<PageSection doRender={!selfMinted && samePriceForAllNFT} title="Private mint NFT price" key={8} collapsed={premintPriceCollapsed} setCollapsed={setPremintPriceCollapsed} getFormChildren={getPremintPriceControls} />
	</>
	const mint = () => <>
		{mintPrompt}
		<PageSection title={`${ScheduleStagesTexts[ScheduleStages.mint]} page`} pageSectionType={PageSectionTypeMap.mint} key={9} control={control} onFileRemoved={onFileRemoved} noCollapse={true} isColumn={!isDynamicPricing()} />
		<PageSection title="Public mint schedule" key={10} collapsed={mintScheduleCollapsed} setCollapsed={setMintScheduleCollapsed} getFormChildren={getMintScheduleControls} />
		<PageSection doRender={!selfMinted && samePriceForAllNFT} title="Public mint NFT price" key={8} collapsed={mintPriceCollapsed} setCollapsed={setMintPriceCollapsed} getFormChildren={getMintPriceControls} />
	</>
	const market = () => <FormContainer cls="pt-5">
		{control({ doRender: isImpersonating, type: "select", label: "Show market", name: "showMarketMode", options: [{ value: ShowMarketMode.nobody, text: "To nobody (unavailable)" }, { value: ShowMarketMode.teamOnly, text: "To team only" }, { value: ShowMarketMode.anyone, text: "To anyone" }] })}
		{control({ name: "marketFee", label: "Market transaction fee", type: "number", subtype: "percent", underFieldLabel: `Whatever transaction fee you choose 50% will go to you and 50% to ${process.env.REACT_APP_NAME}` })}
	</FormContainer>
	const contents = {
		[TABS.ABOUT.id]: about,
		// [TABS.TEASER.id]: teaser,
		[TABS.PREMINT.id]: premint,
		[TABS.MINT.id]: mint,
		[TABS.MARKET.id]: market,
	}
	const selectedTabContent = (tabContentId) => tabContentId ? contents[tabContentId]() : null
	const getSectionStyles = (data) => {
		const styles = {}
		Object.keys(PageSectionTypeMap).forEach(type => styles[PageSectionTypeMap[type]] = data[`pageSectionStyle-${PageSectionTypeMap[type]}`] || PageSectionStyleMap.textNimage)
		return styles
	}

	return (
		<>
			<div style={{ maxWidth: 900, margin: 'auto' }}>
				<TextPhrase padTop={true}>Update & preview your collection story & pages</TextPhrase>
				<FormContainer>
					{control({ name: "lookNfeel", label: "Look & feel", type: "select", options: LookNFeelOptions })}
					{isMyOwn() && control({ name: "myOwnBGColor", label: "Wrapper bg color", type: "color" })}
					{isMyOwn() && control({ name: "myOwnNavBGColor", label: "Topbar bg color", type: "color" })}
				</FormContainer>
				<TabButtons buttons={[TABS.ABOUT, /*TABS.TEASER,*/ TABS.PREMINT, TABS.MINT, TABS.MARKET]} tabContentId={tabContentId} setTabContentId={setTabContentId} />
				<div className="tab-body">
					<div className="tab-content no-gradient">
						<LookNFeelContext.Provider value={{ lookNfeel: data.lookNfeel, sectionStyles: getSectionStyles(data) }}>
							{selectedTabContent(tabContentId)}
						</LookNFeelContext.Provider>
					</div>
				</div>
			</div>
			{!isViewMode && (
				<>
					<StickyButtonContainer>
						<SaveButton className="secondary" onClick={() => postDataToStorage(collectionId, true).then(() => setPopupVisible(true))} saving={saving && savingForPreview} disabled={saving} text="Preview" />
						<SaveButton onClick={() => postDataToStorage(collectionId)} saving={saving && !savingForPreview} disabled={saving} text={isCurator() ? "Update & continue" : "Update"} />
					</StickyButtonContainer>
					<PreviewPopup visible={popupVisible} setVisible={setPopupVisible} iframeSrc={iframeSrc} />
				</>
			)}
		</>
	)
}

function PageSection({ title, isCustom, pageSectionType, control, onFileRemoved, collapsed, setCollapsed, descLabel, getFormChildren, isColumn = false, doRender = true, columnView = false }) {
	const { isImpersonating } = useContext(AuthContext)
	const { lookNfeel, sectionStyles } = useContext(LookNFeelContext)
	// eslint-disable-next-line
	const isMyOwn = lookNfeel == LookNFeelMap.myOwn
	const noCollapse = collapsed === undefined
	const getName = (name) => `${name}-${pageSectionType}`
	const sectionStyle = parseInt(sectionStyles[pageSectionType])
	const hasText = (sectionStyle & PageSectionStyleMap.text) > 0
	const hasImage = (sectionStyle & PageSectionStyleMap.image) > 0
	const hasVideo = (sectionStyle & PageSectionStyleMap.video) > 0
	const hasPost = (sectionStyle & PageSectionStyleMap.post) > 0
	// eslint-disable-next-line
	const singleElement = sectionStyle == PageSectionStyleMap.text || sectionStyle == PageSectionStyleMap.video || sectionStyle == PageSectionStyleMap.image || sectionStyle == PageSectionStyleMap.post
	if (!doRender) return null
	return (
		<>
			{!noCollapse && <Collapser collapsed={collapsed} setCollapsed={setCollapsed} title={title} />}
			<Collapsee collapsed={!noCollapse && collapsed}>
				<FormContainer cls={noCollapse ? "" : "collapsee-inner"}>
					{typeof getFormChildren === "function" ? getFormChildren() : null}
					{pageSectionType ? <>
						{isCustom && control({ label: 'Section title', name: getName('title'), type: "text", maxLength: 50 })}
						{isCustom && control({ toggleTitle: 'Column view', name: getName('columnView'), type: "checkbox" })}
						{control({ label: "Select section style", name: getName('pageSectionStyle'), type: "chips", options: isColumn ? PageSectionStyleOptions_ColumnView : PageSectionStyleOptions })}
						{!singleElement && !isColumn && control({ label: "Image or media vertical alignment", name: getName('imageVAlign'), type: "select", options: ImageVAlignOptions })}
						{isCustom && isImpersonating && control({ toggleTitle: 'Allow HTML in description', name: getName('allowHTMLInDesc'), type: "checkbox" })}
						{hasText && control({ label: descLabel || `${title} description`, name: getName('desc'), type: "textarea" })}
						{hasImage && control({ label: `Add an image in your ${title} section`, name: getName('image'), type: "file", onFileRemoved: onFileRemoved, imageSize: StoryPageImageSpecs })}
						{hasPost && control({ label: "Hyperlink a post from Twitter, Instagram, or TikTok", name: getName('post'), placeholder: "Paste a link..." })}
						{hasVideo && control({ label: "Video link (YouTube/Vimeo - optional)", name: getName('videoLink'), placeholder: "Paste a link..." })}
						{isMyOwn ? <>
							{control({ label: "Background color", name: getName('bgColor'), type: 'color' })}
							{control({ label: "Text color", name: getName('textColor'), type: 'color' })}
							{control({ label: "Line color", name: getName('lineColor'), type: 'color' })}
						</> : null}
					</> : null}
				</FormContainer>
			</Collapsee>
		</>
	)
}

function ArtShowcaseEditor({ arts, isViewMode, onFileRemoved, setArts }) {
	const [newArtImage, setNewArtImage] = useState('')
	const specs = CardImageSpecs

	useEffect(() => {
		if (newArtImage) {
			setArts(arts => [{ artImage: newArtImage }, ...arts])
			setNewArtImage('')
		}
	}, [newArtImage, setArts])

	const getSetArtImage = (idx) => (artImage) => {
		setArts(arts => {
			const a = [...arts]
			if (artImage) a[idx] = { artImage }
			else a.splice(idx, 1)
			return a
		})
	}
	return <>
		<p className="ta-c">
			This section will show an horizontal rotating gallery of your NFTs. Add as many artworks as you want to showcase (we recommend they will all be the same size and at least {specs.width} px by {specs.height} px)
		</p>

		{!newArtImage && <AppControl label="Add an art image" type="file"
			value={newArtImage} setValue={setNewArtImage} name="artImage"
			onFileRemoved={onFileRemoved} readOnly={isViewMode} disabled={isViewMode} imageSize={specs} noRecommendedSize={true}
		/>}

		{arts === null ?
			<p className="ta-c pt-2"><Spinner /></p>
			:
			arts.map(({ artImage }, idx) => <AppControl key={artImage + idx} label="" type="file"
				value={artImage} setValue={getSetArtImage(idx)} name="artImage" renderDropzone={false}
				onFileRemoved={onFileRemoved} readOnly={isViewMode} disabled={isViewMode} imageSize={specs} noRecommendedSize={true}
			/>
			)}
	</>
}