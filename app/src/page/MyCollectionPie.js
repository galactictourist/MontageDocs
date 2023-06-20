import { mintStage, saleStage } from '../web3/util/stages';
import './myCollectionPie.scss'
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Loading from './prompts/Loading';
import StickyButtonContainer from './parts/StickyButtonContainer';
import { AppControl } from './parts/AppControl';
import { SaveButton } from './parts/SaveButton';
import FormContainer from './parts/FormContainer';
import AuthContext from "../ctx/Auth"
import { loadCollectionPies, loadCollectionSettings, mergeCollectionPie, mintStagePieIndex, saleStagePieIndex } from '../func/collections';
import { RolesMap } from '../util/roles';
import MyCollectionContext from '../ctx/MyCollection';
import { toastSaved } from '../util/toasts';
import TabButtons, { PIE_TABS as TABS } from './parts/Tabs';
import TextPhrase from './parts/TextPhrase';
import CollectionStatusMap from '../util/collectionStatus';
import AppPopup from './parts/AppPopup';
import CollectionProgressBarContext from '../ctx/CollectionProgressBarContext';
import { REV_SHARE_STAGE_IDX } from './parts/CollectionProgressBar';

const LABELS = {
	creatorRoyalties: 'Creator royalties share',
	owner: 'Seller’s share %',
	allPartners: 'Core team share %',
	creator: 'Artist share %',
	allCreators: 'All Artists share %',
	allOwners: 'All holders share %',
	marketplace: 'Montage share %',
}

const LABELS_SUBTEXT = {
	creatorRoyalties: 'The entire secondary pie will be % from the creator royalties, which you can set to 10%, 7%, or 5% etc. from the sales price',
	owner: 'The percentage the seller will get when selling their specific NFT on the secondary market',
	allPartners: 'This is the total royalties share you and your team will get.',
	creator: 'This is the share of the artist who created the specific NFT',
	allCreators: 'Royalties that will be divided evenly between all artists in the collection, no matter what NFT is sold.',
	allOwners: 'Royalties for all holders of the NFT collection, every time there is a sale.',
	marketplace: 'The default is set to 2% which is what we think is fair for the service and infrastructure we provide but you are free to set it to whatever you think is appropriate',
}

const borderColors = {
	creatorRoyalties: "#000000",
	creator: "#DB02E9",
	allPartners: "#10A4FE",
	allCreators: "#0C0BE5",
	allOwners: "#730DF2",
	marketplace: "#FFA6A6",
}
const borderStopColors = {
	creatorRoyalties: "#000000",
	creator: "#AF0AEB",
	allPartners: "#068DE5",
	allCreators: "#0C0BE5",
	allOwners: "#8006D0",
	marketplace: "#FF47AF",
}

const marketplaceMinPercent = 0.8

