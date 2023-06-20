import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import AuthContext from '../ctx/Auth'
import Loading from './prompts/Loading'
import '../css/table.scss'
import FontIcon from '../fontIcon/FontIcon'
import { AppControl } from './parts/AppControl'
import { deleteTeammate, loadCollectionPies, loadCollectionSettings, loadTeam, saleStagePieIndex, updatePublicProfile, updateTeamShares } from '../func/collections'
import setOptimizedUrls, { ProfileImageSpecs } from '../util/optimizedImages'
import { toast } from 'react-toastify'
import { RolesMap } from '../util/roles'
import generateInviteLink from '../util/generateInviteLink'
import FormContainer from './parts/FormContainer'
import last4 from '../util/last4'
import { toastSaved } from '../util/toasts'
import MyCollectionContext from '../ctx/MyCollection'
import TextPhrase from './parts/TextPhrase'
import { getTitleWithIconAndTooltip } from '../util/getTitleWithIconAndTooltip'
import StickyButtonContainer from './parts/StickyButtonContainer'
import CollectionProgressBarContext from '../ctx/CollectionProgressBarContext'
import { CORE_TEAM_STAGE_IDX } from './parts/CollectionProgressBar'
import ButtonsRow from './parts/ButtonsRow'


export default function MyCollectionTeam({ setSidebarState }) {
	const { setProgressStageState } = useContext(CollectionProgressBarContext)
	const { userId } = useContext(AuthContext)
	const { myCollectionRoles, isImportExistingCollection } = useContext(MyCollectionContext)
	const { collectionId } = useParams()
	const [rows, setRows] = useState([])
	const [loading, setLoading] = useState(false)
	const [shares, setShares] = useState({})
	const [dirtyShares, setDirtyShares] = useState(false)
	const [total, setTotal] = useState(0)
	const [totalColor, setTotalColor] = useState("")
	const navigate = useNavigate()
	const [inviteLink, setInviteLink] = useState('')
	const [allPartnersShare, setAllPartnersShare] = useState(0)

	const setSharesFromRows = (rows) => {
		const shares = {}
		rows.forEach((row, idx) => shares[`share${idx}`] = row.share)
		setShares(shares)
	}
	useEffect(() => setSharesFromRows(rows), [rows])

	useEffect(() => {
		const s = { ...shares }
		const keys = Object.keys(s)
		if (keys.length !== rows.length) {
			setDirtyShares(true)
			return
		}
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]
			const share = s[key]
			const idx = key.substring('share'.length)
			if (share !== rows[idx].share) {
				setDirtyShares(true)
				return
			}
		}
		setDirtyShares(false)
	}, [rows, shares])

	useEffect(() => {
		const load = async () => {
			const rows = await loadTeam(collectionId)
			setOptimizedUrls(rows, ["profileImage"], ProfileImageSpecs)
			setRows(rows)
			const { manyArtists } = await loadCollectionSettings(collectionId)
			const pies = await loadCollectionPies(collectionId, manyArtists)
			setAllPartnersShare(pies[saleStagePieIndex].allPartners)
		}
		setLoading(true)
		load().finally(() => setLoading(false))
	}, [collectionId])

	useEffect(() => {
		let sum = 0
		for (let key in shares) {
			sum += shares[key] || 0
		}
		setTotal(sum)
		setTotalColor(sum > 100 ? '#AD3E4D' : sum < 100 ? '#FFA462' : '#04D1AC')
	}, [shares])

	useEffect(() => {
		generateInviteLink({ invitingUserId: userId, inviteeRole: RolesMap.partner, collectionId }).then(setInviteLink)
	}, [userId, collectionId])

	const isCurator = () => (myCollectionRoles & RolesMap.curator) > 0

	const togglePublicProfile = (publicProfile, idx) => {
		if (isCurator()) {
			setRows(rows => {
				const rs = [...rows]
				rs[idx].publicProfile = publicProfile
				return rs
			})
			updatePublicProfile(rows[idx].userId, collectionId, publicProfile).then(toastSaved)
		}
	}

	const addTeammateClick = () => {
		if (isCurator()) {
			navigate(`/my-collection-add-teammate/${collectionId}`)
		}
	}
	const rowClick = (row) => {
		if (isCurator()) {
			navigate(`/my-collection-teammate/${collectionId}/${row.userId}`)
		}
	}
	const deleteClick = (e, idx, teammateId) => {
		if (isCurator() && teammateId !== userId) {
			e.stopPropagation()
			deleteTeammate(teammateId, collectionId)
			setRows(rows => {
				const r = [...rows]
				r.splice(idx, 1)
				return r
			})
		}
	}
	const copyLinkClick = async () => {
		await navigator.clipboard.writeText(inviteLink)
		toast(`Copied ${inviteLink}`)
	}
	const saveSharesClick = async () => {
		if (isCurator()) {
			const s = { ...shares }
			const keys = Object.keys(s)
			const teamShares = {}
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i]
				const idx = key.substring('share'.length)
				teamShares[rows[idx].userId] = shares[key]
			}
			updateTeamShares(collectionId, teamShares).then(toastSaved)
			setRows(rows => rows.map((row, idx) => ({ ...row, share: s[`share${idx}`] })))
		}
	}

	const globalPercent = (share) => (share && allPartnersShare ? (share * allPartnersShare / 100) + '%' : share || '')

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
			setProgressStageState(CORE_TEAM_STAGE_IDX, rows?.length > 0)
		}
		navigate(isImportExistingCollection ? `/my-collection-pie/${collectionId}` : `/my-collection-creators/${collectionId}`)
	}

	return (
		<div>
			<TextPhrase padTop={true}>Assemble your team</TextPhrase>
			<TextPhrase padTop={true} isMain={false}>Add or invite your core team - this can be other founders, partners, influencers, your pet dog, or all the above. You decide what % each teammate will get from the <b>Core Team Share</b> and their royalties.</TextPhrase>
			<ButtonsRow doRender={isCurator()}>
				<button className="secondary" onClick={addTeammateClick}>Add teammate</button>
			</ButtonsRow>

			<div className="table-row header-row pt-2 c6-2fr-24">
				<span>{getTitleWithIconAndTooltip("Teammate", "Tap on any teammate to edit their profile or invite them")}</span>
				<span>{getTitleWithIconAndTooltip("Wallet", "Each teammate needs to have a wallet")}</span>
				<span className="jc-c">{getTitleWithIconAndTooltip("Public Profile", "When toggle is on, the teammate's profile will be shown on the collection page")}</span>
				<span className="jc-c" style={{ color: totalColor }}>{getTitleWithIconAndTooltip(`${total}% Share`, "Set rev share percentage of each teammate from the total Core Team Share")}</span>
				<span className="jc-c">{getTitleWithIconAndTooltip("Overall %", `The percentage each teammate will get relative to the entire collection rev share (Ex. If you have a 50% share of the Core Team Share of 50%, then you will get 25% overall)`)}</span>
				<span></span>
			</div>
			{rows.map((row, idx) => {
				return (
					<div key={idx} className={"table-row c6-2fr-24" + (isCurator() ? "" : " non-clickable")} onClick={() => rowClick(row)}>
						<span>
							<img src={row.profileImage} className="profile-image" alt="" />
							{row.name}
						</span>
						<span className="sm bold">{last4(row.walletAddress)}</span>
						<span className="jc-c" onClick={e => e.stopPropagation()}>
							<AppControl type="checkbox" value={row.publicProfile} name={`publicProfile${idx}`} setValue={checked => togglePublicProfile(checked, idx)} noLabel={true} disabled={!isCurator()} readOnly={!isCurator()} />
						</span>
						<span className="jc-c has-input">
							<AppControl type="number" subtype="percent" value={shares[`share${idx}`]} name={`share${idx}`} setData={setShares} noLabel={true} disabled={!isCurator()} readOnly={!isCurator()} />
						</span>
						<span className="jc-c sm">{globalPercent(shares[`share${idx}`])}</span>
						<span className="jc-e">{row.userId !== userId && isCurator() && <FontIcon name="delete" onClick={(e) => deleteClick(e, idx, row.userId)} />}</span>
					</div>
				)
			})}
			{isCurator() && <div className="table-row footer-row c6-2fr-24">
				<span></span>
				<span></span>
				<span></span>
				<span className="jc-c">
					{dirtyShares && <button disabled={total !== 100} className="secondary" onClick={saveSharesClick}>Save shares</button>}
				</span>
				<span></span>
				<span></span>
			</div>}

			{isCurator() && <FormContainer cls="ta-c">
				<div className="pt-2">Use this link to invite teammates:</div>
				<AppControl name="inviteLink" value={inviteLink} readOnly={true} />
				<div style={{ paddingTop: '1em' }}>
					<button className="secondary" onClick={copyLinkClick}>Copy link</button>
				</div>
			</FormContainer>}

			{isCurator() && <StickyButtonContainer>
				<button onClick={nextButtonClick} className="primary">Next</button>
			</StickyButtonContainer>}
		</div>
	)
}