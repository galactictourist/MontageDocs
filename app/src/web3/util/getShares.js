export function getShares(pie) {
	return [
		percentToBPS(pie.creator),
		percentToBPS(pie.allPartners),
		percentToBPS(pie.allCreators),
		percentToBPS(pie.allOwners),
		percentToBPS(pie.marketplace), // 4
	]
}

export function getShareValues(postMintPie, mintPie) {
	return [
		percentToBPS(postMintPie.allPartners),
		percentToBPS(postMintPie.allCreators),
		percentToBPS(postMintPie.creator),
		percentToBPS(postMintPie.allOwners),
		percentToBPS(postMintPie.marketplace), // 4

		percentToBPS(mintPie.allPartners),
		percentToBPS(mintPie.allCreators),
		percentToBPS(mintPie.creator),
		percentToBPS(mintPie.allOwners),
		percentToBPS(mintPie.marketplace), // 9
	]
}

export function getPartnerShares(team) {
	return team?.map(data => percentToBPS(data.share)) || []
}

function percentToBPS(pct) {
	return Math.round(parseFloat(pct) * 100) || 0
}
