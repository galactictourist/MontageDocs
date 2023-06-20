export const TRADE_BITS = ['tradeOnOpensea', 'tradeOnLooksrare', 'tradeOnX2Y2', 'tradeOnBlur', 'tradeOnFoundation']

export const MarketAddresses = process.env.REACT_APP_CHAINID === "0x1" ? [
	'0x00000000006c3852cbef3e08e8df289169ede581', // opensea mainnet
	'0xf42aa99F011A1fA7CDA90E5E98b277E306BcA83e', // looksrare mainnet
	'0xf849de01b080adc3a814fabe1e2087475cf2e354', // x2y2 mainnet
	'0x00000000000111AbE46ff893f3B2fdF1F759a8A8', // blur mainnet
	'0xcda72070e455bb31c7690a170224ce43623d0b6f', // foundation mainnet
] : [
	'0x00000000006c3852cbef3e08e8df289169ede581', // opensea Goerli
	'0xF8C81f3ae82b6EFC9154c69E3db57fD4da57aB6E', // looksrare Goerli
	'0x0000000000000000000000000000000000000000', // x2y2 Goerli
	'0x0000000000000000000000000000000000000000', // blur Goerli
	'0x0000000000000000000000000000000000000000', // foundation Goerli
]

export const getTradeBits = (data) => TRADE_BITS.map(key => data[key])

export const tradeBitsChanged = (oldBits, newBits) => {
	let dirty = false
	for (let i = 0; i < TRADE_BITS.length; i++) {
		if (oldBits[i] !== newBits[i] && MarketAddresses[i]) {
			dirty = true
			break
		}
	}
	return dirty
}