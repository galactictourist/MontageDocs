import { loadCollectionPies, mintStagePieIndex, saleStagePieIndex, loadTeam } from '../func/collections';
import { getNFTContractFactory, getBufferContractFactory, getBufferContract } from '../frontend/contractsData/addresses';
import { toast } from 'react-toastify';
import { toastNoWeb3Support } from '../util/toasts';
import { getPartnerShares, getShareValues, getShares } from './util/getShares';
import { ContractTypes, getContractType } from '../util/contractTypes';

export async function deployBufferContractForCollection(accountAddress, myCollectionName, collectionSettings, collectionId, nftContract) {
	if (!nftContract) {
		toast("NFT contract address is not set", { type: 'error' })
		return
	}
	if (!window.ethereum) {
		toastNoWeb3Support()
		return
	}
	if (!accountAddress) {
		toast("Please connect wallet", { type: 'error' })
		return
	}

	const owner = accountAddress
	const contractType = getContractType(collectionSettings)
	const groupFactory = await getBufferContractFactory(contractType)
	console.log("contract deployments")
	const pies = await loadCollectionPies(collectionId, false)
	const salesPie = getShares(pies[saleStagePieIndex])
	const shares = [salesPie[3], salesPie[4], salesPie[1]]
	// validate sum of shares is 10000
	console.log("shares", shares)
	const sum = shares.reduce((a, b) => a + b, 0)
	if (sum !== 10000) {
		toast("Shares must sum to 10000 BPS", { type: 'error' })
		return
	}

	const team = await loadTeam(collectionId)
	const coreTeam = team?.map((member) => member.walletAddress) || []
	const coreTeamShares = getPartnerShares(team)
	// validate sum of shares is 10000
	const sum2 = coreTeamShares.reduce((a, b) => a + b, 0)
	if (sum2 !== 10000) {
		toast("Core team shares must sum to 10000 BPS", { type: 'error' })
		return
	}

	console.log("group.genesis(myCollectionName, shares, coreTeam, coreTeamShares, owner)", myCollectionName, shares, coreTeam, coreTeamShares, owner)
	const groupContractReceipt = await groupFactory.methods.genesis(myCollectionName, shares, coreTeam, coreTeamShares, owner).send({ from: owner })
	const groupAddress = groupContractReceipt.events.ContractDeployed.returnValues.group
	console.log("groupAddress", groupAddress)

	return {
		success: true,
		creatorRoyalties: pies[saleStagePieIndex].creatorRoyalties,
		liveCollectionData: {
			collectionId,
			nftAddress: nftContract,
			groupAddress
		}
	}
}

