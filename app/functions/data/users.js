const { encryptImpl, getAuthToken } = require("../crypto")
const { getRequest, createHttpsFunction, runQuery } = require("./db")
const { checkUser } = require("./validAccess")

exports.loadReferrals = createHttpsFunction(async (data) => {
	const { curatorId } = await runQuery(`select top 1 userId as curatorId from userCollections where collectionId=@collectionId and (roles&1)>0 -- RolesMap.curator`,
		data, false, true, () => ({ curatorId: 0 }))
	const query = `
select u.userId, u.name, 2 as inviteeRole, -- RolesMap.partner
(select count(*) from community c inner join users u on u.userId=c.userId where u.invitingUserId=t.userId) as collectorsBrought,
(select count(*) from userItems where userId in (select c.userId from community c inner join users u on u.userId=c.userId where u.invitingUserId=t.userId)) as mintsBrought
from team t
inner join users u on u.userId=t.userId
where t.collectionId=@collectionId
union 
select u.userId, u.name, 4 as inviteeRole, -- RolesMap.creator
(select count(*) from community c inner join users u on u.userId=c.userId where u.invitingUserId=cr.userId) as collectorsBrought,
(select count(*) from userItems where userId in (select c.userId from community c inner join users u on u.userId=c.userId where u.invitingUserId=cr.userId)) as mintsBrought
from creators cr 
inner join users u on u.userId=cr.userId
where cr.collectionId=@collectionId
order by name`
	const rs = await runQuery(query, data)
	// eslint-disable-next-line
	// generate invite links
	const basePath = data.collectionId == 3 ? `/artis` : `/collection-page/${data.collectionId}`
	rs.map(r => {
		r.artistInviteLink = `/invite?key=${encryptImpl(JSON.stringify({
			invitingUserId: curatorId,
			inviteeUserId: r.userId,
			collectionId: data.collectionId,
			inviteeRole: r.inviteeRole
		}))}`
		r.collectorInviteLink = `${basePath}?key=${encryptImpl(JSON.stringify({
			invitingUserId: r.userId,
			collectionId: data.collectionId,
			inviteeRole: 32 // RolesMap.invited
		}))}`
	})
	return rs
}, { hasPublicAccess: false, adminOnly: true })

const adminWallets = {
	'0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266': true,
	'0x573c9814025f7b385d44a2fd85aa3d16b2e7e2f4': true,
	'0x37dd5a7b104b04f107562caeb8f5e99dbcd675cd': true,
	'0x54a6534bd00ae984380e77074f86cb867430ccf2': true,
	'0x74e48406d2114fc933a41b2fdf543e2e502fc720': true,
	'0x8e72ad3554a8aeba01604b6f1547b71d850a4219': true,
	// '0x17db70a0445738ef3067f0c874f5164da332c5dc': true,
	'0xb15dfb31a96b94ec150a237bfc3d464affe774f7': true,
	'0xbc50552a5efa8a0448821ab96164ab03e023044d': true,
	'0x403b343441ac0b55d0a34c204ecd4f32a380a440': true,
}

exports.getUserId = createHttpsFunction(async (data) => {
	const { walletAddress, createNewIfNotExists, mayAddCollection, wasInvited, invitingUserId } = data
	const rs = await runQuery("select userId, isAdmin, mayAddCollection, wasInvited from users where walletAddress=@walletAddress", { walletAddress })
	const r = rs?.length > 0 ? rs[0] : {}
	if (createNewIfNotExists && !r.userId) {
		const isAdmin = adminWallets[walletAddress.toLowerCase()] ? true : null
		const r2 = await createUserImpl({ walletAddress, mayAddCollection, wasInvited, isAdmin, invitingUserId }, true)
		r.userId = r2.userId
		if (isAdmin) r.isAdmin = isAdmin
		r.isNewUser = true
		if (mayAddCollection) r.mayAddCollection = mayAddCollection
		if (wasInvited) r.wasInvited = wasInvited
	}
	if (r.userId) {
		r.authToken = getAuthToken(r.userId, walletAddress, r.isAdmin)
	}
	return r
})

