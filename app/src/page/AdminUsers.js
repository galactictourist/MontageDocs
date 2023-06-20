import { useContext, useEffect, useRef, useState } from 'react'
import CardsFluidGrid from './parts/CardsFluidGrid'
import Loading from './prompts/Loading'
import debounce from '../util/debounce'
import { searchUsers } from '../func/users'
import FormContainer from './parts/FormContainer'
import AuthContext from '../ctx/Auth'
import { AppControl } from './parts/AppControl'
import last4 from '../util/last4'

export default function AdminUsers() {
	const { userId, accounts } = useContext(AuthContext)
	const [users, setUsers] = useState([])
	const [onEmpty, setOnEmpty] = useState(null)
	const [loading, setLoading] = useState(false)
	const [mayHaveMore, setMayHaveMore] = useState(true)
	const [mayAddCollection, setMayAddCollection] = useState(true)
	const query = useRef(null)

	const runSearch = async (fetchOffset) => {
		const pageLimit = 9
		const value = query.current?.value
		const tmp = await searchUsers(value, userId, accounts, fetchOffset, pageLimit, mayAddCollection)
		if (tmp?.length) {
			setUsers(users => fetchOffset > 0 ? [...users, ...tmp] : [...tmp])
			if (tmp.length < pageLimit)
				setMayHaveMore(false)
		} else {
			if (fetchOffset === 0) {
				setUsers([])
			}
			setMayHaveMore(false)
		}
		setOnEmpty(tmp.length > 0 ? null : value ? <h2 className="ta-c pt-5">No users found</h2> : null)
	}

	const runSearchFrom0 = () => {
		setLoading(true)
		runSearch(0).then(() => setLoading(false))
	}

	const debouncedRunSearch = debounce(runSearch, 300)

	useEffect(() => {
		runSearchFrom0()
		// eslint-disable-next-line
	}, [mayAddCollection])

	if (loading) return <Loading />

	return (
		<>
			<FormContainer>
				<div className="app-control">
					<label>Search user by name, email, twitter, wallet address</label>
					<input type="text" placeholder="Start typing..." ref={query} onChange={async () => await debouncedRunSearch(0)} />
				</div>
				<AppControl type="checkbox" name="mayAddCollection" value={mayAddCollection} setValue={setMayAddCollection} toggleTitle="Can create collection" />
			</FormContainer>
			<CardsFluidGrid
				target="_blank"
				list={users}
				idKey="userId"
				footerKey={data => data.name || data.email || last4(data.walletAddress)}
				cardTo={(_asUserId, data) => `/login-as?key=${data.loginAsKey}`}
				onEmpty={onEmpty}
				actionButton={mayHaveMore && <button className="primary" onClick={async () => await runSearch(users.length)}>Show more</button>}
			/>
		</>
	)
}