import FontIcon from '../fontIcon/FontIcon';
import AppPopup from './parts/AppPopup';
import TextPhrase from './parts/TextPhrase';
import FormContainer from "./parts/FormContainer";
import { useContext, useEffect, useState } from 'react';
import { SaveButton } from './parts/SaveButton';
import AuthContext from '../ctx/Auth';
import { toast } from 'react-toastify';
import { MultiMedia } from './parts/MultiMedia';
import { ForItemFromCollection } from './parts/ForItemFromCollection';
import { ethToUsd } from '../util/converter';
import '../css/progress.scss'

const confirmStep = 1
const processingStep = 2
const doneStep = 3
const maxProcessingDuration = 12000

export function AcceptOfferPopup({ visible, setVisible, offer, onOfferAccepted }) {
	const { accounts: accountAddress } = useContext(AuthContext)
	const [acceptStep, setAcceptStep] = useState(confirmStep)
	const [processingDuration, setProcessingDuration] = useState(0)

	const hide = () => setVisible(false)

	const yesAcceptClick = () => { setAcceptStep(processingStep) }

	useEffect(() => {
		if (offer) {
			setAcceptStep(confirmStep)
			setProcessingDuration(0)
		}
	}, [offer])

	useEffect(() => {
		if (offer && onOfferAccepted) {
			if (acceptStep === processingStep) {
				(async (processingDuration) => {
					await new Promise(resolve => setTimeout(resolve, 33))
					if (processingDuration >= maxProcessingDuration) {
						setAcceptStep(doneStep)
					} else {
						setProcessingDuration(processingDuration => processingDuration + 33)
					}
				})(processingDuration)
			} else if (acceptStep === doneStep) {
				onOfferAccepted(offer)
			}
		}
	}, [acceptStep, processingDuration, offer, onOfferAccepted])

	if (!visible) return null
	if (!accountAddress) {
		toast("Please connect your wallet first", { type: "error" })
		return null
	}

	return <AppPopup visible={true} setVisible={hide} insideCls="notice-popup-content" modal={acceptStep === processingStep}>
		<div className="notice-popup-content">
			<FontIcon name="cancel-circle-full" onClick={hide} moreCls="close-popup-x" doRender={acceptStep !== processingStep} />
			<TextPhrase isTitle={true}>
				{acceptStep === confirmStep ? "Accept offer" : acceptStep === processingStep ? "Accepting offer" : "Offer accepted!"}
			</TextPhrase>
			<MultiMedia src={offer?.file || offer?.image} mimeType={offer?.mimeType} keepAspectRatio={offer?.keepAspectRatio} originalCID={offer?.originalCID} />
			<ForItemFromCollection itemName={offer?.name} collectionName={offer?.collectionName} />
			{acceptStep === confirmStep ? <>
				<TextPhrase fieldText={true} fw700={true}>Amount: {offer?.offerAmount} {offer?.offerIn?.toUpperCase()}</TextPhrase>
				<table className="pt-2">
					<tr>
						<td>Offer ({offer?.offerIn?.toUpperCase()})</td>
						<td className="ta-r">
							<FontIcon name="eth" inline={true} nonClickable={true} style={offer?.offerIn === "weth" ? { color: 'red' } : undefined} />
							{offer?.offerAmount}
						</td>
					</tr>
					<tr>
						<td>Estimated gas fee</td>
						<td className="ta-r">
							<FontIcon name="eth" inline={true} nonClickable={true} />
							{0.0000000000}
						</td>
					</tr>
					<tr>
						<td>Montage fee</td>
						<td className="ta-r">
							<FontIcon name="eth" inline={true} nonClickable={true} />
							{0.0000000000}
						</td>
					</tr>
					<tr>
						<td className="fw-700">We’re estimate you’ll get:</td>
						<td className="fw-700 ta-r">
							<FontIcon name="eth" inline={true} nonClickable={true} />
							{offer?.offerAmount}
						</td>
					</tr>
					<tr>
						<td className="ta-r" colSpan={2}>
							<FontIcon name="dollar" inline={true} nonClickable={true} />
							{ethToUsd(offer?.offerAmount)}
						</td>
					</tr>
				</table>
				<FormContainer>
					<SaveButton onClick={yesAcceptClick} text="Accept offer" />
				</FormContainer>
			</> : <>
				<TextPhrase isTitle={true}>
					{acceptStep === doneStep ? "Transaction completed" : "Transaction in progress..."}
				</TextPhrase>
				<FormContainer>
					<progress min={0} value={processingDuration} max={maxProcessingDuration} style={{ width: '100%' }}></progress>
				</FormContainer>
				<TextPhrase padTop={true} fieldText={true}>Even after transaction is over it might take a few<br />minutes until you’ll see it in your wallet</TextPhrase>
				{acceptStep === doneStep ? <FormContainer>
					<SaveButton onClick={hide} text="Close" />
				</FormContainer> : null}
			</>}
		</div>
	</AppPopup>
}
