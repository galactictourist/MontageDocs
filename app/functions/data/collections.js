const { getRequest, createHttpsFunction, runQuery } = require("./db")
const { checkCollectionOwner, checkUserCollectionRoles } = require("./validAccess")

exports.loadCollectionArtists = createHttpsFunction(async (data) => {
	return await runQuery(`
select u.name, u.email, u.userId, u.walletAddress
from creators c
inner join users u on u.userId=c.userId
where c.collectionId=@collectionId
order by u.name`, data)
})

exports.loadCuratorAddress = createHttpsFunction(async (data) => {
	const [r] = await runQuery(`
select top 1 u.walletAddress
from userCollections uc
inner join users u on u.userId=uc.userId 
where uc.collectionId=@collectionId
and (uc.roles & @curatorRole)>0
order by u.userId
	`, data)
	return r
})

exports.mergeCreationStages = createHttpsFunction(async (data, auth) => {
	const { collectionId, states } = data
	await checkCollectionOwner(auth, collectionId)
	await merge()

	async function merge() {
		const sqlReq = await getRequest()
		sqlReq.input("collectionId", collectionId)

		const q = states?.length > 0 ? `
merge creationStages with (holdlock) as Target
using (select stageIdx, isCompleted from (values ${states.map((stateAtIdx, idx) => `(${idx}, ${stateAtIdx ? 1 : 0})`).join(',')}) AS X(stageIdx, isCompleted)) as Source
on Target.collectionId=@collectionId and Target.stageIdx=Source.stageIdx
when matched then 
		update set Target.isCompleted=Source.isCompleted
when not matched by Target then
	insert (collectionId, stageIdx, isCompleted) values (@collectionId, Source.stageIdx, Source.isCompleted)
when not matched by Source then
		update set Target.isCompleted=0
;` : 'delete from creationStages where collectionId=@collectionId'
		await sqlReq.query(q)
	}
}, { hasPublicAccess: false })

exports.loadCreationStages = createHttpsFunction(async (data) => {
	return await runQuery('select stageIdx, isCompleted from creationStages where collectionId=@collectionId order by stageIdx', data)
})

function setCollectionDefaults(rec) {
	if (rec) {
		// duplicate defaults for new collection at app\src\page\MyCollectionGeneral.js
		if (rec.canGrow === null) rec.canGrow = true
		if (rec.tradeOnOpensea === null) rec.tradeOnOpensea = true
		if (rec.tradeOnLooksrare === null) rec.tradeOnLooksrare = true
		if (rec.tradeOnX2Y2 === null) rec.tradeOnX2Y2 = true
		if (rec.tradeOnBlur === null) rec.tradeOnBlur = true
		if (rec.tradeOnFoundation === null) rec.tradeOnFoundation = false
		if (rec.manyArtists === null) rec.manyArtists = false
		if (rec.batchUploads === null) rec.batchUploads = false
		if (rec.selfMinted === null) rec.selfMinted = true
		if (rec.samePriceForAllNFT === null) rec.samePriceForAllNFT = true
		if (rec.mintersAsArtists === null) rec.mintersAsArtists = false
		if (rec.marketFee === null) rec.marketFee = 0
		if (rec.maxItemsPerMinter === null) rec.maxItemsPerMinter = 0
		if (rec.showMarketMode === null) rec.showMarketMode = 1 // ShowMarketMode.nobody
		if (rec.priceStyle === null) rec.priceStyle = 1 // PriceStylesMap.prices
		if (rec.acceptCasualOffers === null) rec.acceptCasualOffers = false
		if (rec.acceptCasualBids === null) rec.acceptCasualBids = false
	}
	return rec
}
exports.setCollectionDefaults = setCollectionDefaults

exports.deleteAllCollectionItems = createHttpsFunction(async (data, auth) => {
	await checkCollectionOwner(auth, data.collectionId)
	await runQuery("update items set isDeleted=1 where collectionId=@collectionId", data)
}, { hasPublicAccess: false })

