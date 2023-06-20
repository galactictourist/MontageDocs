import '../css/table.scss'
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import AuthContext from '../ctx/Auth';
import FormContainer from './parts/FormContainer';
import { SaveButton } from './parts/SaveButton';
import TextPhrase from './parts/TextPhrase';
import { loadCollectionIdByNFTAddress, loadLiveCollection, loadTotalItemsToMint } from '../func/liveCollections';
import CollectionStatusMap from '../util/collectionStatus';
import MyCollectionContext from '../ctx/MyCollection';
import { getNFTContract } from '../frontend/contractsData/addresses';
import { AppControl } from './parts/AppControl';
import { loadCollectionSettings } from '../func/collections';
import { getContractType } from '../util/contractTypes';
import { toast } from 'react-toastify';
import { getMintStage } from '../util/getMintStage';

export default function MyCollectionMintStage() {
	const { myCollectionStatus } = useContext(MyCollectionContext)
	const { userId, accounts: accountAddress } = useContext(AuthContext)
	const { collectionId } = useParams()

	const [saving, setSaving] = useState(false)
	const [nftContract, setNFTContract] = useState(null)
	const [stage, setStage] = useState("0")

	useEffect(() => {
		if (collectionId && userId) {
			if (myCollectionStatus === CollectionStatusMap.live) {
				loadLiveCollection(collectionId).then(({ nftAddress }) => {
					if (nftAddress) {
						(async () => {
							console.log("nftAddress", nftAddress)
							const { collectionId } = await loadCollectionIdByNFTAddress(nftAddress)
							const collectionSettings = await loadCollectionSettings(collectionId)
							const contractType = getContractType(collectionSettings)
							getNFTContract(nftAddress, contractType).then(setNFTContract)
						})()
					}
				})
			}
		}
	}, [collectionId, myCollectionStatus, userId])
	useEffect(() => {
		getMintStage(nftContract).then(stage => setStage(stage.toString()))
	}, [nftContract])

	if (!userId || !collectionId) return null

	const save = async () => {
		if (myCollectionStatus !== CollectionStatusMap.live) {
			throw new Error("Collection is not deployed yet")
		}
		if (nftContract === null) {
			throw new Error("NFT contract is not loaded yet")
		}
		setSaving(true)
		try {
			const totalItemsToMint = await loadTotalItemsToMint(collectionId)
			if (totalItemsToMint > 0) {
				await nftContract.methods.setStage(stage).send({ from: accountAddress })
				toast('Mint stage updated')
			} else {
				throw new Error("No items to mint... If you just deployed your collection then go to the FINALIZE page to finalize it.")
			}
		} finally {
			setSaving(false)
		}
	}

	return (
		<div>
			<TextPhrase padTop={true} isMain={false}>
				<div className="fw-700">Manual mint activation</div>
				<div>***Only after the collection was deployed and finalized at least once***</div>
			</TextPhrase>

			<FormContainer>
				<AppControl label="Stage" value={stage} setValue={setStage} type="select" options={[
					{ value: "0", text: "0 - INACTIVE" },
					{ value: "1", text: "1 - PREMINT" },
					{ value: "2", text: "2 - PUBLIC" },
				]} />
				<SaveButton saving={saving} disabled={saving} onClick={save} text={saving ? "Saving..." : "Save"} />
			</FormContainer>
		</div>
	)
}
