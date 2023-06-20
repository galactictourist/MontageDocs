import ABI from "../frontend/contractsData/nft/NFTcontract.json";
import { toastNoWeb3Support } from '../util/toasts';
import { loadLiveCollection } from '../func/liveCollections';
import isContractOwner from "../util/isContractOwner";
import { toast } from 'react-toastify';

export async function putCapSupply(collectionId, accountAddress, capStatus) {
	const liveCollection = await loadLiveCollection(collectionId)
	const { nftAddress } = liveCollection
	if (!nftAddress) {
		toast('Collection is not active yet')
		return
	}
	if (!window.ethereum) {
		toastNoWeb3Support()
		return
	}
	const Web3 = await import('web3')
	const web3 = new Web3.default(window.ethereum)
	if (!accountAddress) {
		toast("Please connect wallet")
		return
	}
	try {
		const NFTContract = new web3.eth.Contract(ABI, nftAddress)
		const owner = await NFTContract.methods.owner().call()
		if (!isContractOwner(accountAddress, owner)) {
			console.warn("Please use owner address to call capTrigger: accountAddress, owner", accountAddress, owner)
			toast("Please use owner address to call capTrigger")
			return
		}
		await NFTContract.methods.capTrigger(capStatus).send({ from: accountAddress })
	} catch (e) {
		toast(e.message || e.toString())
		console.error(e)
	}
}
