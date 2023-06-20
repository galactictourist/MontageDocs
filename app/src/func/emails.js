import callFunc from './callFunc'

export async function sendRequestToAddCollection(adminData, signedInUser, requestData) {
	if (adminData && signedInUser && requestData) {
		const l = window.location
		const r = await callFunc("sendRequestToAddCollection", {
			host: l.protocol + '//' + l.host,
			adminEmail: adminData.email,
			adminName: adminData.name,
			requestorUserId: signedInUser.userId,
			requestorName: signedInUser.name,
			requestorEmail: signedInUser.email,
			collectionDesc: requestData.collectionDesc
		})
		console.log(r)
	}
}

export async function sendConfirmationEmail(userId, email, name) {
	if (userId && email) {
		const l = window.location
		await callFunc("sendConfirmationEmail", {
			host: l.protocol + '//' + l.host,
			userId,
			email,
			name
		})
	}
}

export async function sendOfferToSeller(email, offer) {
	if (email) {
		await callFunc("sendOfferToSeller", { email, offer })
	}
}

export async function sendOfferAcceptedToBuyer(email, offer) {
	if (email) {
		await callFunc("sendOfferAcceptedToBuyer", { email, offer })
	}
}