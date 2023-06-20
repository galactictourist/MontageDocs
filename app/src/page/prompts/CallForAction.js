import './prompts.scss'

export default function CallForAction({ title, actionLink, actionText, onClick, isCentered = true, fallbackClassName = "ta-c", titleClassName }) {
	return (
		<div className={isCentered ? "centered-prompt" : fallbackClassName}>
			{title && <h2 className={titleClassName}>{title}</h2>}
			{(actionLink || onClick) && actionText &&
				<div className="mt-5">
					<button to={actionLink} onClick={onClick} style={{ minWidth: 300 }}>{actionText}</button>
				</div>
			}
		</div>
	)
}