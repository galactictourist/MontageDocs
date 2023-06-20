export default function last4(walletAddress) {
	return walletAddress ? '0x...' + walletAddress.slice(-4) : ''
}