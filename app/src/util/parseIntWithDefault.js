export function parseIntWithDefault(s, base, def) {
	const int = parseInt(s, base);
	return isNaN(int) || s !== int.toString() ? def : int;
}
