import { useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { decrypt } from '../../func/crypto';
import { RolesMap } from '../../util/roles';


export function useInviteKey() {
	const [qs] = useSearchParams()
	const qsKey = qs.get('key')
	const [inviteArgs, setInviteArgs] = useState(null)
	const isInvite = useCallback(() => inviteArgs !== null, [inviteArgs])
	const isInviteCurator = useCallback(() => inviteArgs !== null && inviteArgs.invitingUserId && inviteArgs.inviteeRole === RolesMap.curator && !inviteArgs.inviteeUserId, [inviteArgs])
	const isInviteSpecificUser = useCallback(() => inviteArgs !== null && inviteArgs.invitingUserId && !!inviteArgs.inviteeRole && inviteArgs.inviteeUserId, [inviteArgs])
	const isInviteToCollection = useCallback(() => inviteArgs !== null && inviteArgs.collectionId && inviteArgs.inviteeRole, [inviteArgs])
	const keepKey = useMemo(() => qsKey ? '?key=' + qsKey : '', [qsKey])
	useEffect(() => {
		decrypt(qsKey).then(s => s && setInviteArgs(JSON.parse(s)))
	}, [qsKey]);
	return { qsKey, inviteArgs, isInvite, isInviteCurator, isInviteSpecificUser, isInviteToCollection, keepKey }
}
