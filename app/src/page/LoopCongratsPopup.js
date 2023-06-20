import appLogo from '../img/logo.svg'
import FontIcon from '../fontIcon/FontIcon';
import AppPopup from './parts/AppPopup';
import TextPhrase from './parts/TextPhrase';
import FormContainer from "./parts/FormContainer";

export function LoopCongratsPopup({ visible, setVisible, collectionName, hasConfirmation }) {
	const hide = () => setVisible(false)

	return <AppPopup visible={visible} setVisible={hide} insideCls="notice-popup-content">
		<div className="notice-popup-content">
			<FontIcon name="cancel-circle-full" onClick={hide} moreCls="close-popup-x" />
			<div className="ta-c pt-2">
				<img src={appLogo} alt="" />
			</div>
			<TextPhrase isTitle={true}>Congratulations!</TextPhrase>
			<FormContainer>
				<TextPhrase fieldText={true}>You are on the list of<br /><span style={{ textTransform: 'uppercase' }}>{collectionName}</span></TextPhrase>
				{hasConfirmation && <TextPhrase fieldText={true} padTop5={true}>We’ll send you a confirmation email soon</TextPhrase>}
				<button onClick={hide} className="primary">Close</button>
			</FormContainer>
		</div>
	</AppPopup>
}
