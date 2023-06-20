const { sendMetadatasToIPFSImpl } = require("../ipfs")
const { setCollectionDefaults } = require("./collections")
const { getRequest, createHttpsFunction, runQuery } = require("./db")
const { loadTraitRarityCounts } = require("./items")
const { checkCollectionOwner } = require("./validAccess")
const { loadCurrentMintStageImpl } = require("./collections")

exports.loadCreatorMintedTokenIds = createHttpsFunction(async (data) => {
	const r = await runQuery(`
select i.tokenId
from items i
where i.status>=3 -- ItemStatus.minted
and i.collectionId=@collectionId
and i.creatorId=@creatorId
	`, data)
	return r?.map(x => x.tokenId)
})

exports.loadUserLiveCollections = createHttpsFunction(async (data) => {
	if (data.groupAddress) {
		return await runQuery(`
select lc.collectionId, lc.nftAddress, lc.groupAddress, c.name, c.manyArtists, c.isImportExistingCollection, c.canGrow, c.samePriceForAllNFT 
from liveCollections lc
inner join collections c on c.collectionId=lc.collectionId
where lc.groupAddress=@groupAddress
		`, data)
	}
	return await runQuery(`
select lc.collectionId, lc.nftAddress, lc.groupAddress, c.name, c.manyArtists, c.isImportExistingCollection, c.canGrow, c.samePriceForAllNFT 
from liveCollections lc
inner join collections c on c.collectionId=lc.collectionId
inner join userCollections uc on uc.collectionId=lc.collectionId and uc.userId=@userId
union
select lc.collectionId, lc.nftAddress, lc.groupAddress, c.name, c.manyArtists, c.isImportExistingCollection, c.canGrow, c.samePriceForAllNFT 
from userItems ui 
inner join items i on i.itemId=ui.itemId
inner join liveCollections lc on lc.collectionId=i.collectionId
inner join collections c on c.collectionId=i.collectionId
where ui.userId=@userId
	`, data)
})

exports.getMyListedItems = createHttpsFunction(async (data, auth) => {
	return await runQuery(`
	select i.tokenId as token_id, lc.nftAddress as token_address
	from userItems ui
	inner join items i on i.itemId=ui.itemId
	inner join liveCollections lc on lc.collectionId=i.collectionId
	where ui.userId=@seller 
	and ui.roles&64>0 -- RolesMap.owner
	and i.status=4 -- ItemStatus.onSale
	`, { seller: auth.userId })
}, { hasPublicAccess: false })

exports.listCollectionItems = createHttpsFunction(async (data) => {
	const { collectionId, status, seller } = data
	let { firstTokenId, qty, salePrice } = data
	firstTokenId = parseInt(firstTokenId)
	qty = parseInt(qty)
	salePrice = parseFloat(salePrice)

	const { mintedTokensCount } = await runQuery(`
	select count(*) as mintedTokensCount
	from items 
	where collectionId=@collectionId and tokenId between @firstTokenId and @firstTokenId+@qty-1
	`, { collectionId, firstTokenId, qty }, false, true)

	if (mintedTokensCount !== qty) {
		return { listed: false, waitForAllToBeMinted: true, mintedTokensCount, qty }
	}

	await runQuery(`
	update items
	set status=@status, salePrice=@salePrice, seller=@seller
	where collectionId=@collectionId and tokenId between @firstTokenId and @firstTokenId+@qty-1
	`, { collectionId, firstTokenId, qty, status, salePrice, seller })

	return { listed: true, mintedTokensCount, qty, salePrice }
}, { hasPublicAccess: false })

// used by selfMint
exports.loadTotalItemsToMint = createHttpsFunction(async (data) => {
	const { totalItemsToMint } = await runQuery(`
select count(*) as totalItemsToMint
from items i
where i.collectionId=@collectionId
and isnull(i.isDeleted,0)=0
and i.status=2 -- ItemStatus.approved
and i.tokenId is not null
`, data, false, true)
	return totalItemsToMint
}, { hasPublicAccess: false })

