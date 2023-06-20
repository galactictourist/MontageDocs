const isTouchDevice = () => {
	return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0))
}

export function isDesktopByMatchMedia() {
	return window.matchMedia("(min-width: 960px)").matches && !isTouchDevice()
}

export function isMobileByMatchMedia() {
	return !isDesktopByMatchMedia()
}