import { useState, useEffect, useContext } from 'react'
import { useNavigate, useParams } from 'react-router'
import Loading from './prompts/Loading'
import CallForAction from './prompts/CallForAction'
import CardsFluidGrid from './parts/CardsFluidGrid'
import AuthContext from '../ctx/Auth'
import { CardImageSpecs, getOptimizeImgUrl } from '../util/optimizedImages'
import { addUserItemRoles, approveAllItems, loadCollectionItems, loadCollectionMyItems, removeUserItemRoles, updateItem } from '../func/items'
import DeleteItemsPopUp from './parts/DeleteItemsPopUp'
import { loadMyCollections, deleteAllCollectionItems } from '../func/collections'
import { isTeam, RolesMap, rolesToText } from '../util/roles'
import MyCollectionContext from '../ctx/MyCollection'
import TextPhrase from './parts/TextPhrase'
import StickyButtonContainer from './parts/StickyButtonContainer'
import AppPopup, { PreviewPopup } from './parts/AppPopup'
import ButtonsRow from './parts/ButtonsRow'
import { ItemStatus, itemStatusToText } from '../util/itemStatus'
import FontIcon from '../fontIcon/FontIcon'
import { toast } from 'react-toastify'
import generateInviteLink from '../util/generateInviteLink'
import { SaveButton } from './parts/SaveButton'

