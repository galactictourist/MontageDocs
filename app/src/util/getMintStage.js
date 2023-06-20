export async function getMintStage(nftContract) {
	if (nftContract?.methods.getStage) {
		return parseInt(await nftContract.methods.getStage().call())
	}
	if (nftContract?.methods.extractSettings) {
		const settings = await nftContract.methods.extractSettings().call()
		return parseInt(settings["3"])
	}
	return 0 // inactive
}