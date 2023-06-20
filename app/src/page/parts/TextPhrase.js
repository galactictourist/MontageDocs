import './textPhrase.scss'

export function NoActionHereYet(props) {
	return <TextPhrase padTop5={true} isTitle={true} {...props}>No action here yet</TextPhrase>
}

export default function TextPhrase({ children, isTitle = false, isSubTitle = false, isMain = true, padTop = false, padTop1 = false, padTop5 = false, style, cls, fw400 = false, fw700 = false, fw600 = false, tac = true, doRender = true, fieldText = false, evenSmallerText = false }) {
	if (!doRender) return null
	return <div className={(tac ? "ta-c" : "") +
		(evenSmallerText ? " even-smaller-text" :
			fieldText ? " field-text" :
				isTitle ? " title-text" :
					isSubTitle ? " sub-title-text" :
						isMain ? " main-text" :
							" secondary-text")
		+ (padTop1 ? " pt-1" : padTop5 ? " pt-5" : padTop ? " pt-2" : "")
		+ (cls ? " " + cls : "")
		+ (fw700 ? " fw-700" : fw600 ? " fw-600" : fw400 ? " fw-400" : "")
	} style={style}>{children}</div>
}