export async function deployNFTContract(
	accountAddress,
	myCollectionName,
	collectionId,
	tokenName,
	tokenSymbol,
	publicSalePriceETH,
	collectionSettings
) {
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
		const maxSupply = collectionSettings.canGrow ? 0 : collectionSettings.maxItems || 10000
		const owner = accountAddress
		const pies = await loadCollectionPies(collectionId, collectionSettings.manyArtists)
		const team = await loadTeam(collectionId)
		// const notSelfMintedAndHasPrices = !collectionSettings.selfMinted && (parseFloat(collectionSettings.premintPrice) > 0 || parseFloat(collectionSettings.mintPrice) > 0)

		const contractType = getContractType(collectionSettings)
		const nftFactory = await getNFTContractFactory(contractType)
		const groupFactory = await getBufferContractFactory(contractType)

		console.log("contract deployments")
		console.log("group.genesis(myCollectionName, owner)", myCollectionName, owner)
		const groupContractReceipt = await groupFactory.methods.genesis(myCollectionName, owner).send({ from: accountAddress })
		const groupAddress = groupContractReceipt.events.ContractDeployed.returnValues.group
		console.log("groupAddress", groupAddress)
		const collectAddress = groupAddress

		console.log("nft.genesis(collectAddress, accountAddress, tokenName, tokenSymbol, maxSupply, pies[saleStagePieIndex].creatorRoyalties)", collectAddress, accountAddress, tokenName, tokenSymbol, maxSupply, pies[saleStagePieIndex].creatorRoyalties)
		const nftGenesisArgs = [collectAddress, accountAddress, tokenName, tokenSymbol]
		if (contractType & ContractTypes.setNumber) nftGenesisArgs.push(collectionSettings.maxItems || 10000)
		nftGenesisArgs.push(pies[saleStagePieIndex].creatorRoyalties * 100) // convert to BPS
		const nftContractReceipt = await nftFactory.methods.genesis(...nftGenesisArgs).send({ from: accountAddress })
		const nftAddress = nftContractReceipt.events.ContractDeployed.returnValues.clone
		console.log("nftAddress", nftAddress)

		const bufferContract = await getBufferContract(groupAddress, contractType)

		// update settings
		let success = await new Promise((resolve, reject) => {
			let totalToResolve = 0
			const oneMoreToResolve = (request) => {
				totalToResolve++
				console.log("oneMoreToResolve", totalToResolve)
				return request()
			}
			let resolvedCounter = 0
			const oneMoreResolved = () => {
				console.log("oneMoreResolved", resolvedCounter + 1)
				return ++resolvedCounter === totalToResolve ? resolve(true) : null
			}
			const waitForReceipt = (tx, cb) => {
				web3.eth.getTransactionReceipt(tx, (error, reciept) => {
					if (reciept) cb(reciept)
					else if (error) reject(error)
					else window.setTimeout(() => waitForReceipt(tx, cb), 1000)
				})
			}
			const batchRequestCallback = (error, tx) => {
				if (error) reject(error)
				else if (tx) {
					waitForReceipt(tx, (reciept) => {
						if (reciept?.status === true) oneMoreResolved()
						else reject(reciept)
					})
				}
			}

			const setSetNftAddressRequest = () => {
				console.log("setSetNftAddressRequest", nftAddress)
				return bufferContract.methods.setNftAddress(nftAddress).send.request({ from: accountAddress }, batchRequestCallback)
			}
			const setSetPercentsAndAddCoreTeamRequest = () => {
				const coreTeamAddresses = team?.map((member) => member.walletAddress) || []
				// Add core team and share percentages in BPS format 
				// percentages order postmint 0-4, mint 5-9 / coreteam,allartist,singleartist,holders,montage
				const values = getShareValues(pies[saleStagePieIndex], pies[mintStagePieIndex])
				const c_teamPercs = getPartnerShares(team)
				console.log("setPercentsAndAddCoreTeam: values, coreTeamAddresses, c_teamPercs", values, coreTeamAddresses, c_teamPercs)
				return bufferContract.methods.setPercentsAndAddCoreTeam(values, coreTeamAddresses, c_teamPercs).send.request({ from: accountAddress }, batchRequestCallback)
			}
			const setSetAdminRequest = () => {
				const admin = process.env.REACT_APP_OWNER_ADDRESS
				console.log("setSetAdminRequest", admin)
				return bufferContract.methods.setAdmin(admin).send.request({ from: accountAddress }, batchRequestCallback)
			}
			const setSetSignerRequest = () => {
				const signer = process.env.REACT_APP_OWNER_ADDRESS
				console.log("setSetSignerRequest", signer)
				return bufferContract.methods.setSigner(signer).send.request({ from: accountAddress }, batchRequestCallback)
			}

			const batch = new web3.BatchRequest()
			batch.add(oneMoreToResolve(setSetNftAddressRequest))
			batch.add(oneMoreToResolve(setSetPercentsAndAddCoreTeamRequest))
			if (bufferContract.methods.setAdmin) {
				batch.add(oneMoreToResolve(setSetAdminRequest))
			}
			if (bufferContract.methods.setSigner) {
				if (contractType & ContractTypes.manyArtists) {
					batch.add(oneMoreToResolve(setSetSignerRequest))
				}
			}
			// 	console.log("addArtistsAndNFTs: currently implemented in the finalize step app\src\page\MyCollectionFinalize.js")
			// batch.add(oneMoreToResolve(setAddArtistsAndNFTsRequest))
			batch.execute()
		})

		return {
			success,
			creatorRoyalties: pies[saleStagePieIndex].creatorRoyalties,
			liveCollectionData: {
				collectionId,
				nftAddress,
				groupAddress,
				tokenSymbol,
				maxPublicMint: maxSupply,
				publicSalePriceETH,
				collectAddress
			}
		}
	} catch (e) {
		toast(e.message || e.toString())
		console.error(e)
	}
}