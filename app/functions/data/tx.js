const functions = require("firebase-functions");
const { getAllOwnersImpl, getNFTContractTransfersImpl } = require("../web3/nfts");
const { setCollectionDefaults } = require("./collections");
const { runQuery, dbRuntimeOptions, createHttpsFunction, getTransaction } = require('./db');
const { checkWalletOwner } = require("./validAccess");

const CREATOR_FEE_INDEX = 0
const ALL_PARTNERS_FEE_INDEX = 1
const ALL_CREATORS_FEE_INDEX = 2
const OWNERS_FEE_INDEX = 3
// const MARKETPLACE_FEE_INDEX = 4

const mintStage = 50001
const saleStage = 50002

exports.withdrawWaitingFunds = createHttpsFunction(async (data, auth) => {
	checkWalletOwner(auth, data.address)
	console.log("withdrawWaitingFunds: data", data)
	const { groupAddress, address, onlyHolders, isRequest, donationWallet } = data
	if (onlyHolders && !donationWallet) {
		throw new Error("Empty donationWallet")
	}

	const shareAmount = onlyHolders ? "holderShareAmount" : "shareAmount"
	const withdrawn = onlyHolders ? "withdrawnHolderShareAmount" : "withdrawn"
	const withdrawnBit = onlyHolders ? "withdrawnHolderShare" : "withdrawn"
	const withdrawRequested = onlyHolders ? "withdrawHolderShareRequested" : "withdrawRequested"
	const tran = await getTransaction()
	await tran.begin()
	try {
		console.log("withdrawWaitingFunds: tran began! isRequest:", isRequest)
		await runQuery(`
			if @isRequest=1 begin
				update txShareData
				set ${withdrawRequested}=1
				${onlyHolders ? ", donationWallet=@donationWallet" : ""}
				where groupAddress=@groupAddress and address=@address
			end else begin
				update txShareData
				set ${shareAmount}='0'
				, ${withdrawn}=convert(nvarchar(50), convert(decimal(36,0), isnull(${withdrawn}, '0')) + convert(decimal(36,0), isnull(${shareAmount},'0')))
				${onlyHolders ? ", donationWallet=@donationWallet" : ""}
				where groupAddress=@groupAddress and address=@address

				update txFeesDetails
				set ${withdrawnBit}=1
				where groupAddress=@groupAddress and recipientAddress=@address
			end
	`, { groupAddress, address, isRequest, donationWallet }, false, false, null, tran)
		await tran.commit()
		console.log("withdrawWaitingFunds: tran commited! isRequest:", isRequest)
	} catch (ex) {
		console.error("withdrawWaitingFunds: exception", ex)
		await tran.rollback()
		throw ex
	}
}, { hasPublicAccess: false })

exports.feeReceived = functions.runWith(dbRuntimeOptions).firestore
	.document(`moralis/events/Feereceived/{id}`)
	.onWrite(async (change) => {
		const data = change.after.exists ? change.after.data() : null
		if (!data) {
			console.log("feeReceived: data deleted")
			return
		}
		await processFeeReceived(data)
	})

async function processFeeReceived(data) {
	const { confirmed, to: groupAddress, amount: feeAmount, chainId } = data
	if (!confirmed) {
		console.log("feeReceived: unconfirmed")
		return
	}
	const { collectionId, nftAddress, saleGroupAddress, mintGroupAddress } = await runQuery('select collectionId, nftAddress, groupAddress as saleGroupAddress, mintGroupAddress from liveCollections where groupAddress=@groupAddress or mintGroupAddress=@groupAddress', { groupAddress }, false, true)
	if (!collectionId) {
		console.log("feeReceived: collectionId not found in liveCollections by groupAddress:", groupAddress)
		return
	}
	const stage = groupAddress.toLowerCase() === saleGroupAddress.toLowerCase() ? saleStage : groupAddress.toLowerCase() === mintGroupAddress.toLowerCase() ? mintStage : 0
	if (!stage) {
		console.log("feeRecevied: splitter stage not identified by address: groupAddress, saleGroupAddress, mintGroupAddress", groupAddress, saleGroupAddress, mintGroupAddress)
		return
	}
	const tran = await getTransaction()
	await tran.begin()
	try {
		console.log("feeReceived: tran began!")
		console.log("feeReceived: updateFees: collectionId, feeAmount, groupAddress, stage", collectionId, feeAmount, groupAddress, stage)
		await updateFees(collectionId, feeAmount, groupAddress, stage, tran)
		await enqueueToScanLater(nftAddress, chainId, stage, tran)
		await tran.commit()
		console.log("feeReceived: tran commited!")
	} catch (ex) {
		console.error("feeReceived: exception", ex)
		await tran.rollback()
		throw ex
	}
}
exports.processFeeReceived = processFeeReceived

