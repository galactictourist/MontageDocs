import { getOptimizedBucketFullSrc } from "../../util/optimizedImages";
import TextPhrase from "./TextPhrase";

export default function FightingBots({ padTop5 = true, padTop, minHeight = '75vh' }) {
	return <div className="ta-c" style={{ minHeight }}>
		<TextPhrase padTop5={padTop5} padTop={padTop}>We’re fighting bots at the moment we’ll be back soon</TextPhrase>
		<img src={getOptimizedBucketFullSrc("/img/fighting-robots.jpg")} alt="Fighting Bots" className="responsive-img pt-2 d-ib" />
	</div>
}