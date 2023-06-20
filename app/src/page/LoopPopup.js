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
import { checkAllowList } from '../func/collections';

export function LoopPopup({ visible, setVisible, setCompleted, setWillConfirmEmail, collectionName, collectionId }) {
	const { userId, setIsNewUser } = useContext(AuthContext)
	const [email, setEmail] = useState(null)
	const [twitter, setTwitter] = useState(null)
	const [name, setName] = useState(null)
	const [emailConfirmed, setEmailConfirmed] = useState(false)
	const [saving, setSaving] = useState(false)
	const [isInAllowList, setIsInAllowList] = useState(null)
	const hide = () => setVisible(false)

	useEffect(() => {
		if (userId && collectionId) {
		  checkAllowList(collectionId, userId).then(setIsInAllowList)
		}
	}, [userId, collectionId])

	useEffect(() => {
		if (userId && isInAllowList === false) {
			loadUserProfile(userId).then(({ email, twitter, name, emailConfirmed }) => {
				setEmail(email)
				setTwitter(twitter)
				setName(name)
				setEmailConfirmed(emailConfirmed)
			})
		}
	}, [userId, isInAllowList])

	const nextClick = async () => {
		if (email && !isValidEmail(email)) {
			toast('Please enter valid email address or leave empty field to continue')
			return
		}
		if (email || twitter || name) {
			setSaving(true)
			try {
				await updateUser(userId, { email, twitter, name })
				if (isValidEmail(email) && !emailConfirmed) {
					setWillConfirmEmail(true)
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

			<FormContainer doRender={!isInAllowList}>
				<TextPhrase isTitle={true}>Stay in the loop</TextPhrase>
				<TextPhrase fieldText={true}>Add your details and we’ll keep you in the loop on mint dates & when you have earnings waiting for you to collect</TextPhrase>
				<AppControl name="email" type="text" maxLength={50} placeholder="Email (optional)" value={email} setValue={setEmail} />
				<AppControl name="twitter" type="text" maxLength={50} placeholder="Twitter (optional)" value={twitter} setValue={setTwitter} />
				<AppControl name="name" type="text" maxLength={50} placeholder="Name (optional)" value={name} setValue={setName} />
				<SaveButton onClick={async () => await nextClick()} text="Next" disabled={saving} saving={saving} />
			</FormContainer>

			<FormContainer doRender={isInAllowList}>
				<TextPhrase isTitle={true}>We’ve got you!</TextPhrase>
				<TextPhrase fieldText={true} padTop5={true}>It seems you’re already on the list of<br /><span style={{ textTransform: 'uppercase' }}>{collectionName}</span></TextPhrase>
				<div className="flex-row pt-5">
					<button className="primary f-1" onClick={hide}>Close</button>
				</div>
			</FormContainer>
		</div>
	</AppPopup>
}
