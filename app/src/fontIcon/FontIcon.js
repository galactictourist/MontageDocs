import './icomoon/style.css'
import './fontIcon.scss'
import Tooltip from 'rc-tooltip'

export default function FontIcon({ name, moreCls, inline, nonClickable, asFabButton, onClick, moreFabCls, tip, doRender = true, disabled, ...rest }) {
	if (!name || !doRender) return null
	const i = <i tabIndex={0} disabled={disabled} className={(inline ? "" : "font-icon") + " icon-" + name + (nonClickable ? " non-clickable" : "") + (moreCls ? " " + moreCls : '')} onClick={asFabButton ? undefined : onClick} {...rest}></i>
	const icon = asFabButton ? <span className={"fab-button" + (moreFabCls ? " " + moreFabCls : "")} onClick={onClick} disabled={disabled}>{i}</span> : i
	if (tip) {
		return <Tooltip overlayClassName="app-tooltip" overlay={tip} transitionName="rc-tooltip-zoom" placement="bottom" offsetX={0} offsetY={0} destroyTooltipOnHide={true} >{icon}</Tooltip>
	}
	return icon
}