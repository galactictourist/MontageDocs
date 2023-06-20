export default function FormContainer({ children, cls, doRender = true, ...rest }) {
	if (!doRender) return null
	return <div className={"form-container" + (cls ? " " + cls : "")} {...rest}>{children}</div>
}