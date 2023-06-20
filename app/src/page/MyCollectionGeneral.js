import './parts/collapser.scss'
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Loading from './prompts/Loading';
import StickyButtonContainer from './parts/StickyButtonContainer';
import { AppControl } from './parts/AppControl';
import { SaveButton } from './parts/SaveButton';
import FormContainer from './parts/FormContainer';
import AuthContext from '../ctx/Auth'
import { loadMyCollectionStory, createCollection, updateCollection, loadMyCollections, deleteCollection } from '../func/collections';
import { RolesMap } from '../util/roles';
import { getFileRemovedHandler, unpinRemovedFiles } from '../util/uploadToIPFS';
import { CoverImageSpecs, CardImageSpecs, getOptimizeImgUrl } from '../util/optimizedImages';
import MyCollectionContext from '../ctx/MyCollection';
import { toastSaved } from '../util/toasts';
import SidebarContext from '../ctx/Sidebar';
import { Collapser } from './parts/Collapser';
import { Cardviewer } from './parts/Cardviewer';
import { Collapsee } from './parts/Collapsee';
import TextPhrase from './parts/TextPhrase';
import CollectionIntroVideo, { poppedOnceAlready } from './CollectionIntroVideo';
import { useNVarcharLimits } from '../util/useNVarcharLimits';
import { DefaultPriceKindTooltips, PriceKindFieldName, PriceKinds, PriceKindTooltips } from '../util/nftPrice';
import { getTitleWithIconAndTooltip } from '../util/getTitleWithIconAndTooltip';
import CollectionProgressBarContext from '../ctx/CollectionProgressBarContext';
import { NAME_AND_COVER_IMAGE_STAGE_IDX } from './parts/CollectionProgressBar';
import FontIcon from '../fontIcon/FontIcon';
import ButtonsRow from './parts/ButtonsRow';
import AppPopup from './parts/AppPopup';
import DeleteItemsPopUp from './parts/DeleteItemsPopUp';
import { ItemStatus, itemStatusToText } from '../util/itemStatus';
import CARDCONSTANT from './parts/CardViewerConstant';

const defaultSettings = { canGrow: true, manyArtists: false, batchUploads: false, selfMinted: true, samePriceForAllNFT: true }

