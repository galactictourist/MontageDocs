export async function getEthRate() {
	//https://www.coingecko.com/en/api/documentation
	// 10-50 free calls per minute
	try {
		const r = await fetch('https://api.coingecko.com/api/v3/exchange_rates')
		const obj = await r.json()
		if (obj && obj.rates) {
			const { usd, eth } = obj.rates
			const ethRate = Number(usd.value / eth.value)
			return { ethRate: ethRate.toFixed(1) }
		}
		return { ethRate: 0 }
	} catch (e) {
		console.error(e)
		return { err: { message: e.message, stack: e.stack, e } }
	}
}