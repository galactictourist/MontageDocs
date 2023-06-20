import './stateIcon.scss'
import { Link } from "react-router-dom"





export default function StateIcon({ onClick, type, moreCls, disabled, to, doRender = true, ...rest }) {
	if (!doRender) return null
	const props = {
		"data-type": type,
		className: "state-icon" + (moreCls ? " " + moreCls : ""),
		disabled,
		onClick,
		to,
		...rest
	}
	return to ? <Link {...props}></Link> : <span {...props}></span>
}