// used by mintWithID
exports.loadItemsToMint = createHttpsFunction(async (data) => {
	const { collectionId, offset, ofCreatorId, exceptItemId, fetchCount } = data
	let { priceField } = data
	if (priceField !== "premintPrice" && priceField !== "mintPrice" && priceField !== "currentMintPrice") return -30001 // prevent sql injection
	if (priceField === "currentMintPrice") {
		const { stage } = await loadCurrentMintStageImpl(collectionId)
		priceField = stage === 2 ? "premintPrice" : "mintPrice"
	}
	return await runQuery(`
select i.itemId, i.collectionId, isnull(i.${priceField}, c.${priceField}) as price, i.name, i.[file], i.mimeType, i.status, 
u.name as creatorName, c.name as collectionName, i.keepAspectRatio, oi.originalCID,
i.tokenId, lc.nftAddress 
from items i
inner join collections c on c.collectionId=i.collectionId
inner join users u on u.userId=i.creatorId
left outer join liveCollections lc on lc.collectionId=i.collectionId
left outer join originalImages oi on oi.croppedCID=i.fileCID
where i.collectionId=@collectionId
and isnull(i.isDeleted,0)=0
and i.status>=2 -- ItemStatus.approved
and i.tokenId is not null
${ofCreatorId > 0 ? " and i.creatorId=@ofCreatorId" : ""}
${exceptItemId > 0 ? " and i.itemId<>@exceptItemId" : ""}
order by i.itemId desc
offset @offsetCount rows
fetch next @fetchCount rows only
`, { collectionId, fetchCount, offsetCount: offset || 0, ofCreatorId: ofCreatorId || 0, exceptItemId: exceptItemId || 0 })
})

// used by mintWithQTY with same price for all
exports.getMintPriceETH = createHttpsFunction(async (data) => {
	const { collectionId, stage, mintNFTQty } = data
	// eslint-disable-next-line
	const priceFieldName = stage == 1 ? "mintPrice" : "premintPrice"
	const r = await runQuery(`select samePriceForAllNFT, ${priceFieldName} from collections where collectionId=@collectionId`, { collectionId }, false, true)
	setCollectionDefaults(r)
	if (r.samePriceForAllNFT) {
		return r[priceFieldName] * mintNFTQty
	}
	throw new Error("getMintPriceETH does not support dynamic prices")
})

exports.updateLiveCollectionConductKey = createHttpsFunction(async (data) => {
	await runQuery("update liveCollections set conductKey=@conductKey where collectionId=@collectionId", data)
})

