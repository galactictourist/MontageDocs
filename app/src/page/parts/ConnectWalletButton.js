import { isMobileByMatchMedia } from "../../util/isDesktopByMatchMedia";

export function ConnectWalletButton({ onClick, mobileText = "Connect wallet", desktopText = "Join allowlist" }) {
	return (
		<button className="primary" onClick={onClick}>{isMobileByMatchMedia() && !window.ethereum ? mobileText : desktopText}</button>
	)
}