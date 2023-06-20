import { sendToIPFS, unpinFromIPFS } from '../func/ipfsHttpClient'
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// cloud storage can be emptied anytime - it holds files only temporary until they are pushed to ipfs
const storage = getStorage()

const urlToCID = (url) => url?.split('/').filter(s => !!s).pop().split('?')[0]
const cidToUrl = (cid) => cid ? `https://${process.env.REACT_APP_INFURA_PROJECT_GATEWAY}.infura-ipfs.io/ipfs/${cid.toString()}` : null

export { urlToCID, cidToUrl }

export const uploadToIPFSAsync = async (file, progress) => {
	if (file) {
		const [, ext] = file.type.split('/')
		const storageUrl = `upload/${new Date().getTime().toString()}-${(Math.random() * 1e18).toFixed(0)}.${ext || 'noext'}`
		const storageRef = ref(storage, storageUrl)
		const uploadTask = uploadBytesResumable(storageRef, file)
		return new Promise((resolve, reject) => {
			uploadTask.on('state_changed',
				(snapshot) => {
					if (progress) progress(snapshot.bytesTransferred)
					// const completedPercent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
					// console.log('Upload is ' + completedPercent + '% done')
					// switch (snapshot.state) {
					// 	case 'paused': console.log('Upload is paused'); break
					// 	case 'running': console.log('Upload is running'); break
					// 	default: break
					// }
				},
				(error) => {
					// A full list of error codes is available at
					// https://firebase.google.com/docs/storage/web/handle-errors
					// switch (error.code) {
					// 	case 'storage/unauthorized':
					// 		// User doesn't have permission to access the object
					// 		break
					// 	case 'storage/canceled':
					// 		// User canceled the upload
					// 		break
					// 	case 'storage/unknown':
					// 		// Unknown error occurred, inspect error.serverResponse
					// 		break
					// 	default: break
					// }
					console.error(error)
					reject(error)
				},
				() => {
					getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
						// console.log('File available at', downloadURL)
						const ipfsUrl = await sendToIPFS(downloadURL)
						// console.log("ipfsUrl", ipfsUrl)
						resolve(ipfsUrl)
					}).catch(reject)
				}
			)
		})
	}
}

export const unpinRemovedFiles = async (removedFiles, persistedData) => {
	const cids = []
	const fieldNames = Object.keys(removedFiles || {})
	for (let i = 0; i < fieldNames.length; i++) {
		const fieldName = fieldNames[i]
		const paths = Object.keys(removedFiles[fieldName] || {})
		for (let j = 0; j < paths.length; j++) {
			const path = paths[j]
			if (!persistedData || path !== persistedData[fieldName]) {
				const cid = urlToCID(path)
				cid && cids.push(cid)
			}
		}
	}
	if (cids.length) {
		await unpinFromIPFS(cids)
	}
}

export const getFileRemovedHandler = (name, ipfsPath) => prevRemovedFiles => {
	if (!ipfsPath || (Array.isArray(ipfsPath) && !ipfsPath.length)) {
		return prevRemovedFiles
	}
	const newRemovedFiles = { ...prevRemovedFiles }
	const files = newRemovedFiles[name] || {}
	if (Array.isArray(ipfsPath)) ipfsPath.forEach(p => p && (files[p] = true))
	else files[ipfsPath] = true
	newRemovedFiles[name] = files
	return newRemovedFiles
}
