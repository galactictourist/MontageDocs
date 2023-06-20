import { useEffect, useState } from 'react';
import { AppControl } from './parts/AppControl';
import FormContainer from './parts/FormContainer';
import { useLocation } from 'react-router';
import FontIcon from '../fontIcon/FontIcon';
import FollowUs from './teaser/FollowUs';
import { ItemStatus } from '../util/itemStatus';

export default function ListItemSuccess({ setSidebarState, setCrumbLabel }) {
	const location = useLocation()
	const [item, setItem] = useState(location.state?.item || {})

	const control = ({ name, ...props }) => <AppControl name={name} value={item[name]} setData={setItem} {...props} />

	const ethSymbol = () => <FontIcon name="eth" inline={true} />

	useEffect(() => {
		if (setSidebarState) {
			setSidebarState(3)
		}
		// eslint-disable-next-line
	}, [])

	useEffect(() => {
		if (item.name && setCrumbLabel) setCrumbLabel(item.name)
	}, [item, setCrumbLabel])

	return (
		<FormContainer>
			<h2 className="good ta-c">Item listed successfully</h2>
			<div>
				<img src={item.file} alt="" style={{ maxWidth: '100%', display: 'block' }} className="mx-auto" />
			</div>
			{control({ label: "Collection", name: "collectionName", readOnly: true, disabled: true })}
			{control({ label: "Item", name: "name", readOnly: true, disabled: true })}
			{item.status > ItemStatus.minted ? control({ label: "You paid", name: "youPaidETH", appendAfterLabel: ethSymbol, readOnly: true, disabled: true }) : null}
			{control({ label: "List price", appendAfterLabel: ethSymbol, type: "number", name: "listPrice", readOnly: true, disabled: true })}
			{control({ label: "Creator royalties", type: "number", subtype: "percent", name: "creatorRoyalties", readOnly: true, disabled: true })}
			<FollowUs subLabel="TWEET IT!" href="https://twitter.com/" />
			<br />
		</FormContainer>
	)
}