exports.loadCurrentSchedule = createHttpsFunction(async (data) => {
	const { collectionId, status, stage } = data
	const r = await loadCurrentMintStageImpl(collectionId, status, stage)
	const rs = await runQuery(`
	select launchAt 
	from schedule 
	where collectionId=@collectionId 
	and stage in (2, 3) 
	order by stage -- ScheduleStages.premint, ScheduleStages.mint
	`, { collectionId })
	const [privateMintLaunchAt, publicMintLaunchAt] = rs?.map(r => r.launchAt)
	r.privateMintLaunchAt = privateMintLaunchAt || null
	r.publicMintLaunchAt = publicMintLaunchAt || null
	return r
})

async function loadCurrentMintStageImpl(collectionId, status = 2 /* ScheduleStatuses.done */, stage = 0) {
	const sqlReq = await getRequest()
	sqlReq.input("collectionId", collectionId)
	let filter = ''
	if (stage) {
		sqlReq.input("stage", stage)
		filter = "and stage=@stage"
	} else {
		sqlReq.input("status", status)
		filter = "and status=@status"
	}
	const q = `
		select top 1 stage, passwordProtected
		from schedule
		where collectionId=@collectionId ${filter}
		${stage ? '' : 'order by stage desc'}`
	const result = await sqlReq.query(q)
	return result?.recordset?.length > 0 ? result.recordset[0] : {}
}
exports.loadCurrentMintStageImpl = loadCurrentMintStageImpl
exports.loadCurrentMintStage = createHttpsFunction(async ({ collectionId }) => loadCurrentMintStageImpl(collectionId))

exports.mergeSchedule = createHttpsFunction(async (data, auth) => {
	const { collectionId, rows } = data
	await checkCollectionOwner(auth, collectionId)
	await merge()

	async function merge() {
		const sqlReq = await getRequest()
		sqlReq.input("collectionId", collectionId)

		const q = rows?.length > 0 ? `
merge schedule with (holdlock) as Target
using (select stage, launchAt, passwordProtected from (values ${rows.map((_row, idx) => `(@stage${idx}, @launchAt${idx}, @passwordProtected${idx})`).join(',')}) AS X(stage, launchAt, passwordProtected)) as Source
on Target.collectionId=@collectionId and Target.stage=Source.stage
when matched then 
		update set Target.launchAt=Source.launchAt, Target.passwordProtected=Source.passwordProtected
when not matched by Target then
	insert (collectionId, stage, launchAt, passwordProtected) values (@collectionId, Source.stage, Source.launchAt, Source.passwordProtected)
when not matched by Source and Target.collectionId=@collectionId then
	delete
;` : 'delete from schedule where collectionId=@collectionId'
		rows?.forEach((row, idx) => {
			sqlReq.
				input(`stage${idx}`, row.stage).
				input(`launchAt${idx}`, row.launchAt).
				input(`passwordProtected${idx}`, row.passwordProtected)
		})
		await sqlReq.query(q)
	}
}, { hasPublicAccess: false })

exports.loadSchedule = createHttpsFunction(async (data) => {
	const { collectionId } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		const result = await sqlReq.input("collectionId", collectionId).query(`
		select stage, launchAt, status, passwordProtected
		from schedule 
		where collectionId=@collectionId
		order by stage`
		)
		return result.recordset || []
	}
})

exports.loadMyCollectionBasics = createHttpsFunction(async (data) => {
	const { collectionId, userId } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		const result = await sqlReq.input("collectionId", collectionId).input("userId", userId).query(`
		select c.name, c.status, c.pagesPassword, uc.roles, c.profileImage, c.isImportExistingCollection, c.importedNFTAddress
		from collections c
		inner join userCollections uc on uc.userId=@userId and uc.collectionId=@collectionId
		where c.collectionId=@collectionId`
		)
		return result.recordset[0] || {}
	}
})

