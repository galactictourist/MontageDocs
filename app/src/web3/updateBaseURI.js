import { toastNoWeb3Support } from '../util/toasts';
import { toast } from 'react-toastify';
import { getNFTContract } from "../frontend/contractsData/addresses";

export async function updateBaseURI(accountAddress, nftAddress, baseURI, contractType) {
	if (!nftAddress) {
		toast('Collection is not active yet')
		return
	}
	if (!window.ethereum) {
		toastNoWeb3Support()
		return
	}
	if (!accountAddress) {
		toast("Please connect wallet")
		return
	}
	if (!baseURI) {
		console.error("Unexpected empty baseURI")
		toast("Unexpected empty baseURI")
		return
	}
	try {
		const nftContract = await getNFTContract(nftAddress, contractType)
		const uri = baseURI.endsWith('/') ? baseURI : baseURI + '/'
		console.log("NFTContract.updateBaseURI: uri", uri)
		await nftContract.methods.updateBaseURI(uri).send({ from: accountAddress })
		return true
	} catch (e) {
		toast(e.message || e.toString())
		console.error(e)
	}
}
