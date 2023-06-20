import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import AuthContext from '../ctx/Auth'
import Loading from './prompts/Loading'
import '../css/table.scss'
import FontIcon from '../fontIcon/FontIcon'
import { AppControl } from './parts/AppControl'
import { loadCreators, deleteCreator } from '../func/collections'
import setOptimizedUrls, { ProfileImageSpecs } from '../util/optimizedImages'
import { toast } from 'react-toastify'
import { RolesMap } from '../util/roles'
import generateInviteLink from '../util/generateInviteLink'
import FormContainer from './parts/FormContainer'
import last4 from '../util/last4'
import TextPhrase from './parts/TextPhrase'
import StickyButtonContainer from './parts/StickyButtonContainer'
import MyCollectionContext from '../ctx/MyCollection'
import CollectionProgressBarContext from '../ctx/CollectionProgressBarContext'
import { ARTISTS_STAGE_IDX } from './parts/CollectionProgressBar'
import ButtonsRow from './parts/ButtonsRow'

export default function MyCollectionCreators({ setSidebarState }) {
	const { setProgressStageState } = useContext(CollectionProgressBarContext)
	const { userId } = useContext(AuthContext)
	const { myCollectionRoles } = useContext(MyCollectionContext)
	const { collectionId } = useParams()
	const [rows, setRows] = useState([])
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()
	const [inviteLink, setInviteLink] = useState('')

	const isCurator = () => (myCollectionRoles & RolesMap.curator) > 0

	useEffect(() => {
		(async (collectionId) => {
			setLoading(true)
			const rows = await loadCreators(collectionId)
			setOptimizedUrls(rows, ["profileImage"], ProfileImageSpecs)
			setRows(rows)
			setLoading(false)
		})(collectionId)
	}, [collectionId])

	useEffect(() => {
		(async (userId, collectionId) => {
			setInviteLink(await generateInviteLink({ invitingUserId: userId, inviteeRole: RolesMap.creator, collectionId }))
		})(userId, collectionId)
	}, [userId, collectionId])

	const addCreatorClick = () => {
		navigate(`/my-collection-add-creator/${collectionId}`)
	}
	const rowClick = (row) => {
		navigate(`/my-collection-creator/${collectionId}/${row.userId}`)
	}
	const deleteClick = (e, idx, creatorId) => {
		e.stopPropagation()
		deleteCreator(creatorId, collectionId)
		setRows(rows => {
			const r = [...rows]
			r.splice(idx, 1)
			return r
		})
	}
	const copyLinkClick = async () => {
		await navigator.clipboard.writeText(inviteLink)
		toast(`Copied ${inviteLink}`)
	}

	useEffect(() => {
		if (setSidebarState) {
			setSidebarState(2)
		}
		// eslint-disable-next-line
	}, [])

	if (!userId || !collectionId) return null
	if (loading) return <Loading />

	const nextButtonClick = () => {
		if (isCurator()) {
			setProgressStageState(ARTISTS_STAGE_IDX, true)
		}
		navigate(`/my-collection-pie/${collectionId}`)
	}
	return (
		<div>
			<TextPhrase padTop={true}>Manage artists</TextPhrase>
			<TextPhrase padTop={true} isMain={false}>Invite an individual artist or bring together multiple artists to add their pieces to the collection, working together toward the same goal, idea, or subject</TextPhrase>
			<ButtonsRow>
				<button className="secondary" onClick={addCreatorClick}>Add artist</button>
			</ButtonsRow>

			{rows.length > 0 && <div className="table-row header-row pt-2 c4">
				<span>Artist</span>
				<span>Wallet</span>
				<span>Items</span>
				<span></span>
			</div>}
			{rows.map((row, idx) => {
				return (
					<div key={idx} className="table-row c4" onClick={() => rowClick(row)}>
						<span>
							<img src={row.profileImage} className="profile-image" alt="" />
							{row.name}
						</span>
						<span className="sm bold">{last4(row.walletAddress)}</span>
						<span>{row.itemsCount}</span>
						<span className="jc-e">
							<FontIcon name="delete" onClick={(e) => deleteClick(e, idx, row.userId)} />
						</span>
					</div>
				)
			})}

			<FormContainer cls="ta-c">
				<div className="pt-2">Use this link to invite artists:</div>
				<AppControl name="inviteLink" value={inviteLink} readOnly={true} />
				<div style={{ paddingTop: '1em' }}>
					<button className="secondary" onClick={copyLinkClick}>Copy link</button>
				</div>
			</FormContainer>

			{isCurator() && <StickyButtonContainer>
				<button onClick={nextButtonClick} className="primary">Next</button>
			</StickyButtonContainer>}
		</div>
	)
}