exports.loadMyCollections = createHttpsFunction(async (data) => {
	const fieldsForCard = 'c.collectionId, c.profileImage, c.name, c.status'
	const { userId, offsetCount, fetchCount, roleFilter, collectionId } = data
	return collectionId ? await loadSingle() : await load()

	async function loadSingle() {
		const sqlReq = await getRequest()
		sqlReq.input("collectionId", collectionId)
		const result = await sqlReq.query(`
		select ${fieldsForCard}
		from collections c 
		where c.collectionId=@collectionId
		`)
		return result.recordset || []
	}

	async function load() {
		const sqlReq = await getRequest()
		sqlReq.input("userId", userId).input("offsetCount", offsetCount).input("fetchCount", fetchCount)
		let roleFilterSql = ''
		if (roleFilter > 0) {
			sqlReq.input("roleFilter", roleFilter)
			roleFilterSql = 'and (uc.roles&@roleFilter)>0'
		}
		const result = await sqlReq.query(`
		select ${fieldsForCard}, uc.roles
		from userCollections uc
		inner join collections c on c.collectionId=uc.collectionId and isnull(c.isDeleted,0)=0
		where uc.userId=@userId ${roleFilterSql}
		order by uc.collectionId
		offset @offsetCount rows
		fetch next @fetchCount rows only
		`)
		return result.recordset || []
	}
})

const commonCollectionSettings = 'canGrow, maxItems, manyArtists, isImportExistingCollection, maxItemsPerCreator, batchUploads, selfMinted, samePriceForAllNFT, premintPrice, mintPrice, salePrice, mintersAsArtists, marketFee, maxItemsPerMinter, defaultItemStatus, showMarketMode'

exports.loadMyCollectionStory = createHttpsFunction(async (data) => {
	const { collectionId, forEditPages, noPageSections } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		const result = await sqlReq.input("collectionId", collectionId).query(`
		select ${forEditPages ? "lookNfeel, marketFee, myOwnBGColor, myOwnNavBGColor, showMarketMode" : `[name], [profileImage], [desc], [coverImage], [videoLink], pagesPassword, [twitter], [discord], [tiktok], [youtube], [instagram], lookNfeel, myOwnBGColor, myOwnNavBGColor, ${commonCollectionSettings}`}
		from collections 
		where collectionId=@collectionId
		${noPageSections ? '' : `
		select *
		from pageSections
		where collectionId=@collectionId
		`}
		`)
		return {
			details: setCollectionDefaults(result.recordsets[0][0] || {}),
			pageSections: noPageSections ? undefined : result.recordsets[1] || []
		}
	}
})

exports.createCollection = createHttpsFunction(async (data) => {
	const { fields, userId, curatorRole, share } = data
	const { collectionId } = await insert()
	await Promise.all([
		createUserCollectionImpl(userId, collectionId, curatorRole),
		createTeammateImpl(userId, collectionId, share)
	])
	return { collectionId }

	async function insert() {
		const sqlReq = await getRequest()
		const keys = Object.keys(fields).filter(key => key !== "collectionId")
		keys.forEach(key => sqlReq.input(key, fields[key]))
		const q = `insert into collections (${keys.map(key => `[${key}]`).join(',')}) values (${keys.map(key => '@' + key).join(',')}) select @@IDENTITY as collectionId`
		const result = await sqlReq.query(q)
		return result.recordset[0]
	}
})

exports.updateCollection = createHttpsFunction(async (data, auth) => {
	const { collectionId, fields, pageSections } = data
	await checkCollectionOwner(auth, collectionId)
	await Promise.all([update(), updatePageSections()])

	async function update() {
		const sqlReq = await getRequest()
		sqlReq.input("collectionId", collectionId)
		const keys = Object.keys(fields).filter(key => key !== "collectionId")
		keys.forEach(key => sqlReq.input(key, fields[key]))
		const q = `update collections set ${keys.map(key => `[${key}]=@${key}`).join(',')} where collectionId=@collectionId`
		await sqlReq.query(q)
	}
	async function updatePageSections() {
		if (pageSections?.length) {
			await runQuery('delete from pageSections where collectionId=@collectionId', { collectionId })
			const promises = pageSections.map(ps => {
				const keys = Object.keys(ps)
				return runQuery(`insert into pageSections (${keys.map(key => `[${key}]`).join(',')}) values (${keys.map(key => `@${key}`).join(',')})`, ps)
			})
			await Promise.all(promises)
		}
	}
}, { hasPublicAccess: false })

