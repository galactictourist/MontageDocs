import { getEthRate } from '../func/coingecko'

let ethRate = parseFloat(localStorage.ethRate) || 1000
let ethRateFetchedAt = parseInt(localStorage.ethRateFetchedAt) || 0

const rateIsTooOld = () => {
	if (ethRateFetchedAt) {
		const now = new Date().getTime()
		const diff = (now - ethRateFetchedAt) / 1000 / 60 / 60 // refresh rate once an hour
		return diff >= 1
	}
	return true
}

const fetchRate = async () => {
	if (new Date().getTime() - ethRateFetchedAt < 1000) return
	localStorage.ethRateFetchedAt = ethRateFetchedAt = new Date().getTime()
	const { err, ethRate: rate } = await getEthRate()
	if (err) {
		throw new Error(err.message || "Tech error... please try again later")
	}
	if (rate) {
		localStorage.ethRate = ethRate = rate
	}
}

export const ethToUsd = (eth, decimals = 2) => {
	if (rateIsTooOld()) fetchRate()
	const usd = eth * ethRate
	return Number(usd.toFixed(decimals))
}


// TODO [offers] - use contract weth rate 
const wethRate = 1.01

export const wethToEth = (eth, decimals = 4) => {
	const weth = eth / wethRate
	return Number(weth.toFixed(decimals))
}