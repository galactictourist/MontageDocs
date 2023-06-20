export const PriceKinds = { Premint: 'Premint', Mint: 'Mint', Sale: 'Sale' }
export const PriceKindFieldLabel = { [PriceKinds.Premint]: 'Private', [PriceKinds.Mint]: 'Public', [PriceKinds.Sale]: 'Listing' }
export const PriceKindFieldName = { [PriceKinds.Premint]: 'premintPrice', [PriceKinds.Mint]: 'mintPrice', [PriceKinds.Sale]: 'salePrice' }
export const PriceKindTooltips = {
	[PriceKinds.Premint]: 'This is the presale price for your allowlist or early access collectors',
	[PriceKinds.Mint]: 'This is the public mint price',
	[PriceKinds.Sale]: 'This is the list price set for an individual item'
}
export const DefaultPriceKindTooltips = {
	[PriceKinds.Premint]: 'This is the default presale price for your allowlist or early access collectors (to set only once for the most repetitive price)',
	[PriceKinds.Mint]: 'This is the default public mint price (to set only once for the most repetitive price)',
	[PriceKinds.Sale]: 'This is the default list price set for an individual item (to set only once for the most repetitive price)'
}