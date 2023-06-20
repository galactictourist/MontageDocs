const { createHttpsFunction, runQuery } = require("./db")
const { checkCollectionOwner } = require("./validAccess")

exports.loadArtShowcase = createHttpsFunction(async (data) => {
	return await runQuery('select artImage from artShowcase where collectionId=@collectionId', data)
})

exports.updateArtShowcase = createHttpsFunction(async ({ arts, collectionId }, auth) => {
	await checkCollectionOwner(auth, collectionId)
	await runQuery('delete from artShowcase where collectionId=@collectionId', { collectionId })
	const promises = arts?.map(({ artImage }) => runQuery('insert into artShowcase (collectionId, artImage) values (@collectionId, @artImage)', { collectionId, artImage }))
	if (promises?.length) await Promise.all(promises)
}, { hasPublicAccess: false })