import { useContext, useEffect, useState } from 'react';
import Loading from './prompts/Loading';
import StickyButtonContainer from './parts/StickyButtonContainer';
import { AppControl } from './parts/AppControl';
import { SaveButton } from './parts/SaveButton';
import AuthContext from '../ctx/Auth'
import { loadUserProfile, updateUser } from '../func/users';
import { getFileRemovedHandler, unpinRemovedFiles } from "../util/uploadToIPFS";
import { UserProfileFields } from './parts/UserProfileFields';
import { toastSaved } from '../util/toasts';
import TextPhrase from './parts/TextPhrase';
import { useNVarcharLimits } from '../util/useNVarcharLimits';

export default function MyProfile() {
	const { userId } = useContext(AuthContext)
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [data, setData] = useState({})
	const [removedFiles, setRemovedFiles] = useState({})
	const { nvarcharLimits } = useNVarcharLimits("users")

	useEffect(() => {
		(async (userId) => {
			setLoading(true)
			const data = (await loadUserProfile(userId)) || {}
			setData(data)
			setLoading(false)
		})(userId)
		// eslint-disable-next-line
	}, [userId])

	const postDataToStorage = async () => {
		setSaving(true)
		const d = { ...data }
		try {
			await updateUser(userId, d)
			unpinRemovedFiles(removedFiles, d)
			setRemovedFiles({})
			toastSaved()
		} finally {
			setSaving(false)
		}
	}

	const onFileRemoved = (name, ipfsPath) => setRemovedFiles(getFileRemovedHandler(name, ipfsPath))

	if (!userId) return null
	if (loading || nvarcharLimits === null) return <Loading />

	const control = ({ name, ...props }) => <AppControl maxLength={nvarcharLimits[name]} name={name} value={data[name]} setData={setData} {...props} />

	return (
		<>
			<TextPhrase padTop={true}>View or update your profile</TextPhrase>
			<UserProfileFields control={control} onFileRemoved={onFileRemoved} />

			<StickyButtonContainer>
				<SaveButton onClick={postDataToStorage} saving={saving} />
			</StickyButtonContainer>
		</>
	)
}
