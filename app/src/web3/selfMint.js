import { toastNoWeb3Support } from '../util/toasts';
import { loadLiveCollection } from '../func/liveCollections';
import { toast } from 'react-toastify';
import { getNFTContract } from "../frontend/contractsData/addresses";
import { getMintStage } from '../util/getMintStage';

export async function selfMint(mintNFTQty = 1, accountAddress, setMinting, collectionId, contractType) {
	if (!window.ethereum) {
		toastNoWeb3Support()
		return
	}
	if (!accountAddress) {
		toast("Please connect wallet")
		return
	}
	try {
		setMinting(true)
		const liveCollection = await loadLiveCollection(collectionId)
		const { nftAddress } = liveCollection
		if (nftAddress?.length > 0) {
			const nftContract = await getNFTContract(nftAddress, contractType)
			// TODO check isMintActive
			const currentStage = await getMintStage(nftContract)
			if (currentStage === 0) {
				throw new Error('Minting is not currently active.')
				// stage 0: pre-mint stage maps to stage 1: mint stage
				// stage 1: mint stage maps to stage 2: post-mint stage
				// can only be called by owner
				//await nftContract.methods.setStage(stage + 1).send({ from: accountAddress })
			}
			const totalSupply = parseInt(await nftContract.methods.totalSupply().call()) + 1
			console.log("NFTContract.selfMint: mintNFTQty", mintNFTQty)
			const r = await nftContract.methods.selfMint(parseInt(mintNFTQty)).send({ from: accountAddress })
			//r.events.TokensMinted.returnValues.mintQty
			return {
				success: true,
				nftAddress: r.events.TokensMinted.returnValues.contractAddress,
				firstTokenId: totalSupply,
				qty: parseInt(mintNFTQty)
			}
		} else {
			toast('Collection is not active yet')
		}
	} catch (e) {
		toast(e.message || e.toString())
		console.error(e)
	} finally {
		setMinting(false)
	}
}
