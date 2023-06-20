import last4 from '../../../../util/last4';
import { EtherScanLink } from './EtherScanLink';

export function WalletAddrWithItemsCount({ addr, itemsCount }) {
	return (
		<span className="flex-column jc-se">
			<span className="bold">{last4(addr)}</span>
			{itemsCount > 0 ? <span className="bold"><EtherScanLink address={addr} itemsCount={itemsCount} /></span> : null}
		</span>
	);
}
