import callFunc from './callFunc'
import CollectionStatusMap from '../util/collectionStatus'
import { DefaultRole, RolesMap } from '../util/roles'
import { ScheduleStatuses } from '../util/scheduleStages'
import { mintStage, saleStage } from '../web3/util/stages'
import { RightsTypeMap } from '../util/rightsTypes'
import { LookNFeelMap } from '../util/lookNfeel'
import { ImageVAlignMap } from '../util/imageVAlign'
import { PageSectionStyleMap, PageSectionTypeMap } from '../util/pageSection'

export async function loadCollectionArtists(collectionId) {
	return collectionId ? (await callFunc("loadCollectionArtists", { collectionId })) || [] : []
}

export async function loadCurrentItemsCount(collectionId) {
	return collectionId ? (await callFunc("loadCurrentItemsCount", { collectionId })) || 0 : 0
}

export async function loadCuratorAddress(collectionId) {
	return collectionId ? (await callFunc("loadCuratorAddress", { collectionId, curatorRole: RolesMap.curator }))?.walletAddress : null
}

export async function mergeCreationStages(collectionId, states) {
	if (collectionId) {
		await callFunc("mergeCreationStages", { collectionId, states })
	}
}

export async function loadCreationStages(collectionId) {
	const arr = collectionId ? (await callFunc("loadCreationStages", { collectionId })) : null
	const ret = []
	arr?.forEach(r => ret[r.stageIdx] = !!r.isCompleted)
	return ret
}

export async function deleteAllCollectionItems(collectionId) {
	if (collectionId) {
		await callFunc("deleteAllCollectionItems", { collectionId })
	}
}

export async function deleteCollection(collectionId) {
	if (collectionId) {
		await Promise.all([updateCollection(collectionId, { isDeleted: true }), deleteAllCollectionItems(collectionId)])
	}
}

export async function loadCurrentMintStage(collectionId) {
	return collectionId ? (await callFunc("loadCurrentMintStage", { collectionId })) || {} : {}
}

export async function loadCurrentSchedule(collectionId, stage = 0) {
	return collectionId ? (await callFunc("loadCurrentSchedule", { collectionId, status: ScheduleStatuses.done, stage })) || {} : {}
}

export async function mergeSchedule(collectionId, rows) {
	if (collectionId) {
		await callFunc("mergeSchedule", { collectionId, rows })
	}
}

function adjustForDateTimeLocalInput(utcDateTimeStr) {
	if (!utcDateTimeStr) return utcDateTimeStr
	const d = new Date(utcDateTimeStr)
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
	function pad2(num) {
		const s = num.toString()
		return s.length >= 2 ? s : '0' + s
	}
}
export async function loadSchedule(collectionId) {
	const rows = collectionId ? (await callFunc("loadSchedule", { collectionId })) || [] : []
	rows.forEach(row => {
		row.launchAt = adjustForDateTimeLocalInput(row.launchAt)
	})
	return rows
}

export async function loadMyCollectionBasics(collectionId, userId) {
	const r = collectionId && userId ? (await callFunc("loadMyCollectionBasics", { collectionId, userId })) || {} : {}
	if (!r.status) r.status = CollectionStatusMap.draft
	if (!r.roles) r.roles = DefaultRole
	if (!r.name) r.name = 'Collection'
	return r
}

export async function loadMyCollections(userId, offsetCount, fetchCount, roleFilter, collectionId) {
	return userId || collectionId ? (await callFunc("loadMyCollections", { userId, offsetCount, fetchCount, roleFilter, collectionId })) || [] : []
}

export async function loadMyCollectionStory(collectionId, forEditPages, noPageSections) {
	let { details: data, pageSections } = collectionId ? (await callFunc("loadMyCollectionStory", { collectionId, forEditPages, noPageSections })) || { details: {} } : { details: {} }
	if (data.lookNfeel === null) data.lookNfeel = LookNFeelMap.lightMode
	if (!noPageSections) {
		if (!pageSections) pageSections = []
		Object.keys(PageSectionTypeMap).forEach(pageSectionType => {
			const pst = PageSectionTypeMap[pageSectionType]
			// eslint-disable-next-line
			let pageSection = pageSections.find(ps => ps.pageSectionType == pst)
			if (!pageSection) pageSections.push(pageSection = { collectionId, pageSectionType: pst, pageSectionStyle: PageSectionStyleMap.textNimage, imageVAlign: ImageVAlignMap.topOfText })
			Object.keys(pageSection).forEach(field => data[`${field}-${pst}`] = pageSection[field])
		})
	}
	return data
}

export async function createCollection(fields, userId, curatorRole = RolesMap.curator, share = 100) {
	if (userId && fields) {
		if (Object.keys(fields).length === 0) fields.name = ''
		return (await callFunc("createCollection", { fields, userId, curatorRole, share }))?.collectionId
	}
}

export async function updateCollection(collectionId, fields, hasPageSections) {
	const keys = fields ? Object.keys(fields) : []
	if (collectionId && fields && keys.length > 0) {
		let pageSections = []
		if (hasPageSections) {
			keys.forEach(key => {
				const [fieldName, pageSectionType] = key.split('-')
				if (pageSectionType) {
					// eslint-disable-next-line
					let pageSection = pageSections.find(ps => ps.pageSectionType == pageSectionType)
					if (!pageSection) pageSections.push(pageSection = { collectionId, pageSectionType })
					pageSection[fieldName] = fields[key]
					delete fields[key]
				}
			})
		}
		await callFunc("updateCollection", { collectionId, fields, pageSections })
	}
}

