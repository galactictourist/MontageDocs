import './trade-control-buttons.scss'
import DropdownFilter from './DropdownFilter';
import RoundIconButton from './RoundIconButton';
import { QuoteCurrencyDropdownFilter } from './QuoteCurrencyDropdownFilter';
import { useContext } from 'react';
import TradeContext from '../../ctx/Trade';

export function TradeControlButtons({ favClick, refreshClick }) {
	const { quoteCurrency, setQuoteCurrency, timeFrame, setTimeFrame } = useContext(TradeContext)

	return (
		<span className="trade-control-buttons">
			<QuoteCurrencyDropdownFilter quoteCurrency={quoteCurrency} setQuoteCurrency={setQuoteCurrency} />
			<DropdownFilter labels={["24h", "7d", "30d", "All"]} selected={timeFrame} setSelected={setTimeFrame} disabled={true} />
			<RoundIconButton icon="heart" disabled={true} onClick={favClick} />
			<RoundIconButton icon="refresh" disabled={true} onClick={refreshClick} />
		</span>
	);
}
