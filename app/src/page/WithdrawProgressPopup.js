import appLogo from '../img/logo.svg'
import FontIcon from '../fontIcon/FontIcon';
import AppPopup from './parts/AppPopup';
import TextPhrase from './parts/TextPhrase';
import { useContext, useEffect, useState } from 'react';
import AuthContext from '../ctx/Auth';
import { SaveButton } from './parts/SaveButton';
import FormContainer from './parts/FormContainer';

export function WithdrawProgressPopup({ visible, setVisible, withdrawAmount }) {
	const { accounts: accountAddress } = useContext(AuthContext)
	const [balance, setBalance] = useState(Number(0).toFixed(4))

	useEffect(() => {
		if (accountAddress) {
			window.ethereum?.request({ method: 'eth_getBalance', params: [accountAddress] }).then(wei => setBalance((parseInt(wei) / 1e18).toFixed(4)))
		}
	}, [accountAddress])

	const hide = () => setVisible(false)
	return <AppPopup visible={visible} setVisible={hide} insideCls="notice-popup-content">
		<div className="notice-popup-content">
			<FontIcon name="cancel-circle-full" onClick={hide} moreCls="close-popup-x" />
			<div className="ta-c pt-2">
				<img src={appLogo} alt="" />
			</div>
			<TextPhrase isTitle={true}>Withdraw in progress</TextPhrase>
			<FormContainer>
				<div className="flex-row">
					<TextPhrase cls="f-1" fieldText={true} tac={false}>You have in your balance:</TextPhrase>
					<TextPhrase fieldText={true}>{balance}</TextPhrase>
				</div>
				<div className="flex-row">
					<TextPhrase cls="f-1" fieldText={true} fw700={true} tac={false}>We estimate you'll get:</TextPhrase>
					<TextPhrase fieldText={true} fw700={true}>{parseFloat(withdrawAmount).toFixed(6)}</TextPhrase>
				</div>
				<TextPhrase evenSmallerText={true}>
					For security reasons withdraw might take 12-36 hours we’re working in a system that will make it immediate soon
				</TextPhrase>
				<SaveButton onClick={hide} text="Close" />
			</FormContainer>
		</div>
	</AppPopup>
}
