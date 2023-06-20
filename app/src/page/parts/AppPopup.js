import './app-popup.scss'

export default function AppPopup({ visible, setVisible, children, insideCls, modal = false }) {
	const onClickOutside = (e) => {
		if (modal) return
		if (insideCls) {
			const { target: t } = e
			if (t.closest('.' + insideCls) || t.classList.contains(insideCls)) {
				return
			}
		}
		setVisible(false)
	}

	if (!visible) return null
	return <div onClick={onClickOutside} className="app-popup opened">{children}</div>
}

export function PreviewPopup({ visible, setVisible, iframeSrc }) {
	return (
		<AppPopup visible={visible} setVisible={setVisible}>
			<iframe src={iframeSrc} frameBorder={0} style={{ width: '90vw', height: '90vh' }} title="preview iframe"></iframe>
		</AppPopup>
	)
}