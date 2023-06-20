import { functions } from '../firebase-config'
import { httpsCallable } from "firebase/functions"
import notifyToSlackChannel from '../util/notifyToSlackChannel'

export default async function callFunc(name, argsData, options) {
	const func = httpsCallable(functions, name)
	const argsWithToken = { ...argsData, authToken: window.authToken }
	const result = await func(argsWithToken)
	const { data } = result
	if (data?.err) {
		if (data.err.message?.indexOf('Invalid address provided') > -1) {
			data.err.message = "Please connect your wallet"
		}
		if (options?.errorHandler && options.errorHandler(data.err)) {
			return
		}
		const msg = data.err?.e?.originalError?.info?.message
		if (options?.ignoreDup && msg?.indexOf('Cannot insert duplicate key') > -1) {
			return
		}
		console.error(data.err)
		const skipNotifySlack = data.err?.message === 'Wallet address already exists for another user'
		if (!skipNotifySlack) {
			notifyToSlackChannel(process.env.REACT_APP_MONTAGE_TECH_ERROR,
				`Error from cloud function ${name}: ` +
				(msg || data.err.message || ('\n' + JSON.stringify(data.err, null, 2))) +
				`\nstack:\n${data.err.stack}` +
				"\nargsWithToken:\n" + JSON.stringify(argsWithToken, null, 2)
			)
		}
		throw new Error(data.err.message || "Tech error... please try again later")
	}
	return data
}