exports.createUserCollection = createHttpsFunction(async (data) => {
	const { userId, collectionId, roles } = data
	await createUserCollectionImpl(userId, collectionId, roles)
}, { hasPublicAccess: false })

async function createUserCollectionImpl(userId, collectionId, roles) {
	const sqlReq = await getRequest()
	sqlReq.input("userId", userId).input("collectionId", collectionId).input("roles", roles)
	const q = `
merge userCollections with (holdlock) as Target
using (select 1 as [TempKey]) as Source
on Target.userId=@userId and Target.collectionId=@collectionId
when matched then
	update set roles |= @roles
when not matched then
	insert (userId, collectionId, roles) values (@userId, @collectionId, @roles);`
	await sqlReq.query(q)
}

exports.addUserCollectionRoles = createHttpsFunction(async (data) => {
	const { userId, collectionId, roles } = data
	checkUserCollectionRoles(roles)
	await update()

	async function update() {
		const sqlReq = await getRequest()
		sqlReq.input("userId", userId).input("collectionId", collectionId).input("roles", roles)
		const q = `update userCollections set roles |= @roles where userId=@userId and collectionId=@collectionId`
		await sqlReq.query(q)
	}
}, { hasPublicAccess: false })

exports.removeUserCollectionRoles = createHttpsFunction(async (data) => {
	const { userId, collectionId, roles } = data
	checkUserCollectionRoles(roles)
	await update()

	async function update() {
		const sqlReq = await getRequest()
		sqlReq.input("userId", userId).input("collectionId", collectionId).input("roles", roles)
		const q = `update userCollections set roles &= ~@roles where userId=@userId and collectionId=@collectionId`
		await sqlReq.query(q)
	}
}, { hasPublicAccess: false })

exports.loadCollectionPies = createHttpsFunction(async (data) => {
	const { collectionId } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		sqlReq.input("collectionId", collectionId)
		const q = `select stage, [allPartners], [allCreators], [creator], [owner], [allOwners], [marketplace], [creatorRoyalties] from pies where collectionId=@collectionId order by stage`
		const result = await sqlReq.query(q)
		return result.recordset || null
	}
})

exports.mergeCollectionPie = createHttpsFunction(async (data, auth) => {
	const { collectionId, stage, fields } = data
	await checkCollectionOwner(auth, collectionId)
	await merge()

	async function merge() {
		const sqlReq = await getRequest()
		sqlReq.input("collectionId", collectionId).input("stage", stage)
		const keys = Object.keys(fields).filter(key => key !== "collectionId" && key !== "stage")
		keys.forEach(key => sqlReq.input(key, fields[key]))
		const q = `
merge pies with (holdlock) as Target
using (select 1 as [TempKey]) as Source
on Target.collectionId=@collectionId and Target.stage=@stage
when matched then 
	update set ${keys.map(key => `Target.${key}=@${key}`).join(',')}
when not matched then
	insert (collectionId, stage, ${keys.map(key => `[${key}]`).join(',')}) 
	values (@collectionId, @stage, ${keys.map(key => `@${key}`).join(',')});`
		await sqlReq.query(q)
	}
}, { hasPublicAccess: false })

exports.loadCollectionRights = createHttpsFunction(async (data) => {
	const [r] = await runQuery(`select rightsType, rightsText from collections where collectionId=@collectionId`, data)
	return r || {}
})

exports.loadCollectionSettings = createHttpsFunction(async (data) => {
	const { collectionId } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		sqlReq.input("collectionId", collectionId)
		const q = `
		select ${commonCollectionSettings}, tradeOnOpensea, tradeOnLooksrare, tradeOnX2Y2, tradeOnBlur, tradeOnFoundation
		from collections 
		where collectionId=@collectionId
		`
		const result = await sqlReq.query(q)
		return setCollectionDefaults(result.recordset[0] || {})
	}
})