export default function MyCollectionPie() {
	const { userId } = useContext(AuthContext)
	const { myCollectionRoles, isImportExistingCollection } = useContext(MyCollectionContext)
	const [qs] = useSearchParams()
	const isQSView = !!qs.get('view')
	const { collectionId } = useParams()
	const [isEditMode, setIsEditMode] = useState(false)
	const [loading, setLoading] = useState(false)
	const [pies, setPies] = useState([])
	const [tabContentId, setTabContentId] = useState(TABS.MINT.id)
	const [manyArtists, setManyArtists] = useState(null)

	useEffect(() => {
		if (collectionId) {
			const load = async () => {
				const { manyArtists } = await loadCollectionSettings(collectionId)
				setManyArtists(manyArtists)
				const pies = await loadCollectionPies(collectionId, manyArtists)
				setPies(pies)
			}
			setLoading(true)
			load().finally(() => setLoading(false))
		}
	}, [collectionId])

	useEffect(() => {
		if (!isEditMode && !isQSView) {
			if ((myCollectionRoles & RolesMap.curator) > 0) {
				setIsEditMode(true)
			}
		}
	}, [isQSView, isEditMode, myCollectionRoles])

	const getSelectedTabContent = () => {
		if (isImportExistingCollection) {
			return <PieTabContent key={2} pie={pies[saleStagePieIndex]} stage={saleStage} pieIndex={saleStagePieIndex} setPies={setPies} isEditMode={isEditMode} manyArtists={manyArtists} />
		}
		switch (tabContentId) {
			case TABS.MINT.id: return <PieTabContent key={0} pie={pies[mintStagePieIndex]} stage={mintStage} pieIndex={mintStagePieIndex} setPies={setPies} isEditMode={isEditMode} manyArtists={manyArtists} />
			case TABS.SECONDARY.id: return <PieTabContent key={1} pie={pies[saleStagePieIndex]} stage={saleStage} pieIndex={saleStagePieIndex} setPies={setPies} isEditMode={isEditMode} manyArtists={manyArtists} />
			default:
				console.error("unknown tabContentId at getSelectedTabContent", tabContentId)
				return null
		}
	}

	const VIDEO_ID = '767388955'
	const poppedOnceAlready = localStorage.getItem(VIDEO_ID)
	const [videoId, setVideoId] = useState(poppedOnceAlready ? null : VIDEO_ID)
	const openPopupWithPlayer = () => { setVideoId(VIDEO_ID) }
	const closePopupWithPlayer = () => { setVideoId(null) }

	if (!userId && isEditMode) return null
	if (loading) return <Loading />
	if (!poppedOnceAlready) localStorage.setItem(VIDEO_ID, '1')

	return (
		<>
			<TextPhrase padTop={true}>As easy as pie</TextPhrase>
			<TextPhrase padTop={true} isMain={false}>{isEditMode ? "Set" : "See"} the royalties of the core team, artists, and collectors,<br />for {isImportExistingCollection ? "" : "both the mint and"} any secondary sales for all items in the collection.</TextPhrase>
			<div className="ta-c pt-2">
				<button className="secondary" onClick={openPopupWithPlayer}>Watch video</button>
			</div>
			<div style={{ margin: '0 auto', maxWidth: 900, paddingBottom: '4em' }}>
				<TabButtons buttons={isImportExistingCollection ? [] : [TABS.MINT, TABS.SECONDARY]} tabContentId={tabContentId} setTabContentId={setTabContentId} moreCls="pie-tab-buttons" />
				<div className="tab-body">
					<div className="tab-content no-gradient">{getSelectedTabContent()}</div>
				</div>
			</div>
			{videoId && <AppPopup visible={true} setVisible={closePopupWithPlayer}>
				<iframe style={{ width: "32vw", height: "18vw" }} src={`https://player.vimeo.com/video/${videoId}?h=52c02a77fd&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479`} frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="rev share video v1.mp4"></iframe>
				<script src="https://player.vimeo.com/api/player.js"></script>
			</AppPopup>}
		</>
	)
}

