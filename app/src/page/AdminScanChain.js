import { useState } from 'react'
import FormContainer from './parts/FormContainer'
import TextPhrase from './parts/TextPhrase'
import { AppControl } from './parts/AppControl'
import { SaveButton } from './parts/SaveButton'
import { mintStage } from '../web3/util/stages'
import { scanAndDealAdminOnly } from '../func/tx'

export default function AdminScanChain() {
	const [scanInProgress, setScanInProgress] = useState(false)
	const [block, setBlock] = useState(16739303) // 16739303
	const [collectionId, setCollectionId] = useState(3) // artis collection
	const [stage, setStage] = useState(mintStage)
	const [chainId, setChainId] = useState(1)

	const doScan = async () => {
		setScanInProgress(true)
		try {
			await scanAndDealAdminOnly(block, collectionId, stage, chainId)
		} catch (e) {
			console.error(e)
		} finally {
			setScanInProgress(false)
		}
	}

	return (<>
		<FormContainer>
			<TextPhrase>Scan chain to process fees:</TextPhrase>
			<AppControl type="text" name="block" value={block} setValue={setBlock} label="From block" />
			<AppControl type="text" name="collectionId" value={collectionId} setValue={setCollectionId} label="Collection ID" />
			<AppControl type="text" name="stage" value={stage} setValue={setStage} label="Stage (50001 or 50002)" />
			<AppControl type="text" name="chainId" value={chainId} setValue={setChainId} label="Chain ID (1 - mainnet)" />
			<SaveButton onClick={doScan} text="Scan chain" disabled={scanInProgress} saving={scanInProgress} />
		</FormContainer>
	</>
	)
}