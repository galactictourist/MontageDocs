import './youtubePlayer.scss'

export default function YoutubePlayer({ str }) {
	if (typeof (str) === "string") {
		const parseVideoId = (url) => {
			const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
			const match = url?.match(regExp)
			return (match && match[7].length === 11) ? match[7] : false
		}

		const videoId = parseVideoId(str)
		const src = videoId ? `https://www.youtube.com/embed/${videoId}` : null
		if (src) {
			return (
				<div className="video-iframe-16-9">
					<iframe src={src} className="video-iframe" frameBorder="0" title="Youtube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
				</div>
			)
		}
	}
	return null
}