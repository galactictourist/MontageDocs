const CollectionStatusMap = {
	draft: 0,
	live: 1
}

export default CollectionStatusMap

export const DefaultCollectionStatus = CollectionStatusMap.draft

export const CollectionStatuses = [
	CollectionStatusMap.draft,
	CollectionStatusMap.live
]

export const CollectionStatusTextMap = {
	draft: 'Draft',
	live: 'Live'
}