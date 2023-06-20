import { useState, useEffect, useRef, useContext, useCallback } from 'react'
import './home.scss'
import { getOptimizedBucketFullSrc } from '../util/optimizedImages'
import StickyButtonContainer from './parts/StickyButtonContainer'
import AuthContext from '../ctx/Auth'
import { useNavigate } from 'react-router'
import { WelcomePopup } from './WelcomePopup'

export default function Home() {
	const { userId, isAdmin, openWalletConnectPopup, isNewUser, isUserAction: userClickedWalletConnectIcon, setIsUserAction } = useContext(AuthContext)
	const [isConnectFlowCompleted, setIsConnectFlowCompleted] = useState(false)
	const [isInConnectFlow, setIsInConnectFlow] = useState(false)
	const [openWelcomePopup, setOpenWelcomePopup] = useState(false)
	const navigate = useNavigate()
	const navToUserZone = useCallback(() => navigate(isAdmin ? '/admin' : '/my-collections'), [isAdmin, navigate])

	const openConnectFlow = () => {
		if (userId) {
			navToUserZone()
		} else {
			setIsInConnectFlow(true)
			openWalletConnectPopup()
		}
	}

	useEffect(() => {
		if (userClickedWalletConnectIcon) {
			setIsUserAction(false)
			if (!isInConnectFlow) {
				setIsInConnectFlow(true)
			}
		}
	}, [isInConnectFlow, userClickedWalletConnectIcon, setIsUserAction])

	useEffect(() => {
		if (isInConnectFlow && userId) {
			setIsInConnectFlow(false)
			if (isNewUser) setOpenWelcomePopup(true)
			else setIsConnectFlowCompleted(true)
		}
	}, [isInConnectFlow, isNewUser, userId])

	useEffect(() => {
		if (isConnectFlowCompleted) {
			navToUserZone()
		}
	}, [isConnectFlowCompleted, navToUserZone])

	return (
		<div className="home">
			<div className="home-main-header ta-c">
				<div className="fw-500">
					Easily create your new NFT collection where all artists & their communities get ongoing royalties & donations.
				</div>
				<div>No-code, full-cycle, smart contract solution.</div>
			</div>

			<img src={getOptimizedBucketFullSrc("/home/wave-top.svg", { width: 1280 })} alt="" className="home-wave-image" />

			<div className="home-block flex-row jc-se" style={{ height: 800 }}>
				<img src={getOptimizedBucketFullSrc("/home/rocket3.png", { width: 693 })} alt="" className="home-block--img desktop-only" />
				<img src={getOptimizedBucketFullSrc("/home/rocket-mobile-2.png", { width: 424 })} alt="" className="home-block--img mobile-only" />
				<FeatureCard firstWord="Deploy" title="& manage your collection" style={{ marginTop: 32 }}>
					Create smart contracts, lazy mint, trade on your free collection page, and list on top marketplaces.
				</FeatureCard>
				<FeatureCard firstWord="Unleash" title="the power of collaboration" style={{ marginBottom: 32 }}>
					Assemble teams of artists and curators to build a cohesive collection, with just a few clicks.
				</FeatureCard>
			</div>

			<div className="home-block flex-row jc-se" style={{ height: 1260 }}>
				<img src={getOptimizedBucketFullSrc("/home/eth-mobile-2.png", { width: 1280 })} alt="" className="home-block--img desktop-only" style={{ marginTop: -16 }} />
				<img src={getOptimizedBucketFullSrc("/home/eth-mobile-2.png", { width: 424 })} alt="" className="home-block--img mobile-only" style={{ marginTop: -16 }} />
				<FeatureCard firstWord="Give" title="a reason for your collectors to hold" style={{ transform: 'translateX(64px)' }}>
					Our revolutionary system incentivizes holding your NFTs. The more they hold, the more they can donate to causes of their choice.
				</FeatureCard>
				<FeatureCard firstWord="Take" title="control of RevShare" style={{ marginTop: 0, transform: 'translateY(96px)' }}>
					Set fair, transparent revenue sharing for artists & teams, on mints and secondary sales.
				</FeatureCard>
				<FeatureCard firstWord="Unite" title="artists in multi-artist collections" style={{ marginBottom: 256 }}>
					Promote collaboration and community growth with multi-artist collections and shared royalties.
				</FeatureCard>
			</div>

			<FadeInSection>
				<div className="major-title">“A fair and transparent distribution of earnings for all parties”</div>
			</FadeInSection>

			<div className="home-block flex-column align-cards-to-start" style={{ height: 1327 }}>
				<img src={getOptimizedBucketFullSrc("/home/planet.png", { width: 1280 })} className="home-block--img desktop-only" alt="" />
				<img src={getOptimizedBucketFullSrc("/home/planet-mobile-2.png", { width: 424 })} className="home-block--img mobile-only" alt="" />
				<FeatureCard firstWord="Go" title="private" style={{ transform: 'translateY(96px)' }}>
					Build a free, visually-appealing mini-site & private secondary marketplace using our user-friendly design tools.
				</FeatureCard>
				<FeatureCard firstWord="Elevate" title="existing collections">
					Upgrade your existing collections and give your holders a new way to donate to their causes.
				</FeatureCard>
				<FeatureCard firstWord="Partner" title="up" style={{ transform: 'translateY(-96px)' }}>
					Artists, curators, founders, brands, developers, marketplaces, and aggregators, let’s join forces.
				</FeatureCard>
			</div>

			<img src={getOptimizedBucketFullSrc("/home/wave-bottom.svg", { width: 1280 })} alt="" style={{ marginTop: -106 }} className="home-wave-image" />

			<StickyButtonContainer style={{ marginTop: -5 }}>
				<button className="primary" onClick={openConnectFlow}>Connect</button>
			</StickyButtonContainer>

			<WelcomePopup visible={openWelcomePopup} setVisible={setOpenWelcomePopup} setCompleted={setIsConnectFlowCompleted} />
		</div>
	)
}

