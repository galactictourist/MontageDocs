const { getRequest, createHttpsFunction } = require("./db")

exports.loadProps = createHttpsFunction(async (data) => {
	const { collectionId } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		const result = await sqlReq.input("collectionId", collectionId).query(`
		select propId, name
		from props
		where collectionId=@collectionId
		order by name
		`)
		return result.recordset || []
	}
})

exports.loadOptions = createHttpsFunction(async (data) => {
	const { collectionId } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		const result = await sqlReq.input("collectionId", collectionId).query(`
		select o.propId, o.optionId, o.name
		from options o 
		inner join props p on p.propId=o.propId
		where p.collectionId=@collectionId
		order by o.propId, o.name
		`)
		return result.recordset || []
	}
})

exports.loadItemOptions = createHttpsFunction(async (data) => {
	const { itemId } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		const result = await sqlReq.input("itemId", itemId).query(`
		select optionId
		from itemOptions 
		where itemId=@itemId
		`)
		return result.recordset || []
	}
})

exports.createProp = createHttpsFunction(async (data) => {
	const { collectionId, name } = data
	return await insert()

	async function insert() {
		const sqlReq = await getRequest()
		const q = `insert into props (collectionId, name) values (@collectionId, @name) select @@IDENTITY as propId`
		const result = await sqlReq.input("collectionId", collectionId).input("name", name).query(q)
		return result.recordset[0]
	}
}, { hasPublicAccess: false })

exports.createOption = createHttpsFunction(async (data) => {
	const { propId, name } = data
	return await insert()

	async function insert() {
		const sqlReq = await getRequest()
		const q = `insert into options (propId, name) values (@propId, @name) select @@IDENTITY as optionId`
		const result = await sqlReq.input("propId", propId).input("name", name).query(q)
		return result.recordset[0]
	}
}, { hasPublicAccess: false })

exports.mergeItemOptions = createHttpsFunction(async (data) => {
	const { itemId, optionIds } = data
	return await merge()

	async function merge() {
		const sqlReq = await getRequest()
		sqlReq.input("itemId", itemId)
		const q = optionIds?.length > 0 ? `
merge itemOptions with (holdlock) as Target
using (select optionId from (values ${optionIds.map((_id, idx) => `(@optionId${idx})`).join(',')}) AS X(optionId)) as Source
on Target.itemId=@itemId and Target.optionId=Source.optionId
when not matched by Target then
	insert (itemId, optionId) values (@itemId, Source.optionId)
when not matched by Source and Target.itemId=@itemId then
	delete
;` : 'delete from itemOptions where itemId=@itemId'
		optionIds?.forEach((id, idx) => sqlReq.input(`optionId${idx}`, id))
		await sqlReq.query(q)
	}
}, { hasPublicAccess: false })

exports.deleteOption = createHttpsFunction(async (data) => {
	const { optionId } = data
	await del()

	async function del() {
		const sqlReq = await getRequest()
		sqlReq.input("optionId", optionId)
		const q = `
		delete from options where optionId=@optionId
		delete from itemOptions where optionId=@optionId
		`
		await sqlReq.query(q)
	}
}, { hasPublicAccess: false })

exports.deleteProp = createHttpsFunction(async (data) => {
	const { propId } = data
	await del()

	async function del() {
		const sqlReq = await getRequest()
		sqlReq.input("propId", propId)
		const q = `
		delete from itemOptions where optionId in (select optionId from options where propId=@propId)
		delete from options where propId=@propId
		delete from props where propId=@propId
		`
		await sqlReq.query(q)
	}
}, { hasPublicAccess: false })

exports.updateProp = createHttpsFunction(async (data) => {
	const { propId, name } = data
	await update()

	async function update() {
		const sqlReq = await getRequest()
		sqlReq.input("propId", propId).input("name", name)
		const q = `update props set name=@name where propId=@propId`
		await sqlReq.query(q)
	}
}, { hasPublicAccess: false })

exports.updateOption = createHttpsFunction(async (data) => {
	const { optionId, name } = data
	await update()

	async function update() {
		const sqlReq = await getRequest()
		sqlReq.input("optionId", optionId).input("name", name)
		const q = `update options set name=@name where optionId=@optionId`
		await sqlReq.query(q)
	}
}, { hasPublicAccess: false })