export function isMasterOwner(accountAddress) {
	return isContractOwner(accountAddress)
}

export default function isContractOwner(accountAddress, owner = null) {
	return accountAddress?.toLowerCase() === (owner || process.env.REACT_APP_OWNER_ADDRESS)?.toLowerCase()
}