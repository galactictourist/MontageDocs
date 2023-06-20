async function getIP() {
	const r = await fetch('https://api.ipify.org?format=json')
	const j = r ? await r.json() : null
	const ip = j?.ip
	return ip
}

export default getIP