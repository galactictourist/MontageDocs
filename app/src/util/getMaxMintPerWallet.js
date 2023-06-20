export async function getMaxMintPerWallet(nftContract) {
	if (nftContract?.methods.getMaxMintPerWallet) {
		return parseInt(await nftContract.methods.getMaxMintPerWallet().call())
	}
	if (nftContract?.methods.extractSettings) {
		const settings = await nftContract.methods.extractSettings().call()
		return parseInt(settings["2"])
	}
	return 0
}