exports.scanAndDealEveryMinute = functions.runWith(dbRuntimeOptions).pubsub.schedule('every 1 minutes').onRun(async (context) => {
	await scanAndDealImpl()
})

exports.scanAndDealAdminOnly = createHttpsFunction(async (data) => {
	const { collectionId, block, stage, chainId } = data
	const { nftAddress, salesGroupAddress, mintGroupAddress } = await runQuery(`select nftAddress, groupAddress as salesGroupAddress, mintGroupAddress from liveCollections where collectionId=@collectionId`, { collectionId }, false, true)
	if (!nftAddress) {
		throw new Error("Invalid collectionId; (ArtIs collectionId = 3)")
	}
	// eslint-disable-next-line 
	if (stage != saleStage && stage != mintStage) {
		throw new Error("Invalid stage (not sales=50002 or mint=50001")
	}
	// eslint-disable-next-line 
	if (chainId != 1 && chainId != 5) {
		throw new Error("Invalid chainId (not 1 or 5)")
	}

	await runQuery(`update liveCollections set lastScannedBlock=@block where collectionId=@collectionId`, { collectionId, block })
	const scanResult = await scanRecentTransfers(nftAddress, chainId)
	// eslint-disable-next-line 
	const groupAddress = stage == saleStage ? salesGroupAddress : mintGroupAddress
	const { prices } = scanResult
	for (let i = 0; i < prices?.length; i++) {
		await updateFees(collectionId, prices[i], groupAddress, stage)
	}
	await enqueueToScanLater(nftAddress, data.chainId, data.stage)
	await scanAndDealImpl([scanResult])
}, { hasPublicAccess: false, adminOnly: true })

async function scanAndDealImpl(scanResults = []) {
	const rs = await runQuery(`
	select s.enqueueIndex, s.nftAddress, s.chainId, s.stage, lc.collectionId, lc.groupAddress as saleGroupAddress, lc.mintGroupAddress
	from txScans s 
	inner join liveCollections lc on lc.nftAddress=s.nftAddress
	order by s.enqueueIndex
	`)
	if (rs?.length > 0) {
		for (let i = 0; i < rs.length; i++) {
			await scanAndDealNFTAddress(rs[i], scanResults[i])
		}

		async function scanAndDealNFTAddress({ enqueueIndex, nftAddress, chainId, stage, collectionId, saleGroupAddress, mintGroupAddress }, scanResult) {
			console.log("scanAndDealNFTAddress: enqueueIndex, nftAddress, chainId, stage, collectionId, saleGroupAddress, mintGroupAddress", enqueueIndex, nftAddress, chainId, stage, collectionId, saleGroupAddress, mintGroupAddress)
			const { tokenIds, prices, times, owners, lastScannedBlock } = scanResult || (await scanRecentTransfers(nftAddress, chainId))
			const tran = await getTransaction()
			await tran.begin()
			try {
				console.log("scanAndDealNFTAddress: tran began!")
				const groupAddress = stage === saleStage ? saleGroupAddress : mintGroupAddress
				if (tokenIds?.length > 0 && tokenIds?.length === prices?.length) {
					await distributeFees(groupAddress, tokenIds, prices, times, collectionId, stage, owners, tran)
				} else {
					await resetFees(groupAddress, tran)
				}
				await runQuery('update liveCollections set lastScannedBlock=@lastScannedBlock where collectionId=@collectionId', { collectionId, lastScannedBlock }, false, false, null, tran)
				await runQuery('delete from txScans where enqueueIndex=@enqueueIndex', { enqueueIndex }, false, false, null, tran)
				await tran.commit()
				console.log("scanAndDealNFTAddress: tran committed!")
			} catch (ex) {
				console.error("scanAndDealNFTAddress: exception", ex)
				await tran.rollback()
				throw ex
			}
		}
	}
}

