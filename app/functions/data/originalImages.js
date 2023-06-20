const { runQuery, createHttpsFunction } = require("./db")

exports.saveOriginalImage = createHttpsFunction(async (data) => {
	await runQuery(`
	merge originalImages with (holdlock) as Target
using (select 1 as [TempKey]) as Source
on Target.croppedCID=@croppedCID
when matched then 
	update set originalCID=@originalCID
when not matched then
	insert (croppedCID, originalCID)
	values (@croppedCID, @originalCID);`, data)
}, { hasPublicAccess: false })

exports.loadOriginalImage = createHttpsFunction(async (data) => {
	const [r] = await runQuery("select originalCID from originalImages where croppedCID=@croppedCID", data)
	return r?.originalCID || null
})

