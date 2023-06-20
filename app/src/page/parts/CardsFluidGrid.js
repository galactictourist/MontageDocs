import './cardsFluidGrid.scss'
import imagePlaceholder from '../../img/image-placeholder.svg'
import { Link } from 'react-router-dom'
import StateIcon from './stateIcon/StateIcon'
import FontIcon from '../../fontIcon/FontIcon'
import { useState } from 'react'
import { isAudio, isVideo } from '../../util/mimeTypes'
import AppPopup from './AppPopup'
import { CardImageSpecs, getOptimizeImgUrl } from '../../util/optimizedImages'

export default function CardsFluidGrid({ list, cardTo, cardClick, moreCardCls, footerKey = 'name', srcKey = 'profileImage', originalCID = 'originalCID', defaultImage, srcMimeType, srcCachedImages, srcCacheKey, getCachedSrc, idKey = 'id', onEmpty, actionButton, target, hasFavToggleButton, onFavToggleClick, isFav, moreFooter, fullSizeImage = true, smallImageOnFooter = false, appendToCard, beforeFavButton, moreGridCls, gridStyle, cardImageSpecs = CardImageSpecs, cardImgCtHasStatusOverlay, cardImgCtStatusOverlay }) {
	const [audioSrc, setAudioSrc] = useState(null)
	const openMedia = (e, url, mimeType) => {
		e.preventDefault()
		if (isAudio(mimeType)) setAudioSrc(url)
	}
	const getPlayButton = (data) => srcMimeType && data[srcMimeType] && isAudio(data[srcMimeType]) ? <span onClick={(e) => openMedia(e, data[srcKey], data[srcMimeType])} className="open-menu-button"><FontIcon name="play" /></span> : null

	const getFavButton = (data, idx) => hasFavToggleButton && isFav ? <StateIcon type="heart" moreCls={"fav-toggle-button" + (isFav(data) ? " selected" : "")} onClick={(e) => {
		e.preventDefault()
		if (onFavToggleClick) {
			onFavToggleClick(data[idKey], isFav(data), idx)
		}
	}} /> : null

	const getFooterTitle = (data) => typeof footerKey === 'string' ? data[footerKey] : typeof footerKey === 'function' ? footerKey(data) : null

	const getMedia = (data) => {
		let cachedSrc = getCachedSrc ? getCachedSrc(data) : null
		if (!cachedSrc && srcCachedImages && srcCacheKey) {
			cachedSrc = (data[srcCachedImages] || {})[srcCacheKey]
		}
		let src = cachedSrc || data[srcKey] || defaultImage || imagePlaceholder
		const mimeType = srcMimeType ? data[srcMimeType] : null
		if (cardImageSpecs && src && src.startsWith('https://montage')) {
			src = getOptimizeImgUrl(src, cardImageSpecs, mimeType, data.keepAspectRatio, data[originalCID])
		}
		return isVideo(mimeType) ? <video src={src} className="card-img" autoPlay={true} controls={true} muted={true} loop={true}></video> : <img className="card-img" src={src} alt="" />
	}

	if (list?.length > 0)
		return (
			<>
				<div className={"cards-fluid-grid" + (moreGridCls ? " " + moreGridCls : "")} style={gridStyle}>
					{list.map((data, idx) => (
						<CardWrapper key={idx} cardTo={cardTo} moreCardCls={moreCardCls} data={data} idKey={idKey} target={target} onClick={cardClick && (() => cardClick(data[idKey], data))}>
							{fullSizeImage && <div className={"card-img-ct" + (cardImgCtHasStatusOverlay && cardImgCtHasStatusOverlay(data) ? " has-status-overlay" : "")}>{getMedia(data)}{cardImgCtStatusOverlay ? cardImgCtStatusOverlay(data) : null}</div>}
							<div className="card-footer">
								<div className="card-footer-main-line">
									{smallImageOnFooter && getMedia(data)}
									<div className="card-main-title">
										{getPlayButton(data)}
										{getFooterTitle(data)}
									</div>
									{beforeFavButton && beforeFavButton(data[idKey], data)}
									{getFavButton(data, idx)}
								</div>
								{moreFooter && moreFooter(data[idKey], data)}
							</div>
							{appendToCard && appendToCard(data[idKey], data, idx)}
						</CardWrapper>
					))}
				</div>
				{actionButton && <div className="ta-c" style={{ paddingBottom: '5em' }}>{actionButton}</div>}

				<AppPopup visible={audioSrc !== null} setVisible={() => setAudioSrc(null)}>
					<audio src={audioSrc} autoPlay={true} controls={true}></audio>
				</AppPopup>
			</>
		)
	return onEmpty || null
}

function CardWrapper({ cardTo, moreCardCls, target, data, idKey, children, ...rest }) {
	const attrs = { className: "card" + (moreCardCls ? ' ' + moreCardCls(data[idKey], data) : ''), ...rest }
	return cardTo ? <Link to={cardTo(data[idKey], data) || '#'} target={target} {...attrs}>{children}</Link> : <div {...attrs}>{children}</div>
}