async function enqueueToScanLater(nftAddress, chainId, stage, tran) {
	await runQuery(`
	merge txScans with (holdlock) as Target
	using (select 1 as [TempKey]) as Source
	on Target.nftAddress=@nftAddress
	when not matched then 
		insert (nftAddress, chainId, stage)
	 	values (@nftAddress, @chainId, @stage);`, { nftAddress, chainId, stage }, false, false, null, tran)
}

async function scanRecentTransfers(nftAddress, chainId) {
	let { lastScannedBlock } = await runQuery('select lastScannedBlock from liveCollections where nftAddress=@nftAddress', { nftAddress }, false, true)

	const from_block = lastScannedBlock ? lastScannedBlock + 1 : undefined
	let cursor
	const tokenIds = []
	const prices = []
	const times = []
	do {
		const res = await getNFTContractTransfersImpl(nftAddress, chainId, from_block, cursor)
		cursor = res?.data?.cursor
		const transfers = res?.data?.result?.filter(t => t.value !== "0") || []
		for (let i = 0; i < transfers.length; i++) {
			const t = transfers[i]
			const bn = parseInt(t.block_number)
			if (bn > (lastScannedBlock || 0)) lastScannedBlock = bn
			tokenIds.push(parseInt(t.token_id))
			prices.push(t.value)
			times.push(t.block_timestamp)
		}
	} while (cursor)
	const owners = await getAllOwnersImpl(nftAddress, chainId)
	console.log("scanRecentTransfers: nftAddress, chainId, lastScannedBlock; tokenIds, prices, owners", nftAddress, chainId, lastScannedBlock, tokenIds?.join(','), prices?.join(','), owners?.join(','))
	return { tokenIds, prices, times, owners, lastScannedBlock }
}

