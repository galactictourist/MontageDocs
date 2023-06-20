import '../css/table.scss'
import { useContext, useState } from 'react';
import { useParams } from 'react-router';
import AuthContext from '../ctx/Auth';
import FormContainer from './parts/FormContainer';
import { SaveButton } from './parts/SaveButton';
import TextPhrase from './parts/TextPhrase';
import { loadLiveCollection, uploadApprovedItemsMetadata } from '../func/liveCollections';
import CollectionStatusMap from '../util/collectionStatus';
import { updateBaseURI } from '../web3/updateBaseURI';
import MyCollectionContext from '../ctx/MyCollection';
import { toast } from 'react-toastify';
import { getNFTContract } from '../frontend/contractsData/addresses';
import { loadCollectionSettings } from '../func/collections';
import { ContractTypes, getContractType } from '../util/contractTypes';

export default function MyCollectionFinalize() {
	const { myCollectionStatus } = useContext(MyCollectionContext)
	const { userId, accounts: accountAddress } = useContext(AuthContext)
	const { collectionId } = useParams()

	const [finalizing, setFinalizing] = useState(false)

	if (!userId || !collectionId) return null

	const finzalize = async () => {
		if (myCollectionStatus !== CollectionStatusMap.live) {
			throw new Error("Collection is not deployed yet, no need to finalize")
		}
		setFinalizing(true)
		try {
			const { nftAddress } = await loadLiveCollection(collectionId)
			const { totalCount, baseURI, newNftIds } = await uploadApprovedItemsMetadata(collectionId)
			if (totalCount > 0 && baseURI) {
				const collectionSettings = await loadCollectionSettings(collectionId)
				const contractType = getContractType(collectionSettings)
				console.log("finalizing contractType", contractType)
				const success = await updateBaseURI(accountAddress, nftAddress, baseURI, contractType)
				if (!success) {
					toast('Failed to update base URI', { type: 'error' })
				} else if (Object.keys(newNftIds).length > 0) {
					if (contractType & ContractTypes.manyArtists) {
						const nftContract = await getNFTContract(nftAddress, contractType)
						const artists = Object.keys(newNftIds)
						console.log("nftContract.addArtists: artists", artists)
						await nftContract.methods.addArtists(artists).send({ from: accountAddress })
					}
					toast('Done!')
				}
			} else if (totalCount <= 0) {
				toast('No new or approved items found')
			}
		} finally {
			setFinalizing(false)
		}
	}

	return (
		<div>
			<TextPhrase padTop={true} isMain={false}>
				<div className="fw-700">Upload collection to IPFS storage</div>
				<div>***Only after the collection was deployed***</div>
			</TextPhrase>

			<FormContainer>
				<SaveButton saving={finalizing} disabled={finalizing} onClick={finzalize} text={finalizing ? "Finalizing..." : "Finalize"} />
			</FormContainer>
		</div>
	)
}
