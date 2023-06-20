import { useState, useEffect, useContext } from 'react'
import Loading from './prompts/Loading'
import CallForAction from './prompts/CallForAction'
import CardsFluidGrid from './parts/CardsFluidGrid'
import AuthContext from '../ctx/Auth'
import { loadItemsCreatedByMe } from '../func/items'
import { ItemStatus, itemStatusToText } from '../util/itemStatus'
import FormContainer from './parts/FormContainer'
import { AppControl } from './parts/AppControl'
import TextPhrase from './parts/TextPhrase'

const ANY_ITEM_STATUS = -1
const DEFAULT_FILTER = ANY_ITEM_STATUS

export default function MyItemsCreated() {
	const { userId } = useContext(AuthContext)
	const [loading, setLoading] = useState(false)
	const [items, setItems] = useState([])
	const [mayHaveMore, setMayHaveMore] = useState(true)
	const [status, setStatus] = useState(DEFAULT_FILTER)

	const doLoadItems = async (fetchOffset) => {
		const pageLimit = 9
		const loadedItems = await loadItemsCreatedByMe(userId, fetchOffset, pageLimit, status)
		if (loadedItems?.length) {
			setItems(items => fetchOffset > 0 ? [...items, ...loadedItems] : [...loadedItems])
			if (loadedItems.length < pageLimit)
				setMayHaveMore(false)
		} else {
			if (fetchOffset === 0) {
				setItems([])
			}
			setMayHaveMore(false)
		}
	}

	useEffect(() => {
		if (userId) {
			setLoading(true)
			doLoadItems(0).finally(() => setLoading(false))
		}
		// eslint-disable-next-line
	}, [userId, status])

	const linkTo = (itemId, item) => `/my-collection-item/${item.collectionId}/${itemId}`

	if (!userId) return null
	if (loading) return <Loading />
	return (
		<div>
			<TextPhrase padTop={true}>View the items you’ve created, minted, listed, or submitted for approvals</TextPhrase>

			<FormContainer style={{ width: '100%', maxWidth: 936 }}>
				<AppControl type="select" name="status" value={status} setValue={setStatus} style={{ width: '100%' }} options={[
					{ value: ANY_ITEM_STATUS, text: 'All' },
					{ value: ItemStatus.needApproval, text: 'Waiting for approval' },
					{ value: ItemStatus.approved, text: 'Approved' },
				]} />
			</FormContainer>

			<CardsFluidGrid
				list={items}
				cardTo={linkTo}
				onEmpty={<CallForAction title="No items yet" />}
				srcKey="file"
				idKey="itemId"
				footerKey="name"
				actionButton={mayHaveMore && <button className="primary" onClick={() => doLoadItems(items.length)}>Show more</button>}
				hasFavToggleButton={false}
				onFavToggleClick={undefined}
				isFav={false}
				moreFooter={(_itemId, data) => <div className="card-footer-sub-line">{itemStatusToText(data.status)}</div>}
			/>
		</div>
	)
}