export async function createUserCollection(userId, collectionId, roles) {
	if (userId && collectionId && roles) {
		await callFunc("createUserCollection", { userId, collectionId, roles }, { ignoreDup: true })
	}
}

export async function addUserCollectionRoles(userId, collectionId, roles) {
	if (userId && collectionId && roles) {
		await callFunc("addUserCollectionRoles", { userId, collectionId, roles })
	}
}
export async function removeUserCollectionRoles(userId, collectionId, roles) {
	if (userId && collectionId && roles) {
		await callFunc("removeUserCollectionRoles", { userId, collectionId, roles })
	}
}

const defaultPiesInit_manyArtists = [
	{ creatorRoyalties: 100, allPartners: 85, allCreators: 3, creator: 7, owner: 0, allOwners: 3, marketplace: 2, stage: mintStage }, // mint
	{ creatorRoyalties: 10, allPartners: 85, allCreators: 3, creator: 7, owner: 0, allOwners: 3, marketplace: 2, stage: saleStage }, // sale
]
const defaultPiesInit_oneArtist = [
	{ creatorRoyalties: 100, allPartners: 95, allCreators: 0, creator: 0, owner: 0, allOwners: 3, marketplace: 2, stage: mintStage }, // mint
	{ creatorRoyalties: 10, allPartners: 95, allCreators: 0, creator: 0, owner: 0, allOwners: 3, marketplace: 2, stage: saleStage }, // sale
]
export const mintStagePieIndex = 0
export const saleStagePieIndex = 1

export async function loadCollectionPies(collectionId, manyArtists) {
	const defaultPiesInit = manyArtists ? defaultPiesInit_manyArtists : defaultPiesInit_oneArtist
	if (collectionId) {
		const pies = await callFunc("loadCollectionPies", { collectionId })
		if (pies?.length > 0) {
			if (pies.length === 2) {
				return pies
			}
			if (pies.length === 1) {
				const pie = pies[0]
				if (pie.stage === mintStage) {
					return [pie, { ...defaultPiesInit[saleStagePieIndex] }]
				}
				if (pie.stage === saleStage) {
					return [{ ...defaultPiesInit[mintStagePieIndex] }, pie]
				}
				throw new Error("Unexcepted pie.stage: '" + pie.stage + "'")
			}
			throw new Error("Unexcepted count of pies: " + pies.length)
		}
	}
	return [...defaultPiesInit]
}
export async function mergeCollectionPie(collectionId, stage, fields) {
	if (collectionId && stage && fields) {
		await callFunc("mergeCollectionPie", { collectionId, stage, fields })
	}
}

export async function loadCollectionRights(collectionId) {
	const d = collectionId ? (await callFunc("loadCollectionRights", { collectionId })) || {} : {}
	if (!d.rightsType) d.rightsType = RightsTypeMap.cc0
	return d
}

export async function loadCollectionSettings(collectionId) {
	return collectionId ? (await callFunc("loadCollectionSettings", { collectionId })) || {} : {}
}

export async function createTeammate(userId, collectionId, share) {
	return userId && collectionId ? (await callFunc("createTeammate", { userId, collectionId, share }, { ignoreDup: true })) || {} : {}
}

export async function loadTeamForStory(collectionId) {
	return collectionId ? (await callFunc("loadTeamForStory", { collectionId })) || [] : []
}

export async function loadTeamForShares(collectionId, accountAddress) {
	return (await loadTeam(collectionId)).filter(data => data.walletAddress && data.walletAddress !== accountAddress)
}
export async function loadTeam(collectionId) {
	const rows = collectionId ? (await callFunc("loadTeam", { collectionId })) || [] : []
	rows.forEach(row => {
		if (row.publicProfile === null) row.publicProfile = true
	})
	return rows
}
export async function deleteTeammate(userId, collectionId) {
	if (userId && collectionId) {
		await callFunc("deleteTeammate", { userId, collectionId })
	}
}

export async function updatePublicProfile(userId, collectionId, publicProfile) {
	if (userId && collectionId) {
		await callFunc("updatePublicProfile", { userId, collectionId, publicProfile })
	}
}

export async function updateTeamShares(collectionId, teamShares) {
	if (collectionId && teamShares && Object.keys(teamShares).length > 0) {
		await callFunc("updateTeamShares", { collectionId, teamShares })
	}
}

export async function createCreator(userId, collectionId) {
	return userId && collectionId ? (await callFunc("createCreator", { userId, collectionId }, { ignoreDup: true })) || {} : {}
}

export async function loadCreators(collectionId) {
	return collectionId ? (await callFunc("loadCreators", { collectionId, creatorRole: RolesMap.creator })) || [] : []
}

export async function deleteCreator(userId, collectionId) {
	if (userId && collectionId) {
		await callFunc("deleteCreator", { userId, collectionId })
	}
}

export async function createMember(userId, collectionId) {
	return userId && collectionId ? (await callFunc("createMember", { userId, collectionId }, { ignoreDup: true })) || {} : {}
}

export async function loadCommunity(collectionId) {
	return collectionId ? (await callFunc("loadCommunity", { collectionId, roles: RolesMap.invited | RolesMap.owner })) || [] : []
}

export async function deleteMember(userId, collectionId) {
	if (userId && collectionId) {
		await callFunc("deleteMember", { userId, collectionId })
	}
}

export async function checkAllowList(collectionId, userId) {
	const isInAllowList = collectionId && userId ? (await callFunc("checkAllowList", { collectionId, userId })) : false
	return isInAllowList
}

export async function getMintedNFTPerWallet(collectionId, userId) {
	const totalCount = collectionId && userId ? (await callFunc("getMintedNFTPerWallet", { collectionId, userId })) : 0
	return totalCount
}