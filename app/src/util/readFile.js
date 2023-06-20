
export default function readFileAsText(file) {
	return new Promise((resolve, reject) => {
		const r = new FileReader()
		r.onload = () => resolve(r.result)
		r.onerror = reject
		r.readAsText(file)
	})
}

export function readFileAsDataURL(file) {
	return new Promise((resolve, reject) => {
		const r = new FileReader()
		r.onload = () => resolve(r.result)
		r.onerror = reject
		r.readAsDataURL(file)
	})
}