import { useContext, useEffect,/* useMemo, */useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import AuthContext from '../ctx/Auth';
import MyCollectionContext from '../ctx/MyCollection';
import { updateCollection, loadCollectionSettings } from '../func/collections';
import { RolesMap } from '../util/roles';
import { toastSaved } from '../util/toasts';
import { AppControl } from './parts/AppControl';
import FormContainer from './parts/FormContainer';
import { SaveButton } from './parts/SaveButton';
import StickyButtonContainer from './parts/StickyButtonContainer';
import TextPhrase from './parts/TextPhrase';
import Loading from './prompts/Loading';

export default function MyCollectionOptions() {
	const { userId } = useContext(AuthContext)
	const { collectionId } = useParams()
	const { myCollectionRoles } = useContext(MyCollectionContext)
	const navigate = useNavigate()
	const isCurator = () => (myCollectionRoles & RolesMap.curator) > 0

	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [data, setData] = useState({})

	useEffect(() => {
		if (collectionId) {
			setLoading(true)
			loadCollectionSettings(collectionId).then((r) => {
				setData(r)
				setLoading(false)
			})
		}
	}, [collectionId])

	const postDataToStorage = async (collectionId) => {
		setSaving(true)
		try {
			const d = { ...data }
			await updateCollection(collectionId, d)
			setSaving(false)
			if (isCurator()) navigate(`/my-collection-rights/${collectionId}`)
			else toastSaved()
		} catch (e) {
			setSaving(false)
			throw e
		}
	}

	if (!userId) return null
	if (loading) return <Loading />

	const control = ({ name, ...rest }) => <AppControl name={name} value={data[name]} setData={setData} {...rest} />

	return (
		<>
			<TextPhrase padTop={true}>Royalties enforcement</TextPhrase>
			<div className="pt-2 ta-c">
				We recommend you will choose only markets that respect & enfoce creator royalties<br />
				as markets where your collection can be traded on
			</div>
			<FormContainer>
				{control({ name: "tradeOnOpensea", toggleTitle: "Opensea", type: "checkbox" })}
				{/* {control({ name: "tradeOnLooksrare", toggleTitle: "Looksrare", type: "checkbox" })} */}
				{control({ name: "tradeOnX2Y2", toggleTitle: "X2Y2", type: "checkbox" })}
				{/* {control({ name: "tradeOnBlur", toggleTitle: "Blur", type: "checkbox" })} */}
				{control({ name: "tradeOnFoundation", toggleTitle: "Foundation", type: "checkbox" })}
			</FormContainer>
			<StickyButtonContainer>
				<SaveButton onClick={() => postDataToStorage(collectionId)} saving={saving} text={isCurator() ? "Update & continue" : "Update"} />
			</StickyButtonContainer>
		</>
	)
}