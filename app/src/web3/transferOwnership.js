import ABI from "../frontend/contractsData/nft/NFTcontract.json"
import { loadCuratorAddress } from '../func/collections'

export async function transferOwnership(currentOwner, nftAddress, collectionId) {
	if (!currentOwner) {
		throw new Error("Please connect wallet")
	}
	const curator = await loadCuratorAddress(collectionId)
	if (!curator) {
		throw new Error("Curator address empty")
	}
	const Web3 = await import('web3')
	const web3 = new Web3.default(window.ethereum)
	const NFTContract = new web3.eth.Contract(ABI, nftAddress)
	console.log("NFTContract.transferOwnership: curator", curator)
	await NFTContract.methods.transferOwnership(curator).send({ from: currentOwner })
	return true
}
