import { useEffect, useRef, useState } from 'react'
import Loading from './prompts/Loading'
import { loadReferrals } from '../func/users'

function selectElementContents(el) {
	var body = document.body, range, sel;
	if (document.createRange && window.getSelection) {
		range = document.createRange();
		sel = window.getSelection();
		sel.removeAllRanges();
		try {
			range.selectNodeContents(el);
			sel.addRange(range);
		} catch (e) {
			range.selectNode(el);
			sel.addRange(range);
		}
	} else if (body.createTextRange) {
		range = body.createTextRange();
		range.moveToElementText(el);
		range.select();
	}
}

export default function AdminReferrals() {
	const [loading, setLoading] = useState(false)
	const [referrals, setReferrals] = useState([])
	const { protocol, host } = window.location
	const inviteLinksBasePath = protocol + '//' + host
	const tableRef = useRef(null)
	const [totalCollectorsBrought, setTotalCollectorsBrought] = useState(0)
	const [totalMintsBrought, setTotalMintsBrought] = useState(0)

	useEffect(() => {
		setLoading(true)
		loadReferrals(3).then(setReferrals).finally(() => setLoading(false))
	}, [])

	useEffect(() => {
		let totalCollectorsBrought = 0
		let totalMintsBrought = 0
		referrals?.forEach(r => {
			totalCollectorsBrought += r.collectorsBrought
			totalMintsBrought += r.mintsBrought
		})
		setTotalCollectorsBrought(totalCollectorsBrought)
		setTotalMintsBrought(totalMintsBrought)
	}, [referrals])

	if (loading) return <Loading />

	return (<>
		<button onClick={() => selectElementContents(tableRef.current)}>select all table contents</button>
		<table border={1} cellPadding={4} cellSpacing={4} ref={tableRef}>
			<thead>
				<tr>
					<th>Name</th>
					<th>Link</th>
					<th>Link</th>
					<th>Collectors ({totalCollectorsBrought})</th>
					<th>Mints ({totalMintsBrought})</th>
				</tr>
			</thead>
			<tbody>
				{referrals?.map((r, i) => {
					return (
						<tr key={i}>
							<td>{r.name}</td>
							<td><a href={inviteLinksBasePath + r.artistInviteLink} target="_blank" rel="noreferrer">artist link</a></td>
							<td><a href={inviteLinksBasePath + r.collectorInviteLink} target="_blank" rel="noreferrer">collector link</a></td>
							<td>{r.collectorsBrought}</td>
							<td>{r.mintsBrought}</td>
						</tr>
					)
				})}
			</tbody>
		</table>
	</>
	)
}