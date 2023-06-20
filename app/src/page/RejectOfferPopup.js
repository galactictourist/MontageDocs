import FontIcon from '../fontIcon/FontIcon';
import AppPopup from './parts/AppPopup';
import TextPhrase from './parts/TextPhrase';
import FormContainer from "./parts/FormContainer";
import { useContext } from 'react';
import { SaveButton } from './parts/SaveButton';
import AuthContext from '../ctx/Auth';
import { toast } from 'react-toastify';
import { MultiMedia } from './parts/MultiMedia';
import { ForItemFromCollection } from './parts/ForItemFromCollection';

export function RejectOfferPopup({ visible, setVisible, offer, onOfferRejected }) {
	const { accounts: accountAddress } = useContext(AuthContext)

	const hide = () => setVisible(false)

	const yesRejectClick = () => {
		onOfferRejected(offer)
		hide()
	}

	if (!visible) return null
	if (!accountAddress) {
		toast("Please connect your wallet first", { type: "error" })
		return null
	}

	return <AppPopup visible={true} setVisible={hide} insideCls="notice-popup-content">
		<div className="notice-popup-content">
			<FontIcon name="cancel-circle-full" onClick={hide} moreCls="close-popup-x" />
			<TextPhrase isTitle={true}>Are you sure you want<br />to reject offer?</TextPhrase>
			<MultiMedia src={offer?.file || offer?.image} mimeType={offer?.mimeType} keepAspectRatio={offer?.keepAspectRatio} originalCID={offer?.originalCID} />
			<ForItemFromCollection itemName={offer?.name} collectionName={offer?.collectionName} />
			<FormContainer>
				<SaveButton onClick={yesRejectClick} text="Yes, reject" />
				<SaveButton onClick={hide} text="No, go back" className="secondary" />
			</FormContainer>
		</div>
	</AppPopup>
}
