import ABI from "../frontend/contractsData/nft/NFTcontract.json";
import { toastNoWeb3Support } from '../util/toasts';
import { loadLiveCollection } from '../func/liveCollections';
import { toast } from 'react-toastify';
import isContractOwner from "../util/isContractOwner";

export async function updateOperatorsFilter(collectionId, accountAddress, marketAddresses, tradeBits) {
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
	if (!isContractOwner(accountAddress)) {
		toast("Please use owner address to activate the smart contract")
		return
	}
	try {
		const NFTContract = new web3.eth.Contract(ABI, nftAddress)
		await NFTContract.methods.updateOperatorsFilter(marketAddresses, tradeBits).send({ from: accountAddress })
	} catch (e) {
		toast(e.message || e.toString())
		console.error(e)
	}
}
