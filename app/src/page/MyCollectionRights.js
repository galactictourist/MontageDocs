import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import AuthContext from '../ctx/Auth';
import CollectionProgressBarContext from '../ctx/CollectionProgressBarContext';
import MyCollectionContext from '../ctx/MyCollection';
import { loadCollectionRights, updateCollection } from '../func/collections';
import { RightsDesciption, RightsTypeMap, RightsTypeOptions } from '../util/rightsTypes';
import { RolesMap } from '../util/roles';
import { toastSaved } from '../util/toasts';
import { AppControl } from './parts/AppControl';
import { RIGHTS_AND_IP_STAGE_IDX } from './parts/CollectionProgressBar';
import FormContainer from './parts/FormContainer';
import { SaveButton } from './parts/SaveButton';
import StickyButtonContainer from './parts/StickyButtonContainer';
import TextPhrase from './parts/TextPhrase';
import Loading from './prompts/Loading';

export default function MyCollectionRights() {
	const { setProgressStageState } = useContext(CollectionProgressBarContext)
	const { userId } = useContext(AuthContext)
	const { collectionId } = useParams()
	const { myCollectionRoles } = useContext(MyCollectionContext)
	const navigate = useNavigate()
	const isCurator = () => (myCollectionRoles & RolesMap.curator) > 0

	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [data, setData] = useState({})
	// eslint-disable-next-line
	const isOther = () => data?.rightsType == RightsTypeMap.other

	useEffect(() => {
		if (collectionId) {
			setLoading(true)
			loadCollectionRights(collectionId).then((r) => {
				setData(r)
				setLoading(false)
			})
		}
	}, [collectionId])

	const postDataToStorage = async (collectionId) => {
		if (!isCurator()) return
		setSaving(true)
		const d = { ...data }
		await updateCollection(collectionId, d)
		setSaving(false)
		if (isCurator()) {
			setProgressStageState(RIGHTS_AND_IP_STAGE_IDX, true)
			navigate(`/my-collection-deploy/${collectionId}`)
		} else {
			toastSaved()
		}
	}

	if (!userId || !collectionId) return null
	if (loading) return <Loading />

	const control = ({ name, ...rest }) => <AppControl name={name} value={data[name]} setData={setData} {...rest} />

	return (<>
		<TextPhrase padTop={true}>
			Set the rights & IP your collectors will have.<br />
			It’s totally up to you to choose & enforce whatever you think is right for you and your collection<br />
			and you should consult your lawyer about each option
		</TextPhrase>
		<FormContainer>
			{control({ label: "Rights & IP", name: "rightsType", type: "select", options: RightsTypeOptions })}
			{isOther() && control({ label: "Rights description", name: "rightsText", type: "textarea" })}
			{!isOther() && <div dangerouslySetInnerHTML={{ __html: RightsDesciption[data.rightsType] || '' }}></div>}
		</FormContainer>
		<StickyButtonContainer>
			<SaveButton onClick={() => postDataToStorage(collectionId)} saving={saving} text={isCurator() ? "Update & continue" : "Update"} />
		</StickyButtonContainer>
	</>)
}