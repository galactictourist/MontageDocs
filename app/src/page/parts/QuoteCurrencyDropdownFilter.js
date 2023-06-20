import DropdownFilter from './DropdownFilter';
import '../../ctx/Trade'
import { useContext } from 'react';
import TradeContext from '../../ctx/Trade';

export function QuoteCurrencyDropdownFilter() {
	const { quoteCurrency, setQuoteCurrency } = useContext(TradeContext)
	return <DropdownFilter icons={["eth", "dollar"]} selected={quoteCurrency} setSelected={setQuoteCurrency} />;
}
