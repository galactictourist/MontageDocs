import last4 from "../../../../util/last4";

export function etherScanAddress(address, tokenId) { return `https://etherscan.io/address/${address}${tokenId ? '/' + tokenId : ''}` }

export function EtherScanLink({ address, tokenId, itemsCount, className, text }) {
	return (
		<a href={etherScanAddress(address, tokenId)} target="_blank" rel="noreferrer" className={className || (itemsCount > 2 ? "bad" : "good")}>
			{text || itemsCount || tokenId || last4(address)}
		</a>
	)
}
