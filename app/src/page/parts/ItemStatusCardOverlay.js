import { itemStatusToText } from '../../util/itemStatus'

export default function ItemStatusCardOverlay({ itemStatus, moreCls }) {
	return <div className={"item-card-overlay" + (moreCls ? " " + moreCls : "")}>{itemStatusToText(itemStatus)}</div>
}