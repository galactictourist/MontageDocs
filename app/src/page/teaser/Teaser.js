import { toast } from 'react-toastify'
import '../parts/connect-wallet.scss'
import './teaser.scss'
import metamask from '../../img/metamask.png'
// import coinbaseWallet from '../../img/coinbase-wallet.png'
// import walletConnect from '../../img/wallet-connect.png'
import { useNavigate } from 'react-router-dom'
import FollowUs from './FollowUs'
import { useContext, useEffect, useState } from 'react'
import Spinner from '../../util/Spinner'
import { getOrCreateUserId, loadUserProfile, updateUser } from '../../func/users'
import { createCreator, createMember, createTeammate, createUserCollection, loadMyCollections } from '../../func/collections'
import { RolesMap } from '../../util/roles'
import CardsFluidGrid from '../parts/CardsFluidGrid'
import CollectionContext from '../../ctx/Collection'
import Loading from '../prompts/Loading'
import { METAMASK } from '../../web3/adapters'
import AuthContext from '../../ctx/Auth'
import InviteContext from '../../ctx/Invite'
import { TermsPhrase } from '../parts/TermsPhrase'
import { HookMeUp } from '../parts/HookMeUp'
import { isMobileByMatchMedia } from '../../util/isDesktopByMatchMedia'

