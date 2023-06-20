export function generateValidKey() {
	const dec2hex = (dec) => dec.toString(16).padStart(2, "0");
	const generateId = (len) => {
		const arr = new Uint8Array((len || 40) / 2);
		window.crypto.getRandomValues(arr);
		return Array.from(arr, dec2hex).join('');
	};
	return generateId(50);
}

export async function sha256AsBytes32String(string) {
	const hashHex = await sha256(string);
	return `0x${hashHex}`;
}

export async function sha256(string) {
	const utf8 = new TextEncoder().encode(string);
	const hashBuffer = await window.crypto.subtle.digest('SHA-256', utf8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((bytes) => bytes.toString(16).padStart(2, '0')).join('');
	return hashHex;
}