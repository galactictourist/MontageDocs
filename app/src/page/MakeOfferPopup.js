import FontIcon from '../fontIcon/FontIcon';
import AppPopup from './parts/AppPopup';
import TextPhrase from './parts/TextPhrase';
import FormContainer from "./parts/FormContainer";
import { useContext, useEffect, useMemo, useState } from 'react';
import { SaveButton } from './parts/SaveButton';
import { AppControl } from './parts/AppControl';
import { ethToUsd, wethToEth } from '../util/converter';
import AuthContext from '../ctx/Auth';
import { toast } from 'react-toastify';
import { MultiMedia } from './parts/MultiMedia';
import { ForItemFromCollection } from './parts/ForItemFromCollection';
import { acceptOffers, isAuction } from '../util/priceStyle';

const getExipresOnDefaultDate = () => {
	const d = new Date()
	d.setDate(d.getDate() + 7)
	return d.toJSON().split(':').splice(0, 2).join(':')
}

export function MakeOfferPopup({ visible, setVisible, item, onOfferMade, priceStyle }) {
	const { accounts: accountAddress } = useContext(AuthContext)
	const defaultOfferIn = 'eth'
	// offer data
	const [offerIn, setOfferIn] = useState(defaultOfferIn)
	const [offerAmount, setOfferAmount] = useState(0)
	const [offerExpiresOn, setOfferExpiresOn] = useState(getExipresOnDefaultDate())
	const acceptCasual = useMemo(() => acceptOffers(priceStyle) ? item?.acceptCasualOffers : isAuction(priceStyle) ? item?.acceptCasualBids : false, [item, priceStyle])
	const minPrice = useMemo(() => acceptOffers(priceStyle) ? item?.offerMinPrice || 0 : isAuction(priceStyle) ? item?.bidMinPrice || 0 : 0, [item, priceStyle])

	useEffect(() => {
		if (acceptOffers(priceStyle) && item?.offerMinPrice > 0) {
			setOfferAmount(item.offerMinPrice)
		}
		if (isAuction(priceStyle)) {
			if (item?.bidMinPrice > 0) setOfferAmount(item.bidMinPrice)
			if (item?.bidEndTime) setOfferExpiresOn(new Date(item.bidEndTime.replace('Z', '')))
		}
	}, [item, priceStyle])

	const hide = () => setVisible(false)

	const makeOfferClick = () => {
		const offer = {
			offerIn,
			offerAmount,
			offerExpiresOn,
			buyer: accountAddress,
			seller: item?.seller,
			nftContract: item?.nftContract,
			tokenId: item?.tokenId,
			name: item?.name,
			collectionName: item?.collectionName,
		}
		onOfferMade(offer)
		hide()
	}

	if (!visible) return null
	if (!accountAddress) {
		toast("Please connect your wallet first", { type: "error" })
		return null
	}
	return <AppPopup visible={visible} setVisible={hide} insideCls="notice-popup-content">
		<div className="notice-popup-content">
			<FontIcon name="cancel-circle-full" onClick={hide} moreCls="close-popup-x" />
			<TextPhrase isTitle={true}>Make {isAuction(priceStyle) ? "a bid" : "an offer"}</TextPhrase>
			<MultiMedia src={item?.file} mimeType={item?.mimeType} keepAspectRatio={item?.keepAspectRatio} originalCID={item?.originalCID} />
			<ForItemFromCollection itemName={item?.name} collectionName={item?.collectionName} />
			<FormContainer>
				<AppControl label={isAuction(priceStyle) ? "Bid in" : "Offer in"} type="select" value={offerIn} setValue={setOfferIn}
					options={acceptCasual ? [{ value: 'eth', text: `Casual ${isAuction(priceStyle) ? 'bid' : 'offer'}` }] : [{ value: 'eth', text: 'ETH' }, { value: 'weth', text: 'WETH' }]}
					underFieldLabel={acceptCasual ? "(No funds committed)" : "ETH (small gas fee will apply even if rejected)"} />

				<AppControl type="number" subtype="price"
					inputStyle={{ textAlign: "left", width: "50%", fontSize: 14, fontWeight: 700 }}
					noSpinners={true} noLabel={true} renderMainLabelOverride={true}
					value={offerAmount} setValue={setOfferAmount}
					min={minPrice || 0}
					label={(isAuction(priceStyle) ? "Bid" : "Offer") + " (in " + offerIn.toUpperCase() + ")"}
					inputPrefix={<FontIcon name="eth" inline={true} nonClickable={true} style={offerIn === 'weth' ? { color: 'red' } : undefined} />}
					inputPostix={
						<span className='flex-row' style={{ columnGap: 16, fontSize: 12, marginLeft: 'auto' }}>
							{offerIn === 'weth' ? <span><FontIcon name="eth" inline={true} nonClickable={true} />{wethToEth(offerAmount)}</span> : null}
							<span><FontIcon name="dollar" inline={true} nonClickable={true} />{ethToUsd(offerAmount)}</span>
						</span>
					}
					underFieldLabel={minPrice > 0 ? "Minimum " + Number(parseFloat(minPrice).toFixed(4)) + " ETH" : null}
				/>
				<AppControl type="datetime-local" label="Offer expires on" value={offerExpiresOn} setValue={setOfferExpiresOn} doRender={acceptOffers(priceStyle)} />

				<SaveButton onClick={makeOfferClick} text={isAuction(priceStyle) ? "Bid" : "Make offer"}
					disabled={(minPrice > 0 && offerAmount < minPrice) || !offerExpiresOn || new Date(offerExpiresOn) <= new Date()}
				/>
			</FormContainer>
		</div>
	</AppPopup>
}
