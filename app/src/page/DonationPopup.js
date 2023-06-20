import appLogo from '../img/logo.svg'
import FontIcon from '../fontIcon/FontIcon';
import AppPopup from './parts/AppPopup';
import TextPhrase from './parts/TextPhrase';
import { useState } from 'react';
import { SaveButton } from './parts/SaveButton';
import FormContainer from './parts/FormContainer';
import { AppControl } from './parts/AppControl';

export function DonationPopup({ visible, setVisible, donationWallet, setDonationWallet }) {
	const [address, setAddress] = useState(donationWallet)

	const hide = () => {
		setDonationWallet(address)
		setVisible(false)
	}

	return <AppPopup visible={visible} setVisible={hide} insideCls="notice-popup-content">
		<div className="notice-popup-content">
			<FontIcon name="cancel-circle-full" onClick={hide} moreCls="close-popup-x" />
			<div className="ta-c pt-2">
				<img src={appLogo} alt="" />
			</div>
			<TextPhrase isTitle={true}>Donation to</TextPhrase>
			<FormContainer>
				<TextPhrase evenSmallerText={true}>
					Choose a donation destination or if you have another in mind add their crypto wallet and we will send the funds (gas fees & calculation fees will be deducted)
				</TextPhrase>
				<AppControl name="address" value={address} setValue={setAddress} label="Enter wallet to donate to" placeholder="0x...1234"></AppControl>
				<SaveButton onClick={hide} text="Donate" className="primary donation" />
			</FormContainer>
		</div>
	</AppPopup>
}
