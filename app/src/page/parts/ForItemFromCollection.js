export function ForItemFromCollection({ itemName, collectionName, doRender = true, forLabel = "For" }) {
	if (!doRender) return null
	return <div className="ta-c pt-2 notice-details">
		{forLabel} <span className="highlight-color">{itemName}</span>
		<br />
		From <span className="highlight-color">{collectionName}</span>
	</div>
}