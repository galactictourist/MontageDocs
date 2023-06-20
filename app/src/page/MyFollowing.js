import { useState, useEffect, useContext } from 'react'
import Loading from './prompts/Loading'
import CallForAction from './prompts/CallForAction'
import CardsFluidGrid from './parts/CardsFluidGrid'
import AuthContext from '../ctx/Auth'
import FontIcon from '../fontIcon/FontIcon'
import { RolesMap } from '../util/roles'
import { addUserItemRoles, loadMyFollowing, removeUserItemRoles } from '../func/items'
import { toast } from 'react-toastify'
import FormContainer from './parts/FormContainer'
import { AppControl } from './parts/AppControl'
import { getWalletNFTs } from '../func/nfts'
import TextPhrase from './parts/TextPhrase'

const FOLLOW_COLLECTIONS = 'collections'
const FOLLOW_ITEMS = 'items'

export default function MyFollowing() {
	const { userId, accounts: walletAddress } = useContext(AuthContext)
	const [loading, setLoading] = useState(false)
	const [items, setItems] = useState([])
	const [mayHaveMore, setMayHaveMore] = useState(true)
	const [filter, setFilter] = useState({})
	const [cursor, setCursor] = useState(null)
	const parsedFilter = () => {
		const { roles, status } = JSON.parse(filter.itemsFilter)
		return { roles, status }
	}
	const isFromMoralis = () => parsedFilter().roles === RolesMap.owner

	const doLoadItems = async (fetchOffset) => {
		const pageLimit = 9
		const { roles, status } = parsedFilter()
		if (isFromMoralis()) {
			// const walletAddressDemo = '0x017347cb75aC8725608e593EA35d83f9B2b3cfb8'
			getWalletNFTs(walletAddress /*walletAddressDemo*/, process.env.REACT_APP_CHAINID_DEMO, pageLimit, fetchOffset > 0 ? cursor : null).then(r => {
				const { cursor, result } = r.data
				setCursor(cursor)
				const tmp = result.map(r => {
					const metadata = JSON.parse(r.metadata)
					if (metadata?.image?.startsWith("ipfs://")) {
						metadata.image = "https://ipfs.io/ipfs/" + metadata.image.substring("ipfs://".length)
					}
					return {
						...r,
						collectionName: r.name,
						...metadata,
						name: metadata?.name || ('#' + r.token_id)
					}
				})
				doSetItems(tmp, null)
			})
		} else {
			const tmp = await loadMyFollowing(userId, fetchOffset, pageLimit, roles, status)
			doSetItems(tmp)
		}

		function doSetItems(tmp) {
			if (tmp?.length) {
				setItems(items => fetchOffset > 0 ? [...items, ...tmp] : [...tmp])
				if (tmp.length < pageLimit)
					setMayHaveMore(false)
			} else {
				if (fetchOffset === 0) {
					setItems([])
				}
				setMayHaveMore(false)
			}
		}
	}

	useEffect(() => {
		if (userId) {
			setLoading(true)
			doLoadItems(0).then(() => setLoading(false))
		}
		// eslint-disable-next-line
	}, [userId, filter])

	const linkTo = (id, item) => `/collection-item/${item.collectionId || 0}/${id}`

	const onFavToggleClick = (itemId, isFollower, idx) => {
		(isFollower ? removeUserItemRoles(userId, itemId, RolesMap.follower) : addUserItemRoles(userId, itemId, RolesMap.follower))
		setItems(items => {
			const tmp = [...items]
			tmp[idx].roles ^= RolesMap.follower
			return tmp
		})
	}

	const listItemClick = () => { toast('TODO list item') }

	if (!userId) return null
	if (loading) return <Loading />
	return (
		<div>
			<div className="pt-2" style={{ textAlign: 'right', marginRight: '2em' }}>
				<button className="primary" onClick={listItemClick}>List</button>
			</div>

			<TextPhrase>View collections, creators, and NFTs you are following</TextPhrase>

			<FormContainer style={{ width: '100%', maxWidth: 936 }}>
				<AppControl type="select" name="itemsFilter" value={filter.itemsFilter} setData={setFilter} style={{ width: '100%' }} options={[
					{ value: FOLLOW_COLLECTIONS, text: 'Collections I follow' },
					{ value: FOLLOW_ITEMS, text: 'Items I follow' },
				]} />
			</FormContainer>

			<CardsFluidGrid
				list={items}
				cardTo={linkTo}
				onEmpty={<CallForAction title="No items yet" />}
				srcKey={isFromMoralis() ? "image" : "file"}
				idKey={isFromMoralis() ? "token_id" : "itemId"}
				footerKey="name"
				actionButton={mayHaveMore && <button className="primary" onClick={() => doLoadItems(items.length)}>Show more</button>}
				hasFavToggleButton={!isFromMoralis()}
				onFavToggleClick={!isFromMoralis() ? onFavToggleClick : undefined}
				isFav={data => !isFromMoralis() && (data.roles & RolesMap.follower) > 0}
				moreFooter={(_itemId, _data) => <div className="card-footer-sub-line">Current price: <FontIcon name="eth" inline={true} />0.5 <FontIcon name="dollar" inline={true} />728</div>}
			/>
		</div>
	)
}