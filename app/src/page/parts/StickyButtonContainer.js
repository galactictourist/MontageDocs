import './stickyButtonContainer.scss'

export default function StickyButtonContainer({ children, style }) {
	if (children)
		return (
			<div className="sticky-button-ct" style={style}>
				{children}
			</div>
		)
	return null
}