function FadeInSection({ children }) {
	const [isVisible, setVisible] = useState(true)
	const domRef = useRef()
	useEffect(() => {
		const { current } = domRef
		const observer = new IntersectionObserver(entries => {
			entries.forEach(entry => setVisible(entry.isIntersecting))
		})
		observer.observe(current)
		return () => observer.unobserve(current)
	}, [])
	return <div className={`fade-in-section ${isVisible ? 'is-visible' : ''}`} ref={domRef}>{children}</div>
}

function FeatureCard({ firstWord, title, children, style }) {
	const innerCls = 'feature-card--inner'
	const innerClsSelector = '.' + innerCls

	const calculateAngle = function (e, cardInner, card) {
		let dropShadowColor = `rgba(0, 0, 0, 0.3)`
		if (card.getAttribute('data-filter-color') !== null) {
			dropShadowColor = card.getAttribute('data-filter-color')
		}

		card.classList.add('animated')
		// Get the x position of the users mouse, relative to the button itself
		let x = Math.abs(cardInner.getBoundingClientRect().x - e.clientX)
		// Get the y position relative to the button
		let y = Math.abs(cardInner.getBoundingClientRect().y - e.clientY)

		// Calculate half the width and height
		let halfWidth = cardInner.getBoundingClientRect().width / 2
		let halfHeight = cardInner.getBoundingClientRect().height / 2

		// Use this to create an angle. I have divided by 6 and 4 respectively so the effect looks good.
		// Changing these numbers will change the depth of the effect.
		let calcAngleX = (x - halfWidth) / 6
		let calcAngleY = (y - halfHeight) / 14

		let gX = (1 - (x / (halfWidth * 2))) * 100
		let gY = (1 - (y / (halfHeight * 2))) * 100

		// Add the glare at the reflection of where the user's mouse is hovering
		cardInner.querySelector('.glare').style.background = `radial-gradient(circle at ${gX}% ${gY}%, rgb(199 198 243), transparent)`
		// And set its container's perspective.
		card.style.perspective = `${halfWidth * 6}px`
		cardInner.style.perspective = `${halfWidth * 6}px`

		// Set the items transform CSS property
		cardInner.style.transform = `rotateY(${calcAngleX}deg) rotateX(${-calcAngleY}deg) scale(1.04)`

		if (card.getAttribute('data-custom-perspective') !== null) {
			card.style.perspective = `${card.getAttribute('data-custom-perspective')}`
		}

		// Reapply this to the shadow, with different dividers
		let calcShadowX = (x - halfWidth) / 3
		let calcShadowY = (y - halfHeight) / 6

		// Add a filter shadow - this is more performant to animate than a regular box shadow.
		cardInner.style.filter = `drop-shadow(${-calcShadowX}px ${-calcShadowY}px 15px ${dropShadowColor})`
	}
	const isDesktop = () => window.matchMedia("(min-width: 960px)").matches
	const onMouseEnter = (e) => isDesktop() ? calculateAngle(e, e.currentTarget.querySelector(innerClsSelector), e.currentTarget) : null
	const onMouseMove = (e) => isDesktop() ? calculateAngle(e, e.currentTarget.querySelector(innerClsSelector), e.currentTarget) : null
	const onMouseLeave = ({ currentTarget: card }) => {
		if (isDesktop()) {
			let dropShadowColor = `rgba(0, 0, 0, 0.3)`
			if (card.getAttribute('data-filter-color') !== null) {
				dropShadowColor = card.getAttribute('data-filter-color')
			}
			card.classList.remove('animated')
			card.querySelector(innerClsSelector).style.transform = `rotateY(0deg) rotateX(0deg) scale(1)`
			card.querySelector(innerClsSelector).style.filter = `drop-shadow(0 10px 15px ${dropShadowColor})`
		}
	}

	return (<div className="feature-card" style={style} onMouseEnter={onMouseEnter} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
		<div className={innerCls}>
			<div className="feature-card--title">
				<span className="highlighted">{firstWord}</span> {title}
			</div>
			<div className="featured-card--content">{children}</div>
			<div className="glare"></div>
		</div>
	</div>)
}