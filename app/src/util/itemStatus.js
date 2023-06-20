export const ItemStatus = {
	needApproval: 1,
	approved: 2,
	minted: 3,
	onSale: 4,
	bought: 5,
	minting: 30,
	all: 99
}

export const canBeMintedOrBought = (status) => {
	// eslint-disable-next-line
	return status == ItemStatus.approved || status == ItemStatus.onSale
}

export const itemStatusToText = (status, postfix = '') => {
	switch (status) {
		case ItemStatus.needApproval: return 'Waiting for approval' + postfix
		case ItemStatus.approved: return 'Approved' + postfix
		case ItemStatus.minted: return 'Minted' + postfix
		case ItemStatus.onSale: return 'Listed' + postfix
		case ItemStatus.bought: return 'Sold' + postfix
		default: return ''
	}
}

export const ListingStatus = {
	Any: -1,
	Active: 0,
	Sold: 1,
	Cancelled: 2
}

export const itemStatusToListingStatus = (status) => {
	// eslint-disable-next-line
	return status == ItemStatus.onSale ? ListingStatus.Active : ListingStatus.Any
}