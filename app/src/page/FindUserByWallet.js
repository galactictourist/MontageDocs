import { useRef, useState } from 'react';
import { findUserByWalletAddress } from '../func/users';
import debounce from '../util/debounce';
import CardsFluidGrid from './parts/CardsFluidGrid';
import FormContainer from './parts/FormContainer';

export function FindUserByWallet({ setFoundUserId }) {
	const [users, setUsers] = useState([])
	const [onEmpty, setOnEmpty] = useState(null)
	const query = useRef(null)

	const runSearch = async () => {
		const value = query.current?.value
		const tmp = await findUserByWalletAddress(value)
		setUsers(_users => tmp)
		setOnEmpty(tmp.length > 0 ? null : value ? <h2 className="ta-c pt-5">User not found</h2> : null)
	}

	const debouncedRunSearch = debounce(runSearch, 300)

	return <>
		<FormContainer>
			<button className="primary" onClick={() => setFoundUserId(-1)}>Create new</button>
			<div className="app-control">
				<label>Or link by wallet address</label>
				<input type="text" placeholder="Paste here wallet address 0x...1234" ref={query} value={query.value} onChange={async () => await debouncedRunSearch(0)} />
			</div>
		</FormContainer>
		<CardsFluidGrid list={users} idKey="userId" cardClick={setFoundUserId} onEmpty={onEmpty} moreGridCls="single-card" moreCardCls={() => "interactive"} />
	</>
}
