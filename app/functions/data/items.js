const functions = require("firebase-functions");
const { loadCurrentMintStageImpl } = require("./collections");
const { getPieWithDefaults } = require("./tx");
const { getRequest, createHttpsFunction, runQuery, dbRuntimeOptions, getTransaction } = require("./db");
const { checkCollectionOwner, checkItemOwner, checkUserItemRoles } = require("./validAccess");
const { blockspan } = require("../web3/blockspan");
const { Moralis } = require("../web3/moralis");

exports.approveAllItems = createHttpsFunction(async (data, auth) => {
	await checkCollectionOwner(auth, data.collectionId)
	await runQuery(`update items set status=2 where collectionId=@collectionId and status<2 -- ItemStatus.approved`, data)
}, { hasPublicAccess: false })

exports.loadCurrentItemsCount = createHttpsFunction(async (data) => {
	const [r] = await runQuery(`
	select count(*) as currentItemsCount 
	from items 
	where collectionId=@collectionId
	and isnull(isDeleted,0)=0 
	`, data)
	return r.currentItemsCount
})

exports.loadItemDetails = createHttpsFunction(async (data) => {
	const { collectionAddress, tokenId } = data
	let collectionId, itemId
	if (collectionAddress && tokenId) {
		collectionId = await getLiveCollectionId(collectionAddress)
		itemId = await getItemIdByTokenId(collectionId, tokenId)
	} else {
		collectionId = data.collectionId
		itemId = data.itemId
	}

	if (collectionId > 0 && itemId > 0) {
		return await loadLocalItemDetailsImpl(collectionId, itemId)
	}

	if (collectionAddress && tokenId) {
		return await loadOnChainItemDetailsImpl(collectionAddress, tokenId)
	}
})

async function loadOnChainItemDetailsImpl(collectionAddress, tokenId) {
	const collection = await loadCollection(collectionAddress)
	const itemData = await loadItemData(collectionAddress, tokenId)
	return { collection, itemData, isExternalCollection: true }

	async function loadCollection(address) {
		return await blockspan.getCollection({ chain: 'eth-main', contract_address: address })
	}
	async function loadItemData(contract_address, token_id) {
		return await blockspan.getNFTMetadata({
			chain: 'eth-main',
			contract_address,
			token_id
		})
	}
}

async function loadLocalItemDetailsImpl(collectionId, itemId) {
	const { stage } = await loadCurrentMintStageImpl(collectionId)
	const priceField = stage === 3 ? "mintPrice" : "premintPrice" // ScheduleStages.mint
	const { creatorRoyalties } = await getPieWithDefaults(collectionId, 50001) // mintState
	const collection = await loadCollection(collectionId)
	const itemData = await loadItemData(itemId, collection)
	return { collection, itemData, isExternalCollection: false }

	async function loadCollection(collectionId) {
		const { nftAddress } = await runQuery(`select nftAddress from liveCollections where collectionId=@collectionId`, { collectionId }, false, true)
		const [r] = await runQuery(`select coverImage, profileImage, name, [desc], selfMinted, samePriceForAllNFT, ${priceField} as mintPrice, lookNfeel, myOwnBGColor, myOwnNavBGColor from collections where collectionId=@collectionId`, { collectionId })
		const [{ totalTokens }] = await runQuery("select count(*) as totalTokens from items where collectionId=@collectionId and isnull(isDeleted,0)=0 and status>=2 -- ItemStatus.approved", { collectionId })
		const [curator] = await runQuery("select top 1 u.profileImage, u.walletAddress, u.name, u.twitter from users u inner join team t on t.userId=u.userId and t.collectionId=@collectionId and isnull(t.publicProfile,1)=1 order by u.userId", { collectionId })
		return {
			...r,
			contractAddress: nftAddress,
			curator,
			totalTokens,
			exchange_data: [{
				banner_image_url: r.coverImage,
				image_url: r.profileImage,
				exchange: "montage",
			}],
			creatorRoyalties,
		}
	}

	async function loadItemData(itemId, collection) {
		const [r] = await runQuery(`
select i.itemId, i.[file], i.mimeType, i.[name], i.[name] as token_name, i.[desc], i.tokenId, i.tokenId as [id],
	i.${priceField} as mintPrice, i.salePrice, i.status, i.seller, i.keepAspectRatio, 
	u.walletAddress as creatorAddress, u.profileImage as creatorProfileImage, 
	u.name as creatorName, u.twitter as creatorTwitter, 
	oi.originalCID, 
	(
		select p.[name] as [traitType], o.[name] as [value],
			(select count(*) from itemOptions where optionId=io.optionId) as [count]
		from itemOptions io
		inner join options o on o.optionId=io.optionId 
		inner join props p on p.propId=o.propId
		where io.itemId=i.itemId
		for json path
	) as attributes,
	(
		select i.salePrice as price for json path
	) as recent_price,
	c.name as collectionName, c.profileImage as collectionProfileImage,
	1 as sourceMarket, -- 1=Montage
	'erc721' as token_type, 
  lc.conductKey, lc.nftAddress as contract_address, lc.nftAddress as nftContract, lc.groupAddress,
	i.priceStyle, i.offerMinPrice, i.acceptCasualOffers, 
	i.bidMinPrice, i.bidStartTime, i.bidEndTime, i.acceptCasualBids
from items i
inner join collections c on c.collectionId=i.collectionId
inner join users u on u.userId=i.creatorId
left outer join liveCollections lc on lc.collectionId=i.collectionId
left outer join originalImages oi on oi.croppedCID=i.fileCID
where i.itemId=@itemId
		`, { itemId })
		return {
			...r,
			attributes: JSON.parse(r.attributes),
			recent_price: JSON.parse(r.recent_price)[0],
			mintPrice: collection.selfMinted ? null : collection.samePriceForAllNFT ? collection.mintPrice : r.mintPrice || collection.mintPrice,
			tokenType: "erc721",
			blockchain: 'Ethereum',
		}
	}
}

