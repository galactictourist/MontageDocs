import { useContext, useEffect, useState } from 'react';
import StickyButtonContainer from './parts/StickyButtonContainer';
import { SaveButton } from './parts/SaveButton';
import FormContainer from './parts/FormContainer';
import AuthContext from '../ctx/Auth'
import { loadMayAddCollection, updateUser } from '../func/users';
import { AppControl } from './parts/AppControl';
import { toastSaved } from '../util/toasts';
import TextPhrase from './parts/TextPhrase';
import Loading from './prompts/Loading';

export default function MyPermissions() {
	const { userId, mayAddCollection, setMayAddCollection } = useContext(AuthContext)
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (userId) {
			setLoading(true)
			loadMayAddCollection(userId).then(({ mayAddCollection }) => {
				setMayAddCollection(mayAddCollection)
				setLoading(false)
			})
		}
		// eslint-disable-next-line
	}, [userId])

	const postDataToStorage = async () => {
		setSaving(true)
		try {
			await updateUser(userId, { mayAddCollection })
			toastSaved()
		} finally {
			setSaving(false)
		}
	}

	if (!userId) return null
	if (loading) return <Loading />

	return (
		<>
			<TextPhrase padTop={true}>Manage permissions. Access granted.</TextPhrase>
			<FormContainer>
				<AppControl name="mayAddCollection" value={mayAddCollection} setValue={setMayAddCollection} type="checkbox" toggleTitle="May add collection" label="Permission" />
				<StickyButtonContainer>
					<SaveButton onClick={postDataToStorage} saving={saving} />
				</StickyButtonContainer>
			</FormContainer>
		</>
	)
}