import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { loadLiveCollection } from '../func/liveCollections';
import CollectionMarketplace from './CollectionMarketplace';
import { TRADE_TABS as TABS } from './parts/Tabs';
import TextPhrase from './parts/TextPhrase';

export default function MyCollectionActivity() {
	const { collectionId } = useParams()
	const [nftAddress, setNFTAddress] = useState(null)
	useEffect(() => {
		if (collectionId) {
			loadLiveCollection(collectionId).then(r => {
				setNFTAddress(r.nftAddress)
			})
		}
	}, [collectionId])

	return <>
		<TextPhrase padTop={true}>View all collection activities</TextPhrase>
		<CollectionMarketplace selectedTabContentId={TABS.SALES.id} nftAddress={nftAddress} hasItemsTab={false} />
	</>
}