export default function MyCollectionGeneral({ setSidebarState }) {
	const { triggerSidebarAnimation } = useContext(SidebarContext)
	const { userId, mayAddCollection, isImpersonating } = useContext(AuthContext)
	const { myCollectionRoles, setMyCollectionRoles, setMyCollectionName, isImportExistingCollection, importedNFTAddress } = useContext(MyCollectionContext)
	const { setProgressStageState } = useContext(CollectionProgressBarContext)
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [data, setData] = useState({})
	const [isViewMode, setIsViewMode] = useState(null)
	const [removedFiles, setRemovedFiles] = useState({})
	const navigate = useNavigate()
	const { collectionId } = useParams()
	const isNewCollection = !collectionId
	const { nvarcharLimits } = useNVarcharLimits("collections")
	const isCurator = () => (myCollectionRoles & RolesMap.curator) > 0
	const [deleteStatus, setDeleteStatus] = useState(false)
	const [deleting, setDeleting] = useState(false)
	const [collection, setCollection] = useState([])

	useEffect(() => {
		if (userId) {
			if (myCollectionRoles) {
				if (collectionId) {
					setLoading(true)
					loadMyCollectionStory(collectionId, false, true).then(data => {
						setData(data)
						setLoading(false)
						const isEditMode = (myCollectionRoles & RolesMap.curator) > 0
						setIsViewMode(!isEditMode)
					})
				} else {
					const isEditMode = mayAddCollection
					setIsViewMode(!isEditMode)
					setData({ ...defaultSettings })
				}
			} else if (!collectionId) {
				setMyCollectionRoles(mayAddCollection ? RolesMap.curator : 0)
				setData(mayAddCollection ? { ...defaultSettings } : {})
			}
		}
	}, [userId, collectionId, myCollectionRoles, mayAddCollection, setMyCollectionRoles])


	const openDeleteConfirmation = () => {
		if (collection?.length > 0) {
			setDeleteStatus(true)
		} else {
			loadMyCollections(0, 0, 0, 0, collectionId).then((data) => {
				setCollection(data)
				setDeleteStatus(true)
			})
		}
	}
	const hideDeleteConfirmation = () => setDeleteStatus(false)
	const handleDelete = async () => {
		setDeleting(true)
		try {
			await deleteCollection(collectionId)
			setDeleting(false)
			navigate(`/my-collections`)
		} catch (e) {
			setDeleting(false)
			throw e
		}
	}

	const changeToggleStatus = (val, type) => {
		let d = { ...data };
		console.log(val);
		switch (type) {
			case CARDCONSTANT.TOGGLE.ENVOLVING:
				d.canGrow = val;
				break;
			case CARDCONSTANT.TOGGLE.ARTISTS:
				d.manyArtists = val;
				break;
			case CARDCONSTANT.TOGGLE.BATCHES:
				d.batchUploads = val;
				break;
			case CARDCONSTANT.TOGGLE.MINT_COLLECTOR:
				d.selfMinted = val;
				break;
			default:
				break;
		}

		setData(d);
	}

	const postDataToStorage = async (collectionId) => {
		if (isViewMode) return
		setSaving(true)
		const d = { ...data }
		const isCompleted = d.name?.length > 0 && d.coverImage?.length > 0
		if (isNewCollection) {
			if (isImportExistingCollection) {
				d.isImportExistingCollection = true
				d.importedNFTAddress = importedNFTAddress
			}
			collectionId = await createCollection(d, userId)
			if (isCompleted) {
				await setProgressStageState(NAME_AND_COVER_IMAGE_STAGE_IDX, true, collectionId)
			}
		} else if (!isImportExistingCollection) {
			await Promise.all([
				updateCollection(collectionId, d),
				setProgressStageState(NAME_AND_COVER_IMAGE_STAGE_IDX, isCompleted)
			])
		}
		setMyCollectionName(isImportExistingCollection ? 'My Existing Collection' : d.name || 'My Collection')
		if (!isImportExistingCollection) {
			unpinRemovedFiles(removedFiles, d)
			setRemovedFiles({})
		}
		setSaving(false)
		if (isNewCollection) triggerSidebarAnimation()
		else if (!isImportExistingCollection) toastSaved()
		navigate(`/my-collection-team/${collectionId}`)
	}

	const onFileRemoved = (name, ipfsPath) => setRemovedFiles(getFileRemovedHandler(name, ipfsPath))

	useEffect(() => {
		if (setSidebarState) {
			setSidebarState(isNewCollection ? 0 : 2)
		}
		// eslint-disable-next-line
	}, [])

	if (loading) return <Loading />
	if (!userId || isViewMode === null || nvarcharLimits == null) return null

	if (!poppedOnceAlready() && !isImportExistingCollection) return <CollectionIntroVideo />

	const control = ({ name, ...props }) => <AppControl maxLength={nvarcharLimits[name]} name={name} value={data[name]} setData={setData} {...props} readOnly={isViewMode} disabled={isViewMode} />
	const priceControl = (priceKind) => {
		const samePrice = data.samePriceForAllNFT
		return control({
			type: "number",
			subtype: "price",
			name: PriceKindFieldName[priceKind],
			label: samePrice ?
				getTitleWithIconAndTooltip(`${priceKind} price of all NFTs (eth)`, PriceKindTooltips[priceKind])
				: getTitleWithIconAndTooltip(`Default ${priceKind.toLowerCase()} price (eth)`, DefaultPriceKindTooltips[priceKind]),
		})
	}

	if (isImportExistingCollection) {
		return <>
			<TextPhrase fw600={true} padTop={true}>Our "Creators' Pie" contract</TextPhrase>
			<TextPhrase fw400={true} cls="mx-auto" tac={false} padTop={true} style={{ maxWidth: 600, lineHeight: 1.5 }}>
				Our "Creators' Pie" contract is a smart contract designed to act as a buffer between your existing collection smart contract and secondary sales. With this contract, you can easily and transparently split your creator's fee on-chain. Here are some key features:
				<ul>
					<li>Split between all core team members of your collection</li>
					<li>Add and split between one or more artists in the project</li>
					<li>Split a percentage between all artists in project, even if they didn't create the specific NFT sold</li>
					<li>Give back to your holders and set a share that will be allocated to donate to any charity, cause, or wallet they choose.</li>
				</ul>
				When you deploy this contract, you fully own it, and it's entirely reversible. To connect it to your existing contract, simply change the creator's fee wallet address to the contract address. If you change your mind, you can easily change it back. Additionally, we automatically create a lazy withdraw page for you, your team, and your holders to withdraw or donate their share only when they want to.
				<div className="fw-600 pt-1">
					It's time to be transparent and give back to your community with the "Creators' Pie" contract.
				</div>
			</TextPhrase>
			<FormContainer>
				{control({ label: "Collection name", name: "name" })}
			</FormContainer>
			<StickyButtonContainer>
				<SaveButton onClick={async () => await postDataToStorage(collectionId)} saving={saving} text="Got it - let's start" />
			</StickyButtonContainer>
		</>
	}
	return (
		<>
			<ButtonsRow doRender={!isNewCollection && isCurator()} width600={true}>
				<button className="danger" onClick={openDeleteConfirmation}><FontIcon name="delete" inline={true} />Delete Collection</button>
			</ButtonsRow>
			<TextPhrase padTop={true}>Collection basic info</TextPhrase>
			<FormContainer>
				{control({ label: "Collection name", name: "name" })}
				{/* {control({ label: "Tagline", name: "tagline" })} */}
				{control({ label: "Profile image", name: "profileImage", type: "file", onFileRemoved: onFileRemoved, imageSize: CardImageSpecs })}
				{control({ label: "Collection description", name: "desc", type: "textarea" })}
				{control({ label: "Cover image", name: "coverImage", type: "file", onFileRemoved: onFileRemoved, imageSize: CoverImageSpecs })}
				{control({ label: "Video link (YouTube/Vimeo - optional)", name: "videoLink" })}
			</FormContainer>

			<Cardviewer type={CARDCONSTANT.TOGGLE.ENVOLVING} selIndex={data.canGrow} disabled={isViewMode} event={changeToggleStatus} />
			<div className="mx-auto" style={{ maxWidth: 360, marginTop: 25 }}>
				<FormContainer cls="pt-0">
					{!data.canGrow && control({ name: "maxItems", label: "Total number of items in collection", type: "number" })}
				</FormContainer>
			</div>

			<Cardviewer type={CARDCONSTANT.TOGGLE.ARTISTS} selIndex={data.manyArtists} disabled={isViewMode} event={changeToggleStatus} />
			<div className="mx-auto" style={{ maxWidth: 360, marginTop: 25 }}>
				<FormContainer cls="pt-0">
					{data.manyArtists && control({ name: "maxItemsPerCreator", label: "Max number of items per artist (optional)", type: "number" })}
				</FormContainer>
			</div>

			<Cardviewer type={CARDCONSTANT.TOGGLE.BATCHES} selIndex={data.batchUploads} disabled={isViewMode} event={changeToggleStatus} />

			<Cardviewer type={CARDCONSTANT.TOGGLE.MINT_COLLECTOR} selIndex={data.selfMinted} disabled={isViewMode} event={changeToggleStatus} />
			<div className="mx-auto" style={{ maxWidth: 360 }}>
				{!data.selfMinted && <>
					<TextPhrase padTop={true} isMain={false} tac={false}>Will all items in the collection have the same identical initial pricing?</TextPhrase>
					<FormContainer cls="pt-0">
						{control({ name: "samePriceForAllNFT", toggleTitle: "Same price", type: "checkbox" })}
						{priceControl(PriceKinds.Premint)}
						{priceControl(PriceKinds.Mint)}
					</FormContainer>
				</>}
			</div>
			<div className="mx-auto" style={{ maxWidth: 360, marginTop: 25 }}>

				{isImpersonating && !data.selfMinted && <>
					<TextPhrase padTop={true} isMain={false} tac={false}>This collection type gives the perpetual royalties normally reserved for creators to the minters</TextPhrase>
					<FormContainer cls="pt-0">
						{control({ name: "mintersAsArtists", toggleTitle: "Minter royalties", type: "checkbox" })}
					</FormContainer>
					<TextPhrase padTop={true} isMain={false} tac={false}>Limit the number of NFTs that can be minted per wallet (0 - unlimited)</TextPhrase>
					<FormContainer cls="pt-0">
						{control({ name: "maxItemsPerMinter", toggleTitle: "Max items per minter", type: "number" })}
					</FormContainer>
				</>}

				{isImpersonating && <>
					<TextPhrase padTop={true} isMain={false} tac={false}>Default NFT status (applies when added by curator)</TextPhrase>
					<FormContainer cls="pt-0">
						{control({
							name: "defaultItemStatus", type: "select", options: [
								{ text: "Choose...", value: 0 },
								{ text: itemStatusToText(ItemStatus.needApproval), value: ItemStatus.needApproval },
								{ text: itemStatusToText(ItemStatus.approved), value: ItemStatus.approved },
							]
						})}
					</FormContainer>
				</>}
			</div>

			{/* <SettingSection control={control} /> */}

			<SocialSection control={control} />

			{!isViewMode && (
				<StickyButtonContainer>
					<SaveButton onClick={() => postDataToStorage(collectionId)} saving={saving} text="Update & continue" />
				</StickyButtonContainer>
			)}

			<AppPopup visible={deleteStatus} setVisible={hideDeleteConfirmation} insideCls="delete-items-popup">
				<DeleteItemsPopUp
					list={collection}
					onClick={handleDelete}
					onCancel={hideDeleteConfirmation}
					deleting={deleting}
					deleteWhat={<b>{data.name || 'my collection'}</b>}
					getCachedSrc={collection => getOptimizeImgUrl(collection.profileImage, CardImageSpecs)}
				/>
			</AppPopup>
		</>
	)
}

