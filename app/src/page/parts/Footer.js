import './footer.scss'
import { Link } from 'react-router-dom'
import FontIcon from '../../fontIcon/FontIcon'

export default function Footer() {
	return (
		<footer className="flex-column ai-c">
			<div className="flex-row">
				<div className="main-links">
					<div className="flex-column">
						<Link to="/">Home</Link>
						{/* <Link to="/launchpad" disabled={true}>Launchpad</Link> */}
						<Link to="/collection-marketplace" disabled={true}>Private Markets</Link>
						<Link to="/about" disabled={true}>About</Link>
						<Link to="/faq" disabled={true}>FAQ</Link>
						<Link to="#" onClick={() => window.open(`mailto:${process.env.REACT_APP_CONTACT_EMAIL}`, '_blank')}>Contact</Link>
					</div>
					<div className="flex-column">
						<div className="flex-column">
							<Link to="/my-collections">My Collections</Link>
							<Link to="/add-collection">Create</Link>
							<Link to="/my-earnings">Earnings</Link>
						</div>
						<div className="social-icon-links">
							<a href="https://twitter.com/montageDapp" target="_blank" rel="noreferrer" className="has-icon"><FontIcon name="twitter" /></a>
							<a href="https://discord.gg/HMBhhaQZU3" target="_blank" rel="noreferrer" className="has-icon"><FontIcon name="discord" /></a>
						</div>
					</div>
				</div>
			</div>
			<div className="subfooter">
				<div className="legal-links">
					<Link to="/terms" target="_blank">Terms</Link>
					<Link to="/privacy" target="_blank">Privacy</Link>
					<Link to="/cookies" target="_blank">Cookie policy</Link>
				</div>
				{/* <div className="copyright">&copy; {new Date().getFullYear()} All rights reserved by {process.env.REACT_APP_NAME} inc.</div> */}
			</div>
		</footer>
	)
}