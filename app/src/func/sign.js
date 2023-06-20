import callFunc from './callFunc'

export async function addValidPayee(address, shareAmount, dest) {
	return address ? await callFunc("addValidPayee", { address, shareAmount, dest }) : false
}

export async function signMessage(hash) {
	return hash ? await callFunc("signMessage", { hash }) : ""
}
