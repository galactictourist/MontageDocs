export function getExchangeProp(collection, ...keys) {
	const list = collection?.exchange_data;
	for (let i = list?.length - 1; i >= 0; i--) {
		let v = list[i]
		for (let j = 0; v && j < keys.length; j++) {
			v = v[keys[j]]
		}
		if (v) {
			return v
		}
	}
}

export function getExchangeStats(collection) {
	const list = collection?.exchange_data
	for (let i = list?.length - 1; i >= 0; i--) {
		const stats = list[i]?.stats
		if (stats) {
			return stats
		}
	}
}