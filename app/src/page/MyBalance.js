import { useContext, useEffect, useState } from 'react';
import AuthContext from '../ctx/Auth';
import FontIcon from '../fontIcon/FontIcon';
import { getEarnings, getUserSplitterAddresses } from '../func/liveCollections';
import { withdrawWaitingFunds } from '../func/tx';
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
import { WithdrawProgressPopup } from './WithdrawProgressPopup';
import { DonationPopup } from './DonationPopup';
import { DonationProgressPopup } from './DonationProgressPopup';
import { addValidPayee } from '../func/sign';
import '../css/progress.scss';

export default function MyBalance() {
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
	const [withdrawn, setWithdrawn] = useState(0)
	const [waitingDonation, setWaitingDonation] = useState(0)
	const [withdrawnDonation, setWithdrawnDonation] = useState(0)
	const [splitters, setSplitters] = useState([])
	const [earnings, setEarnings] = useState([])
	const [rowDetailsOpen, setRowDetailsOpen] = useState([])

	const [donationProgressPopupVisible, setDonationProgressPopupVisible] = useState(false)

	const [donationPopupVisible, setDonationPopupVisible] = useState(false)
	const [donationWallet, setDonationWallet] = useState('')

	const [withdrawProgressPopupVisible, setWithdrawProgressPopupVisible] = useState(false)
	const [amountRequestedToWithdraw, setAmountRequestedToWithdraw] = useState('0')

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

	const loadSplittersAndEarnings = async () => {
		setLoading(true)
		Promise.all([
			getUserSplitterAddresses(accountAddress).then(setSplitters),
			getEarnings(accountAddress).then(setEarnings)
		]).finally(() => setLoading(false))
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

	const withdrawFunds = async (splitters, onlyHolders = false) => {
		if (withdrawalDisabled) {
			toast("Your earnings are getting an upgrade! Hang on tight and we’ll be right back")
			return
		}
		if (impersonatedAccounts) {
			toast(<span>You're signed in as admin. To withdraw funds please sign in with <b>{last4(impersonatedAccounts)}</b></span>, { type: 'error' })
			return
		}
		const hasFunds = splitters?.length > 0
		if (!hasFunds) {
			toast("You don't have any funds to withdraw", { type: 'error' })
			return
		}
		if (withdrawRequestedOnSplitter && !onlyHolders) {
			toast("You've already requested a withdrawal", { type: 'error' })
			return
		}
		if (withdrawHolderShareRequestedOnSplitter && onlyHolders) {
			setDonationProgressPopupVisible(true)
			return
		}
		if (onlyHolders && !donationWallet) {
			setDonationPopupVisible(true)
			return
		}

		const isAdminOnly = process.env.REACT_APP_WITHDRAW_MODE === 'adminOnly'

		setProcessing(true)
		setWithdrawType(onlyHolders ? 'donation' : 'funds')
		const { BigNumber } = await import('ethers')
		try {
			const doWithdraw = async ({ groupAddress, shareAmount, holderShareAmount, withdrawRequested, withdrawHolderShareRequested }) => {
				if (isAdminOnly) {
					const isRequested = onlyHolders ? withdrawHolderShareRequested : withdrawRequested
					if (isRequested) {
						throw new Error("You've already requested a withdrawal")
					}
				}

				const withdrawAmount = (onlyHolders ? holderShareAmount : shareAmount) || '0'
				if (isAdminOnly) {
					await withdrawWaitingFunds(groupAddress, accountAddress, onlyHolders, true, donationWallet)
					new Audio('/wav/cha-ching-money.mp3').play()
				} else { // selfService
					if (groupAddress !== process.env.REACT_APP_ARTIS_BUFFER_ADDR) {
						throw new Error("This splitter address is not yet supported for withdrawing funds: " + groupAddress)
					}
					const success = await addValidPayee(accountAddress, withdrawAmount, onlyHolders ? donationWallet : accountAddress)
					if (!success) {
						throw new Error("Failed to add payee")
					}
					const splitter = await getBufferContract(groupAddress)
					await splitter.methods.withdraw(withdrawAmount).send({ from: accountAddress })
					await withdrawWaitingFunds(groupAddress, accountAddress, onlyHolders, false, donationWallet)
					new Audio('/wav/cha-ching-money.mp3').play()
				}
				return withdrawAmount
			}

			let totalWithdrawAmount = BigNumber.from(0)
			for (let i = 0; i < splitters.length; i++) {
				const withdrawAmount = await doWithdraw(splitters[i])
				console.log('MyBalance: withdrawAmount', withdrawAmount)
				totalWithdrawAmount = totalWithdrawAmount.add(BigNumber.from(withdrawAmount))
			}
			if (isAdminOnly) {
				const { utils } = await import('ethers')
				console.log('MyBalance: totalWithdrawAmount', totalWithdrawAmount, utils.formatEther(totalWithdrawAmount))
				setAmountRequestedToWithdraw(utils.formatEther(totalWithdrawAmount))
				setWithdrawProgressPopupVisible(true)
			} else {
				await loadSplittersAndEarnings()
			}
		} catch (e) {
			setTxFailedData('Withdrawal could not be completed')
			throw e
		} finally {
			setProcessing(false)
			setWithdrawType('')
		}
	}

	useEffect(() => {
		if (accountAddress) {
			loadSplittersAndEarnings()
		}
		// eslint-disable-next-line
	}, [accountAddress])

	useEffect(() => {
		const setAmounts = async () => {
			const { BigNumber, utils } = await import('ethers')
			let sumWaiting = BigNumber.from(0)
			let sumWithdrawn = BigNumber.from(0)
			let sumWaitingDonation = BigNumber.from(0)
			let sumWithdrawnDonation = BigNumber.from(0)
			splitters?.forEach(({ shareAmount, withdrawn, holderShareAmount, withdrawnHolderShareAmount }) => {
				sumWaiting = sumWaiting.add(shareAmount)
				sumWithdrawn = sumWithdrawn.add(withdrawn)
				sumWaitingDonation = sumWaitingDonation.add(holderShareAmount || 0)
				sumWithdrawnDonation = sumWithdrawnDonation.add(withdrawnHolderShareAmount || 0)
			})
			setWaiting(utils.formatEther(sumWaiting))
			setWithdrawn(utils.formatEther(sumWithdrawn))
			setEarned(utils.formatEther(sumWaiting.add(sumWithdrawn)))
			setWaitingDonation(utils.formatEther(sumWaitingDonation))
			setWithdrawnDonation(utils.formatEther(sumWithdrawnDonation))
		}
		setAmounts()
	}, [splitters, earnings])

	useEffect(() => {
		if (donationWallet) {
			withdrawFunds(splitters, true)
		}
		// eslint-disable-next-line
	}, [donationWallet])

	if (loading) return <Loading />

	const withdrawRequestedOnSplitter = splitters?.length > 0 ? splitters[0].withdrawRequested : false
	const withdrawHolderShareRequestedOnSplitter = splitters?.length > 0 ? splitters[0].withdrawHolderShareRequested : false

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
			{/* <button onClick={() => {
				setProcessing(true)
				setWithdrawType('donation')
			}}>start</button> */}
			{/* <button onClick={() => addValidPayee(accountAddress, 1e16, accountAddress)}>addValidPayee</button>
			<button onClick={async () => {
				const splitter = await getBufferContract(process.env.REACT_APP_ARTIS_BUFFER_ADDR)
				await splitter.methods.withdraw(1e16.toString()).send({ from: accountAddress })
			}}>withdraw</button> */}

			<div className="my-balance-page">
				<TextPhrase fw400={true} padTop={true}>
					See how much you earned from sales & royalties and withdraw your funds
					<div className="flex-row column-on-mobile ai-c jc-c" style={{ columnGap: 8 }}>
						<span>Royalties might take a few minutes to update</span>
						<FontIcon name="refresh" asFabButton={true} moreFabCls="i-f" onClick={loadSplittersAndEarnings} tip="Refresh" />
					</div>
				</TextPhrase>
				<div className="mx-auto pt-2 amounts-view">
					<AmountWithTitle amt={earned} title="Earned" />
					<AmountWithTitle amt={waiting} title="Waiting" />
					<AmountWithTitle amt={withdrawn} title="Withdrawn" />
				</div>
				{processingDuration > 0 && withdrawType === "funds" ?
					<div className="ta-c pt-2">
						<progress min={0} max={maxProcessingDuration} value={processingDuration} style={{ width: '100%', maxWidth: withdrawBtnWidth }}></progress>
					</div>
					: null
				}
				<div className="ta-c pt-2">
					<SaveButton onClick={async () => await withdrawFunds(splitters)} text={withdrawRequestedOnSplitter ? "Withdrawing funds..." : "Withdraw all funds"} saving={processing && withdrawType === "funds"} disabled={processing} style={{ width: withdrawBtnWidth }} />
				</div>
			</div>

			<div className="my-balance-page">
				<TextPhrase fw400={true} padTop={true}>
					See how much holders’ donation you accumulated
					<div className="flex-row column-on-mobile ai-c jc-c" style={{ columnGap: 8 }}>
						<span>It might take a few minutes to update and you need to hold the NFT at the time of donation</span>
						<FontIcon name="refresh" asFabButton={true} moreFabCls="i-f" onClick={loadSplittersAndEarnings} tip="Refresh" />
					</div>
				</TextPhrase>
				<div className="mx-auto pt-2 amounts-view x2">
					<AmountWithTitle amt={waitingDonation} title="Waiting" />
					<AmountWithTitle amt={withdrawnDonation} title="Donated" />
				</div>
				{processingDuration > 0 && withdrawType === "donation" ?
					<div className="ta-c pt-2">
						<progress min={0} max={maxProcessingDuration} value={processingDuration} style={{ width: '100%', maxWidth: withdrawBtnWidth }}></progress>
					</div>
					: null
				}
				<div className="ta-c pt-2">
					<SaveButton className="primary donation" onClick={async () => await withdrawFunds(splitters, true)} text={withdrawHolderShareRequestedOnSplitter ? "Donating funds..." : "Donate funds"} saving={processing && withdrawType === "donation"} disabled={processing} style={{ width: withdrawBtnWidth }} />
				</div>
				<div className="pt-2" style={{ borderBottom: '1px solid #E2E9E6' }}></div>
			</div>

			{earnings.length === 0 ?
				<div className="ta-c pt-2 main-text" style={{ fontSize: 32 }}>No earnings yet</div>
				:
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
			<br /><br /><br /><br />
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

			<DonationProgressPopup visible={donationProgressPopupVisible} setVisible={setDonationProgressPopupVisible} />
			<DonationPopup visible={donationPopupVisible} setVisible={setDonationPopupVisible} donationWallet={donationWallet} setDonationWallet={setDonationWallet} />
			<WithdrawProgressPopup visible={withdrawProgressPopupVisible} setVisible={setWithdrawProgressPopupVisible} withdrawAmount={amountRequestedToWithdraw} />
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