async function loadTraitRarityCounts(collectionId) {
	const [{ traitRarityCounts }] = await runQuery(`
		select (
			select p.[name] as [trait],
			(
				select o.[name] as [value], 
				(select count(*) 
					from itemOptions io 
					inner join items i on i.itemId=io.itemId 
					where io.optionId=o.optionId and isnull(i.isDeleted,0)=0 and i.status>=2 -- ItemStatus.approved
				) as [count]
				from options o
				where o.propId=p.propId
				order by o.[name]
				for json path
			) as rarityCounts
			from props p
			where p.collectionId=@collectionId
			order by p.[name]
			for json path
		) as traitRarityCounts
		`, { collectionId })
	return JSON.parse(traitRarityCounts)
}
exports.loadTraitRarityCounts = loadTraitRarityCounts

exports.loadItem = createHttpsFunction(async (data) => {
	return await runQuery(`
	select [file], [mimeType], [name], [desc], [tokenId], [saleType], [startingPrice], [auctionHours], premintPrice, mintPrice, salePrice, [status], keepAspectRatio, 
	priceStyle, offerMinPrice, autoRejectLowerOffers, acceptCasualOffers,
	bidMinPrice, bidStartTime, bidEndTime, acceptCasualBids
	from items 
	where itemId=@itemId
	`, data, false, true)
})

exports.createItem = createHttpsFunction(async (args, auth) => {
	await checkCollectionOwner(auth, args.data.collectionId, true)
	const { data, roles } = args
	const r = await insert()
	return r

	async function insert() {
		const sqlReq = await getRequest()
		const keys = Object.keys(data).filter(key => key !== "itemId")
		keys.forEach(key => sqlReq.input(key, data[key]))
		sqlReq.input("roles", roles)
		const q = `
		declare @itemId bigint
		insert into items (${keys.map(key => `[${key}]`).join(',')}) values (${keys.map(key => '@' + key).join(',')}) 
		select @itemId=@@IDENTITY

		declare @mintersAsArtists bit
		select @mintersAsArtists=mintersAsArtists 
		from collections 
		where collectionId=@collectionId
		if @mintersAsArtists=1 set @roles=0

		insert into userItems (userId, itemId, roles) values (@creatorId, @itemId, @roles)
		select @itemId as itemId
		`
		const result = await sqlReq.query(q)
		return result.recordset[0]
	}
}, { hasPublicAccess: false })

exports.updateItem = createHttpsFunction(async (data, auth) => {
	const { itemId, fields } = data
	await checkItemOwner(auth, itemId)
	await update()

	async function update() {
		const sqlReq = await getRequest()
		sqlReq.input("itemId", itemId)
		const keys = Object.keys(fields).filter(key => key !== "itemId")
		keys.forEach(key => sqlReq.input(key, fields[key]))
		const q = `update items set ${keys.map(key => `[${key}]=@${key}`).join(',')} where itemId=@itemId`
		await sqlReq.query(q)
	}
}, { hasPublicAccess: false })


