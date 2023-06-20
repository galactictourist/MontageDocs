import FontIcon from '../fontIcon/FontIcon';
import AppPopup from './parts/AppPopup';
import TextPhrase from './parts/TextPhrase';
import FormContainer from "./parts/FormContainer";
import { useContext } from 'react';
import { getOptimizeImgUrl, PopupSpecs } from '../util/optimizedImages';
import MyCollectionContext from '../ctx/MyCollection';
import imagePlaceholder from '../img/image-placeholder.svg'
import appLogo from '../img/logo.svg'

export function DeploySuccessPopup({ visible, setVisible, postActivationData }) {
	const { myCollectionName, myCollectionProfileImage, isImportExistingCollection } = useContext(MyCollectionContext)

	const hide = () => setVisible(false)

	if (isImportExistingCollection) {
		return <AppPopup visible={visible} setVisible={hide} insideCls="notice-popup-content">
			<div className="notice-popup-content">
				<FontIcon name="cancel-circle-full" onClick={hide} moreCls="close-popup-x" />
				<div className="pt-1 ta-c">
					<img src={appLogo} alt="" className="notice-img--any-resolution" />
				</div>
				<TextPhrase padTop={true} fw400={true}>Your “Creators’ Pie” buffer contract was</TextPhrase>
				<TextPhrase isTitle={true}>Successfully Deployed!</TextPhrase>
				<FormContainer>
					<button className="primary" onClick={hide}>Close</button>
				</FormContainer>
			</div>
		</AppPopup>
	}
	return <AppPopup visible={visible} setVisible={hide} insideCls="notice-popup-content">
		<div className="notice-popup-content">
			<FontIcon name="cancel-circle-full" onClick={hide} moreCls="close-popup-x" />
			<TextPhrase isTitle={true}>Successfully Deployed!</TextPhrase>
			<div className="pt-1">
				<div className="card">
					<img src={myCollectionProfileImage ? getOptimizeImgUrl(myCollectionProfileImage, PopupSpecs) : imagePlaceholder} alt="" />
				</div>
			</div>
			<div className="ta-c pt-1 notice-details">
				the contract for <span className="highlight-color">{myCollectionName}</span>
				{postActivationData ? <div className="ta-c pt-1 flex-column" style={{ fontWeight: 400, lineHeight: 1.5 }}>
					<div className="fw-500">Royalties enforecement details</div>
					<div>Royalties: {postActivationData.creatorRoyalties}%</div>
					<div><a href={openSeaCollectionUrl(myCollectionName)} className="primary" target="_blank" rel="noreferrer">OpenSea collection link</a></div>
					<div>Splitter address: {postActivationData.groupAddress}</div>
					<div>Curator address: {postActivationData.curatorAddress}</div>
				</div> : null}
			</div>
			<FormContainer>
				<button className="primary" onClick={hide}>Close</button>
			</FormContainer>
		</div>
	</AppPopup>
}

function openSeaCollectionUrl(collectionName) {
	if (!collectionName) return "https://opeasea.io/collections"
	const capitalizedString = collectionName.replace(/[^a-zA-Z0-9]/g, "-").replace(/--/g, "-").toLowerCase()
	return "https://opensea.io/collection/" + capitalizedString
}