import FontIcon from '../fontIcon/FontIcon';
import AppPopup from './parts/AppPopup';
import TextPhrase from './parts/TextPhrase';
import ShareToTwitter from "./teaser/ShareToTwitter";
import FormContainer from "./parts/FormContainer";
import { RequestEmail } from "./parts/RequestEmail";
import { useContext, useEffect, useState } from 'react';
import AuthContext from '../ctx/Auth';
import { useNavigate } from 'react-router';
import { loadUserProfile, updateUser } from '../func/users';
import { sendConfirmationEmail } from '../func/emails';
import CollectionContext from '../ctx/Collection';
import { getNFTContract } from '../frontend/contractsData/addresses';
import { getOptimizeImgUrl, PopupSpecs } from '../util/optimizedImages';
import { fetchTokenURI, isVideo } from '../util/mimeTypes';
import { loadCollectionIdByNFTAddress } from '../func/liveCollections';
import { loadCollectionSettings } from '../func/collections';
import { getContractType } from '../util/contractTypes';

export function MintSuccessPopup({ visible, setVisible, mintResult, collectionProfileImage }) {
	const { collectionName } = useContext(CollectionContext)
	const { userId } = useContext(AuthContext)
	const [name, setName] = useState(null)
	const [email, setEmail] = useState(null)
	const [emailConfirmed, setEmailConfirmed] = useState(false)
	const [requestedToBeNotified, setRequestedToBeNotified] = useState(false)
	const [mintedSrc, setMintedSrc] = useState(null)
	const [mintedItemName, setMintedItemName] = useState(null)
	const [mimeType, setMimeType] = useState(null)
	const navigate = useNavigate()

	const seeInWalletClick = () => { navigate(`/my-collected-items`) }

	const hide = () => setVisible(false)

	useEffect(() => {
		if (mintResult) {
			const { qty, firstTokenId: tokenId, nftAddress } = mintResult
			if (qty > 1) {
				setMintedSrc(getOptimizeImgUrl(collectionProfileImage, PopupSpecs))
			} else {
				(async () => {
					const { collectionId } = await loadCollectionIdByNFTAddress(nftAddress)
					const collectionSettings = await loadCollectionSettings(collectionId)
					const contractType = getContractType(collectionSettings)
					const nftContract = await getNFTContract(nftAddress, contractType)
					console.log("onMint: NFTContract.methods.tokenURI: tokenId", tokenId)
					const tokenURI = await nftContract.methods.tokenURI(tokenId).call()
					const { image, name, mimeType } = await fetchTokenURI(tokenURI)
					setMimeType(mimeType)
					setMintedItemName(name)
					setMintedSrc(getOptimizeImgUrl(image, PopupSpecs, mimeType))
				})()
			}
		}
	}, [collectionProfileImage, mintResult])

	useEffect(() => {
		if (userId && email && !emailConfirmed && requestedToBeNotified && visible) {
			updateUser(userId, { email }).then(() => sendConfirmationEmail(userId, email, name))
		}
	}, [userId, email, name, emailConfirmed, requestedToBeNotified, visible])
	useEffect(() => {
		if (userId && visible) {
			loadUserProfile(userId).then(({ name, email, emailConfirmed }) => {
				setName(name)
				setEmail(email)
				setEmailConfirmed(emailConfirmed)
			})
		}
	}, [userId, visible])

	return <AppPopup visible={visible} setVisible={hide} insideCls="notice-popup-content">
		<div className="notice-popup-content">
			<FontIcon name="cancel-circle-full" onClick={hide} moreCls="close-popup-x" />
			<TextPhrase isTitle={true}>Successfully Minted!</TextPhrase>
			<div className="ta-c pt-2">
				{isVideo(mimeType) ? <video src={mintedSrc} autoPlay={true} controls={true} muted={true} loop={true} style={{ maxWidth: 94 }} /> : <img src={mintedSrc} alt="" style={{ maxWidth: 94 }} />}
			</div>
			<div className="ta-c pt-2 notice-details">
				{mintResult?.qty > 1 ? <>{mintResult.qty} items</> : <span className="highlight-color">{mintedItemName}</span>} from <span className="highlight-color">{collectionName}</span>
			</div>
			<ShareToTwitter />
			<RequestEmail setEmail={setEmail} doRender={!email} setRequestedToBeNotified={setRequestedToBeNotified} />
			<FormContainer doRender={email && requestedToBeNotified}>
				<TextPhrase fieldText={true}>Thanks, confirm your email and we’ll keep you in the loop about your holder earnings and royalties</TextPhrase>
			</FormContainer>
			<FormContainer>
				<button className="primary" onClick={seeInWalletClick}>See in wallet</button>
			</FormContainer>
		</div>
	</AppPopup>;
}
