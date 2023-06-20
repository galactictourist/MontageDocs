export default async function notifyToSlackChannel(webHookURL, text, channel, userName, botIconURL) {
	if (webHookURL && text) {
		const payload = { text }
		if (channel) payload.channel = channel
		if (userName) payload.username = userName
		if (botIconURL) payload.icon_url = botIconURL

		return await fetch(webHookURL, { method: 'post', body: JSON.stringify(payload) })
	}
}