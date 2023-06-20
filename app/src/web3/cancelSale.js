import { toast } from 'react-toastify'
import { toastNoWeb3Support } from '../util/toasts'
import { getMarketContract } from '../frontend/contractsData/addresses'
import { updateItem } from '../func/items'
import { ItemStatus, itemStatusToListingStatus } from '../util/itemStatus'

export async function cancelSale({ accountAddress, itemId, nftContract, tokenId, status, seller, conductKey }) {
	if (!window.ethereum) {
		toastNoWeb3Support()
		return
	}
	if (!accountAddress) {
		toast("Please connect wallet")
		return
	}

	try {
		// TODO care about contractType here?
		const market = await getMarketContract()
		console.log("market.cancelSale: nftContract, tokenId, status, seller, conductKey", nftContract, tokenId, itemStatusToListingStatus(status), seller, conductKey)
		await market.methods.cancelSale(nftContract, tokenId, itemStatusToListingStatus(status), seller, conductKey).send({ from: accountAddress })
		const updated = { status: ItemStatus.bought, salePrice: null, seller: null }
		await updateItem(itemId, updated)
		return updated
	} catch (e) {
		toast(e.message || e.toString())
		console.error(e)
	}
}