import './prompts.scss'
import Spinner from "../../util/Spinner"

export default function Loading({ centered = true, moreCls, h2Cls, h2Style }) {
	return (
		<div className={(centered ? "centered-prompt" : "") + (moreCls ? " " + moreCls : "")}>
			<h2 className={h2Cls} style={h2Style}><Spinner /> Loading...</h2>
		</div>
	)
}

export function LoadingInline() {
	return <Loading centered={false} moreCls="pt-5 ta-c" h2Cls="flex-row jc-c ai-c" h2Style={{ columnGap: 16 }} />
}