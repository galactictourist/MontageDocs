import { useState, useContext, useEffect, Suspense, lazy, useCallback } from 'react'
import AuthContext from '../ctx/Auth'
import FormContainer from './parts/FormContainer'
import { AppControl } from './parts/AppControl'
import TextPhrase, { NoActionHereYet } from './parts/TextPhrase'
import Loading from './prompts/Loading'
import { NumWithChange } from './parts/activityTables/helper/NumWithChange'
import FontIcon from '../fontIcon/FontIcon'
import { ItemCt } from './parts/activityTables/helper/ItemCt'
import demoMoonbird from '../img/demo-moonbird.png'
import { getTimerRenderer } from './parts/timerRenderer';
import Spinner from '../util/Spinner'
import { RejectOfferPopup } from './RejectOfferPopup'
import { AcceptOfferPopup } from './AcceptOfferPopup'
import { sendOfferAcceptedToBuyer } from '../func/emails'
import { getUserIdByAddy, loadUserProfile } from '../func/users'
import { isValidEmail } from '../util/isValidEmail'
const Countdown = lazy(() => import('react-countdown'))

const OfferDirection = {
	incoming: "incoming",
	outgoing: "outgoing"
}

const getExpirationDate = (inDays) => {
	const d = new Date()
	d.setDate(d.getDate() + inDays)
	return d.toJSON()
}
const getExpirationDateInSecs = (inSecs) => {
	const d = new Date()
	d.setSeconds(d.getSeconds() + inSecs)
	return d.toJSON()
}

const getMockOffers = () => [{
	offerId: 1,
	offerIn: "eth",
	offerAmount: 0.1,
	offerExpiresOn: getExpirationDateInSecs(10),
	buyer: "0x54A6534BD00Ae984380e77074f86cb867430CCF2",
	seller: "0x8b0e42f366ba502d787bb134478adfae966c8798",
	nftContract: "0x8b0e42f366ba502d787bb134478adfae966c8798",
	tokenId: 1,
	name: "Item 1",
	collectionName: "Collection 1",
	offerDirection: OfferDirection.incoming,
	image: demoMoonbird
},
{
	offerId: 2,
	offerIn: "weth",
	offerAmount: 0.67,
	offerExpiresOn: getExpirationDate(3),
	buyer: "0x8b0e42f366ba502d787bb134478adfae966c8798",
	seller: "0x8b0e42f366ba502d787bb134478adfae966c8798",
	nftContract: "0x8b0e42f366ba502d787bb134478adfae966c8798",
	tokenId: 2,
	name: "Item 2",
	collectionName: "Collection 1",
	offerDirection: OfferDirection.incoming,
	image: demoMoonbird
},
{
	offerId: 3,
	offerIn: "Casual offer",
	offerAmount: 0.25,
	offerExpiresOn: getExpirationDate(3),
	buyer: "0x8b0e42f366ba502d787bb134478adfae966c8798",
	seller: "0x8b0e42f366ba502d787bb134478adfae966c8798",
	nftContract: "0x8b0e42f366ba502d787bb134478adfae966c8798",
	tokenId: 3,
	name: "Item 3",
	collectionName: "Collection 1",
	offerDirection: OfferDirection.incoming,
	image: demoMoonbird
}]

