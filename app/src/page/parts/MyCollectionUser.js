import TabButtons, { USER_TABS as TABS } from './Tabs';
import { useContext, useEffect, useState } from 'react';
import Loading from '../prompts/Loading';
import StickyButtonContainer from './StickyButtonContainer';
import { AppControl } from './AppControl';
import { SaveButton } from './SaveButton';
import AuthContext from '../../ctx/Auth'
import { createUser, loadUserProfile, updateUser } from '../../func/users';
import { getFileRemovedHandler, unpinRemovedFiles } from "../../util/uploadToIPFS";
import { useNavigate, useParams } from 'react-router';
import { createUserCollection } from '../../func/collections';
import { UserProfileFields } from './UserProfileFields';
import { toastSaved } from '../../util/toasts';
import generateInviteLink from '../../util/generateInviteLink';
import { InviteForm } from './InviteForm';
import { useNVarcharLimits } from '../../util/useNVarcharLimits';

export default function MyCollectionUser({ setSidebarState, userId, inviteeRole, backToUrlBase, invitePrompt, onCreateUser, setCrumbLabel }) {
	const [tabContentId, setTabContentId] = useState(TABS.PROFILE.id)
	const { userId: authUserId } = useContext(AuthContext)
	const { collectionId } = useParams()
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [data, setData] = useState({})
	const [removedFiles, setRemovedFiles] = useState({})
	const [inviteLink, setInviteLink] = useState('')
	const navigate = useNavigate()
	const { nvarcharLimits } = useNVarcharLimits("users")

	useEffect(() => {
		if (userId) {
			setLoading(true)
			loadUserProfile(userId).then(data => {
				setData(data)
				if (setCrumbLabel) setCrumbLabel(data.name)
				setLoading(false)
			})
		}
		// eslint-disable-next-line
	}, [userId])

	const postDataToStorage = async (userId) => {
		setSaving(true)
		const d = { ...data }
		try {
			if (!userId) {
				userId = await createUser(d)
				await Promise.all([onCreateUser(userId, collectionId), createUserCollection(userId, collectionId, inviteeRole)])
			} else {
				await updateUser(userId, d)
			}
			unpinRemovedFiles(removedFiles, d)
			setRemovedFiles({})
			toastSaved()
			navigate(`${backToUrlBase}/${collectionId}`)
		} finally {
			setSaving(false)
		}
	}

	useEffect(() => {
		if (!inviteLink) {
			if (tabContentId === TABS.INVITE.id) {
				if (userId && collectionId && authUserId) {
					generateInviteLink({ invitingUserId: authUserId, inviteeUserId: userId, collectionId, inviteeRole }).then(setInviteLink)
				}
			}
		}
	}, [userId, collectionId, inviteLink, tabContentId, inviteeRole, authUserId])

	const onFileRemoved = (name, ipfsPath) => setRemovedFiles(getFileRemovedHandler(name, ipfsPath))
	const control = ({ name, ...props }) => <AppControl maxLength={nvarcharLimits[name]} name={name} value={data[name]} setData={setData} {...props} />

	useEffect(() => {
		if (setSidebarState) {
			setSidebarState(3)
		}
		// eslint-disable-next-line
	}, [])

	const getSelectedTabContent = () => {
		switch (tabContentId) {
			case TABS.PROFILE.id: return (<>
				<UserProfileFields control={control} onFileRemoved={onFileRemoved} />
				<StickyButtonContainer>
					<SaveButton onClick={() => postDataToStorage(userId)} saving={saving} />
				</StickyButtonContainer>
			</>)
			case TABS.INVITE.id:
				return <InviteForm invitePrompt={invitePrompt} inviteLink={inviteLink} name={data.name} profileImage={data.profileImage} />
			default:
				console.error("unknown tabContentId at getSelectedTabContent", tabContentId)
				return null
		}
	}
	const getTabButtons = () => userId ? [TABS.PROFILE, TABS.INVITE] : [TABS.PROFILE]

	if (!authUserId || !collectionId) return null
	if (loading || nvarcharLimits === null) return <Loading />

	return (
		<div className="as-form-container xx">
			<TabButtons buttons={getTabButtons()} tabContentId={tabContentId} setTabContentId={setTabContentId} />
			<div className="tab-body">
				<div className="tab-content no-gradient">{getSelectedTabContent()}</div>
			</div>
		</div>
	)
}