function PieTabContent({ pie, stage, pieIndex, setPies, isEditMode, manyArtists }) {
	const { setProgressStageState } = useContext(CollectionProgressBarContext)
	const [Pie, setPie] = useState(null)
	const [chartElems, setChartElems] = useState(null)
	const [chartElemsRegistered, setChartElemsRegistered] = useState(false)
	useEffect(() => { import('react-chartjs-2').then(({ Pie }) => setPie(Pie)) }, [])
	useEffect(() => { import('chart.js').then(setChartElems) }, [])
	useEffect(() => {
		if (chartElems) {
			const { Chart, ArcElement, Tooltip, Legend } = chartElems
			Chart.register(ArcElement, Tooltip, Legend)
			Chart.overrides.pie.plugins.legend.display = false
			setChartElemsRegistered(true)
		}
	}, [chartElems])
	const { myCollectionRoles, myCollectionStatus, isImportExistingCollection } = useContext(MyCollectionContext)
	const [total, setTotal] = useState(0)
	const [totalColor, setTotalColor] = useState("")
	const [saving, setSaving] = useState(false)
	const { collectionId } = useParams()
	const isDraft = myCollectionStatus === CollectionStatusMap.draft
	const canEdit = isEditMode && isDraft
	const navigate = useNavigate()
	const postDataToStorage = async () => {
		if (collectionId && canEdit) {
			setSaving(true)
			try {
				await mergeCollectionPie(collectionId, stage, { ...pie })
				toastSaved()
			} finally {
				setSaving(false)
			}
		}
	}

	useEffect(() => {
		if (pie && canEdit) {
			let sum = 0
			for (let key in pie) {
				sum += key !== "collectionId" && key !== "stage" && key !== "creatorRoyalties" ? pie[key] || 0 : 0
			}
			setTotal(sum)
			setTotalColor(sum > 100 ? '#AD3E4D' : sum < 100 ? '#FFA462' : pie.marketplace >= marketplaceMinPercent ? '#04D1AC' : '#FFA462')
		}
	}, [pie, canEdit])

	const shareControl = ({ name, disabled, readOnly, ...props }) => {
		return (
			<div className={"share-percent-control " + name}>
				<div className="share-percent-labels">
					<div className="short-label">{LABELS[name]}</div>
					<div className="short-label-subtext">{LABELS_SUBTEXT[name]}</div>
				</div>
				<AppControl type="number" numberBoxStyle={{ borderColor: borderColors[name], borderWidth: 2, borderRadius: 24 }} subtype="percent" name={name} noLabel={true} value={pie[name]} setData={setPies} rowIdx={pieIndex} readOnly={!canEdit || readOnly} disabled={!canEdit || disabled} {...props} />
			</div>
		)
	}
	const isCurator = () => (myCollectionRoles & RolesMap.curator) > 0

	if (!pie || !chartElems || !Pie || !chartElemsRegistered) return null

	const continueButtonClick = () => {
		if (isCurator()) {
			setProgressStageState(REV_SHARE_STAGE_IDX, true)
		}
		navigate(isImportExistingCollection ? `/my-collection-deploy/${collectionId}` : `/my-collection-story/${collectionId}`)
	}

	return (
		<>
			<div style={{ display: 'flex', flexFlow: 'row wrap', justifyContent: 'space-between' }}>
				<FormContainer cls="mx-0" style={{ width: 500 }}>
					{stage === saleStage && !isImportExistingCollection && shareControl({ name: "creatorRoyalties" })}
					{/* {stage === saleStage && shareControl({ name: "owner" })} */}
					{manyArtists && shareControl({ name: "creator" })}
					{shareControl({ name: "allPartners" })}
					{manyArtists && shareControl({ name: "allCreators" })}
					{shareControl({ name: "allOwners" })}
					{shareControl({ name: "marketplace", min: marketplaceMinPercent })}
				</FormContainer>
				<div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start' }}>
					{canEdit && <div className="ta-c fw-700 pt-2" style={{ color: totalColor }}>{total}% distributed</div>}
					<div>
						<Pie data={pieChartData(pie)} style={{ width: 300, height: 300, margin: '2em auto' }}></Pie>
					</div>
				</div>
			</div>
			{canEdit && <StickyButtonContainer>
				<SaveButton onClick={postDataToStorage} saving={saving} disabled={total !== 100 || !pie.marketplace || pie.marketplace < marketplaceMinPercent} text="Update" />
				{isCurator() && <button className="secondary" onClick={continueButtonClick}>Continue</button>}
			</StickyButtonContainer>}
		</>
	)
}

function pieChartData(data) {
	const arrData = []
	const arrLabels = []
	const bgColors = []
	const bgStopColors = []
	for (let key in LABELS) {
		if (key === "creatorRoyalties") continue
		const v = data[key] || 0
		if (v > 0) {
			arrData.push(v)
			arrLabels.push(LABELS[key])
			bgColors.push(borderColors[key])
			bgStopColors.push(borderStopColors[key])
		}
	}
	const ctx = document.createElement('canvas').getContext("2d")
	const getGradient = (start, stop) => {
		const gradient = ctx.createLinearGradient(0, 0, 400, 400)
		gradient.addColorStop(0, start)
		gradient.addColorStop(1, stop)
		return gradient
	}

	return {
		labels: arrLabels,
		datasets: [{
			data: arrData,
			backgroundColor: bgColors.map((bgColor, idx) => getGradient(bgColor, bgStopColors[idx])),
			borderWidth: 2,
			hoverOffset: 2
		}]
	}
}