import { useEffect } from "react"
import { useNavigate } from "react-router"
import StickyButtonContainer from "./parts/StickyButtonContainer"

const VIDEO_ID = '767391077'
export const poppedOnceAlready = () => !!localStorage[VIDEO_ID]
const setPoppedOnceAlready = () => localStorage.setItem(VIDEO_ID, '1')

export default function CollectionIntroVideo({ setSidebarState }) {
	useEffect(() => {
		if (setSidebarState) {
			setSidebarState(0)
		}
		// eslint-disable-next-line
	}, [])
	const naviate = useNavigate()
	const gotItClick = () => {
		setPoppedOnceAlready()
		naviate(`/add-collection`)
	}
	return (
		<>
			<div style={{ fontSize: 18, maxWidth: 800 }} className="ta-c pt-2 mx-auto">
				<div style={{ fontWeight: 700 }}>
					Here you can create & launch your collection with our proprietary smart contract.<br />
					Set core team, artists, rev-share and even get a landing page to promote, mint it.
				</div>
				<div className="pt-2">
					Before you start, let’s watch this quick & short overview video,<br />
					it will save you so much time & it’s just less than two minutes.
				</div>

				<div style={{ padding: "60% 0 0 0", position: "relative" }}>
					<iframe src={`https://player.vimeo.com/video/${VIDEO_ID}?h=85ca111050&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479`}
						frameBorder="0"
						allow="autoplay; fullscreen; picture-in-picture"
						allowFullScreen={true}
						style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
						title="collection overview.mp4"></iframe>
					<script src="https://player.vimeo.com/api/player.js"></script>
				</div>
			</div>
			<StickyButtonContainer>
				<button onClick={gotItClick} className="primary">Got it</button>
			</StickyButtonContainer>
		</>
	)
}