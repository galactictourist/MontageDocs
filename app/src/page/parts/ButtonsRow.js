export default function ButtonsRow({ children, doRender = true, width600 = false }) {
	return doRender ? <div className={"pt-2 jc-c buttons-row" + (width600 ? " width600" : "")}>{children}</div> : null
}