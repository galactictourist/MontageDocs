import './topbar.scss'
import StateIcon from "./stateIcon/StateIcon"
import AuthContext from "../../ctx/Auth"
import { useContext } from "react"
import FontIcon from '../../fontIcon/FontIcon'
import CartContext from '../../ctx/Cart'
import last4 from '../../util/last4'
import { Link } from 'react-router-dom'
import SidebarContext from '../../ctx/Sidebar'
import InviteContext from '../../ctx/Invite'
import CollectionProgressBarContext from '../../ctx/CollectionProgressBarContext'
import { CollectionProgressBar } from './CollectionProgressBar'
import { isDesktopByMatchMedia, isMobileByMatchMedia } from '../../util/isDesktopByMatchMedia'

export default function Topbar({ pageTitle, noCartButton, crumbs, noWalletConnectButtonWhenConnected = false }) {
	const { toggleSidebarState, toggleSidebarOnMobile, sidebarState, doRenderSidebar } = useContext(SidebarContext)
	const { accounts, isAdmin, isImpersonating, openWalletConnectPopup, openWalletDisconnectPopup } = useContext(AuthContext)
	const { wasInvited, keepKey } = useContext(InviteContext)
	const connected = accounts?.length > 0
	const { hasStageProgressBar } = useContext(CollectionProgressBarContext)
	const { cart, toggleCartView } = useContext(CartContext)
	const itemsInCart = cart?.items?.length || 0
	const cartHasItems = itemsInCart > 0
	const toStr = (fnOrStatic) => typeof (fnOrStatic) === 'function' ? fnOrStatic() : fnOrStatic || ''

	const isInDeeperLevel = () => sidebarState > 1
	const menuOrBackArrowIcon = () => isInDeeperLevel() ? "arrow-back" : "menu"
	const title = (label) => <span className="page-title">{label}</span>
	const crumbLinks = () => {
		const tmp = crumbs.map(c => {
			if (c) {
				const { path, label } = typeof (c) === 'function' ? c() : c
				const p = toStr(path)
				const l = toStr(label)
				if (p && l) {
					return { path: p, label: l }
				}
			}
			return null
		})
		const tmp2 = []
		for (let i = 0; i < tmp.length; i++) {
			const x = tmp[i]
			if (!x) {
				if (tmp2.length === 0) continue
				break
			}
			tmp2.push(x)
		}
		return tmp2.map(({ path, label }, idx) => <Link to={path} key={idx} className="crumb">{title(label)}</Link>)
	}

	const inviteOrRoot = () => keepKey ? '/invite' + keepKey : '/'

	const logoTo = () =>
		!connected ? inviteOrRoot() :
			isAdmin && !isImpersonating ? '/admin' :
				wasInvited || (isAdmin && isImpersonating) ? '/my-collections' :
					inviteOrRoot()
	return (
		<header className="app-header">
			<StateIcon type="montage" to={logoTo()} doRender={isDesktopByMatchMedia() || !isInDeeperLevel()} />
			<FontIcon name="menu" moreCls="topbar-icon" tabIndex={0} onClick={toggleSidebarOnMobile} disabled={!connected} doRender={doRenderSidebar ? isMobileByMatchMedia() : false} />
			<FontIcon name="arrow-back" moreCls="topbar-icon" tabIndex={0} onClick={toggleSidebarState} disabled={!connected} doRender={doRenderSidebar ? isMobileByMatchMedia() && isInDeeperLevel() : false} />
			<FontIcon name={menuOrBackArrowIcon()} moreCls="topbar-icon" tabIndex={0} onClick={toggleSidebarState} disabled={!connected} doRender={doRenderSidebar ? isDesktopByMatchMedia() : false} />
			{crumbs && isDesktopByMatchMedia() ? crumbLinks() : title(pageTitle)}
			<div className="side-icon-set">
				{hasStageProgressBar ? <CollectionProgressBar /> : null}
				<FontIcon name={cartHasItems ? "cart-full" : "cart"} moreCls="topbar-icon cart-toggler" tabIndex={0} onClick={toggleCartView} title={cartHasItems ? `${itemsInCart} item${itemsInCart > 1 ? 's' : ''} in cart` : null} />
				{(connected || !noWalletConnectButtonWhenConnected) && <FontIcon name={connected ? "wallet-connected" : "wallet"} moreCls="topbar-icon" tabIndex={0} onClick={connected ? openWalletDisconnectPopup : openWalletConnectPopup} title={connected ? `Disconnect from ${last4(accounts)}` : "Connect wallet"} />}
			</div>
		</header>
	)
}