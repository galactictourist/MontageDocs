export const RolesMap = {
	curator: 1,
	partner: 2,
	creator: 4,
	buyer: 8,
	follower: 16,
	invited: 32,
	owner: 64
}

export const isTeam = roles => (roles & (RolesMap.curator | RolesMap.partner)) > 0
export const mayAddItem = roles => (roles & (RolesMap.curator | RolesMap.creator)) > 0

export const DefaultRole = RolesMap.buyer

export const Roles = [
	RolesMap.curator,
	RolesMap.partner,
	RolesMap.creator,
	RolesMap.buyer,
	RolesMap.follower,
	RolesMap.invited,
	RolesMap.owner,
]

const IndefiniteArticleOf = {
	[RolesMap.curator]: 'a',
	[RolesMap.partner]: 'a',
	[RolesMap.creator]: 'an',
	[RolesMap.buyer]: 'a',
	[RolesMap.follower]: 'a',
	[RolesMap.invited]: '',
	[RolesMap.owner]: 'an'
}

export function rolesToText(roles) {
	const allRoles = Object.keys(RolesMap)
	const texts = []
	let firstRole
	for (let i = 0; i < allRoles.length; i++) {
		const role = RolesMap[allRoles[i]]
		if (role === RolesMap.follower) continue
		if ((roles & role) > 0) {
			const roleText = roleToText(role)
			texts.push(roleText)
			if (!firstRole) firstRole = role
		}
	}
	return texts.length > 0 ? ['I am', IndefiniteArticleOf[firstRole], texts.join(', ')].join(' ') : ''
}

export function roleToText(role) {
	switch (role) {
		case RolesMap.curator: return 'Curator'
		case RolesMap.partner: return 'Teammate'
		case RolesMap.creator: return 'Artist'
		case RolesMap.buyer: return 'Buyer'
		case RolesMap.follower: return 'Follower'
		case RolesMap.invited: return 'Invited'
		case RolesMap.owner: return 'Owner'
		default: return role
	}
}