exports.uploadApprovedItemsMetadata = createHttpsFunction(async (data, auth) => {
	await checkCollectionOwner(auth, data.collectionId)
	const [[{ maxTokenId }], items] = await runQuery(`
	declare @maxTokenId int
	select @maxTokenId = isnull(max(i.tokenId), 0) 
	from items i 
	where i.collectionId=@collectionId 
	and isnull(i.isDeleted,0)=0 
	and i.status=2 -- ItemStatus.approved
	and i.tokenId is not null

	select @maxTokenId as maxTokenId

	select i.itemId, i.name, i.[desc] as description, i.[file] as image, i.mimeType, u.walletAddress as creator,
	tokenId,
	(
		select p.[name] as [trait_type], o.[name] as [value]
		from itemOptions io
		inner join options o on o.optionId=io.optionId 
		inner join props p on p.propId=o.propId
		where io.itemId=i.itemId
		for json path
	) as attributes, 0 as isNew
	from items i
	left outer join users u on u.userId=i.creatorId
	where i.collectionId=@collectionId 
	and isnull(i.isDeleted,0)=0 
	and i.status>=2 -- ItemStatus.approved
	and i.tokenId <= @maxTokenId

	union

	select i.itemId, i.name, i.[desc] as description, i.[file] as image, i.mimeType, u.walletAddress as creator,
	@maxTokenId + row_number() over (order by i.itemId desc) as tokenId,
	(
		select p.[name] as [trait_type], o.[name] as [value]
		from itemOptions io
		inner join options o on o.optionId=io.optionId 
		inner join props p on p.propId=o.propId
		where io.itemId=i.itemId
		for json path
	) as attributes, 1 as isNew
	from items i
	left outer join users u on u.userId=i.creatorId
	where i.collectionId=@collectionId 
	and isnull(i.isDeleted,0)=0 
	and i.status=2 -- ItemStatus.approved
	and i.tokenId is null

	order by i.itemId desc`, data, true)

	const newNftIds = {}
	const source = items?.map((item) => {
		const { mimeType, tokenId, itemId, isNew, ...token } = item
		if ((mimeType?.startsWith("image/") && mimeType?.endsWith("gif")) || mimeType?.startsWith("video/")) {
			token.animation_url = token.image
			token.mime_type = mimeType
		}
		if (token.attributes) {
			token.attributes = JSON.parse(token.attributes)
		}
		if (maxTokenId < tokenId) {
			(async () => {
				await runQuery("update items set tokenId=@tokenId where itemId=@itemId", { tokenId, itemId })
			})()
		}
		if (isNew) {
			if (newNftIds[token.creator]) {
				newNftIds[token.creator].push(tokenId)
			} else {
				newNftIds[token.creator] = [tokenId]
			}
		}
		return ({ path: `${tokenId}.json`, content: JSON.stringify(token) })
	})
	const baseURI = source?.length > 0 ? await sendMetadatasToIPFSImpl(source) : null
	return { totalCount: items?.length || 0, baseURI, newNftIds }
}, { hasPublicAccess: false, withIPFSAccess: true })

// used by mintWithQTY with same price for all
exports.loadArtistAddresses = createHttpsFunction(async (data) => {
	const r = await runQuery(`
select top(@qty) u.walletAddress
from items i
left outer join users u on u.userId=i.creatorId
where i.collectionId=@collectionId 
and isnull(i.isDeleted,0)=0 
and i.status=2 -- ItemStatus.approved
and i.tokenId is not null
order by i.tokenId asc
	`, data)
	return r.map(({ walletAddress }) => walletAddress)
})

// used by mintWithQTY with same price for all
exports.loadNonMintedItemsCount = createHttpsFunction(async (data) => {
	const { count } = await runQuery(`
select count(*) as [count] 
from items 
where collectionId=@collectionId
and isnull(isDeleted,0)=0 
and status=2 -- ItemStatus.approved`, data, false, true, () => ({ count: 0 }))
	return count
})

exports.updateBoughtItems = createHttpsFunction(async (data, auth) => {
	const { boughtItems } = data
	boughtItems.forEach(async ({ nftAddress, tokenId }) => {
		await runQuery(`
declare @collectionId bigint
select @collectionId = collectionId from liveCollections where nftAddress=@nftAddress

declare @itemId bigint
select @itemId = itemId from items where collectionId=@collectionId and tokenId=@tokenId

update items set [status]=@boughtStatus where itemId=@itemId

declare @oldOwnerId bigint
select @oldOwnerId = userId from userItems where itemId=@itemId and roles & @ownerRole > 0 -- RolesMap.owner

update userItems set roles &= ~@ownerRole where userId=@oldOwnerId and itemId=@itemId

merge userItems with (holdlock) as Target
using (select 1 as [TempKey]) as Source
on Target.userId=@newOwnerId and Target.itemId=@itemId
when matched then 
	update set roles |= @ownerRole | @buyerRole
when not matched then 
	insert (userId, itemId, roles) values (@newOwnerId, @itemId, @ownerRole | @buyerRole);`, {
			nftAddress,
			tokenId,
			boughtStatus: 5, // ItemStatus.bought
			newOwnerId: auth.userId,
			buyerRole: 8, // RolesMap.buyer 
			ownerRole: 64, // RolesMap.owner
		})
	})
}, { hasPublicAccess: false })

