const startWithAt = { twitter: true, instagram: true, tiktok: true }

export default function getFullUrl(url, socialNetwork) {
	if (!url)
		return url
	if (url.startsWith("@") && socialNetwork)
		return `https://${socialNetwork}.com/` + url
	if (url.startsWith("http://"))
		return "https" + url.substring("http".length)
	if (!url.startsWith("https://"))
		url = "https://" + (socialNetwork ? `${socialNetwork}.com/` + (url.startsWith("@") ? "" : startWithAt[socialNetwork] ? "@" : "") + url : url)
	return url
}