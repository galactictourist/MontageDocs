import FontIcon from '../fontIcon/FontIcon';
import Tooltip from 'rc-tooltip';

export function getTitleWithIconAndTooltip(title, tooltipText) {
	return (
		<Tooltip overlayClassName="app-tooltip" overlay={tooltipText} transitionName="rc-tooltip-zoom" placement="top" trigger={["hover"]} offsetX={0} offsetY={0} destroyTooltipOnHide={true}>
			<span className="flex-row ai-c" style={{ columnGap: 4 }}>{title}<FontIcon name="doubts" nonClickable={true} inline={true} /></span>
		</Tooltip>
	);
}
