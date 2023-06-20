import callFunc from "./callFunc"

export async function scanAndDealAdminOnly(block, collectionId, stage, chainId) {
	await callFunc("scanAndDealAdminOnly", { block, collectionId, stage, chainId })
}

export async function withdrawWaitingFunds(groupAddress, address, onlyHolders, isRequest, donationWallet) {
	if (groupAddress && address) {
		await callFunc("withdrawWaitingFunds", { groupAddress, address, onlyHolders, isRequest, donationWallet })
	}
}