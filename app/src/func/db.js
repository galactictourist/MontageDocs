import callFunc from "./callFunc";

export async function getNVarcharLimits(tableName) {
	const rs = tableName ? (await callFunc("getNVarcharLimits", { tableName })) || [] : []
	const map = {}
	rs.forEach(({ COLUMN_NAME, CHARACTER_MAXIMUM_LENGTH }) => map[COLUMN_NAME] = CHARACTER_MAXIMUM_LENGTH)
	return map
}