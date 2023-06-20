import { useContext, useEffect, useState } from 'react';
import StickyButtonContainer from './parts/StickyButtonContainer';
import { AppControl } from './parts/AppControl';
import { SaveButton } from './parts/SaveButton';
import FormContainer from './parts/FormContainer';
import { useNavigate, useParams } from 'react-router';
import Loading from './prompts/Loading';
import AuthContext from '../ctx/Auth';

import { getMarketContract, getNFTContract, MARKET_ADDR } from '../frontend/contractsData/addresses'
import { ItemStatus } from '../util/itemStatus';
import { loadCollectionIdByNFTAddress, updateLiveCollectionConductKey } from '../func/liveCollections';
import { updateItem } from '../func/items';
import { toast } from 'react-toastify';
import { CardImageSpecs, getOptimizeImgUrl } from '../util/optimizedImages';
import TxFailedContext from '../ctx/TxFailedContext';
import { MultiMedia } from './parts/MultiMedia';
import { ForItemFromCollection } from './parts/ForItemFromCollection';
import { fetchTokenURI } from '../util/mimeTypes';
import { getContractType } from '../util/contractTypes';
import { loadCollectionSettings } from '../func/collections';

export default function ListItemForSale({ setCrumbLabel }) {
	const { accounts: accountAddress } = useContext(AuthContext)
	const { setTxFailedData } = useContext(TxFailedContext)
	const { nftAddress, tokenId } = useParams()
	const navigate = useNavigate()
	const [item, setItem] = useState({})
	const [loading, setLoading] = useState(false)
	const [processing, setProcessing] = useState(false)
	const [contractType, setContractType] = useState(null)

	useEffect(() => {
		if (contractType === null) {
			const load = async () => {
				const { collectionId, itemId, mimeType, conductKey } = await loadCollectionIdByNFTAddress(nftAddress, tokenId)
				setContractType(getContractType(await loadCollectionSettings(collectionId)))
				setItem(item => ({ ...item, itemId, mimeType, conductKey }))
			}
			setLoading(true)
			load().finally(() => setLoading(false))
		}
		if (nftAddress && tokenId && contractType !== null) {
			const load = async () => {
				const nftContract = await getNFTContract(nftAddress, contractType)
				const tokenSymbol = await nftContract.methods.symbol().call()
				const tokenURI = await nftContract.methods.tokenURI(tokenId).call()
				const { image, name, mimeType } = await fetchTokenURI(tokenURI)
				setItem(item => ({ ...item, image, name, mimeType, tokenId, nftAddress, tokenSymbol }))
				if (name && setCrumbLabel) setCrumbLabel(name)
			}
			setLoading(true)
			load().finally(() => setLoading(false))
		}
	}, [nftAddress, tokenId, contractType, setCrumbLabel])

	const control = ({ name, ...props }) => <AppControl name={name} value={item[name]} setData={setItem} {...props} />

	const listItemClick = async () => {
		if (!item.tokenId) {
			toast('Missing tokenId for itemId: ' + item.itemId)
			return
		}
		if (!item.listPrice) {
			toast('Please enter list price')
			return
		}
		const listPriceFloat = parseFloat(item.listPrice)
		if (isNaN(listPriceFloat)) {
			toast('Invalid list price')
			return
		}
		setProcessing(true)
		try {
			const marketAddr = await MARKET_ADDR()
			const nftContract = await getNFTContract(nftAddress, contractType)
			const marketContract = await getMarketContract()

			const isApprovedAll = await nftContract.methods.isApprovedForAll(accountAddress, marketAddr).call()
			console.log("nftContract.isApprovedForAll(owner, operator): owner, operator, status", accountAddress, marketAddr, isApprovedAll)
			if (!isApprovedAll) {
				console.log("nftContract.setApprovalForAll: marketAddr, true", marketAddr, true)
				await nftContract.methods.setApprovalForAll(marketAddr, true).send({ from: accountAddress })
			}

			const isRegistered = await marketContract.methods.registrationStatus(nftAddress).call()
			if (!isRegistered) {
				console.log("marketContract.registerContractToMarket: nftAddress", nftAddress)
				const result = await marketContract.methods.registerContractToMarket(nftAddress).send({ from: accountAddress })
				const conductKey = result.events.MarketRegistration.returnValues.registrationHash
				await updateLiveCollectionConductKey(item.collectionId, conductKey)
			}
			if (item.itemId) {
				await updateItem(item.itemId, { status: ItemStatus.onSale, salePrice: listPriceFloat, seller: accountAddress })
			} else {
				console.log("TODO update sold item for external collection")
			}
		} catch (e) {
			setTxFailedData('Listing could not be completed', getOptimizeImgUrl(item.image, CardImageSpecs, item.mimeType))
			throw e
		} finally {
			setProcessing(false)
		}
		navigate(`/list-item-success`, { state: { item } })
	}

	if (loading) return <Loading />

	return (
		<>
			<FormContainer>
				<MultiMedia src={item?.image} mimeType={item?.mimeType} keepAspectRatio={item?.keepAspectRatio} originalCID={item?.originalCID} />
				<ForItemFromCollection itemName={item?.name} collectionName={item?.tokenSymbol} forLabel="" />
				{control({ label: "Listing price (eth)", type: "number", subtype: "price", name: "listPrice" })}
			</FormContainer>

			<StickyButtonContainer>
				<SaveButton onClick={async (e) => await listItemClick(e)} saving={processing} disabled={processing || parseFloat(item?.listPrice || 0) <= 0} text="List now" />
			</StickyButtonContainer>
		</>
	)
}