exports.createTeammate = createHttpsFunction(async (data, auth) => {
	const { userId, collectionId, share } = data
	// TODO need to separate the check when invited teammate logs in and when curator adds one
	if (share > 0) { // only curator may set shares for teammates
		await checkCollectionOwner(auth, collectionId)
	}
	await createTeammateImpl(userId, collectionId, share)
}, { hasPublicAccess: false })

async function createTeammateImpl(userId, collectionId, share) {
	const sqlReq = await getRequest()
	sqlReq.input("userId", userId).input("collectionId", collectionId).input("share", share)
	const q = `insert into team (userId, collectionId, share) values (@userId, @collectionId, @share)`
	await sqlReq.query(q)
}

exports.loadTeamForStory = createHttpsFunction(async (data) => {
	const { collectionId } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		const q = `
		select u.profileImage, u.name, u.twitter, u.discord, u.tiktok, u.youtube, u.instagram, u.[desc], u.videoLink
		from team t 
		inner join users u on u.userId=t.userId
		where t.collectionId=@collectionId and isnull(t.publicProfile,1)=1
		`
		sqlReq.input("collectionId", collectionId)
		const result = await sqlReq.query(q)
		return result.recordset || []
	}
})

exports.loadTeam = createHttpsFunction(async (data) => {
	const { collectionId } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		const q = `
		select u.userId, u.profileImage, u.name, u.walletAddress, t.share, t.publicProfile
		from team t 
		inner join users u on u.userId=t.userId
		where t.collectionId=@collectionId
		`
		sqlReq.input("collectionId", collectionId)
		const result = await sqlReq.query(q)
		return result.recordset || []
	}
})

exports.deleteTeammate = createHttpsFunction(async (data, auth) => {
	const { userId, collectionId } = data
	await checkCollectionOwner(auth, collectionId)
	del()

	async function del() {
		const sqlReq = await getRequest()
		const q = `delete from team where userId=@userId and collectionId=@collectionId`
		sqlReq.input("userId", userId).input("collectionId", collectionId).query(q)
	}
}, { hasPublicAccess: false })

exports.updatePublicProfile = createHttpsFunction(async (data, auth) => {
	const { userId, collectionId, publicProfile } = data
	await checkCollectionOwner(auth, collectionId)
	await update()

	async function update() {
		const sqlReq = await getRequest()
		sqlReq.input("userId", userId).input("collectionId", collectionId).input("publicProfile", publicProfile)
		const q = `update team set publicProfile=@publicProfile where userId=@userId and collectionId=@collectionId`
		await sqlReq.query(q)
	}
}, { hasPublicAccess: false })

exports.updateTeamShares = createHttpsFunction(async (data, auth) => {
	const { collectionId, teamShares } = data
	await checkCollectionOwner(auth, collectionId)
	await update()

	async function update() {
		const sqlReq = await getRequest()
		const template = idx => `update team set share=@share${idx} where userId=@userId${idx} and collectionId=@collectionId`
		const userIds = Object.keys(teamShares)
		const q = userIds.map((userId, idx) => {
			sqlReq.input(`userId${idx}`, userId).input(`share${idx}`, teamShares[userId])
			return template(idx)
		}).join(' ')
		sqlReq.input("collectionId", collectionId)
		await sqlReq.query(q)
	}
}, { hasPublicAccess: false })


exports.createCreator = createHttpsFunction(async (data, auth) => {
	const { userId, collectionId } = data
	// TODO separate the check when invited creator logs in and when curator adds one
	// await checkCollectionOwner(auth, collectionId)
	await insert()

	async function insert() {
		const sqlReq = await getRequest()
		sqlReq.input("userId", userId).input("collectionId", collectionId)
		const q = `insert into creators (userId, collectionId) values (@userId, @collectionId)`
		await sqlReq.query(q)
	}
}, { hasPublicAccess: false })