async function distributeFees(groupAddress, tokenIds, prices, times, collectionId, stage, owners, tran) {
	const isValidCall = tokenIds?.length > 0 && tokenIds?.length === prices?.length
	if (!isValidCall) {
		throw new Error("distributeFees: invalid call: isValidCall = tokenIds?.length > 0 && tokenIds?.length === prices?.length", tokenIds?.join(', '), prices?.join(', '))
	}
	const soldTokensCount = tokenIds.length

	const { royaltyFeePercent, shareDetails, totalShares } = await getShares(collectionId, stage)
	console.log("distributeFees: getShares: royaltyFeePercent, shareDetails, totalShares", royaltyFeePercent, shareDetails.join(','), totalShares)

	// eslint-disable-next-line
	const actionType = stage == mintStage ? 'mint' : stage == saleStage ? 'sale' : stage.toString()
	const recipientFees = {}
	const feesDetailsByToken = []
	for (let i = 0; i < tokenIds.length; i++) {
		const { itemId } = await runQuery('select itemId from items where collectionId=@collectionId and tokenId=@tokenId', { collectionId, tokenId: tokenIds[i] }, false, true, () => ({ itemId: null }))
		feesDetailsByToken.push({
			groupAddress,
			collectionId,
			itemId,
			tokenId: tokenIds[i],
			receivedAt: times[i],
			actionType,
			price: parseFloat(prices[i]),
			totalShare: 0,
			shareAsTeammate: 0,
			shareAsArtist: 0,
			shareAsAllArtists: 0,
			shareAsHolder: 0,
			withdrawn: false,
			withdrawnHolderShare: false
		})
	}
	const addFeeDetails = (recipientAddress, tokenIx, addToShareAmount, shareKey) => {
		recipientAddress = recipientAddress.toLowerCase()
		let rf = recipientFees[recipientAddress]
		if (!rf) recipientFees[recipientAddress] = rf = {}
		let rft = rf[tokenIx]
		if (!rft) rf[tokenIx] = rft = { ...feesDetailsByToken[tokenIx] }
		rft.totalShare += addToShareAmount
		rft[shareKey] += addToShareAmount
	}

	const { creatorFee, allPartnersFee, allCreatorsFee, allHoldersShare } = await loadFees(groupAddress)
	if (creatorFee > 0) {
		for (let tokenIx = 0; tokenIx < soldTokensCount; tokenIx++) {
			const creatorAddress = await loadCreatorAddress(groupAddress, tokenIds[tokenIx])
			const addToShareAmount = shareDetails[CREATOR_FEE_INDEX] * parseFloat(prices[tokenIx]) * royaltyFeePercent / 10000 / totalShares
			console.log("distributeFees: creatorAddress <== addToShareAmount = shareDetails[CREATOR_FEE_INDEX] * parseFloat(prices[i]) * royaltyFeePercent / 10000 / totalShares", creatorAddress, addToShareAmount, shareDetails[CREATOR_FEE_INDEX], parseFloat(prices[tokenIx]), royaltyFeePercent, 10000, totalShares)
			await updateShareData(groupAddress, creatorAddress, addToShareAmount, tran)
			addFeeDetails(creatorAddress, tokenIx, addToShareAmount, 'shareAsArtist')
		}
	}

	if (allPartnersFee > 0) {
		const { partnerShareDetails, totalSharesOfPartners } = await loadPartnerShareDetails(collectionId)
		const partnersGroupLength = partnerShareDetails.length
		for (let i = 0; i < partnersGroupLength; i++) {
			const { walletAddress: parterAddress, partnerShare } = partnerShareDetails[i]
			const addToShareAmount = allPartnersFee * partnerShare / totalSharesOfPartners
			console.log("distributeFees: parterAddress <== addToShareAmount = allPartnersFee * partnerShare / totalSharesOfPartners", parterAddress, addToShareAmount, allPartnersFee, partnerShare, totalSharesOfPartners)
			await updateShareData(groupAddress, parterAddress, addToShareAmount, tran)
			for (let tokenIx = 0; tokenIx < soldTokensCount; tokenIx++) {
				addFeeDetails(parterAddress, tokenIx, addToShareAmount / soldTokensCount, 'shareAsTeammate')
			}
		}
	}

	if (allCreatorsFee > 0) {
		const { creatorShareDetails, totalSharesOfCreators } = await loadCreatorShareDetails(collectionId)
		const creatorsGroupLength = creatorShareDetails?.length || 0
		for (let i = 0; i < creatorsGroupLength; i++) {
			const { walletAddress: creatorAddress, creatorShare } = creatorShareDetails[i]
			const addToShareAmount = allCreatorsFee * creatorShare / totalSharesOfCreators
			console.log("distributeFees: creatorAddress <== addToShareAmount = allCreatorsFee * creatorShare / totalSharesOfCreators", creatorAddress, addToShareAmount, allCreatorsFee, creatorShare, totalSharesOfCreators)
			await updateShareData(groupAddress, creatorAddress, addToShareAmount, tran)
			for (let tokenIx = 0; tokenIx < soldTokensCount; tokenIx++) {
				addFeeDetails(creatorAddress, tokenIx, addToShareAmount / soldTokensCount, 'shareAsAllArtists')
			}
		}
	}

	if (owners?.length > 0 && allHoldersShare > 0) {
		const uniqueOwners = owners.filter((v, i, a) => a.findIndex(q => q.toLowerCase() === v.toLowerCase()) === i)
		const addToShareAmount = allHoldersShare / uniqueOwners.length
		for (let i = 0; i < uniqueOwners.length; i++) {
			const owner = uniqueOwners[i]
			console.log(`distributeFees: uniqueOwners[${i}] <== addToShareAmount = allHoldersShare / uniqueOwners.length`, owner, addToShareAmount, allHoldersShare, uniqueOwners.length)
			await updateShareData(groupAddress, owner, addToShareAmount, tran, true)
			for (let tokenIx = 0; tokenIx < soldTokensCount; tokenIx++) {
				addFeeDetails(owner, tokenIx, addToShareAmount / soldTokensCount, 'shareAsHolder')
			}
		}
	}

	await resetFees(groupAddress, tran)

	const recipientAddresses = Object.keys(recipientFees)
	for (let i = 0; i < recipientAddresses.length; i++) {
		const recipientAddress = recipientAddresses[i]
		const rf = recipientFees[recipientAddress]
		const tokenIxs = Object.keys(rf)
		for (let j = 0; j < tokenIxs.length; j++) {
			const rft = rf[tokenIxs[j]]
			await updateFeesDetails(recipientAddress, rft, tran)
		}
	}
}