exports.getUserSplitterAddresses = createHttpsFunction(async (data) => {
	return await runQuery(`
		select sd.groupAddress, sd.shareAmount, sd.withdrawn, sd.holderShareAmount, sd.withdrawnHolderShareAmount, sd.withdrawRequested, sd.withdrawHolderShareRequested
		from liveCollections lc 
		inner join txShareData sd on sd.groupAddress=lc.groupAddress
		where sd.address=@address
		union
		select sd.groupAddress, sd.shareAmount, sd.withdrawn, sd.holderShareAmount, sd.withdrawnHolderShareAmount, sd.withdrawRequested, sd.withdrawHolderShareRequested
		from liveCollections lc 
		inner join txShareData sd on sd.groupAddress=lc.mintGroupAddress
		where sd.address=@address`, data)
}, { hasPublicAccess: false })

exports.getEarnings = createHttpsFunction(async (data) => {
	return await runQuery(`
	select c.name as collectionName, 
		i.[file], i.mimeType, i.keepAspectRatio, oi.originalCID,
		fd.receivedAt, fd.tokenId, fd.actionType, fd.price, fd.totalShare, 
		fd.shareAsTeammate, fd.shareAsArtist, fd.shareAsAllArtists, fd.shareAsHolder,
		fd.withdrawn
	from txFeesDetails fd
	inner join collections c on c.collectionId=fd.collectionId
	inner join items i on i.itemId=fd.itemId
	left outer join originalImages oi on oi.croppedCID=i.fileCID
	where fd.recipientAddress=@address
	order by fd.receivedAt desc, fd.feeId desc
`, data)
}, { hasPublicAccess: false })

exports.createLiveCollection = createHttpsFunction(async (data, auth) => {
	await checkCollectionOwner(auth, data?.fields?.collectionId)
	const { fields } = data
	await insert()

	async function insert() {
		const sqlReq = await getRequest()
		const keys = Object.keys(fields)
		keys.forEach(key => sqlReq.input(key, fields[key]))
		const q = `insert into liveCollections (${keys.map(key => `[${key}]`).join(',')}) values (${keys.map(key => '@' + key).join(',')})`
		await sqlReq.query(q)
	}
}, { hasPublicAccess: false })

exports.loadLiveCollection = createHttpsFunction(async (data) => {
	const { collectionId } = data
	return await load()

	async function load() {
		const sqlReq = await getRequest()
		const result = await sqlReq.
			input("collectionId", collectionId).
			query("select [nftAddress], [groupAddress], [tokenSymbol], [maxPublicMint], [publicSalePriceETH], [collectAddress], [mintGroupAddress], [nftContractAddressMintKey] from liveCollections where collectionId=@collectionId")
		return result.recordset[0] || {}
	}
})

async function getLiveCollectionId(address) {
	const r = await runQuery('select top 1 collectionId from liveCollections where nftAddress=@address order by collectionId desc', { address })
	return r?.length > 0 ? r[0].collectionId : 0
}

exports.loadCollectionIdByNFTAddress = createHttpsFunction(async (data) => {
	const { nftAddress, tokenId } = data
	const collectionId = await getLiveCollectionId(nftAddress)
	const { itemId, mimeType, conductKey } = tokenId > 0 ? await runQuery(`
	select i.itemId, i.mimeType, lc.conductKey
	from items i
	inner join liveCollections lc on lc.collectionId=i.collectionId
	where i.collectionId=@collectionId and i.tokenId=@tokenId`,
		{ collectionId, tokenId }, false, true, () => ({ itemId: 0, mimeType: null, conductKey: null }))
		: ({ itemId: 0, mimeType: null, conductKey: null })
	return { collectionId, itemId, mimeType, conductKey }
})

