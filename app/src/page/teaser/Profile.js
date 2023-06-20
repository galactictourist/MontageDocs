import './teaser.scss'
import { useNavigate } from 'react-router-dom'
import { AppControl } from '../parts/AppControl'
import { useEffect, useState } from 'react'
import AuthContext from "../../ctx/Auth"
import { useContext } from "react"
import { loadUserProfile, updateUser } from '../../func/users'
import { UserProfileFields } from '../parts/UserProfileFields'
import { getFileRemovedHandler, unpinRemovedFiles } from '../../util/uploadToIPFS'
import StickyButtonContainer from '../parts/StickyButtonContainer'
import { SaveButton } from '../parts/SaveButton'
import { useNVarcharLimits } from '../../util/useNVarcharLimits'
import Loading from '../prompts/Loading'
import InviteContext from '../../ctx/Invite'

export default function Profile() {
	const { wasInvited, isInviteToCollection } = useContext(InviteContext)
	const { accounts: walletAddress } = useContext(AuthContext)
	const navigate = useNavigate()
	const [data, setData] = useState({ walletAddress })
	const [isDirty, setIsDirty] = useState(false)
	const { userId } = useContext(AuthContext)
	const [saving, setSaving] = useState(false)
	const [removedFiles, setRemovedFiles] = useState({})
	const { nvarcharLimits } = useNVarcharLimits("users")

	useEffect(() => {
		if (Object.keys(data).length > 0)
			setIsDirty(true)
	}, [data])

	useEffect(() => {
		if (userId) {
			loadUserProfile(userId).then(setData)
		}
	}, [userId])

	const nextScreen = async () => {
		if (isDirty) {
			setSaving(true)
			try {
				await updateUser(userId, data)
				unpinRemovedFiles(removedFiles, data)
			} finally {
				setSaving(false)
			}
		}
		navigate(
			isInviteToCollection() ? `/my-collections` :
				'/thank-you')
	}

	if (nvarcharLimits === null) return <Loading />

	const control = ({ name, ...props }) => <AppControl maxLength={nvarcharLimits[name]} name={name} value={data[name]} setData={setData} {...props} />
	const onFileRemoved = (name, ipfsPath) => setRemovedFiles(getFileRemovedHandler(name, ipfsPath))

	return (
		<>
			<div className="teaser">
				{!wasInvited && <div className="teaser-part teaser-pattern pattern-2">YOU</div>}
				<div className="teaser-part teaser-content">
					<UserProfileFields control={control} onFileRemoved={onFileRemoved} />
				</div>
			</div>
			<StickyButtonContainer>
				<SaveButton text={isDirty ? "Save and continue" : "Skip for now"} disabled={saving} saving={saving} onClick={nextScreen} />
			</StickyButtonContainer>
		</>
	)
}