exports.loadItemsCreatedByMe = createHttpsFunction(async (data, auth) => {
	return await runQuery(`
	select i.itemId, i.[file], i.mimeType, i.name, i.collectionId, i.status, i.keepAspectRatio, oi.originalCID
	from items i 
	left outer join originalImages oi on oi.croppedCID=i.fileCID
	where i.creatorId=@userId 
	and isnull(i.isDeleted,0)=0
	${data.status > 0 ? ' and i.status=@status' : ''}
	order by i.itemId
	offset @offsetCount rows
	fetch next @fetchCount rows only
	`, data)
})

exports.loadMyFollowing = createHttpsFunction(async (data) => {
	const { userId, offsetCount, fetchCount, roles, status } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		sqlReq.input("userId", userId).input("offsetCount", offsetCount).input("fetchCount", fetchCount)
		let filter = ''
		if (roles !== null) { sqlReq.input("roles", roles); filter = "and (ui.roles & @roles) > 0" }
		if (status >= 0) { sqlReq.input("status", status); filter = "and i.status=@status" }
		const result = await sqlReq.query(`
		select i.itemId, i.[file], i.mimeType, i.name, ui.roles, i.collectionId, i.keepAspectRatio, oi.originalCID
		from userItems ui
		inner join items i on i.itemId=ui.itemId and isnull(i.isDeleted,0)=0
		left outer join originalImages oi on oi.croppedCID=i.fileCID
		where ui.userId=@userId ${filter}
		order by ui.itemId
		offset @offsetCount rows
		fetch next @fetchCount rows only
		`)
		return result.recordset || []
	}
})

exports.loadCollectionItems = createHttpsFunction(async (data) => {
	const { userId, collectionId, roles, offsetCount, fetchCount } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		sqlReq.input("collectionId", collectionId).input("userId", userId).input("offsetCount", offsetCount).input("fetchCount", fetchCount).input("roles", roles)
		const result = await sqlReq.query(`
		select i.itemId, i.[file], i.mimeType, i.name, i.status, i.tokenId, i.collectionId, isnull(ui.roles, @roles) as roles, i.seller,
			i.premintPrice, i.mintPrice, c.status as collectionStatus, c.name as collectionName, c.selfMinted,
			uc.roles as collectionRoles,
			lc.nftAddress as nftContract, lc.conductKey,
			i.keepAspectRatio, oi.originalCID
		from items i
		inner join collections c on c.collectionId=i.collectionId
		left outer join userCollections uc on uc.collectionId=i.collectionId and uc.userId=@userId
		left join userItems ui on ui.itemId=i.itemId and ui.userId=@userId 
		left outer join liveCollections lc on lc.collectionId=i.collectionId
		left outer join originalImages oi on oi.croppedCID=i.fileCID
		where i.collectionId=@collectionId and isnull(i.isDeleted,0)=0 
		order by i.itemId
		${fetchCount > 0 ? `
		offset @offsetCount rows
		fetch next @fetchCount rows only
		`: ''}
		`)
		return result.recordset || []
	}
})

exports.tokenMinted = functions.runWith(dbRuntimeOptions).firestore
	.document(`moralis/events/Tokenminted/{id}`)
	.onWrite(async (change) => {
		const data = change.after.exists ? change.after.data() : null
		if (!data) {
			console.log("tokenMinted: data deleted")
			return
		}
		const { confirmed, firstId: tokenId, mintQty: mintNFTQty, contractAddress: nftAddress, minter: walletAddress } = data
		if (!confirmed) {
			console.log("tokenMinted: unconfirmed")
			return
		}
		const { collectionId } = await runQuery('select collectionId from liveCollections where nftAddress=@nftAddress', { nftAddress }, false, true)
		if (!collectionId) {
			console.log("tokenMinted: collectionId not found in liveCollections by nftAddress:", nftAddress)
			return
		}
		const { userId } = await runQuery('select userId from users where walletAddress=@walletAddress', { walletAddress }, false, true)
		if (!userId) {
			console.log("tokenMinted: userId not found in users by walletAddress (minter):", walletAddress)
			return
		}
		const tran = await getTransaction()
		await tran.begin()
		try {
			console.log("tokenMinted: tran began!")
			const status = 30 // ItemStatus.minting
			const newStatus = 3 // ItemStatus.minted
			const roles = 8 + 64 // RolesMap.buyer | RolesMap.owner
			console.log("tokenMinted: assignTokensToItems: collectionId, tokenId, mintNFTQty, userId, status, newStatus, roles",
				collectionId, tokenId, mintNFTQty, userId, status, newStatus, roles)
			await assignTokensToItemsImpl({ collectionId, tokenId, mintNFTQty: parseInt(mintNFTQty), userId, status, newStatus, roles }, tran)
			await tran.commit()
			console.log("tokenMinted: tran commited!")
		} catch (ex) {
			console.error("tokenMinted: exception", ex)
			await tran.rollback()
			throw ex
		}
	})

