import '../css/table.scss'
import { useContext, useState } from 'react';
import { useParams } from 'react-router';
import AuthContext from '../ctx/Auth';
import FormContainer from './parts/FormContainer';
import { SaveButton } from './parts/SaveButton';
import TextPhrase from './parts/TextPhrase';
import { AppControl } from './parts/AppControl';
import FontIcon from '../fontIcon/FontIcon';
import { selfMint } from '../web3/selfMint';
import { getMarketContract, getNFTContract, MARKET_ADDR } from '../frontend/contractsData/addresses';
import { listCollectionItems, loadTotalItemsToMint, updateLiveCollectionConductKey } from '../func/liveCollections';
import { ItemStatus } from '../util/itemStatus';
import { toast } from 'react-toastify';
import { revertMintingStatus, setMintingStatus } from '../func/items';
import { loadCollectionSettings } from '../func/collections';
import { getContractType } from '../util/contractTypes';

export default function MyCollectionMintOnChain() {
	const { userId, accounts: accountAddress } = useContext(AuthContext)
	const { collectionId } = useParams()

	const ITEMS_TO_MINT = { ALL: 'all', SOME: 'some' }
	const [itemsToMint, setItemsToMint] = useState(ITEMS_TO_MINT.ALL)
	const [mintQty, setMintQty] = useState(0)
	const [listAfterMint, setListAfterMint] = useState(true)
	const [listPrice, setListPrice] = useState(0.001)
	const [minting, setMinting] = useState(false)
	const [listing, setListing] = useState(false)

	const ethSymbol = () => <FontIcon name="eth" inline={true} />

	if (!userId || !collectionId) return null

	const mintOnChain = async () => {
		const allQtyOrSome = itemsToMint === ITEMS_TO_MINT.ALL ? await loadTotalItemsToMint(collectionId) : mintQty
		if (!allQtyOrSome || allQtyOrSome <= 0) {
			throw new Error("No NFTs to mint")
		}
		console.log("allQtyOrSome", allQtyOrSome)
		const updatedItems = await setMintingStatus(userId, collectionId, allQtyOrSome)
		if (parseInt(updatedItems) < allQtyOrSome) {
			throw new Error(`Already minting... please wait for confirmation`)
		}
		const collectionSettings = await loadCollectionSettings(collectionId)
		const contractType = getContractType(collectionSettings)
		let mintResult
		try {
			mintResult = await selfMint(allQtyOrSome, accountAddress, setMinting, collectionId, contractType)
		} catch (e) {
			console.error(e)
			await revertMintingStatus(userId, collectionId, allQtyOrSome)
			throw e
		}
		if (mintResult) {
			if (listAfterMint) {
				const listPriceFloat = parseFloat(listPrice)
				if (isNaN(listPriceFloat) || listPriceFloat < 0) {
					toast('Invalid list price')
					return
				}
				setListing(true)
				try {
					const { nftAddress, firstTokenId, qty } = mintResult
					const nftContract = await getNFTContract(nftAddress, contractType)
					const marketAddr = await MARKET_ADDR()
					const isApprovedAll = await nftContract.methods.isApprovedForAll(accountAddress, marketAddr).call()
					console.log("nftContract.isApprovedForAll(owner, operator): owner, operator, status", accountAddress, marketAddr, isApprovedAll)
					if (!isApprovedAll) {
						console.log("nftContract.setApprovalForAll: marketAddr, true", marketAddr, true)
						await nftContract.methods.setApprovalForAll(marketAddr, true).send({ from: accountAddress })
					}

					const marketContract = await getMarketContract()
					const isRegistered = await marketContract.methods.registrationStatus(nftAddress).call()
					console.log("marketContract.registrationStatus(nftAddress): isRegistered", nftAddress, isRegistered)
					if (!isRegistered) {
						console.log("marketContract.registerContractToMarket: nftAddress", nftAddress)
						const result = await marketContract.methods.registerContractToMarket(nftAddress).send({ from: accountAddress })
						const conductKey = result.events.MarketRegistration.returnValues.registrationHash
						await updateLiveCollectionConductKey(collectionId, conductKey)
					}

					while (true) {
						const r = await listCollectionItems(collectionId, firstTokenId, qty, ItemStatus.onSale, listPriceFloat, accountAddress)
						console.log("listCollectionItems: r", r)
						if (r?.listed) {
							break
						}
						await new Promise(resolve => setTimeout(resolve, 2500))
					}
				} finally {
					setListing(false)
				}
			}
		} else {
			await revertMintingStatus(userId, collectionId, allQtyOrSome)
		}
	}

	return (
		<div>
			<TextPhrase padTop={true} isMain={false}>
				You can choose to mint by yourself one or more of the items in this collection
				<br />
				When you self-mint you do it for $0 and you need to pay the gas for the minting
			</TextPhrase>

			<FormContainer>
				<AppControl type="select" label="Items to mint" value={itemsToMint} setValue={setItemsToMint} options={[{ text: 'All items', value: ITEMS_TO_MINT.ALL }, { text: 'Some items', value: ITEMS_TO_MINT.SOME }]} />
				<AppControl type="number" label="Number of items" value={mintQty} setValue={setMintQty} doRender={itemsToMint === ITEMS_TO_MINT.SOME} />
				<AppControl type="checkbox" toggleTitle="After mint list in my collection page" value={listAfterMint} setValue={setListAfterMint} />
				<AppControl type="number" subtype="price" appendAfterLabel={ethSymbol} value={listPrice} setValue={setListPrice} doRender={listAfterMint} numTypeLabel="List price" />
				<SaveButton saving={minting || listing} disabled={minting || listing} onClick={mintOnChain} text={listing ? "Listing..." : minting ? "Minting..." : "Mint on chain"} />
			</FormContainer>
		</div>
	)
}