async function loadCreatorShareDetails(collectionId) {
	const creatorShareDetails = await runQuery(`
	select u.walletAddress, 
		(select count(*) 
			from items 
			where creatorId=c.userId 
			and collectionId=c.collectionId 
			and tokenId is not null
		) * 100 as creatorShare
	from creators c
	inner join users u on u.userId=c.userId
	where c.collectionId=@collectionId and len(u.walletAddress)>0
	`, { collectionId })
	const totalSharesOfCreators = creatorShareDetails?.map(({ creatorShare }) => creatorShare || 0).reduce((a, b) => a + b, 0) || 0
	return { creatorShareDetails, totalSharesOfCreators }
}

async function loadPartnerShareDetails(collectionId) {
	const partnerShareDetails = await runQuery(`
	select u.walletAddress, isnull(t.share, 0) * 100 as partnerShare
	from team t 
	inner join users u on u.userId=t.userId
	where t.collectionId=@collectionId
	`, { collectionId })
	const totalSharesOfPartners = partnerShareDetails?.map(({ partnerShare }) => partnerShare || 0).reduce((a, b) => a + b, 0) || 0
	return { partnerShareDetails, totalSharesOfPartners }
}

async function loadFees(groupAddress) {
	const fees = await runQuery(`
	select 
		Fees${CREATOR_FEE_INDEX}, 
		Fees${ALL_PARTNERS_FEE_INDEX}, 
		Fees${ALL_CREATORS_FEE_INDEX}, 
		Fees${OWNERS_FEE_INDEX} 
	from txFees 
	where groupAddress=@groupAddress`, { groupAddress }, false, true)
	const creatorFee = parseFloat(fees[`Fees${CREATOR_FEE_INDEX}`] || 0)
	const allPartnersFee = parseFloat(fees[`Fees${ALL_PARTNERS_FEE_INDEX}`] || 0)
	const allCreatorsFee = parseFloat(fees[`Fees${ALL_CREATORS_FEE_INDEX}`] || 0)
	const allHoldersShare = parseFloat(fees[`Fees${OWNERS_FEE_INDEX}`] || 0)
	return { creatorFee, allPartnersFee, allCreatorsFee, allHoldersShare }
}

async function resetFees(groupAddress, tran) {
	await runQuery(`
	update txFees set 
		Fees${CREATOR_FEE_INDEX}='0',
		Fees${ALL_PARTNERS_FEE_INDEX}='0',
		Fees${ALL_CREATORS_FEE_INDEX}='0',
		Fees${OWNERS_FEE_INDEX}='0'
	where groupAddress=@groupAddress`
		, { groupAddress }, false, false, null, tran)
}

async function updateFeesDetails(recipientAddress, data, tran) {
	const { groupAddress, collectionId, itemId, tokenId, receivedAt, actionType, price, totalShare, shareAsTeammate, shareAsArtist, shareAsAllArtists, shareAsHolder, withdrawn, withdrawnHolderShare } = data
	await runQuery(`
	insert into txFeesDetails (
		groupAddress, recipientAddress, collectionId, itemId, tokenId, receivedAt, actionType, 
		price, totalShare, shareAsTeammate, shareAsArtist, shareAsAllArtists, shareAsHolder, 
		withdrawn, withdrawnHolderShare
	)
	values (
		@groupAddress, @recipientAddress, @collectionId, @itemId, @tokenId, @receivedAt, @actionType, 
		@price, @totalShare, @shareAsTeammate, @shareAsArtist, @shareAsAllArtists, @shareAsHolder, 
		@withdrawn, @withdrawnHolderShare
	)`, {
		groupAddress, recipientAddress, collectionId, itemId, tokenId, receivedAt, actionType,
		price: Math.round(price).toString(),
		totalShare: Math.round(totalShare).toString(),
		shareAsTeammate: Math.round(shareAsTeammate).toString(),
		shareAsArtist: Math.round(shareAsArtist).toString(),
		shareAsAllArtists: Math.round(shareAsAllArtists).toString(),
		shareAsHolder: Math.round(shareAsHolder).toString(),
		withdrawn, withdrawnHolderShare
	}, false, false, null, tran)
}

