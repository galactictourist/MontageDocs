import { useState, useContext, useEffect } from 'react'
import CallForAction from './prompts/CallForAction'
import CardsFluidGrid from './parts/CardsFluidGrid'
import AuthContext from '../ctx/Auth'
import { ItemStatus } from '../util/itemStatus'
import FormContainer from './parts/FormContainer'
import { AppControl } from './parts/AppControl'
import { getMultipleNFTs, getWalletNFTs } from '../func/nfts'
import TextPhrase from './parts/TextPhrase'
import { useNavigate } from 'react-router'
import CardButtonOverlay from './parts/CardButtonOverlay'
import { useLocalhost } from '../frontend/contractsData/addresses'
import { loadCollectionIdByNFTAddress, getMyListedItems } from '../func/liveCollections'
import InfiniteScroll from 'react-infinite-scroller';
import Spinner from '../util/Spinner'
import Loading from './prompts/Loading'
import { cancelSale } from '../web3/cancelSale'
import { fetchMimeType } from '../util/mimeTypes'
import ItemStatusCardOverlay from './parts/ItemStatusCardOverlay'

const completeItemsData = async (items) => {
	return await Promise.all(items?.map(async item => {
		const metadata = JSON.parse(item.metadata)
		if (metadata?.image?.startsWith("ipfs://")) {
			metadata.image = "https://ipfs.io/ipfs/" + metadata.image.substring("ipfs://".length)
		}
		return {
			...item,
			collectionName: item.name,
			...metadata,
			name: metadata?.name || ('#' + item.token_id),
			tokenId: item.token_id,
			file: metadata?.animation_url || metadata?.image,
			mimeType: metadata?.mime_type || (await fetchMimeType(metadata?.animation_url || metadata?.image))
		}
	}))
}

const chain = process.env.REACT_APP_CHAINID

export default function MyCollectedItems() {
	const { accounts: accountAddress } = useContext(AuthContext)
	const [loading, setLoading] = useState(false)
	const [items, setItems] = useState([])
	const [listedTokens, setListedTokens] = useState(null)
	const [mayHaveMore, setMayHaveMore] = useState(true)
	const [listingStatus, setListingStatus] = useState(ItemStatus.all)
	const [cursor, setCursor] = useState(null)
	const navigate = useNavigate()

	const doLoadItems = async (aCursor, listingStatus, listedTokens) => {
		if (!accountAddress) return
		if (useLocalhost) {
			console.warn("Using local chain. getWalletNFTs can be called only on testnet or mainnet")
			return
		}
		let items, newCursor
		// eslint-disable-next-line
		if (listingStatus == ItemStatus.all) {
			const r = await getWalletNFTs(accountAddress, chain, 9, aCursor || null)
			setCursor(newCursor = r?.data?.cursor)
			items = r?.data?.result
		} else { // if (listingStatus == ItemStatus.onSale) {
			// NOTE returns up to 25 items
			// https://docs.moralis.io/web3-data-api/reference/get-multiple-nfts
			items = await getMultipleNFTs(chain, listedTokens)
		}
		const loadedItems = await completeItemsData(items)
		if (loadedItems?.length) {
			setItems(items => aCursor ? [...items, ...loadedItems] : loadedItems)
			setMayHaveMore(!!newCursor)
		} else {
			if (!aCursor) setItems([])
			setMayHaveMore(false)
		}
	}

	useEffect(() => {
		if (accountAddress) {
			getMyListedItems().then(setListedTokens)
		}
	}, [accountAddress])

	useEffect(() => {
		if (accountAddress && listedTokens !== null) {
			setLoading(true)
			doLoadItems(0, listingStatus, listedTokens).finally(() => setLoading(false))
		}
		// eslint-disable-next-line
	}, [accountAddress, listingStatus, listedTokens])

	const linkTo = (_id, item) => `/collection-item/${item.nftContract || item.token_address}/${item.tokenId || item.token_id}`

	const getItemCardOverlays = (_id, item) => {
		const listItem = (e) => {
			e.preventDefault()
			navigate(`/list-item-for-sale/${item.token_address}/${item.token_id}`)
		}
		const cancelListedItem = async (e) => {
			e.preventDefault()
			const { itemId, conductKey } = await loadCollectionIdByNFTAddress(item.token_address, item.token_id)
			const updated = await cancelSale({
				accountAddress,
				itemId,
				nftContract: item.token_address,
				tokenId: item.token_id,
				status: ItemStatus.onSale,
				seller: accountAddress,
				conductKey
			})
			if (updated) {
				// eslint-disable-next-line
				setListedTokens(listedTokens => listedTokens.filter(t => t.token_address?.toLowerCase() != item.token_address?.toLowerCase() || t.token_id != item.token_id))
			}
		}
		// eslint-disable-next-line
		if (listedTokens.some(t => t.token_address?.toLowerCase() == item.token_address?.toLowerCase() && t.token_id == item.token_id)) {
			return <>
				<ItemStatusCardOverlay itemStatus={ItemStatus.onSale} moreCls="top-left always-visible bg-dark item-status-on-card" />
				<CardButtonOverlay text="Cancel" onClick={async (e) => await cancelListedItem(e)} />
			</>
		}
		return <CardButtonOverlay text="List" onClick={listItem} />
	}

	if (loading) return <Loading />
	return (
		<div>
			<TextPhrase padTop={true}>View and list your items</TextPhrase>

			<FormContainer style={{ width: '100%', maxWidth: 936 }}>
				<AppControl type="select" name="itemsFilter" value={listingStatus} setValue={setListingStatus} style={{ width: '100%' }} options={[
					{ value: ItemStatus.all, text: 'All items' },
					{ value: ItemStatus.onSale, text: 'Listed' },
					// { value: ListingStatus.Sold, text: 'Sold' },
					// { value: ListingStatus.Cancelled, text: 'Cancelled' },
				]} />
			</FormContainer>

			<InfiniteScroll
				initialLoad={false}
				loadMore={() => doLoadItems(cursor, listingStatus, listedTokens)}
				hasMore={mayHaveMore}
				loader={<div className="ta-c" key={0}><Spinner /></div>}
			>
				<CardsFluidGrid
					list={items}
					appendToCard={getItemCardOverlays}
					cardTo={linkTo}
					onEmpty={<CallForAction title="No items yet" />}
					srcKey="file" srcMimeType="mimeType" idKey="token_id"
					footerKey="name"
					hasFavToggleButton={false}
					onFavToggleClick={undefined}
					isFav={false}
				// eslint-disable-next-line
				// moreFooter={(_itemId, item) => item.status != listingStatus.Any ? <div className="card-footer-sub-line">Current price: <FontIcon name="eth" inline={true} />{item.priceETH} <FontIcon name="dollar" inline={true} />{item.priceUSD}</div> : null}
				/>
			</InfiniteScroll>
		</div>
	)
}