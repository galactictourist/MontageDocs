import { isVideo } from "../../../../util/mimeTypes";

export function ItemCt({ image: src, mimeType, keepAspectRatio, itemName, collectionName }) {
	return (
		<span className="item-ct">
			{isVideo(mimeType) ?
				<video src={src} autoPlay={true} controls={false} muted={true} loop={true} className="item-image" />
				:
				<span className="item-image">
					<img src={src} className={"item-image" + (keepAspectRatio ? " keep-aspect-ratio" : "")} alt="" />
				</span>
			}
			<span className="flex-column jc-se">
				<span className="bold">{itemName}</span>
				<span>{collectionName}</span>
			</span>
		</span>
	);
}
