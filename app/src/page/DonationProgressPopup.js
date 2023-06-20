import appLogo from '../img/logo.svg'
import FontIcon from '../fontIcon/FontIcon';
import AppPopup from './parts/AppPopup';
import TextPhrase from './parts/TextPhrase';
import { SaveButton } from './parts/SaveButton';
import FormContainer from './parts/FormContainer';

export function DonationProgressPopup({ visible, setVisible }) {
	const hide = () => setVisible(false)

	return <AppPopup visible={visible} setVisible={hide} insideCls="notice-popup-content">
		<div className="notice-popup-content">
			<FontIcon name="cancel-circle-full" onClick={hide} moreCls="close-popup-x" />
			<div className="ta-c pt-2">
				<img src={appLogo} alt="" />
			</div>
			<TextPhrase isTitle={true}>Donation in progress</TextPhrase>
			<FormContainer>
				<TextPhrase evenSmallerText={true}>
					Choose a donation destination from our list or if you have another in mind add their crypto wallet and we will send the funds  (gas fees & calculation fees will be deducted)
				</TextPhrase>
				<SaveButton onClick={hide} text="Close" className="primary" />
			</FormContainer>
		</div>
	</AppPopup>
}
