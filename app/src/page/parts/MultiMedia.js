import { isVideo } from "../../util/mimeTypes"
import { getOptimizeImgUrl, PopupSpecs } from "../../util/optimizedImages"

export function MultiMedia({ src, sizeSpecs = PopupSpecs, mimeType, keepAspectRatio, originalCID, maxWidth = PopupSpecs.width, doRender = true }) {
	if (!doRender) return null
	return <div className="ta-c pt-2">
		{isVideo(mimeType) ?
			<video src={src} autoPlay={true} controls={true} muted={true} loop={true} style={{ maxWidth }} />
			:
			<img src={getOptimizeImgUrl(src, sizeSpecs, mimeType, keepAspectRatio, originalCID)}
				className={(keepAspectRatio ? "keep-aspect-ratio" : "")}
				style={{ maxWidth }} alt=""
			/>
		}
	</div>
}