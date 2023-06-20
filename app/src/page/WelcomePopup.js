import appLogo from '../img/logo.svg'
import FontIcon from '../fontIcon/FontIcon';
import AppPopup from './parts/AppPopup';
import TextPhrase from './parts/TextPhrase';
import FormContainer from "./parts/FormContainer";
import { useContext, useEffect, useState } from 'react';
import AuthContext from '../ctx/Auth';
import { loadUserProfile, updateUser } from '../func/users';
import { sendConfirmationEmail } from '../func/emails';
import { AppControl } from './parts/AppControl';
import { isValidEmail } from '../util/isValidEmail';
import { toast } from 'react-toastify';
import { SaveButton } from './parts/SaveButton';

export function WelcomePopup({ visible, setVisible, setCompleted }) {
	const { userId, setIsNewUser } = useContext(AuthContext)
	const [email, setEmail] = useState(null)
	const [twitter, setTwitter] = useState(null)
	const [name, setName] = useState(null)
	const [saving, setSaving] = useState(false)
	const hide = () => setVisible(false)

	useEffect(() => {
		if (userId) {
			loadUserProfile(userId).then(({ email, twitter, name }) => {
				setEmail(email)
				setTwitter(twitter)
				setName(name)
			})
		}
	}, [userId])

	const nextClick = async () => {
		if (email && !isValidEmail(email)) {
			toast('Please enter valid email address or leave empty field to continue')
			return
		}
		if (email || twitter || name) {
			setSaving(true)
			try {
				await updateUser(userId, { email, twitter, name })
				if (isValidEmail(email)) {
					sendConfirmationEmail(userId, email, name)
				}
			} finally {
				setSaving(false)
			}
		}
		setIsNewUser(false)
		setCompleted(true)
		hide()
	}

	return <AppPopup visible={visible} setVisible={hide} insideCls="notice-popup-content">
		<div className="notice-popup-content">
			<FontIcon name="cancel-circle-full" onClick={hide} moreCls="close-popup-x" />
			<div className="ta-c pt-2">
				<img src={appLogo} alt="" />
			</div>
			<TextPhrase isTitle={true}>Welcome to {process.env.REACT_APP_NAME}</TextPhrase>
			<FormContainer>
				<TextPhrase fieldText={true}>Thank you for joining our private beta! We’d love your feedback. Add your details to stay in the loop on mints, updates and royalties to collect.</TextPhrase>
				<AppControl name="email" type="text" maxLength={50} placeholder="Email (optional)" value={email} setValue={setEmail} />
				<AppControl name="twitter" type="text" maxLength={50} placeholder="Twitter (optional)" value={twitter} setValue={setTwitter} />
				<AppControl name="name" type="text" maxLength={50} placeholder="Name (optional)" value={name} setValue={setName} />
				<TextPhrase evenSmallerText={true}>We’ll send you a confirmation email soon</TextPhrase>
				<SaveButton onClick={async () => await nextClick()} text="Next" disabled={saving} saving={saving} />
			</FormContainer>
		</div>
	</AppPopup>;
}