function SocialSection({ control, initCollapsed = true }) {
	const [collapsed, setCollapsed] = useState(initCollapsed)
	return (
		<>
			<Collapser collapsed={collapsed} setCollapsed={setCollapsed} title="Social" />
			<Collapsee collapsed={collapsed}>
				<FormContainer cls="collapsee-inner">
					{control({ label: "Twitter (handle or link)", name: "twitter", placeholder: "https://twitter.com/@..." })}
					{control({ label: "Discord invite link", name: "discord", placeholder: "https://discord.gg/..." })}
					{control({ label: "Tik Tok (handle or link)", name: "tiktok", placeholder: "https://tiktok.com/@..." })}
					{control({ label: "YouTube channel", name: "youtube", placeholder: "https://youtube.com/..." })}
					{control({ label: "Instagram (handle or link)", name: "instagram", placeholder: "https://instagram.com/@..." })}
				</FormContainer>
			</Collapsee>
		</>
	)
}

// function SettingSection({ initCollapsed = true }){
// 	const [collapsed, setCollapsed] = useState(initCollapsed);
// 	return (
// 		<>
// 			<Collapser collapsed={collapsed} setCollapsed={setCollapsed} title="Collection basic settings" />
// 			<Collapsee collapsed={collapsed}>
// 				<FormContainer cls="collapsee-inner full-width">
// 					<Cardviewer absolute={collapsed}/>
// 				</FormContainer>
// 			</Collapsee>
// 		</>
// 	)
// }

