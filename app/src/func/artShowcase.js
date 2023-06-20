import callFunc from "./callFunc";

export async function updateArtShowcase(collectionId, arts) {
	if (collectionId) {
		await callFunc("updateArtShowcase", { collectionId, arts })
	}
}

export async function loadArtShowcase(collectionId) {
	return collectionId ? (await callFunc("loadArtShowcase", { collectionId })) || [] : []
}