async function setMintingStatusImpl(data, tran) {
	const { totalUpdated } = await runQuery(`
declare @assignedItems table (itemId bigint not null)

declare @totalMintingItems int
select @totalMintingItems = count(*) 
from mintingItems 
where userId=@userId and collectionId=@collectionId

-- do not allow minting when that user already has minting items
-- if ItemStatus.minting or ItemStatus.approved
if (@totalMintingItems = 0 and @newStatus=30) or (@newStatus=2) 
begin
	if @itemId > 0
		insert into @assignedItems values (@itemId)
	else
		insert into @assignedItems
		select top (@mintNFTQty) itemId
		from items
		where collectionId=@collectionId and status=@status
		and tokenId is not null and isnull(isDeleted,0)=0
		order by itemId desc
			
	if @newStatus=30 -- ItemStatus.minting
	begin
		insert into mintingItems (userId, collectionId, itemId)
		select @userId, @collectionId, itemId	
		from @assignedItems
	end
	else -- reverting to ItemStatus.approved 
	begin
		delete from mintingItems
		where userId=@userId and collectionId=@collectionId
	end

	update i
	set status=@newStatus
	from @assignedItems ai
	inner join items i on i.itemId=ai.itemId
end

select count(*) as totalUpdated from @assignedItems
`, data, false, true, () => ({ totalUpdated: 0 }), tran)
	return totalUpdated
}

exports.setMintingStatus = createHttpsFunction(async (data) => {
	const tran = await getTransaction()
	try {
		await tran.begin()
		const totalUpdated = await setMintingStatusImpl(data, tran)
		await tran.commit()
		return totalUpdated
	} catch (ex) {
		await tran.rollback()
		throw ex
	}
})

exports.updateMintedStatus = createHttpsFunction(async (data) => {
	const tran = await getTransaction()
	try {
		await tran.begin()
		const userItemRoles = 8 + 64 // RolesMap.buyer | RolesMap.owner
		console.log("updateMintedStatus: collectionId, mintNFTQty, userId, userItemRoles", data.collectionId, data.mintNFTQty, data.userId, userItemRoles)
		await runQuery(`
declare @mintedItems table (itemId bigint not null)

insert into @mintedItems
select itemId from items
where collectionId=@collectionId 
	and tokenId between @firstTokenId and @firstTokenId + @mintNFTQty - 1 

update items
set status=3 -- ItemStatus.minted 
where itemId in (select itemId from @mintedItems)

declare @mintersAsArtists bit
select @mintersAsArtists=mintersAsArtists 
from collections 
where collectionId=@collectionId
if @mintersAsArtists=1 
begin 
	set @userItemRoles |= 4 -- RolesMap.creator
	merge creators with (holdlock) as Target
	using (select 1 as [TempKey]) as Source
	on Target.userId=@userId and Target.collectionId=@collectionId
	when not matched then
		insert (userId, collectionId) values (@userId, @collectionId);
	-- TODO check if userCollections needs to be merged here as well
end

merge userItems with (holdlock) as Target
using (select itemId from @mintedItems) as Source
on Target.userId=@userId and Target.itemId=Source.itemId
when matched then 
	update set roles |= @userItemRoles
when not matched then 
	insert (userId, itemId, roles) values (@userId, Source.itemId, @userItemRoles);
`, { ...data, userItemRoles }, false, false, null, tran)
		await tran.commit()
		return true
	} catch (ex) {
		await tran.rollback()
		throw ex
	}
})

