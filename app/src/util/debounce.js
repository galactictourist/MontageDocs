export default function debounce(fn, delay) {
	let timer = null
	return async function () {
		let context = this, args = arguments
		clearTimeout(timer)
		timer = setTimeout(function () {
			fn.apply(context, args)
		}, delay)
	}
}
