import FontIcon from '../../../../fontIcon/FontIcon';

export function TxOpener({ tx }) {
	return <a href={`https://etherscan.io/tx/${tx}`} target="_blank" rel="noreferrer"><FontIcon name="openlink" /></a>;
}
