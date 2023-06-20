import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import AuthContext from '../ctx/Auth'
import Loading from './prompts/Loading'
import '../css/table.scss'
import FontIcon from '../fontIcon/FontIcon'
import { loadCommunity, deleteMember, loadCollectionSettings } from '../func/collections'
import setOptimizedUrls, { ProfileImageSpecs } from '../util/optimizedImages'
import { toast } from 'react-toastify'
import { RolesMap } from '../util/roles'
import generateInviteLink from '../util/generateInviteLink'
import last4 from '../util/last4'
import TextPhrase from './parts/TextPhrase'
import StickyButtonContainer from './parts/StickyButtonContainer'
import MyCollectionContext from '../ctx/MyCollection'
import ButtonsRow from './parts/ButtonsRow'
import { SaveButton } from './parts/SaveButton'
import { PAGE_TABS } from './parts/Tabs'

export default function MyCollectionCommunity({ setSidebarState }) {
	const { userId } = useContext(AuthContext)
	const { myCollectionRoles } = useContext(MyCollectionContext)
	const { collectionId } = useParams()
	const [rows, setRows] = useState([])
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()
	const [inviteLink, setInviteLink] = useState('')

	const isCurator = () => (myCollectionRoles & RolesMap.curator) > 0

	useEffect(() => {
		if (collectionId) {
			setLoading(true)
			loadCommunity(collectionId).then(rows => {
				setOptimizedUrls(rows, ["profileImage"], ProfileImageSpecs)
				setRows(rows)
				setLoading(false)
			})
		}
	}, [collectionId])

	useEffect(() => {
		if (userId && collectionId && !inviteLink) {
			generateInviteLink({ invitingUserId: userId, inviteeRole: RolesMap.invited, collectionId }).then(setInviteLink)
		}
	}, [userId, collectionId, inviteLink])

	const addMemberClick = () => {
		navigate(`/my-collection-add-member/${collectionId}`)
	}
	const rowClick = (row) => {
		navigate(`/my-collection-member/${collectionId}/${row.userId}`)
	}
	const deleteClick = (e, idx, memberId) => {
		e.stopPropagation()
		deleteMember(memberId, collectionId)
		setRows(rows => {
			const r = [...rows]
			r.splice(idx, 1)
			return r
		})
	}
	// const copyLinkClick = async () => {
	// 	await navigator.clipboard.writeText(inviteLink)
	// 	toast(`Copied ${inviteLink}`)
	// }

	const [generatingAboutLink, setGeneratingAboutLink] = useState(false)
	const [generatingMintLink, setGeneratingMintLink] = useState(false)
	const copyMyInviteLinkClick = async (tabContentId, progressSetter) => {
		progressSetter(true)
		try {
			// eslint-disable-next-line
			const basePath = collectionId == 3 ? '/artis' : `/collection-page/${collectionId}`
			const link = await generateInviteLink({ inviteeRole: RolesMap.invited, invitingUserId: userId, collectionId }, `${basePath}/${tabContentId}`)
			await navigator.clipboard.writeText(link)
			toast(`Copied: ${link}`)
		} finally {
			progressSetter(false)
		}
	}
	useEffect(() => {
		if (setSidebarState) {
			setSidebarState(2)
		}
		// eslint-disable-next-line
	}, [])

	if (!userId || !collectionId) return null
	if (loading) return <Loading />

	const continueClick = () => {
		loadCollectionSettings(collectionId).then(({ batchUploads }) => {
			const url = batchUploads ? `/my-collection-add-batch/${collectionId}` : `/my-collection-add-item/${collectionId}`
			navigate(url)
		})
	}

	return (
		<div>
			<TextPhrase padTop={true}>Add your allowlist or invite collectors</TextPhrase>
			<ButtonsRow>
				<SaveButton className="secondary" onClick={async () => await copyMyInviteLinkClick(PAGE_TABS.ABOUT.id, setGeneratingAboutLink)} tip="This link is your referral link to invite collectors to join the collection allow-list" text="Copy My Invite Link (about)" saving={generatingAboutLink} disabled={generatingAboutLink} />
				<SaveButton className="secondary" onClick={async () => await copyMyInviteLinkClick(PAGE_TABS.MINT.id, setGeneratingMintLink)} tip="This link is your referral link to invite collectors to mint items from the collection" text="Copy My Invite Link (mint)" saving={generatingMintLink} disabled={generatingMintLink} />
				<button className="secondary" onClick={() => toast('Coming soon')}>Upload list</button>
				<button className="secondary" onClick={addMemberClick}>Add collector</button>
			</ButtonsRow>

			{rows.length > 0 && <div className="table-row header-row pt-2 c5">
				<span>Member</span>
				<span>Wallet</span>
				<span>Items</span>
				<span>Came from</span>
				<span></span>
			</div>}
			{rows.map((row, idx) => {
				return (
					<div key={idx} className="table-row c5" onClick={() => rowClick(row)}>
						<span>
							<img src={row.profileImage} className="profile-image" alt="" />
							{row.name}
						</span>
						<span className="sm bold">{last4(row.walletAddress)}</span>
						<span>{row.itemsCount}</span>
						<span>{row.invitingUser}</span>
						<span className="jc-e">
							<FontIcon name="delete" onClick={(e) => deleteClick(e, idx, row.userId)} />
						</span>
					</div>
				)
			})}
			{/* 
			<FormContainer cls="ta-c">
				<div className="pt-2">Use this link to invite collectors:</div>
				<AppControl name="inviteLink" value={inviteLink} readOnly={true} />
				<div style={{ paddingTop: '1em' }}>
					<button className="secondary" onClick={copyLinkClick}>Copy link</button>
				</div>
			</FormContainer> */}

			{isCurator() && <StickyButtonContainer>
				<button onClick={continueClick} className="primary">Continue</button>
			</StickyButtonContainer>}
		</div>
	)
}