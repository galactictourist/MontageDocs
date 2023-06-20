import FontIcon from '../fontIcon/FontIcon';
import AppPopup from './parts/AppPopup';
import TextPhrase from './parts/TextPhrase';
import FormContainer from "./parts/FormContainer";
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getNFTContract } from '../frontend/contractsData/addresses';
import { getOptimizeImgUrl, PopupSpecs } from '../util/optimizedImages';
import { fetchTokenURI } from '../util/mimeTypes';
import { MultiMedia } from './parts/MultiMedia';
import CartContext from '../ctx/Cart';
import { loadCollectionIdByNFTAddress } from '../func/liveCollections';
import { loadCollectionSettings } from '../func/collections';
import { getContractType } from '../util/contractTypes';

export function BuySuccessPopup({ visible, setVisible }) {
	const { boughtItems } = useContext(CartContext)
	const [boughtSrc, setBoughtSrc] = useState(null)
	const [boughtItemName, setBoughtItemName] = useState(null)
	const [mimeType, setMimeType] = useState(null)
	const navigate = useNavigate()

	const seeInWalletClick = () => {
		hide()
		navigate(`/my-collected-items`)
	}

	const hide = () => setVisible(false)

	useEffect(() => {
		if (boughtItems?.length > 0) {
			if (boughtItems.length > 1) {
				setBoughtSrc(getOptimizeImgUrl(boughtItems[0].collectionProfileImage, PopupSpecs))
			} else {
				(async () => {
					const { tokenId, contract_address: nftAddress } = boughtItems[0]
					const { collectionId } = await loadCollectionIdByNFTAddress(nftAddress)
					const collectionSettings = await loadCollectionSettings(collectionId)
					const contractType = getContractType(collectionSettings)
					const nftContract = await getNFTContract(nftAddress, contractType)
					const tokenURI = await nftContract.methods.tokenURI(tokenId).call()
					const { image, name, mimeType } = await fetchTokenURI(tokenURI)
					setMimeType(mimeType)
					setBoughtItemName(name)
					setBoughtSrc(getOptimizeImgUrl(image, PopupSpecs, mimeType))
				})()
			}
		}
	}, [boughtItems])

	return <AppPopup visible={visible} setVisible={hide} insideCls="notice-popup-content">
		<div className="notice-popup-content">
			<FontIcon name="cancel-circle-full" onClick={hide} moreCls="close-popup-x" />
			<TextPhrase isTitle={true}>Purchased Successfully!</TextPhrase>
			<MultiMedia src={boughtSrc} mimeType={mimeType} />
			<div className="ta-c pt-2 notice-details">
				{boughtItems?.length > 1 ? <><span className="highlight-color">{boughtItems.length}</span> items where successfully purchased</> : null}
				{boughtItems?.length === 1 ? <><span className="highlight-color">{boughtItemName}</span> from <span className="highlight-color">{boughtItems[0].collectionName || boughtItems[0].contract_address}</span></> : null}
			</div>
			<FormContainer>
				<TextPhrase fieldText={true}>It might take a few minutes for purchased items to appear in your wallet</TextPhrase>
				<button className="primary" onClick={seeInWalletClick}>See in wallet</button>
			</FormContainer>
		</div>
	</AppPopup>
}
