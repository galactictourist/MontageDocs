import { useContext, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AuthContext from '../ctx/Auth'
import FormContainer from './parts/FormContainer'
import generateInviteLink from '../util/generateInviteLink'
import { RolesMap } from '../util/roles'
import { AppControl } from './parts/AppControl'
import Loading from './prompts/Loading'
import TextPhrase from './parts/TextPhrase'
import { toast } from 'react-toastify'

export default function AdminInviteCurator({ inviteTester }) {
	const { adminUserId } = useContext(AuthContext)
	const [qs] = useSearchParams()
	const inviteeUserId = qs.get('curatorUserId')
	const [inviteLink, setInviteLink] = useState('')
	const [loading, setLoading] = useState(false)
	useEffect(() => {
		(async () => {
			setLoading(true)
			const args = {
				inviteeRole: RolesMap.curator,
				invitingUserId: adminUserId
			}
			if (inviteeUserId) args.inviteeUserId = inviteeUserId
			const link = await generateInviteLink(args)
			setInviteLink(link)
			setLoading(false)
		})()
		// eslint-disable-next-line
	}, [])

	const copyLinkClick = async () => {
		await navigator.clipboard.writeText(inviteLink)
		toast(`Copied ${inviteLink}`)
	}

	if (loading) return <Loading />

	return (
		<>
			<TextPhrase padTop={true}>Copy and use this link to invite {inviteTester ? "Tester" : "Curator"}{inviteeUserId ? ` to OWN this account (${inviteeUserId})` : ""}</TextPhrase>
			<FormContainer>
				<AppControl placeholder="Invitation link" readOnly={true} value={inviteLink} />
				<div className="ta-c" style={{ paddingTop: '1em' }}>
					<button className="secondary" onClick={copyLinkClick}>Copy link</button>
				</div>
			</FormContainer>
		</>
	)
}