export default function MyOffers() {
	const { accounts: accountAddress } = useContext(AuthContext)
	const [loading, setLoading] = useState(false)
	const [offers, setOffers] = useState([])
	const [offerDirection, setOfferDirection] = useState(OfferDirection.incoming)

	const acceptOfferClick = (offer) => {
		setOfferToAccept(offer)
		setAcceptOfferPopupVisible(true)
	}
	const [acceptOfferPopupVisible, setAcceptOfferPopupVisible] = useState(false)
	const [offerToAccept, setOfferToAccept] = useState(null)
	const onOfferAccepted = useCallback((offer) => {
		// TODO [offers] - accept offer
		setOffers(offers => offers.filter(o => !(o.nftContract === offer.nftContract && o.tokenId === offer.tokenId)));
		(async () => {
			const buyerUserId = await getUserIdByAddy(offer.buyer)
			const { email, emailConfirmed } = await loadUserProfile(buyerUserId)
			if (emailConfirmed && isValidEmail(email)) {
				await sendOfferAcceptedToBuyer(email, offer)
			}
		})()
	}, [])
	useEffect(() => {
		if (offerToAccept && !acceptOfferPopupVisible) {
			setOfferToAccept(null)
		}
	}, [offerToAccept, acceptOfferPopupVisible])

	const rejectOfferClick = (offer) => {
		setOfferToReject(offer)
		setRejectOfferPopupVisible(true)
	}
	const [rejectOfferPopupVisible, setRejectOfferPopupVisible] = useState(false)
	const [offerToReject, setOfferToReject] = useState(null)
	const onOfferRejected = (offer) => {
		// TODO [offers] - reject offer
		setOffers(offers => offers.filter(o => o.offerId !== offer.offerId))
		setRejectOfferPopupVisible(false)
		setOfferToReject(null)
	}

	const doLoadOffers = async (offerDirection) => {
		// TODO [offers] - load offers 
		const offers = getMockOffers().filter(o => o.offerDirection === offerDirection)
		setOffers(offers)
	}

	useEffect(() => {
		if (accountAddress) {
			setLoading(true)
			doLoadOffers(offerDirection).finally(() => setLoading(false))
		}
		// eslint-disable-next-line
	}, [accountAddress, offerDirection])

	const gridTemplateColumns = { gridTemplateColumns: '2fr 1fr 1fr 1.25fr' }

	if (loading) return <Loading />

	return (
		<div>
			<TextPhrase padTop={true}>My offers</TextPhrase>

			<FormContainer style={{ width: '100%', maxWidth: 936 }}>
				<AppControl type="select" name="offersFilter" value={offerDirection} setValue={setOfferDirection} style={{ width: '100%' }} options={[
					{ value: OfferDirection.incoming, text: 'Pending offers I received' },
					{ value: OfferDirection.outgoing, text: 'Pending offers I made' },
				]} />
			</FormContainer>

			{offers?.length > 0 ? (
				<>
					<div className="table-row header-row pt-2" style={gridTemplateColumns}>
						<span>Item</span>
						<span>Price</span>
						<span>Expires</span>
						<span>Action</span>
					</div>
					{offers.map((offer, idx) => {
						return (
							<div key={idx} className="table-row non-clickable" style={gridTemplateColumns}>
								<span>
									<FontIcon name="offer" inline={true} nonClickable={true} />
									<ItemCt image={offer.image} itemName={offer.name} collectionName={offer.collectionName} />
								</span>
								<span><NumWithChange icon="eth" num={offer.offerAmount} isCurrency={true} iconStyle={offer.offerIn === "weth" ? { color: 'red' } : undefined} /></span>
								<span>
									<Suspense fallback={<Spinner />}>
										<Countdown date={offer.offerExpiresOn} renderer={getTimerRenderer("Expired", "xx-small")} />
									</Suspense>
								</span>
								<span>
									{offer.offerDirection === OfferDirection.incoming ?
										<>
											<button className="primary" style={{ minWidth: "auto" }} onClick={() => acceptOfferClick(offer)}>Accept</button>
											<button className="secondary" style={{ minWidth: "auto" }} onClick={() => rejectOfferClick(offer)}>Reject</button>
										</>
										:
										<button className="primary" style={{ minWidth: "auto" }}>Cancel</button>
									}
								</span>
							</div>
						)
					})}

					<AcceptOfferPopup visible={acceptOfferPopupVisible} setVisible={setAcceptOfferPopupVisible} offer={offerToAccept} onOfferAccepted={onOfferAccepted} />
					<RejectOfferPopup visible={rejectOfferPopupVisible} setVisible={setRejectOfferPopupVisible} offer={offerToReject} onOfferRejected={onOfferRejected} />
				</>)
				:
				<NoActionHereYet />
			}
		</div>
	)
}