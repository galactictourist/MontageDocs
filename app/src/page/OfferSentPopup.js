import FontIcon from '../fontIcon/FontIcon';
import AppPopup from './parts/AppPopup';
import TextPhrase from './parts/TextPhrase';
import FormContainer from "./parts/FormContainer";
import { RequestEmail } from "./parts/RequestEmail";
import { useContext, useEffect, useState } from 'react';
import AuthContext from '../ctx/Auth';
import { loadUserProfile, updateUser } from '../func/users';
import { sendConfirmationEmail } from '../func/emails';
import { isValidEmail } from '../util/isValidEmail';
import { isAuction } from '../util/priceStyle';

export function OfferSentPopup({ visible, setVisible, priceStyle }) {
	const { userId } = useContext(AuthContext)
	const [email, setEmail] = useState(null)
	const [emailConfirmed, setEmailConfirmed] = useState(false)
	const [requestedToBeNotified, setRequestedToBeNotified] = useState(false)

	const hide = () => setVisible(false)

	useEffect(() => {
		if (userId && email && !emailConfirmed && requestedToBeNotified && visible) {
			updateUser(userId, { email }).then(() => sendConfirmationEmail(userId, email))
		}
	}, [userId, email, emailConfirmed, requestedToBeNotified, visible])
	useEffect(() => {
		if (userId && visible) {
			loadUserProfile(userId).then(({ email, emailConfirmed }) => {
				setEmail(email)
				setEmailConfirmed(emailConfirmed)
			})
		}
	}, [userId, visible])

	if (!visible) return null

	return <AppPopup visible={visible} setVisible={hide} insideCls="notice-popup-content">
		<div className="notice-popup-content">
			<FontIcon name="cancel-circle-full" onClick={hide} moreCls="close-popup-x" />
			<TextPhrase isTitle={true}>{isAuction(priceStyle) ? "Bid" : "Offer"} sent!</TextPhrase>
			<RequestEmail setEmail={setEmail} doRender={!isValidEmail(email)} setRequestedToBeNotified={setRequestedToBeNotified}
				requestEmailPhrase={`Add your email and we’ll update you if your ${isAuction(priceStyle) ? "bid" : "offer"} is accepted`} />
			<FormContainer doRender={isValidEmail(email)}>
				<TextPhrase fieldText={true}>
					{emailConfirmed ?
						`Thanks, we’ll update you if your ${isAuction(priceStyle) ? "bid" : "offer"} is accepted`
						:
						`Thanks, confirm your email and we’ll update you if your ${isAuction(priceStyle) ? "bid" : "offer"} is accepted`
					}
				</TextPhrase>
			</FormContainer>
			<FormContainer>
				<button className="primary" onClick={hide}>Close</button>
			</FormContainer>
		</div>
	</AppPopup>
}
