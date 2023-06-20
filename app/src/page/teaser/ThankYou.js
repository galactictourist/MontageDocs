import '../parts/connect-wallet.scss'
import './teaser.scss'
import FollowUs from './FollowUs'

export default function ThankYou() {
	return (
		<div className="teaser">
			<div className="teaser-part teaser-pattern pattern-3">YOU’RE<br />IN</div>
			<div className="teaser-part teaser-content">
				<div className="connect-wallet--call-for-action extra-font-weight">THANKS FOR JOINING!</div>
				<div className="connect-wallet--call-for-action">
					THE JOURNEY BEGINS SOON.<br />
					STAY TUNED.
				</div>
				<FollowUs label="Follow us also on" marginTop="4em" />
			</div>
		</div>
	)
}