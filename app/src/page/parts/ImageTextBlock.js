import { YouTubeEmbed } from 'react-social-media-embed';
import { ImageVAlignMap } from '../../util/imageVAlign';
import { LookNFeelMap } from '../../util/lookNfeel';
import { getOptimizeImgUrl, StoryPageImageSpecs } from '../../util/optimizedImages';
import { PageSectionStyleMap } from '../../util/pageSection';
import { parseLinkAndGetEmbed } from '../../util/parseLinkAndGetEmbed';

export function ImageTextBlock({ title, data, pageSectionType, reverse, isColumn = false, imageCls = "", isCustom = false, imageStyle, descStyle, moreTitleDescCls }) {
	const pageSectionStyleKey = `pageSectionStyle-${pageSectionType}`
	const titleKey = `title-${pageSectionType}`
	const imageKey = `image-${pageSectionType}`
	const descKey = `desc-${pageSectionType}`
	const videoLinkKey = `videoLink-${pageSectionType}`
	const bgColorKey = `bgColor-${pageSectionType}`
	const textColorKey = `textColor-${pageSectionType}`
	const postKey = `post-${pageSectionType}`
	const imageVAlignKey = `imageVAlign-${pageSectionType}`
	const columnViewKey = `columnView-${pageSectionType}`
	const allowHTMLInDescKey = `allowHTMLInDesc-${pageSectionType}`
	const imageNoOptimizeKey = `imageNoOptimize-${pageSectionType}`
	const moreToRenderKey = `moreToRender-${pageSectionType}`

	const lookNfeel = data["lookNfeel"]
	const pageSectionStyle = parseInt(data[pageSectionStyleKey])
	const image = data[imageKey]
	const desc = data[descKey]
	const videoLink = data[videoLinkKey]
	const backgroundColor = data[bgColorKey] || '#000000'
	const color = data[textColorKey] || '#000000'
	const post = data[postKey]
	const imageVAlign = data[imageVAlignKey]
	const columnView = data[columnViewKey]
	const allowHTMLInDesc = isCustom && data[allowHTMLInDescKey]
	const imageNoOptimize = data[imageNoOptimizeKey]
	const moreToRender = data[moreToRenderKey]

	const style = lookNfeel === LookNFeelMap.myOwn ? { backgroundColor, color: backgroundColor === "#000000" && color === "#000000" ? "#ffffff" : color } : {}

	const aTitle = isCustom ? data[titleKey] : title
	const hasCustomTitle = isCustom && aTitle
	const hasDesc = desc && (pageSectionStyle & PageSectionStyleMap.text) > 0
	const hasImage = image && (pageSectionStyle & PageSectionStyleMap.image) > 0
	const hasVideo = videoLink && (pageSectionStyle & PageSectionStyleMap.video) > 0
	const hasPost = post && (pageSectionStyle & PageSectionStyleMap.post) > 0

	const hasTitleOrDesc = hasCustomTitle || hasDesc
	const hasMedia = hasVideo || hasImage || hasPost
	const anyContent = hasTitleOrDesc || hasMedia
	if (!anyContent) return null

	// eslint-disable-next-line
	const singleElement = pageSectionStyle == PageSectionStyleMap.text || pageSectionStyle == PageSectionStyleMap.video || pageSectionStyle == PageSectionStyleMap.image || pageSectionStyle == PageSectionStyleMap.post
	return (
		<div className={"image-text-block" + (isColumn || columnView ? " is-column" : "") + (reverse ? " reverse" : "") + (columnView ? " ai-c ta-c" : imageVAlign === ImageVAlignMap.topOfText ? " ai-fs" : "") + (singleElement ? " has-single-element" : "")} style={style}>
			{hasTitleOrDesc && <div className={(singleElement ? "is-single" : "") + (moreTitleDescCls ? " " + moreTitleDescCls : "")}>
				{aTitle && <ImageTextBlockTitle title={aTitle} pageSectionType={pageSectionType} data={data} />}
				{hasDesc ? (allowHTMLInDesc ? <div className="image-text-block--desc" dangerouslySetInnerHTML={{ __html: desc || '' }} style={descStyle}></div> : <div className="image-text-block--desc" style={descStyle}>{desc}</div>) : null}
				{moreToRender && <div className="image-text-block--more">{moreToRender}</div>}
			</div>}
			{hasMedia && <div className={singleElement ? "is-single" : undefined}>
				{hasVideo && <YouTubeEmbed url={videoLink} />}
				{hasImage && <img src={imageNoOptimize ? image : getOptimizeImgUrl(image, StoryPageImageSpecs)} alt="" className={"image-text-block--img " + imageCls} style={imageStyle} />}
				{hasPost && parseLinkAndGetEmbed(post)}
			</div>}
		</div>
	)
}

export function ImageTextBlockTitle({ title, pageSectionType, data, className }) {
	const lookNfeel = data["lookNfeel"]
	const lineColorKey = `lineColor-${pageSectionType}`
	const lineColor = data[lineColorKey]
	const style = lookNfeel === LookNFeelMap.myOwn && lineColor ? { backgroundImage: `linear-gradient(90deg, ${lineColor} 0%, ${lineColor} 100%)` } : {}
	return title ? <div className={className}><span className="image-text-block--title" style={style}>{title}</span></div> : null
}