async function assignTokensToItemsImpl(data, tran) {
	let { tokenId } = data
	tokenId = parseInt(tokenId)
	if (tokenId > 0) {
		await runQuery(`
declare @assignedItems table (itemId bigint not null, tokenId int not null)
declare @canGrow bit
select @canGrow=isnull(canGrow, 1) from collections where collectionId=@collectionId -- default canGrow duplicate from setCollectionDefaults

if @canGrow=1
begin
		declare @itemId bigint
		select @itemId = itemId from items where collectionId=@collectionId and tokenId=@tokenId
		insert into @assignedItems (itemId, tokenId) values (@itemId, @tokenId)

		update items 
		set status=@newStatus
		where collectionId=@collectionId and tokenId=@tokenId
end
else
begin
	insert into @assignedItems
	select top (@mintNFTQty) itemId, @tokenId - 1 + ROW_NUMBER() over (order by itemId desc)
	from items
	where collectionId=@collectionId and status=@status and tokenId is not null and isnull(isDeleted,0)=0
	order by itemId desc

	update i
	set tokenId=ai.tokenId, status=@newStatus 
	from @assignedItems ai
	inner join items i on i.itemId=ai.itemId
end

declare @mintersAsArtists bit
select @mintersAsArtists=mintersAsArtists 
from collections 
where collectionId=@collectionId
if @mintersAsArtists=1 
begin 
	set @roles |= 4 -- RolesMap.creator
	merge creators with (holdlock) as Target
	using (select 1 as [TempKey]) as Source
	on Target.userId=@userId and Target.collectionId=@collectionId
	when not matched then
		insert (userId, collectionId) values (@userId, @collectionId);
	-- TODO check if userCollections needs to be merged here as well
end

merge userItems with (holdlock) as Target
using (select itemId from @assignedItems) as Source
on Target.userId=@userId and Target.itemId=Source.itemId
when matched then 
	update set roles |= @roles
when not matched then 
	insert (userId, itemId, roles) values (@userId, Source.itemId, @roles);
-- done minting - delete from mintingItems
delete from mintingItems where userId=@userId and collectionId=@collectionId
`, data, false, false, null, tran)
	}
}

exports.loadCollectionMyItems = createHttpsFunction(async (data) => {
	const { userId, collectionId, roles, offsetCount, fetchCount } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		const result = await sqlReq.input("userId", userId).input("collectionId", collectionId).input("roles", roles).input("offsetCount", offsetCount).input("fetchCount", fetchCount).query(`
		select i.itemId, i.[file], i.mimeType, i.name, ui.roles, i.keepAspectRatio, oi.originalCID
		from userItems ui
		inner join items i on i.itemId=ui.itemId and isnull(i.isDeleted,0)=0
		left outer join originalImages oi on oi.croppedCID=i.fileCID
		where ui.userId=@userId and i.collectionId=@collectionId and (ui.roles & @roles) > 0
		order by ui.itemId
		offset @offsetCount rows
		fetch next @fetchCount rows only
		`)
		return result.recordset || []
	}
})


const toggleUserItemRolesSql = (turnOnOrOff) => `
merge userItems with (holdlock) as Target
using (select 1 as [TempKey]) as Source
on Target.userId=@userId and Target.itemId=@itemId
when matched then
	update set ${turnOnOrOff ? "roles |= @roles" : "roles &= ~@roles"}
when not matched then
	insert (userId, itemId, roles) values (@userId, @itemId, @roles);`

exports.addUserItemRoles = createHttpsFunction(async (data) => {
	const { userId, roles, tokenId, collectionId } = data
	checkUserItemRoles(roles)
	let { itemId } = data
	if (!itemId && tokenId && collectionId) {
		itemId = await getItemIdByTokenId(collectionId, tokenId)
	}
	await update()

	async function update() {
		const sqlReq = await getRequest()
		sqlReq.input("userId", userId).input("itemId", itemId).input("roles", roles)
		await sqlReq.query(toggleUserItemRolesSql(true))
	}
}, { hasPublicAccess: false })

exports.removeUserItemRoles = createHttpsFunction(async (data) => {
	const { userId, itemId, roles } = data
	checkUserItemRoles(roles)
	await update()

	async function update() {
		const sqlReq = await getRequest()
		sqlReq.input("userId", userId).input("itemId", itemId).input("roles", roles)
		await sqlReq.query(toggleUserItemRolesSql(false))
	}
}, { hasPublicAccess: false })

async function getItemIdByTokenId(collectionId, tokenId) {
	if (collectionId > 0 && tokenId > 0) {
		const { itemId } = await runQuery(`
		select itemId 
		from items 
		where collectionId=@collectionId and tokenId=@tokenId
		`, { collectionId, tokenId }, false, true, () => ({ itemId: 0 }))
		return itemId
	}
}

async function getLiveCollectionId(nftAddress) {
	if (nftAddress) {
		const { collectionId } = await runQuery(`
		select top 1 collectionId 
		from liveCollections 
		where nftAddress=@nftAddress 
		order by collectionId desc
		`, { nftAddress }, false, true, () => ({ collectionId: 0 }))
		return collectionId
	}
}