exports.getNFTDetailsLocal = createHttpsFunction(async (data) => {
	const { address, chain, traitfilter, limit, cursor } = data
	const collectionId = await getLiveCollectionId(address)
	if (collectionId) {
		const [[{ total }], results] = await runQuery(`
		select count(*) as total from items where collectionId=@collectionId and [status]=4 -- ItemStatus.onSale

		select 'erc721' as token_type, @address as contract_address, 
			i.tokenId as [id], i.[name] as token_name, i.[desc] as token_description, 
			i.[file] + '/' + convert(nvarchar(max), i.tokenId) + '.json' as uri,
			(
				select
					i.[file] as [image],
					(
						select p.[name] as [trait_type], o.[name] as [value]
						from itemOptions io
						inner join options o on o.optionId=io.optionId 
						inner join props p on p.propId=o.propId
						where io.itemId=i.itemId
						for json path
					) as attributes
				for json path
			) as metadata,
			(
				select i.salePrice as price for json path
			) as recent_price,
			i.mimeType, i.[status], i.salePrice, i.seller, lc.conductKey, lc.nftAddress as nftContract, lc.groupAddress,
			c.name as collectionName,
			1 as sourceMarket -- 1=Montage
		from items i
		inner join collections c on c.collectionId=i.collectionId
		left outer join liveCollections lc on lc.collectionId=i.collectionId
		where i.collectionId=@collectionId 
		and i.[status]=4 -- ItemStatus.onSale
		order by i.tokenId
		offset @offsetCount rows
		fetch next @fetchCount rows only
		`, { collectionId, address, offsetCount: cursor || 0, fetchCount: limit }, true)
		return {
			chain,
			cursor: (cursor || 0) + (results?.length || 0),
			per_page: limit,
			total,
			results: results?.map(r => ({ ...r, metadata: JSON.parse(r.metadata)[0], recent_price: JSON.parse(r.recent_price)[0] }))
		}
	}
})

exports.getCollectionSummeryLocal = createHttpsFunction(async (data) => {
	const { address } = data
	const collectionId = await getLiveCollectionId(address)
	if (collectionId) {
		const [r] = await runQuery(`select coverImage, profileImage, name, [desc], discord, twitter, instagram from collections where collectionId=@collectionId`, { collectionId })
		const trait_rarity_counts = await loadTraitRarityCounts(collectionId)
		return {
			token_type: "erc721",
			contract_address: address,
			exchange_data: [{
				exchange: "montage",
				name: r.name,
				description: r.desc,
				exchange_url: `https://montage.app/collection-page/${address}`,
				banner_image_url: r.coverImage,
				featured_image_url: null,
				large_image_url: null,
				image_url: r.profileImage,
				chat_url: null,
				discord_url: r.discord,
				telegram_url: null,
				twitter_username: r.twitter,
				wiki_url: null,
				instagram_username: r.instagram,
				stats: {
					"market_cap": 2700,
					"num_owners": 6356,
					"floor_price": 0.27,
					"total_minted": null,
					"total_supply": 10000,
					"total_volume": 735.4302147511502,
					"one_day_volume": 0.22,
					"seven_day_volume": 1.108087,
					"thirty_day_volume": 4.186943,
					"one_day_volume_change": 0.02859578910736036,
					"seven_day_volume_change": 0.27805928464419477,
					"thirty_day_volume_change": -0.5612345912905421,
					"total_sales": 551,
					"one_day_sales": 1,
					"seven_day_sales": 5,
					"thirty_day_sales": 18,
					"total_average_price": 1.3347190830329405,
					"one_day_average_price": 0.22,
					"seven_day_average_price": 0.2216174,
					"thirty_day_average_price": 0.23260794444444444
				}
			}],
			trait_rarity_counts,
			curr_floor: null,
			old_floor: null,
			floor_change: 0
		}
	}
})