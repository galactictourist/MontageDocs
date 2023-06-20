import Tooltip from "rc-tooltip";
import Spinner from "../../util/Spinner";

export function SaveButton({ onClick, saving, text, disabled, className, style, tip, doRender = true, ...rest }) {
	if (!doRender) return null
	const btn = () => <button onClick={onClick} className={className || "primary"} style={style} disabled={saving || disabled} {...rest}>{saving && <Spinner />} {text || "Save"}</button>
	if (tip) {
		return <Tooltip overlayClassName="app-tooltip" overlay={tip} transitionName="rc-tooltip-zoom" placement="bottom" offsetX={0} offsetY={0} destroyTooltipOnHide={true} >{btn()}</Tooltip>
	}
	return btn()
}