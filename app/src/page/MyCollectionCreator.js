import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { createCreator, createUserCollection } from '../func/collections';
import { RolesMap } from '../util/roles';
import { FindUserByWallet } from './FindUserByWallet';
import MyCollectionUser from './parts/MyCollectionUser';
import Loading from './prompts/Loading';

export default function MyCollectionCreator({ setSidebarState, setCrumbLabel }) {
	const { collectionId, creatorId } = useParams()
	const [linkedUserId, setLinkedUserId] = useState(0)
	const navigate = useNavigate()

	useEffect(() => {
		if (collectionId && linkedUserId > 0) {
			const linkUser = async () => {
				await Promise.all([createCreator(linkedUserId, collectionId), createUserCollection(linkedUserId, collectionId, RolesMap.creator)])
				navigate(`/my-collection-creators/${collectionId}`)
			}
			linkUser()
		}
	}, [linkedUserId, collectionId, navigate])

	if (!creatorId && linkedUserId === 0) {
		return <FindUserByWallet setFoundUserId={setLinkedUserId} />
	}

	if (linkedUserId > 0) {
		return <Loading />
	}

	return <MyCollectionUser
		userId={creatorId}
		setSidebarState={setSidebarState}
		inviteeRole={RolesMap.creator}
		backToUrlBase="/my-collection-creators"
		invitePrompt="Use this link to invite artist:"
		onCreateUser={createCreator}
		setCrumbLabel={setCrumbLabel}
	/>
}