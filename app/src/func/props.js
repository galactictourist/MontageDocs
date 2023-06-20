import callFunc from './callFunc'

export async function loadProps(collectionId) {
	return collectionId ? (await callFunc("loadProps", { collectionId })) || [] : []
}

export async function loadOptions(collectionId) {
	return collectionId ? (await callFunc("loadOptions", { collectionId })) || [] : []
}

export async function loadItemOptions(itemId) {
	return itemId ? (await callFunc("loadItemOptions", { itemId })) || [] : []
}

export async function createProp(collectionId, name) {
	return collectionId && name ? (await callFunc("createProp", { collectionId, name }))?.propId || 0 : 0
}

export async function createOption(propId, name) {
	return propId && name ? (await callFunc("createOption", { propId, name }))?.optionId || 0 : 0
}

export async function mergeItemOptions(itemId, optionIds) {
	itemId && (await callFunc("mergeItemOptions", { itemId, optionIds }))
}

export async function deleteOption(optionId) {
	optionId && (await callFunc("deleteOption", { optionId }))
}

export async function deleteProp(propId) {
	propId && (await callFunc("deleteProp", { propId }))
}

export async function updateProp(propId, name) {
	propId && name && (await callFunc("updateProp", { propId, name }))
}

export async function updateOption(optionId, name) {
	optionId && name && (await callFunc("updateOption", { optionId, name }))
}