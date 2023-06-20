import { toastNoWeb3Support } from '../util/toasts';
import { loadLiveCollection } from '../func/liveCollections';
import { toast } from 'react-toastify';
import { getNFTContract } from '../frontend/contractsData/addresses';
import { loadCollectionSettings } from '../func/collections';
import { getContractType } from '../util/contractTypes';

// this api requires stage (0: pre-mint stage, 1: mint stage). To activate the pre-mint/mint stage, we should update stageInfo with stages' scheduled time and price
export async function mintWithID(creator, tokenId, accountAddress, setMinting, collectionId, stage = 1, amount) {
	if (!window.ethereum) {
		toastNoWeb3Support()
		return
	}
	if (!accountAddress) {
		toast("Please connect wallet")
		return
	}
	const { nftAddress } = await loadLiveCollection(collectionId)
	if (!nftAddress) {
		toast('Collection is not active yet')
		return
	}
	const collectionSettings = await loadCollectionSettings(collectionId)
	const contractType = getContractType(collectionSettings)
	try {
		setMinting(true)
		const nftContract = await getNFTContract(nftAddress, contractType)
		const { BigNumber } = await import('ethers')
		const ethAmount = BigNumber.from(Math.round(parseFloat(amount) * 1e18).toString())
		console.log("NFTContract.mintWithID: tokenId, ethAmount, amount", tokenId, stage, ethAmount, amount)
		const r = await nftContract.methods.mintWithID(parseInt(tokenId)).send({ from: accountAddress, value: ethAmount })
		return {
			success: true,
			nftAddress,
			firstTokenId: r.events.TokenMinted.returnValues.firstId,
			qty: 1
		}
	} catch (e) {
		toast(e.message || e.toString())
		console.error(e)
	} finally {
		setMinting(false)
	}
}
