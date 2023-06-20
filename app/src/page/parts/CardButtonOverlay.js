import { useState } from 'react'
import { useNavigate } from 'react-router'
import { SaveButton } from './SaveButton'

export default function CardButtonOverlay({ collectionIdOrAddress, tokenId, text = "Details", onClick }) {
	const [waiting, setWaiting] = useState(false)
	const navigate = useNavigate()
	const defaultOnClick = (e) => {
		e.stopPropagation()
		navigate(`/collection-item/${collectionIdOrAddress}/${tokenId}`)
	}
	const clickHandler = async (e) => {
		if (onClick) {
			setWaiting(true)
			try {
				await onClick(e)
			} finally {
				setWaiting(false)
			}
		} else {
			defaultOnClick(e)
		}
	}
	return (<div className="item-card-overlay">
		<SaveButton text={text} className="secondary" onClick={clickHandler} saving={waiting} disabled={waiting} />
	</div>)
}