import { useContext, useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import AuthContext from '../ctx/Auth';
import FontIcon from '../fontIcon/FontIcon';
import { ItemCt } from './parts/activityTables/helper/ItemCt';
import { SaveButton } from './parts/SaveButton';
import TextPhrase from './parts/TextPhrase';
import Loading from './prompts/Loading';
import '../css/table.scss'
import { getOptimizeImgUrl, ProfileImageSpecs } from '../util/optimizedImages';
import { NumWithChange } from './parts/activityTables/helper/NumWithChange';
import { toast } from 'react-toastify';
import last4 from '../util/last4';
import TxFailedContext from '../ctx/TxFailedContext';
import { getBufferContract } from '../frontend/contractsData/addresses';
import AppPopup from './parts/AppPopup';
import { RequestEmail } from './parts/RequestEmail';
import getNotifed from '../img/get-notified.png';
import getNotifedThanks from '../img/get-notified-thanks.png';
import FormContainer from './parts/FormContainer';
import { sendConfirmationEmail } from '../func/emails';
import { loadUserProfile, updateUser } from '../func/users';
import './my-balance.scss'
import { isDesktopByMatchMedia, isMobileByMatchMedia } from '../util/isDesktopByMatchMedia';
import { DonationPopup } from './DonationPopup';
import '../css/progress.scss';
import { AppControl } from './parts/AppControl';
import { loadCollectionIdByNFTAddress, loadCreatorMintedTokenIds, loadUserLiveCollections } from '../func/liveCollections';
import { getCollectionSalesTotals } from '../func/nfts';
import { signMessage } from '../func/sign';
import { ContractTypes, getContractType } from '../util/contractTypes';
import { loadCollectionPies, saleStagePieIndex } from '../func/collections';

const WITHDRAW_TYPE = {
	earnings: 'earnings',
	artistSaleClaim: 'artistSaleClaim',
	donation: 'donation'
}

export default function MyEarnings() {
	const { setTxFailedData } = useContext(TxFailedContext)
	const { accounts, impersonatedAccounts, userId } = useContext(AuthContext)
	const accountAddress = impersonatedAccounts || accounts
	const [loading, setLoading] = useState(false)
	const [processing, setProcessing] = useState(false)
	const [withdrawType, setWithdrawType] = useState('')
	const [processingDuration, setProcessingDuration] = useState(0)
	const [maxProcessingDuration, setMaxProcessingDuration] = useState(0)
	const [earned, setEarned] = useState(0)
	const [waiting, setWaiting] = useState(0)
	const [waitingForArtistClaim, setWaitingForArtistClaim] = useState(0)
	const [withdrawn, setWithdrawn] = useState(0)
	const [waitingDonation, setWaitingDonation] = useState(0)
	const [withdrawnDonation, setWithdrawnDonation] = useState(0)
	const [groupAddress, setGroupAddress] = useState('')
	const [splitter, setSplitter] = useState(null)
	const [earnings, setEarnings] = useState([])
	const [rowDetailsOpen, setRowDetailsOpen] = useState([])
	const [userCollections, setUserCollections] = useState([])
	const [isManualAddress, setIsManualAddress] = useState(false)
	const [manualGroupAddress, setManualGroupAddress] = useState('')
	const [creatorRoyalties, setCreatorRoyalties] = useState(0)
	const navigate = useNavigate()

	const [donationPopupVisible, setDonationPopupVisible] = useState(false)
	const [donationWallet, setDonationWallet] = useState('')

	const withdrawalDisabled = process.env.REACT_APP_WITHDRAW_DISABLED === '1'

	const [requestEmailOpen, setRequestEmailOpen] = useState(false)
	const [name, setName] = useState(null)
	const [email, setEmail] = useState(null)
	const [emailConfirmed, setEmailConfirmed] = useState(false)
	const [requestedToBeNotified, setRequestedToBeNotified] = useState(false)
	useEffect(() => {
		if (userId && email && !emailConfirmed && requestedToBeNotified) {
			updateUser(userId, { email }).then(() => sendConfirmationEmail(userId, email, name))
		}
	}, [userId, email, name, emailConfirmed, requestedToBeNotified])
	useEffect(() => {
		if (userId) {
			loadUserProfile(userId).then(({ name, email, emailConfirmed }) => {
				setName(name)
				setEmail(email)
				setEmailConfirmed(emailConfirmed)
				if (!email) {
					setRequestEmailOpen(true)
				}
			})
		}
	}, [userId])

	const toggleRowDetails = (idx) => {
		setRowDetailsOpen(arr => {
			const a = [...arr]
			a[idx] = !a[idx]
			return a
		})
	}

	// special call for buffer connected to existing collection
	const viewDonationAmt = async () => {
		const { ethers } = await import('ethers')
		const provider = new ethers.providers.Web3Provider(window.ethereum)
		const ethBalance = await provider.getBalance(groupAddress)
		const nftAbi = [
			'function balanceOf(address owner) view returns (uint256)',
			'function totalSupply() view returns (uint256)',
			'function implementation() view returns (address)',
		]
		const nftAddress = nftAddressOf(groupAddress)
		const testNftAddress = '0x20B700A3017a07b5CdEb1C61c4698313F8a1e6a7'.toLowerCase()
		const testMinterAddress = '0xbc50552a5efa8a0448821ab96164ab03e023044d'.toLowerCase()
		const isTest = nftAddress?.toLowerCase() === testNftAddress
		let nftContract = new ethers.Contract(nftAddress, nftAbi, provider)
		try {
			// try to read as proxy if available
			const implementation = await nftContract.implementation()
			nftContract = new ethers.Contract(implementation, nftAbi, provider)
		} catch (e) {
			console.log('e', e)
		}
		const nftBalance = isTest ? (accountAddress?.toLowerCase() === testMinterAddress ? 1 : 0) : (await nftContract.balanceOf(accountAddress))
		console.log('nftBalance, accountAddress', nftBalance.toString(), accountAddress)
		const nftSupply = isTest ? 1 : (await nftContract.totalSupply())
		console.log('nftSupply', nftSupply.toString())
		const salesTotalClaimed = await splitter.methods.getSalesTotalClaimed().call()
		console.log('salesTotalClaimed', salesTotalClaimed.toString())
		const salesAllHoldersPerc = await splitter.methods.getSalesAllHoldersPerc().call()
		console.log('salesAllHoldersPerc', salesAllHoldersPerc.toString())
		const claimableShare = ethBalance.add(salesTotalClaimed).mul(salesAllHoldersPerc).div(10000)
		console.log('claimableShare', claimableShare.toString())
		const thisHolderShare = claimableShare.mul(nftBalance).div(nftSupply)
		console.log('thisHolderShare', thisHolderShare.toString())
		const thisHolderTotalDonanted = await splitter.methods.viewTotalDonated(accountAddress).call()
		console.log('thisHolderTotalDonanted', thisHolderTotalDonanted.toString())
		const payout = thisHolderShare.gt(thisHolderTotalDonanted) ? thisHolderShare.sub(thisHolderTotalDonanted) : '0'
		console.log('payout', payout.toString())
		return payout
	}

	const loadAmountsAndEarnings = async () => {
		const { utils, BigNumber } = await import('ethers')
		const sumWaiting = splitter ? await splitter.methods.viewEarnings(accountAddress).call() : "0"
		const sumWithdrawn = splitter ? await splitter.methods.viewTotalWithdrawn(accountAddress).call() : '0'
		const sumWaitingDonation = splitter ? await (splitter.methods.viewDonationAmt ? splitter.methods.viewDonationAmt(accountAddress).call() : viewDonationAmt(accountAddress)) : '0'
		const sumWithdrawnDonation = splitter ? await splitter.methods.viewTotalDonated(accountAddress).call() : '0'
		const sumWaitingForArtistClaim = splitter?.methods.artistSaleClaim ? await getClaimableForArtist(splitter) : '0'
		setWaiting(utils.formatEther(sumWaiting))
		setWaitingForArtistClaim(utils.formatEther(sumWaitingForArtistClaim))
		setWithdrawn(utils.formatEther(sumWithdrawn))
		setEarned(utils.formatEther(BigNumber.from(sumWaiting).add(BigNumber.from(sumWithdrawn))))
		setWaitingDonation(utils.formatEther(sumWaitingDonation))
		setWithdrawnDonation(utils.formatEther(sumWithdrawnDonation))

		// TODO load earnings
		setEarnings([])
		// const earnings = await splitter.methods.viewEarningsByGroup(accountAddress).call()
		// setEarnings(earnings)
	}

	useEffect(() => {
		if (processing) {
			setMaxProcessingDuration(12 * 1000)
			setProcessingDuration(1)
		} else {
			setProcessingDuration(0)
			setMaxProcessingDuration(0)
		}
	}, [processing])
	useEffect(() => {
		if (processing && processingDuration > 0) {
			(async () => {
				await new Promise(resolve => setTimeout(resolve, 33))
				setProcessingDuration(processingDuration => processingDuration + 33)
			})()
		}
	}, [processing, processingDuration])
	useEffect(() => {
		if (processing && processingDuration >= maxProcessingDuration && maxProcessingDuration > 0) {
			setMaxProcessingDuration(maxProcessingDuration => Math.round(maxProcessingDuration * 1.5))
		}
	}, [processing, processingDuration, maxProcessingDuration])

	const getClaimable = async (nftAddress, tokenIDs, onlySales) => {
		const { utils } = await import('ethers')
		const { totalSalesFromMints, totalSecondarySales } = await getCollectionSalesTotals(nftAddress, tokenIDs)
		const claimable = utils.parseEther(totalSalesFromMints);
		if (parseFloat(creatorRoyalties) > 0) {
			const secSales = utils.parseEther(totalSecondarySales).mul(creatorRoyalties).div(100);
			return onlySales ? secSales : claimable.add(secSales)
		}
		return onlySales ? 0 : claimable
	}
	const getClaimableForArtist = async (splitter) => {
		if (!splitter) {
			return 0
		}
		const nftAddress = await splitter.methods.getNftAddress().call()
		const { collectionId } = await loadCollectionIdByNFTAddress(nftAddress)
		const tokenIDs = await loadCreatorMintedTokenIds(collectionId, userId)
		console.log('creatorRoaytlies', creatorRoyalties)
		const claimable = await getClaimable(nftAddress, tokenIDs, true)
		return claimable
	}

	const withdrawFunds = async (splitter, aWithdrawType) => {
		if (!splitter) {
			toast("Please select a splitter address to withdraw from", { type: 'error' })
			return
		}
		if (withdrawalDisabled) {
			toast("Your earnings are getting an upgrade! Hang on tight and we’ll be right back")
			return
		}
		if (impersonatedAccounts) {
			toast(<span>You're signed in as admin. To withdraw funds please sign in with <b>{last4(impersonatedAccounts)}</b></span>, { type: 'error' })
			return
		}
		if (aWithdrawType === WITHDRAW_TYPE.donation && !donationWallet) {
			setDonationPopupVisible(true)
			return
		}

		setProcessing(true)
		setWithdrawType(aWithdrawType)
		try {
			switch (aWithdrawType) {
				case WITHDRAW_TYPE.earnings:
					const withdrawEarnings = async () => {
						await splitter.methods.withdraw().send({ from: accountAddress })
					}
					await withdrawEarnings()
					break
				case WITHDRAW_TYPE.donation:
					const makeDonation = async () => {
						const args = [donationWallet]
						const contractType = contractTypeOf(groupAddress)
						if (contractType & ContractTypes.existing) {
							const holderPayout = await viewDonationAmt()
							console.log('holderPayout', holderPayout.toString())
							args.push(holderPayout)
							const nftAddress = nftAddressOf(groupAddress)
							console.log('creatorRoaytlies', creatorRoyalties)
							const claimable = await getClaimable(nftAddress)
							console.log('claimable', claimable.toString())
							const hash = await splitter.methods.hashPayoutMessage(claimable, accountAddress).call()
							const signature = await signMessage(hash)
							args.push(signature)
						}
						await splitter.methods.holderDonate(...args).send({ from: accountAddress })
					}
					await makeDonation()
					break
				case WITHDRAW_TYPE.artistSaleClaim:
					const artistSaleClaim = async () => {
						const claimable = await getClaimableForArtist(splitter)
						console.log('claimable for artist', claimable.toString())
						const hash = await splitter.methods.hashPayoutMessage(claimable, accountAddress).call() // returns bytes32
						const signature = await signMessage(hash) // signature is bytes
						await splitter.methods.artistSaleClaim(claimable, accountAddress, signature).send({ from: accountAddress })
					}
					await artistSaleClaim()
					break
				default:
					break
			}
			await loadAmountsAndEarnings()
			new Audio('/wav/cha-ching-money.mp3').play()
		} catch (e) {
			setTxFailedData('Withdrawal could not be completed')
			throw e
		} finally {
			setProcessing(false)
			setWithdrawType('')
		}
	}

	const loadLiveCollections = async (userId, groupAddress) => {
		const collections = await loadUserLiveCollections(userId, groupAddress)
		setUserCollections([
			{ value: '', text: 'Choose...' },
			...collections.map(({ groupAddress: value, name: text, ...collectionSettings }) => {
				return ({
					value,
					text,
					contractType: getContractType(collectionSettings),
					nftAddress: collectionSettings.nftAddress,
					collectionId: collectionSettings.collectionId,
					manyArtists: collectionSettings.manyArtists
				})
			})
		])
		return collections
	}

	useEffect(() => {
		if (userId) {
			loadLiveCollections(userId)
		}
	}, [userId])

	const collectionPropOf = (groupAddress, propName) => {
		const ix = userCollections.findIndex(({ value }) => value === groupAddress)
		const prop = ix > -1 ? userCollections[ix][propName] : null
		return prop
	}
	const collectionIdOf = (groupAddress) => collectionPropOf(groupAddress, 'collectionId')
	const manyArtistsOf = (groupAddress) => collectionPropOf(groupAddress, 'manyArtists')
	const contractTypeOf = (groupAddress) => collectionPropOf(groupAddress, 'contractType')
	const nftAddressOf = (groupAddress) => collectionPropOf(groupAddress, 'nftAddress')

	useEffect(() => {
		if (manualGroupAddress) {
			loadLiveCollections(0, manualGroupAddress).then(collections => {
				if (collections?.length > 0) {
					setIsManualAddress(false)
				}
			})
		}
	}, [manualGroupAddress])

	useEffect(() => {
		if (groupAddress) {
			const collectionId = collectionIdOf(groupAddress)
			// eslint-disable-next-line
			if (collectionId == process.env.REACT_APP_ARTIS_COLLECTION_ID) {
				setSplitter(null)
				setCreatorRoyalties(0)
				navigate('/my-balance')
				return
			}
			const contractType = contractTypeOf(groupAddress);
			(async (groupAddress) => {
				try {
					const splitter = await getBufferContract(groupAddress, contractType)
					setSplitter(splitter)
				} catch (e) {
					setSplitter(null)
					toast('Buffer contract could not be loaded', { type: 'error' })
					console.error(e)
				}
			})(groupAddress);
			(async (groupAddress, collectionId) => {
				if (collectionId) {
					const pies = await loadCollectionPies(collectionId, manyArtistsOf(groupAddress))
					setCreatorRoyalties(pies[saleStagePieIndex].creatorRoyalties)
				}
			})(groupAddress, collectionId);
		} else {
			setSplitter(null)
			setCreatorRoyalties(0)
		}
		// eslint-disable-next-line
	}, [groupAddress, isManualAddress])

	useEffect(() => {
		if (accountAddress) {
			setLoading(true)
			loadAmountsAndEarnings().finally(() => setLoading(false))
		}
		// eslint-disable-next-line
	}, [accountAddress, splitter])

	useEffect(() => {
		if (donationWallet) {
			withdrawFunds(splitter, WITHDRAW_TYPE.donation)
		}
		// eslint-disable-next-line
	}, [donationWallet])

	if (loading) return <Loading />

	const toActionIcon = (actionType) => {
		switch (actionType) {
			case 'mint': return 'mint'
			case 'sale': return 'cart'
			default: return null
		}
	}
	const parseEth = (wei, maxDecimals = 8) => Number((parseFloat(wei) / 1e18).toFixed(maxDecimals))
	const getDateStr = (dt) => new Date(dt).toLocaleDateString()
	const getTimeStr = (dt) => new Date(dt).toLocaleTimeString()
	const withdrawBtnWidth = 220

	if (process.env.REACT_APP_EARNINGS_DISABLED === '1') return <TextPhrase style={{ lineHeight: 2, minHeight: '50vh' }} padTop5={true}>Your earnings are getting an upgrade!<br />Hang on tight and we’ll be right back</TextPhrase>
	return (
		<div>
			<FormContainer>
				{isManualAddress ?
					<AppControl name="manualGroupAddress" label="Royalties splitter contract address" value={manualGroupAddress} setValue={setManualGroupAddress} />
					:
					<>
						<AppControl name="groupAddress" label="Pick collection" value={groupAddress} setValue={setGroupAddress} options={userCollections} type="select" />
						<button onClick={() => setIsManualAddress(true)} className="secondary">Or enter royalties splitter contract address</button>
					</>
				}
			</FormContainer>
			<div className="my-balance-page">
				<TextPhrase fw400={true} padTop={true}>
					See how much you earned from sales & royalties and withdraw your funds
					<div className="flex-row column-on-mobile ai-c jc-c" style={{ columnGap: 8 }}>
						<span>Royalties might take a few minutes to update</span>
						<FontIcon name="refresh" asFabButton={true} moreFabCls="i-f" onClick={loadAmountsAndEarnings} tip="Refresh" disabled={processing || !splitter} />
					</div>
				</TextPhrase>
				<div className="mx-auto pt-2 amounts-view">
					<AmountWithTitle amt={earned} title="Earned" />
					<AmountWithTitle amt={waiting} title="Waiting" />
					<AmountWithTitle amt={withdrawn} title="Withdrawn" />
				</div>
				{processingDuration > 0 && (withdrawType === WITHDRAW_TYPE.earnings || withdrawType === WITHDRAW_TYPE.artistSaleClaim) ?
					<div className="ta-c pt-2">
						<progress min={0} max={maxProcessingDuration} value={processingDuration} style={{ width: '100%', maxWidth: withdrawBtnWidth }}></progress>
					</div>
					: null
				}
				<div className="ta-c pt-2">
					<SaveButton onClick={async () => await withdrawFunds(splitter, WITHDRAW_TYPE.earnings)} text="Withdraw" saving={processing && withdrawType === WITHDRAW_TYPE.earnings} disabled={!splitter || !(waiting > 0) || processing} style={{ width: withdrawBtnWidth }} />
				</div>

				{splitter?.methods.artistSaleClaim ? <div className="ta-c pt-2">
					<TextPhrase fw400={true}>Withdrawal for artists (secondary sales only)</TextPhrase>
					<div className="mx-auto pt-2 amounts-view x1">
						<AmountWithTitle amt={waitingForArtistClaim} title="Waiting" />
					</div>
					<SaveButton onClick={async () => await withdrawFunds(splitter, WITHDRAW_TYPE.artistSaleClaim)} text="Withdraw" saving={processing && withdrawType === WITHDRAW_TYPE.artistSaleClaim} disabled={!splitter || !(waitingForArtistClaim > 0) || processing} style={{ width: withdrawBtnWidth }} />
				</div> : null}
			</div>

			<div className="my-balance-page">
				<TextPhrase fw400={true} padTop={true}>
					See how much holders’ donation you accumulated
					<div className="flex-row column-on-mobile ai-c jc-c" style={{ columnGap: 8 }}>
						<span>It might take a few minutes to update and you need to hold the NFT at the time of donation</span>
						<FontIcon name="refresh" asFabButton={true} moreFabCls="i-f" onClick={loadAmountsAndEarnings} tip="Refresh" disabled={processing || !splitter} />
					</div>
				</TextPhrase>
				<div className="mx-auto pt-2 amounts-view x2">
					<AmountWithTitle amt={waitingDonation} title="Waiting" />
					<AmountWithTitle amt={withdrawnDonation} title="Donated" />
				</div>
				{processingDuration > 0 && withdrawType === WITHDRAW_TYPE.donation ?
					<div className="ta-c pt-2">
						<progress min={0} max={maxProcessingDuration} value={processingDuration} style={{ width: '100%', maxWidth: withdrawBtnWidth }}></progress>
					</div>
					: null
				}
				<div className="ta-c pt-2">
					<SaveButton className="primary donation" onClick={async () => await withdrawFunds(splitter, WITHDRAW_TYPE.donation)} text="Donate funds" saving={processing && withdrawType === WITHDRAW_TYPE.donation} disabled={!splitter || !(waitingDonation > 0) || processing} style={{ width: withdrawBtnWidth }} />
				</div>
				<div className="pt-2" style={{ borderBottom: '1px solid #E2E9E6' }}></div>
			</div>

			{/* <div className="ta-c pt-2 main-text" style={{ fontSize: 32 }}>No earnings yet</div> */}
			{earnings.length > 0 ?
				isMobileByMatchMedia() ?
					<div className="ta-c pt-2 main-text" style={{ fontSize: 32 }}>Please use a desktop browser to view your earnings</div>
					:
					<div className="table-row header-row pt-2 c7-2fr-24">
						<span>Item/Collection</span>
						<span>Date</span>
						<span>Time</span>
						<span>Price</span>
						<span>Your share</span>
						<span>Status</span>
						<span></span>
					</div>
				: null
			}
			{isDesktopByMatchMedia() ?
				earnings.map((row, idx) => {
					return (
						<div key={idx} className={"table-row c7-2fr-24" + (rowDetailsOpen[idx] ? ' row-details-open' : '')} onClick={() => toggleRowDetails(idx)}>
							<span>
								<FontIcon name={toActionIcon(row.actionType)} inline={true} nonClickable={true} />
								<ItemCt image={getOptimizeImgUrl(row.file, ProfileImageSpecs, row.mimeType, row.keepAspectRatio, row.originalCID)} mimeType={row.mimeType} keepAspectRatio={row.keepAspectRatio} itemName={`#${row.tokenId}`} collectionName={row.collectionName} />
							</span>
							<span>{getDateStr(row.receivedAt)}</span>
							<span>{getTimeStr(row.receivedAt)}</span>
							<span className="contains-row-details">
								<NumWithChange icon="eth" num={parseEth(row.price)} />
								<span className="row-details" style={{ textAlign: 'end', whiteSpace: 'normal' }}>
									<span>As teammate</span>
									<span>As artist</span>
									<span>As all artists</span>
									<span>As holder donation</span>
								</span>
							</span>
							<span className="contains-row-details">
								<NumWithChange icon="eth" num={parseEth(row.totalShare)} />
								<span className="row-details">
									<NumWithChange icon="eth" num={parseEth(row.shareAsTeammate)} />
									<NumWithChange icon="eth" num={parseEth(row.shareAsArtist)} />
									<NumWithChange icon="eth" num={parseEth(row.shareAsAllArtists)} />
									<NumWithChange icon="eth" num={parseEth(row.shareAsHolder)} />
								</span>
							</span>
							<span className={row.withdrawn ? "good" : "waiting"} style={{ textTransform: 'uppercase' }}>{row.withdrawn ? 'withdrawn' : 'waiting'}</span>
							<span><FontIcon name="down-arrow" inline={true} nonClickable={true} style={{ marginLeft: 'auto' }} moreCls="toggle-row-details-arrow" /></span>
						</div>
					)
				})
				: null
			}
			<AppPopup visible={requestEmailOpen} setVisible={() => setRequestEmailOpen(false)} insideCls="notice-popup-content">
				<div className="notice-popup-content">
					<FontIcon name="cancel-circle-full" onClick={() => setRequestEmailOpen(false)} moreCls="close-popup-x" />
					<TextPhrase isTitle={true}>{requestedToBeNotified ? "Thanks!" : "Get notified!"}</TextPhrase>
					<div className="ta-c pt-2">
						<img src={requestedToBeNotified ? getNotifedThanks : getNotifed} alt="" className="notice-img" />
					</div>
					<RequestEmail setEmail={setEmail} doRender={!email} setRequestedToBeNotified={setRequestedToBeNotified} />
					<FormContainer doRender={email && requestedToBeNotified}>
						<TextPhrase fieldText={true}>Thanks, confirm your email and we’ll keep you in the loop about your holder earnings and royalties</TextPhrase>
					</FormContainer>
					<FormContainer doRender={requestedToBeNotified}>
						<button className="primary" onClick={() => setRequestEmailOpen(false)}>Close</button>
					</FormContainer>
				</div>
			</AppPopup>

			<DonationPopup visible={donationPopupVisible} setVisible={setDonationPopupVisible} donationWallet={donationWallet} setDonationWallet={setDonationWallet} />
		</div>
	)
}

function AmountWithTitle({ amt, title }) {
	return (
		<div className="ta-c">
			<div style={{ fontSize: 32, lineHeight: 1 }} title={amt}>{parseFloat(amt).toFixed(6)}<FontIcon name="eth" inline={true} style={{ fontSize: 18 }} /></div>
			<div style={{ fontSize: 18, lineHeight: '48px', textTransform: 'uppercase' }}>{title}</div>
		</div>
	)
}