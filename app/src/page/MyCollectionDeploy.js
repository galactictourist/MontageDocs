import '../css/table.scss'
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import AuthContext from '../ctx/Auth';
import MyCollectionContext from '../ctx/MyCollection';
import { updateCollection, loadCollectionSettings, loadCuratorAddress } from '../func/collections';
import CollectionStatusMap from '../util/collectionStatus';
import FormContainer from './parts/FormContainer';
import { SaveButton } from './parts/SaveButton';
import TextPhrase from './parts/TextPhrase';
import { toast } from 'react-toastify';
import { deployNFTContract, deployBufferContractForCollection } from '../web3/deployNFTContract';
import { createLiveCollection, loadLiveCollection } from '../func/liveCollections';
import { CardImageSpecs, getOptimizeImgUrl } from '../util/optimizedImages';
import imagePlaceholder from '../img/image-placeholder.svg'
import TxFailedContext from '../ctx/TxFailedContext';
import { Checklist } from './parts/Checklist';
import { DeploySuccessPopup } from './DeploySuccessPopup';
import { EtherScanLink } from './parts/activityTables/helper/EtherScanLink';

export default function MyCollectionDeploy() {
	const { setTxFailedData } = useContext(TxFailedContext)
	const { userId, accounts: accountAddress } = useContext(AuthContext)
	const { myCollectionName, myCollectionStatus, setMyCollectionStatus, myCollectionProfileImage, isImportExistingCollection, importedNFTAddress } = useContext(MyCollectionContext)
	const { collectionId } = useParams()
	const [activating, setActivating] = useState(false)
	const [postDeploymentData, setPostDeploymentData] = useState(null)
	const [isRetry, setIsRetry] = useState(false)
	const [postActivationData, setPostActivationData] = useState(null)
	const [deploySuccessOpen, setDeploySuccessOpen] = useState(false)

	const isContractActive = () => myCollectionStatus === CollectionStatusMap.live

	const isValidToActivate = (samePriceForAllNFT, premintPrice, mintPrice, selfMinted) => {
		if (!selfMinted) {
			if (samePriceForAllNFT) {
				if (!premintPrice || parseFloat(premintPrice) <= 0) {
					toast('Please set private mint price in the GENERAL page, and then try again')
					return false
				}
				if (!mintPrice || parseFloat(mintPrice) <= 0) {
					toast('Please set public mint price in the GENERAL page, and then try again')
					return false
				}
				if (parseFloat(premintPrice) >= parseFloat(mintPrice)) {
					toast('Mint price is usually set higher than private mint price.')
					return false
				}
			}
		}
		return true
	}

	useEffect(() => {
		if (!postActivationData) {
			if (collectionId > 0) {
				if (myCollectionStatus === CollectionStatusMap.live) {
					loadLiveCollection(collectionId).then(setPostActivationData)
				}
			}
		}
	}, [collectionId, myCollectionStatus, postActivationData])

	const runPostDeployment = async (activationResult, curatorAddress) => {
		setActivating(true)
		try {
			let success = activationResult?.success
			const { liveCollectionData } = activationResult
			if (success) {
				await createLiveCollection(liveCollectionData)
				await updateCollection(collectionId, { status: CollectionStatusMap.live })
				setMyCollectionStatus(CollectionStatusMap.live)
				setPostActivationData({
					nftAddress: liveCollectionData.nftAddress,
					groupAddress: liveCollectionData.groupAddress,
					creatorRoyalties: activationResult.creatorRoyalties,
					curatorAddress
				})
				setDeploySuccessOpen(true)
			} else {
				setTxFailedData('Deployment of the contract could not be completed', myCollectionProfileImage ? getOptimizeImgUrl(myCollectionProfileImage, CardImageSpecs) : imagePlaceholder)
			}
		} catch (e) {
			setIsRetry(true)
			throw e
		} finally {
			setActivating(false)
		}
	}

	const activateClick = async () => {
		let activationResult
		let curatorAddress
		let selfMinted
		setActivating(true)
		try {
			curatorAddress = await loadCuratorAddress(collectionId)
			if (!curatorAddress) throw new Error("Missing curator address")
			const collectionSettings = await loadCollectionSettings(collectionId)
			const { samePriceForAllNFT, premintPrice, mintPrice } = collectionSettings
			selfMinted = collectionSettings.selfMinted
			if (isValidToActivate(samePriceForAllNFT, premintPrice, mintPrice, selfMinted)) {
				activationResult = await deployNFTContract(
					accountAddress,
					myCollectionName,
					collectionId,
					myCollectionName,
					myCollectionName,
					(mintPrice || 0.01).toFixed(4),
					collectionSettings
				)
			}
		} finally {
			console.log('finally setActivating(false)')
			setActivating(false)
		}
		if (activationResult) {
			setPostDeploymentData({ activationResult, curatorAddress })
			await runPostDeployment(activationResult, curatorAddress)
		}
	}

	if (!userId || !collectionId) return null

	const deployBufferContract = async () => {
		let activationResult
		setActivating(true)
		try {
			const collectionSettings = await loadCollectionSettings(collectionId)
			activationResult = await deployBufferContractForCollection(accountAddress, myCollectionName, collectionSettings, collectionId, importedNFTAddress)
		} finally {
			setActivating(false)
		}
		if (activationResult) {
			setPostDeploymentData({ activationResult, curatorAddress: null })
			await runPostDeployment(activationResult, null)
		}
	}

	if (isImportExistingCollection) {
		return <>
			<TextPhrase padTop={true} isMain={true}>Deploy contract</TextPhrase>
			<TextPhrase padTop={true} fw400={true} style={{ maxWidth: 600, lineHeight: 1.5 }} cls="mx-auto" tac={false}>
				Deploying your “Creators’ Pie” contract will incur a small gas fee. After deploying, you’ll receive a new contract address that you can use to replace the address where exchanges/marketplaces you have listed your NFTs for sale at are sending royalty payments to. You’ll be the owner of this new contract address, using the crypto wallet you’re currently signed in with. You can find your new contract address below, and if you need any help or have any questions, we’re here to assist you.
			</TextPhrase>
			<FormContainer>
				<SaveButton saving={activating} disabled={isContractActive() || activating} text={isContractActive() ? "Deployed" : "Deploy contract"} onClick={async () => await deployBufferContract()} />
			</FormContainer>
			<TextPhrase padTop={true} isMain={false} doRender={!!postActivationData?.groupAddress}>
				<EtherScanLink address={postActivationData?.nftAddress} text="Your NFT contract address" />
				<br />
				<EtherScanLink address={postActivationData?.groupAddress} text="Your group contract address" />
			</TextPhrase>
			<DeploySuccessPopup visible={deploySuccessOpen} setVisible={setDeploySuccessOpen} postActivationData={postActivationData} />
		</>
	}
	return (
		<div>
			<TextPhrase padTop={true} isMain={false}>Until you deploy contract you can make as many changes you want<br />Please make sure all of the following are checked.</TextPhrase>

			<Checklist moreCls="pt-2 mx-auto" style={{ maxWidth: 188 }}>
				<li>All team & artists wallets are updated</li>
				<li>All items are approved and set</li>
				<li>All pricing is correct</li>
				<li>All collections settings are to your liking</li>
				<li>Rights & IP are set</li>
			</Checklist>

			<TextPhrase padTop={true} style={{ textTransform: 'uppercase', color: isContractActive() ? "#00BD9B" : "#FF47AF" }}>{isContractActive() ? "Smart contract is deployed" : "Smart contract is not deployed yet"}</TextPhrase>

			<FormContainer>
				{isContractActive() ?
					null :
					isRetry ?
						<SaveButton saving={activating} disabled={isContractActive() || activating} text="Run post deployment" onClick={async () => await runPostDeployment(postDeploymentData.activationResult, postDeploymentData.curatorAddress)} />
						:
						<SaveButton saving={activating} disabled={isContractActive() || activating} text="Deploy contract" onClick={async () => await activateClick()} />
				}
			</FormContainer>
			<TextPhrase padTop={true} isMain={false} doRender={!!postActivationData?.groupAddress}>
				<EtherScanLink address={postActivationData?.nftAddress} text="Your NFT contract address" />
				<br />
				<EtherScanLink address={postActivationData?.groupAddress} text="Your group contract address" />
			</TextPhrase>
			<br /><br />

			<DeploySuccessPopup visible={deploySuccessOpen} setVisible={setDeploySuccessOpen} postActivationData={postActivationData} />
		</div>
	)
}