import { useContext } from 'react';
import TradeContext from '../../../../ctx/Trade';
import FontIcon from '../../../../fontIcon/FontIcon';
import toShortAmountStr from '../../../../util/toShortestAmountStr';
import StatsPercent from '../../StatsPercent';

export function NumWithChange({ icon, num, numUSD, changePercent, isCurrency, iconStyle }) {
	const { quoteCurrency } = useContext(TradeContext);

	const formatCurrency = (num) => {
		if (quoteCurrency === 'eth') return num === 0 || isNaN(num) ? '---' : parseFloat(num).toFixed(4);
		if (quoteCurrency === 'dollar') return numUSD === 0 || isNaN(numUSD) ? '---' : parseFloat(numUSD).toFixed(2);
		return num;
	};

	return (
		<span className="bold flex-column">
			<span><FontIcon name={icon} inline={true} nonClickable={true} style={iconStyle} />{isCurrency ? formatCurrency(num) : toShortAmountStr(num)}</span>
			{changePercent !== undefined && <StatsPercent pct={changePercent} />}
		</span>
	);
}