exports.loadCreators = createHttpsFunction(async (data) => {
	const { collectionId, creatorRole } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		const q = `
		select u.userId, u.profileImage, u.name, u.walletAddress, 
			(select count(*) 
			from userItems ui
			inner join items i on i.itemId=ui.itemId and ui.userId=c.userId
			where i.collectionId=@collectionId and (ui.roles&@creatorRole)>0
			) as itemsCount
		from creators c
		inner join users u on u.userId=c.userId
		where c.collectionId=@collectionId
		`
		sqlReq.input("collectionId", collectionId).input("creatorRole", creatorRole)
		const result = await sqlReq.query(q)
		return result.recordset || []
	}
})

exports.deleteCreator = createHttpsFunction(async (data, auth) => {
	const { userId, collectionId } = data
	await checkCollectionOwner(auth, collectionId)
	del()

	async function del() {
		const sqlReq = await getRequest()
		const q = `delete from creators where userId=@userId and collectionId=@collectionId`
		sqlReq.input("userId", userId).input("collectionId", collectionId).query(q)
	}
}, { hasPublicAccess: false })


exports.createMember = createHttpsFunction(async (data) => {
	const { userId, collectionId } = data
	await insert()

	async function insert() {
		const sqlReq = await getRequest()
		sqlReq.input("userId", userId).input("collectionId", collectionId)
		const q = `insert into community (userId, collectionId) values (@userId, @collectionId)`
		await sqlReq.query(q)
	}
}, { hasPublicAccess: false })

exports.loadCommunity = createHttpsFunction(async (data) => {
	const { collectionId, roles } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		const q = `
		select u.userId, u.profileImage, u.name, u.walletAddress, 
			(select count(*) 
			from userItems ui
			inner join items i on i.itemId=ui.itemId and ui.userId=c.userId
			where i.collectionId=@collectionId and (ui.roles&@roles)>0
			) as itemsCount,
			iu.name as invitingUser
		from community c
		inner join users u on u.userId=c.userId
		left outer join users iu on iu.userId=u.invitingUserId
		where c.collectionId=@collectionId
		`
		sqlReq.input("collectionId", collectionId).input("roles", roles)
		const result = await sqlReq.query(q)
		return result.recordset || []
	}
})

exports.deleteMember = createHttpsFunction(async (data, auth) => {
	const { userId, collectionId } = data
	await checkCollectionOwner(auth, collectionId)
	del()

	async function del() {
		const sqlReq = await getRequest()
		const q = `delete from community where userId=@userId and collectionId=@collectionId`
		sqlReq.input("userId", userId).input("collectionId", collectionId).query(q)
	}
}, { hasPublicAccess: false })

exports.checkAllowList = createHttpsFunction(async (data, auth) => {
	if (auth?.isAdmin) return true

	const allowedInCommunity = await runQuery('select 1 as isInAllowList from community where collectionId=@collectionId and userId=@userId', data, false, true, () => false)
	if (allowedInCommunity) return true

	const allowedInCreator = await runQuery('select 1 as isInAllowList from creators where collectionId=@collectionId and userId=@userId', data, false, true, () => false)
	if (allowedInCreator) return true

	const allowedInTeam = await runQuery('select 1 as isInAllowList from team where collectionId=@collectionId and userId=@userId', data, false, true, () => false)
	if (allowedInTeam) return true

	return false
})

// used to enforce maxItemsPerMinter
exports.getMintedNFTPerWallet = createHttpsFunction(async (data) => {
	const { totalCount } = await runQuery(`
declare @totalMinted int
select @totalMinted = count(*) 
from userItems 
where userId=@userId
and itemId in (
		select itemId 
		from collections 
		where collectionId=@collectionId)	
and (roles & 64) > 0 -- RolesMap.owner

declare @totalMinting int
select @totalMinting = count(*)
from mintingItems
where userId=@userId and collectionId=@collectionId

select @totalMinted + @totalMinting as totalCount
`, data, false, true, () => ({ totalCount: 0 }))
	return totalCount
})