async function updateShareData(groupAddress, address, addToShareAmount, tran, isDonation = false) {
	const shareAmount = isDonation ? 'holderShareAmount' : 'shareAmount'
	const withdrawnAmount = isDonation ? 'withdrawnHolderShareAmount' : 'withdrawn'
	const otherAmount = isDonation ? 'shareAmount' : 'holderShareAmount'
	const otherWithdrawnAmount = isDonation ? 'withdrawn' : 'withdrawnHolderShareAmount'
	await runQuery(`
	merge txShareData with (holdlock) as Target
	using (select 1 as [TempKey]) as Source
	on Target.groupAddress=@groupAddress and Target.address=@address
	when matched then 
		update set ${shareAmount} = convert(nvarchar(50), convert(decimal(36,0), isnull(${shareAmount},'0')) + convert(decimal(36,0), @addToShareAmount))
	when not matched then
		insert (groupAddress, address, ${shareAmount}, ${withdrawnAmount}, ${otherAmount}, ${otherWithdrawnAmount})
		values (@groupAddress, @address, @addToShareAmount, '0', '0', '0');`, { groupAddress, address, addToShareAmount: Math.round(addToShareAmount).toString() }, false, false, null, tran)
}

async function updateFees(collectionId, price, groupAddress, stage, tran) {
	const { shareDetails, totalShares } = await getShares(collectionId, stage)
	const msgValue = parseFloat(price) // assumed price in WEI
	const fees = shareDetails.map(share => msgValue * share / totalShares)
	console.log("updateFees: fees", fees.join(', '))
	const txFeesArgs = { groupAddress }
	fees.forEach((fee, i) => txFeesArgs[`Fees${i}`] = Math.round(fee).toString())
	await runQuery(`
			merge txFees with (holdlock) as Target
			using (select 1 as [TempKey]) as Source
			on Target.groupAddress=@groupAddress
			when matched then 
				update set ${fees.map((_fee, i) => `Fees${i} = convert(nvarchar(50), convert(decimal(36,0), isnull(Fees${i}, '0')) + convert(decimal(36,0), @Fees${i}))`).join(',')}
			when not matched then 
				insert (groupAddress, ${fees.map((_fee, i) => `Fees${i}`).join(',')}) values (@groupAddress, ${fees.map((_fee, i) => `@Fees${i}`).join(',')});
		`, txFeesArgs, false, false, null, tran)
}

async function loadCreatorAddress(groupAddress, tokenId) {
	const r = await runQuery(`
	declare @collectionId bigint
	select @collectionId = collectionId 
	from liveCollections 
	where groupAddress=@groupAddress or mintGroupAddress=@groupAddress
	
	declare @creatorId bigint
	select @creatorId = creatorId 
	from items 
	where collectionId=@collectionId and tokenId=@tokenId
	
	select walletAddress 
	from users 
	where userId=@creatorId
	`, { groupAddress, tokenId }, false, true, () => ({}))
	if (!r.walletAddress) throw new Error(`Could not find creator address; groupAddress=${groupAddress}, tokenId=${tokenId}`)
	return r.walletAddress
}

async function getDefaultPie(collectionId, stage) {
	const { manyArtists } = setCollectionDefaults(await runQuery('select manyArtists from collections where collectionId=@collectionId', { collectionId }, false, true))
	return {
		creatorRoyalties: stage === 50002 ? 10 : 100,
		creator: manyArtists ? 7 : 0,
		allPartners: manyArtists ? 85 : 95,
		allCreators: manyArtists ? 3 : 0,
		allOwners: 3,
		marketplace: 2
	}
}
async function getPie(collectionId, stage) {
	return await runQuery('select creatorRoyalties, creator, allPartners, allCreators, allOwners, marketplace from pies where collectionId=@collectionId and stage=@stage', { collectionId, stage }, false, true,
		async () => await getDefaultPie(collectionId, stage))
}
exports.getPieWithDefaults = getPie
async function getShares(collectionId, stage) {
	const { creatorRoyalties, creator, allPartners, allCreators, allOwners, marketplace } = await getPie(collectionId, stage)
	// See also app/src/func/collections.js defaultPiesInit_manyArtists and defaultPiesInit_oneArtist for default definitions
	// See also getShares.js
	const shareDetails = [
		100 * creator,
		100 * allPartners,
		100 * allCreators,
		100 * allOwners,
		100 * marketplace
	]
	const totalShares = shareDetails.reduce((a, b) => a + b, 0)
	const result = { royaltyFeePercent: creatorRoyalties * 100, shareDetails, totalShares }
	return result
}
