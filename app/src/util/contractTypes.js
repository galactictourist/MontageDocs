export const ContractTypes = {
	oneArtist: 1,
	manyArtists: 2,

	evolving: 4,
	setNumber: 8,

	existing: 16,
	new: 32,
}

export const SingleMarketPlaceContract = ContractTypes.oneArtist | ContractTypes.evolving;

export const getContractPath = (contractType) => {
	if (!contractType) {
		return "";
	}
	let path = "";

	if (contractType & ContractTypes.oneArtist) {
		path += "oneArtist/";
	} else if (contractType & ContractTypes.manyArtists) {
		path += "manyArtists/";
	}

	if (contractType & ContractTypes.existing) {
		path += "existing/";
	} else if (contractType & ContractTypes.evolving) {
		path += "evolving/";
	} else if (contractType & ContractTypes.setNumber) {
		path += "setNumber/";
	}

	return path;
}

export const getContractType = (collectionSettings) => {
	if (!collectionSettings) return 0;
	return (collectionSettings.manyArtists ? ContractTypes.manyArtists : ContractTypes.oneArtist)
		| (collectionSettings.isImportExistingCollection ? ContractTypes.existing : ContractTypes.new)
		| (collectionSettings.canGrow ? ContractTypes.evolving : ContractTypes.setNumber)
}