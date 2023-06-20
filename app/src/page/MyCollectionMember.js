import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { createMember, createUserCollection } from '../func/collections';
import { RolesMap } from '../util/roles';
import { FindUserByWallet } from './FindUserByWallet';
import MyCollectionUser from './parts/MyCollectionUser';
import Loading from './prompts/Loading';

export default function MyCollectionMember({ setSidebarState, setCrumbLabel }) {
	const { collectionId, memberId } = useParams()
	const [linkedUserId, setLinkedUserId] = useState(0)
	const navigate = useNavigate()

	useEffect(() => {
		if (collectionId && linkedUserId > 0) {
			const linkUser = async () => {
				await Promise.all([createMember(linkedUserId, collectionId), createUserCollection(linkedUserId, collectionId, RolesMap.invited)])
				navigate(`/my-collection-community/${collectionId}`)
			}
			linkUser()
		}
	}, [linkedUserId, collectionId, navigate])

	if (!memberId && linkedUserId === 0) {
		return <FindUserByWallet setFoundUserId={setLinkedUserId} />
	}

	if (linkedUserId > 0) {
		return <Loading />
	}

	return <MyCollectionUser
		userId={memberId}
		setSidebarState={setSidebarState}
		inviteeRole={RolesMap.invited}
		backToUrlBase="/my-collection-community"
		invitePrompt="Use this link to invite collector:"
		onCreateUser={createMember}
		setCrumbLabel={setCrumbLabel}
	/>
}