exports.loadMayAddCollection = createHttpsFunction(async (data) => {
	const { userId } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		const result = await sqlReq.input("userId", userId).query("select mayAddCollection from users where userId=@userId")
		return result.recordset[0] || {}
	}
})

exports.loadUserProfile = createHttpsFunction(async (data) => {
	const { userId } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		const result = await sqlReq.input("userId", userId).query(`
		select name, email, twitter, profileImage, [desc], videoLink, discord, tiktok, youtube, instagram, website, walletAddress, emailConfirmed
		from users 
		where userId=@userId
			`)
		return result.recordset[0] || {}
	}
})

exports.createUser = createHttpsFunction(async (data) => {
	const { walletAddress } = data
	await expectingUniqueWalletAddress(walletAddress)
	return await createUserImpl(data)
})
async function createUserImpl(data, isSafeToUpdateIsAdmin = false) {
	if (data?.isAdmin) {
		if (!isSafeToUpdateIsAdmin) {
			throw new Error(`Cannot create isAdmin field`)
		}
	}
	const sqlReq = await getRequest()
	const keys = Object.keys(data).filter(key => key !== "userId")
	keys.forEach(key => sqlReq.input(key, data[key]))
	const q = `insert into users (${keys.map(key => `[${key}]`).join(',')}) values (${keys.map(key => '@' + key).join(',')}) select @@IDENTITY as userId`
	const result = await sqlReq.query(q)
	return result.recordset[0]
}

exports.updateUser = createHttpsFunction(async (data, auth) => {
	checkUser(auth, data.userId)
	const { userId, fields } = data
	const { walletAddress } = fields
	if (fields?.isAdmin) {
		throw new Error(`Cannot update isAdmin field`)
	}
	await expectingUniqueWalletAddress(walletAddress, userId)
	await update()

	async function update() {
		const sqlReq = await getRequest()
		sqlReq.input('userId', userId)
		const keys = Object.keys(fields).filter(key => key !== "userId")
		keys.forEach(key => sqlReq.input(key, fields[key]))
		const q = `update users set ${keys.map(key => `[${key}]=@${key}`).join(',')} where userId=@userId`
		await sqlReq.query(q)
	}
}, { hasPublicAccess: false })

async function expectingUniqueWalletAddress(walletAddress, checkedUserId = -1) {
	if (walletAddress) {
		const rs = await runQuery(`select top 1 userId from users where walletAddress=@walletAddress order by userId`, { walletAddress })
		const isUnique = !rs || !rs.length || parseInt(rs[0].userId) === parseInt(checkedUserId)
		if (!isUnique) {
			throw new Error(`Wallet address already exists for another user`)
		}
	}
}

exports.searchUsers = createHttpsFunction(async (data) => {
	const { query, userId, accounts, offsetCount, fetchCount, mayAddCollection } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		const byWalletAddress = query && query.startsWith('0x')
		const querySql = query ? (byWalletAddress ? 'and walletAddress=@walletAddress' : 'and (name like @query or email like @query or twitter like @query)') : ''
		sqlReq.input("offsetCount", offsetCount).input("fetchCount", fetchCount)
		if (querySql) {
			if (byWalletAddress) sqlReq.input("walletAddress", query)
			else sqlReq.input("query", `%${query}%`)
		}

		const result = await sqlReq.query(`
				select userId, name, email, profileImage, mayAddCollection, walletAddress
				from users 
				where isnull(isAdmin,0)=0 ${mayAddCollection ? 'and mayAddCollection=1' : ''}
				${querySql}
				order by userId desc
				offset @offsetCount rows
				fetch next @fetchCount rows only`)
		result.recordset.forEach(rec => {
			rec.loginAsKey = encryptImpl(JSON.stringify({
				byUserId: userId,
				asUserId: rec.userId,
				asName: rec.name,
				accounts,
				mayAddCollection: rec.mayAddCollection,
				userWalletAddress: rec.walletAddress
			}))
		})
		return result.recordset
	}
}, { hasPublicAccess: false, adminOnly: true })

exports.findUserByWalletAddress = createHttpsFunction(async (data) => {
	return await runQuery(`select top 1 userId, name, profileImage from users where walletAddress=@walletAddress`, data)
}, { hasPublicAccess: false })
