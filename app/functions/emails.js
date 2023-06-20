const functions = require('firebase-functions')
const nodemailer = require('nodemailer')
const { encryptImpl } = require('./crypto')

const { useremail, refreshtoken, clientid, clientsecret } = functions.config().gmail
const fromEmail = 'Support <support@montage.app>'
const replyTo = 'Eric <eric@montage.app>'

const runtimeOptions = { minInstances: 1, memory: '128MB' }

/**create reusable transporter object using the gmail SMTP transport */
const transporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 465,
	secure: true,
	auth: {
		type: "OAuth2",
		user: useremail,
		clientId: clientid,
		clientSecret: clientsecret,
		refreshToken: refreshtoken
	}
})

exports.sendOfferAcceptedToBuyer = functions.runWith(runtimeOptions).https.onCall(async (data, context) => {
	const { email, offer } = data
	const mailOptions = {
		from: fromEmail,
		to: email,
		subject: `Congratulations!`,
		html: `
<p>
	Hi,
</p>
<p>
	Your offer<br/>
	${getOfferDetails(offer)}
</p>
<p>
	Got accepted!
</p>
<p>
	Thanks,<br/>
	The Montage Team
</p>
`}

	return await transporter.sendMail(mailOptions)
})

exports.sendOfferToSeller = functions.runWith(runtimeOptions).https.onCall(async (data, context) => {
	const { email, offer } = data
	const mailOptions = {
		from: fromEmail,
		to: email,
		subject: `You’ve got a new offer waiting for you`,
		html: `
<p>
	Hi,
</p>
<p>
	You’ve got a new offer<br/>
	${getOfferDetails(offer)}
</p>
<p>
	Offer expires on <strong>${offer?.offerExpiresOn || '[offer expires on]'}</strong>
</p>
<p>
	Go to montage account and to waiting offers<br/>
	to accept or decline the offer.
</p>
<p>
	Thanks,<br/>
	The Montage Team
</p>
`
	}

	return await transporter.sendMail(mailOptions)
})

function getOfferDetails(offer) {
	return offer ? `
for <strong>${offer.itemName || offer.name || offer.tokenId || '[nft name]'}</strong><br/>
of <strong>${offer.collectionName || offer.nftContract || '[collection name]'}</strong><br/>
in the amount of <strong>${offer.offerAmount || '[offer amount]'} ${offer.offerIn || '[offer in]'}</strong>`
		: ''
}

exports.sendConfirmationEmail = functions.runWith(runtimeOptions).https.onCall(async (data, context) => {
	const { host, userId, email, name } = data
	const dearName = name || email.substring(0, email.indexOf('@'))
	const confirmLink = host + '/confirm-email/' + encryptImpl(JSON.stringify({ userId }))
	const mailOptions = {
		from: fromEmail,
		to: email,
		subject: `Confirm your email address for updates on new royalties and collections`,
		html: `
<p style="text-align: center;">
		<img src="${host}/logo192.png" alt="Montage app logo" style="max-width: 100%; width: 92px;" />
</p>
<p>
	Dear ${dearName},
</p>
<p>
	Thanks for signing up to receive updates on new royalties and collections on our platform. To make sure you don't miss out on any exciting news, please confirm your email address by clicking the button below.
</p>
<p>
	<a href="${confirmLink}">Confirm Email</a>
</p>
<p>
	By confirming, you'll be agreeing to our terms of use and giving us the green light to send you updates about new royalties, updates, and collections.
</p>
<p>
	We're excited to have you on board and can't wait to keep you in the loop about everything happening on our platform.
</p>
<p>
	Best,<br/><br/><br/>
	The Montage Team
</p>
`
	}

	return await transporter.sendMail(mailOptions)
})

exports.sendRequestToAddCollection = functions.runWith(runtimeOptions).https.onCall(async (data, context) => {
	const { host } = data
	const { adminName, adminEmail } = data
	const { requestorUserId, requestorName, requestorEmail, collectionDesc } = data

	const mailOptions = {
		from: fromEmail,
		replyTo: requestorEmail,
		to: adminEmail,
		subject: `${requestorName} requested permission to add collection`,
		html: `
<p>Hi ${adminName}</p>
<p>This is the collection desciption:<br/><i>${collectionDesc}</i></p>
<p>You can reply to this email to notify ${requestorName} about your decision</p>
`
	}

	return await transporter.sendMail(mailOptions)
})

exports.userJoinedNotification = functions.runWith(runtimeOptions).https.onCall(async (data, context) => {
	// Checking that the user is authenticated.
	if (!context.auth) {
		// Throwing an HttpsError so that the client gets the error details.
		throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
	}

	const { host } = data
	const { inviterUID, inviterDisplayName, inviterEmail, toCollectionId, toCollectionTitle } = data
	const { inviteeUID, inviteeDisplayName, inviteeEmail, inviteePhotoURL, inviteeRole } = data

	const mailOptions = {
		from: fromEmail,
		replyTo: replyTo,
		to: inviterEmail,
		subject: `${inviteeDisplayName} just joined to ${toCollectionTitle}`,
		html: `
<p>Hi ${inviterDisplayName}</p>
<p>${inviteeDisplayName} just joined to <a href='${host}/my-collections/${toCollectionId}'>${toCollectionTitle}</a> as ${inviteeRole}</p>
<p><img src='${inviteePhotoURL}' /></p>`
	}

	return await transporter.sendMail(mailOptions)
})

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