export default function Teaser({ login, setUserId, setIsAdmin }) {
	const { setWasInvited, qsKey, inviteArgs, isInvite, isInviteCurator, isInviteSpecificUser, isInviteToCollection, keepKey } = useContext(InviteContext)
	const { setMayAddCollection } = useContext(AuthContext)
	const navigate = useNavigate()
	const [connecting, setConnecting] = useState(false)
	const [invitingUserName, setInvitingUserName] = useState('')
	const [singleCollectionInArray, setSingleCollectionInArray] = useState([])
	const { setCollectionName } = useContext(CollectionContext)

	useEffect(() => {
		if (isInviteToCollection()) {
			loadMyCollections(0, 0, 0, 0, inviteArgs.collectionId).then(r => {
				if (r.length > 0) {
					setSingleCollectionInArray(r)
					setCollectionName(r[0].name)
				}
			})
		} else if (isInviteCurator()) {
			loadUserProfile(inviteArgs.invitingUserId).then(r => setInvitingUserName(r.name))
			setCollectionName('as a curator')
		}
		// eslint-disable-next-line
	}, [inviteArgs])

	const handleConnectWallet = async () => {
		if (!window.ethereum && isMobileByMatchMedia()) {
			const l = window.location
			l.href = 'https://metamask.app.link/dapp/' + l.host + l.pathname + l.search
			return
		}
		setConnecting(true)
		const walletAddress = await login()
		const createNewUserIfNotExists = !isInviteSpecificUser()
		const mayAddCollectionWhenCreating = isInviteCurator()
		let { userId, isAdmin, isNewUser, mayAddCollection, wasInvited, authToken } = await getOrCreateUserId(walletAddress, createNewUserIfNotExists, mayAddCollectionWhenCreating, isInvite())
		if (authToken && walletAddress) {
			window.authToken = authToken
			if (isInviteSpecificUser()) {
				if (!userId) {
					userId = inviteArgs.inviteeUserId
					wasInvited = true
					mayAddCollection = true
					await updateUser(userId, { walletAddress, wasInvited })
					// eslint-disable-next-line
				} else if (inviteArgs.inviteeUserId != userId) {
					toast('Another user record already exists with the same wallet address... Please try another address')
					setConnecting(false)
					return
				}
			}
			if (isInviteToCollection() && !inviteArgs.inviteeUserId) {
				const promises = [createUserCollection(userId, inviteArgs.collectionId, inviteArgs.inviteeRole)]
				switch (inviteArgs.inviteeRole) {
					case RolesMap.partner:
						promises.push(createTeammate(userId, inviteArgs.collectionId))
						break
					case RolesMap.creator:
						promises.push(createCreator(userId, inviteArgs.collectionId))
						break
					case RolesMap.invited:
						promises.push(createMember(userId, inviteArgs.collectionId))
						break
					default:
						break
				}
				await Promise.all(promises)
			}
		}
		setConnecting(false)
		if (userId) {
			window.__insp?.push(['identify', userId.toString()])
			const tags = { walletAddress }
			if (isAdmin) tags.isAdmin = true
			window.__insp?.push(['tagSession', tags])

			if (mayAddCollection) setMayAddCollection(mayAddCollection)
			if (wasInvited) setWasInvited(wasInvited)
			if (isAdmin) setIsAdmin(true)
			setUserId(userId)
			navigate(
				isAdmin ? '/admin' :
					isNewUser ? '/profile' :
						isInviteToCollection() || isInviteSpecificUser() ? `/my-collections` :
							'/thank-you'
			)
		}
	}

	const youAreInvitedToCollection = () => {
		return <div className="teaser-part teaser-content">
			<div className="you-are-invited-to ta-c">You're invited to</div>
			<CardsFluidGrid list={singleCollectionInArray}
				moreGridCls="single-card"
				moreFooter={(_itemId, item) => item.tagline ? <div className="card-footer-sub-line">{item.tagline}</div> : null}
				gridStyle={{ padding: '1em 0' }}
			/>
		</div>
	}

	const teaserCallForAction = () => {
		if (isInviteToCollection()) {
			// eslint-disable-next-line
			if (inviteArgs.inviteeRole == RolesMap.partner) return "To join the team"
			// eslint-disable-next-line
			if (inviteArgs.inviteeRole == RolesMap.creator) return "To join as a creator"
			// eslint-disable-next-line
			if (inviteArgs.inviteeRole == RolesMap.invited) return "To join the allowlist"
		}
		return "Experience the journey with us"
	}

	if (qsKey && inviteArgs === null) return <Loading />
	return (
		<div className="teaser">
			{isInviteCurator() ? null : isInviteToCollection() ? youAreInvitedToCollection() : <div className="teaser-part teaser-pattern pattern-1">STILL<br />EVOLVING...</div>}
			<div className="teaser-part teaser-content" style={{ justifyContent: isInviteCurator() ? 'start' : 'center' }}>
				{isInviteCurator() ?
					<div style={{ fontSize: 24, rowGap: 24, lineHeight: 2 }} className="ta-c flex-column pt-2">
						<div>
							Welcome to <span className="fw-700">Montage</span> your smart contract platform for evolving collections<br />
							You’re invited by <span className="fw-700">{invitingUserName}</span> to test our product
						</div>
						<div className="fw-500" style={{ fontSize: 16 }}>
							Thanks for helping us out, please keep what you see confidential until we publically launch<br />and to give us your honest opinion and feedback
						</div>
						<div>
							Please connect your wallet to start
						</div>
					</div>
					:
					<div className="connect-wallet--call-for-action">
						{teaserCallForAction()}<br />
						Connect your wallet
					</div>
				}
				<div className="connect-wallet-buttons">
					<button className="connect-wallet-button" disabled={connecting} onClick={async () => await handleConnectWallet("getMetamaskAdapter", METAMASK)}><img src={metamask} alt="MetaMask" /> MetaMask {connecting && <Spinner />}</button>
					{/* <button className="connect-wallet-button" disabled={connecting} onClick={async () => await handleConnectWallet("getCoinbaseAdapter", COINBASE)}><img src={coinbaseWallet} alt="Coinbase wallet" /> Coinbase wallet {connecting && adapterType === COINBASE && <Spinner />}</button> */}
					{/* <button className="connect-wallet-button" disabled={connecting} onClick={async () => await handleConnectWallet("getWalletConnectV1Adapter", WALLET_CONNECT_V1)}><img src={walletConnect} alt="WalletConnect" /> WalletConnect {connecting && adapterType === WALLET_CONNECT_V1 && <Spinner />}</button> */}
				</div>
				{isInviteCurator() ? null : (<>
					<HookMeUp />
					<FollowUs label="Follow us" />
				</>)}
				<TermsPhrase keepKey={keepKey} />
			</div>
		</div>
	)
}