// import { lazy, Suspense } from 'react'
// import Spinner from '../../util/Spinner'
import { TwitterShareButton } from 'react-twitter-embed'
// const TwitterShareButton = lazy(async () => (await import('react-twitter-embed')).TwitterShareButton)

export default function ShareToTwitter() {
	return (
		<div className="ta-c pt-2">
			{/* <div>Share to</div> */}
			{/* <Suspense fallback={<Spinner />}> */}
			<TwitterShareButton
				// onLoad={function noRefCheck() { }}
				options={{
					buttonHashtag: undefined,
					screenName: undefined,
					size: 'large',
					// text: '#reactjs is awesome',
					// via: 'saurabhnemade'
				}}
			// url="https://facebook.com/saurabhnemade"
			/>
			{/* </Suspense> */}
		</div>
	)
}