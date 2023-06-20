import { ItemStatus } from './itemStatus';

export function nftLink(_itemId, { status, nftAddress, tokenId, collectionId, itemId }) {
	return parseInt(status) < ItemStatus.minted ?
		`/collection-item-mint/${collectionId}/${itemId}`
		:
		`/collection-item/${nftAddress}/${tokenId}`;
}
