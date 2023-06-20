function sigFigs(n, sig) {
	if (!sig) sig = 3
	const mult = Math.pow(10, sig - Math.floor(Math.log(n) / Math.log(10)) - 1)
	return (Math.round(n * mult) / mult).toString()
}

const magnitudeSpecifiers = " KMBTPEZY"

export default function toShortAmountStr(amount, prefix) {
	// eslint-disable-next-line
	if (amount === 0 || amount === NaN) return '---'
	if (amount < 1000) return amount
	let i = 0, k = amount
	while (k >= 1000 && i < magnitudeSpecifiers.length - 1) {
		k /= 1000
		i++
	}
	return (prefix || '') + (k !== 0 ? sigFigs(k) : '0') + magnitudeSpecifiers[i].trim()
}