export default function MyCollectionItems({ setSidebarState }) {
	const { userId } = useContext(AuthContext)
	const { myCollectionRoles, myCollectionName } = useContext(MyCollectionContext)
	const { collectionId } = useParams()
	const [loading, setLoading] = useState(false)
	const [items, setItems] = useState([])
	const [mayHaveMore, setMayHaveMore] = useState(true)
	const [deleteStatus, setDeleteStatus] = useState(false)
	const [deleting, setDeleting] = useState(false)
	const [collection, setCollection] = useState([])
	const [iframeSrc, setIframeSrc] = useState(null)
	const navigate = useNavigate()

	const doLoadItems = async (discardPrev) => {
		const pageLimit = 9
		const offsetCount = discardPrev === true ? 0 : items.length
		const tmp = await (isTeam(myCollectionRoles) ? loadCollectionItems(userId, collectionId, myCollectionRoles, offsetCount, pageLimit) : loadCollectionMyItems(userId, collectionId, myCollectionRoles, offsetCount, pageLimit))
		if (tmp?.length) {
			setItems(prevItems => discardPrev === true ? tmp : [...prevItems, ...tmp])
			if (tmp.length < pageLimit)
				setMayHaveMore(false)
		} else {
			setMayHaveMore(false)
		}
	}

	useEffect(() => {
		if (userId && collectionId && myCollectionRoles) {
			setLoading(true)
			doLoadItems().finally(() => setLoading(false))
		}
		// eslint-disable-next-line
	}, [userId, collectionId, myCollectionRoles])

	const linkTo = (itemId) => `/my-collection-item/${collectionId}/${itemId}`

	const onFavToggleClick = (itemId, isFollower, idx) => {
		(isFollower ? removeUserItemRoles(userId, itemId, RolesMap.follower) : addUserItemRoles(userId, itemId, RolesMap.follower))
		setItems(items => {
			const tmp = [...items]
			tmp[idx].roles ^= RolesMap.follower
			return tmp
		})
	}

	useEffect(() => {
		if (setSidebarState) {
			setSidebarState(2)
		}
		// eslint-disable-next-line
	}, [])

	const addItemClick = () => navigate(`/my-collection-add-item/${collectionId}`)
	const addBatchClick = () => navigate(`/my-collection-add-batch/${collectionId}`)
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
	const handleDeleteAll = async () => {
		setDeleting(true)
		try {
			await deleteAllCollectionItems(collectionId)
			hideDeleteConfirmation()
			setDeleting(false)
			setItems([])
		} catch (e) {
			setDeleting(false)
			throw e
		}
	}

	const isCurator = () => (myCollectionRoles & RolesMap.curator) > 0
	const isCreator = () => (myCollectionRoles & RolesMap.creator) > 0

	const getItemCardOverlays = (id, item, idx) => {
		const previewItem = (e) => {
			e.preventDefault()
			setIframeSrc(`/collection-item-preview/${item.collectionId}/${id}`)
		}
		const approveItem = (e) => {
			e.preventDefault()
			e.target.disabled = true
			const { itemId } = item
			updateItem(itemId, { status: ItemStatus.approved })
			setItems(items => {
				const items2 = [...items]
				items2[idx] = { ...items2[idx], status: ItemStatus.approved }
				return items2
			})
		}

		return (
			<div className="item-card-overlay">
				{item.status === ItemStatus.needApproval && isCurator() ? <><button className="secondary" onClick={previewItem}>Preview</button><button className="secondary" onClick={approveItem}>Approve</button></> : null}
			</div>
		)
	}

	const [generatingLink, setGeneratingLink] = useState(false)
	const copyMyInviteLinkClick = async () => {
		setGeneratingLink(true)
		try {
			const link = await generateInviteLink({ inviteeRole: RolesMap.invited, invitingUserId: userId, collectionId }, `/collection-page/${collectionId}`)
			await navigator.clipboard.writeText(link)
			toast(`Copied: ${link}`)
		} finally {
			setGeneratingLink(false)
		}
	}

	if (!userId || !collectionId) return null
	if (loading) return <Loading />

	const approveAllClick = async () => {
		setLoading(true)
		try {
			await approveAllItems(collectionId)
			await doLoadItems(true)
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			<TextPhrase padTop={true}>Edit & approve items in this collection</TextPhrase>
			<ButtonsRow doRender={isCurator() || isCreator()}>
				{isCreator() && <SaveButton className="secondary" onClick={async () => await copyMyInviteLinkClick()} text="Copy My Invite Link" saving={generatingLink} disabled={generatingLink} />}
				{isCurator() && <button className="secondary" onClick={async () => await approveAllClick()}>Approve all</button>}
				{isCurator() && <button className="secondary" onClick={addBatchClick}>Add batch</button>}
				{(isCurator() || isCreator()) && <button className="secondary" onClick={addItemClick}>Add NFT</button>}
				{(isCurator() && items?.length > 0) && <button className="danger" onClick={openDeleteConfirmation}><FontIcon name="delete" inline={true} />Delete All</button>}
			</ButtonsRow>

			<CardsFluidGrid
				list={items}
				appendToCard={getItemCardOverlays}
				cardTo={linkTo}
				onEmpty={<CallForAction title="No items yet" isCentered={false} titleClassName="py-4" />}
				srcKey="file"
				srcMimeType="mimeType"
				idKey="itemId"
				footerKey="name"
				actionButton={mayHaveMore && <button className="primary" onClick={doLoadItems}>Show more</button>}
				hasFavToggleButton={true}
				onFavToggleClick={onFavToggleClick}
				isFav={data => (data.roles & RolesMap.follower) > 0}
				moreFooter={(_itemId, data) => <div className="card-footer-sub-line">{itemStatusToText(data.status, '. ') + rolesToText(data.roles)}</div>}
			/>

			{isCurator() && <StickyButtonContainer>
				<button onClick={() => navigate(`/my-collection-options/${collectionId}`)} className="primary">Continue</button>
			</StickyButtonContainer>}

			<AppPopup visible={deleteStatus} setVisible={hideDeleteConfirmation} insideCls="delete-items-popup">
				<DeleteItemsPopUp
					list={collection}
					onClick={handleDeleteAll}
					onCancel={hideDeleteConfirmation}
					deleting={deleting}
					deleteWhat={<span><b>All items</b> of <b>{myCollectionName || 'my collection'}</b></span>}
					getCachedSrc={collection => getOptimizeImgUrl(collection.profileImage, CardImageSpecs)}
				/>
			</AppPopup>
			<PreviewPopup visible={iframeSrc !== null} setVisible={() => setIframeSrc(null)} iframeSrc={iframeSrc} />
		</>
	)
}