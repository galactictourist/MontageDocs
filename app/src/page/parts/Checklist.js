import './checklist.scss'

export function Checklist({ children, moreCls = null, ...rest }) {
	return <ul className={"checklist" + (moreCls ? " " + moreCls : "")} {...rest}>{children}</ul>;
}
