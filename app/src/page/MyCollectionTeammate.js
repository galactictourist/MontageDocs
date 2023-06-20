import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { createTeammate, createUserCollection } from '../func/collections';
import { RolesMap } from '../util/roles';
import { FindUserByWallet } from './FindUserByWallet';
import MyCollectionUser from './parts/MyCollectionUser';
import Loading from './prompts/Loading';

export default function MyCollectionTeammate({ setSidebarState, setCrumbLabel }) {
	const { collectionId, teammateId } = useParams()
	const [linkedUserId, setLinkedUserId] = useState(0)
	const navigate = useNavigate()

	useEffect(() => {
		if (collectionId && linkedUserId > 0) {
			const linkUser = async () => {
				await Promise.all([createTeammate(linkedUserId, collectionId), createUserCollection(linkedUserId, collectionId, RolesMap.partner)])
				navigate(`/my-collection-team/${collectionId}`)
			}
			linkUser()
		}
	}, [linkedUserId, collectionId, navigate])

	if (!teammateId && linkedUserId === 0) {
		return <FindUserByWallet setFoundUserId={setLinkedUserId} />
	}

	if (linkedUserId > 0) {
		return <Loading />
	}

	return <MyCollectionUser
		userId={teammateId}
		setSidebarState={setSidebarState}
		inviteeRole={RolesMap.partner}
		backToUrlBase="/my-collection-team"
		invitePrompt="Use this link to invite teammate:"
		onCreateUser={createTeammate}
		setCrumbLabel={setCrumbLabel}
	/>
}