import '../css/progress.scss';
import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StickyButtonContainer from './parts/StickyButtonContainer';
import { SaveButton } from './parts/SaveButton';
import FormContainer from './parts/FormContainer';
import AuthContext from '../ctx/Auth'
import { ItemStatus } from '../util/itemStatus';
import readFileAsText from '../util/readFile';
import { uploadToIPFSAsync } from '../util/uploadToIPFS';
import { createItem } from '../func/items';
import { toast } from 'react-toastify';
import { createOption, createProp, loadOptions, loadProps, mergeItemOptions } from '../func/props';
import TextPhrase from './parts/TextPhrase';
import AppPopup from './parts/AppPopup';

export default function MyCollectionAddBatchItems({ setSidebarState }) {
	const { userId } = useContext(AuthContext)
	const { collectionId } = useParams()
	const [uploading, setUploading] = useState(false)
	const [finishedUpload, setFinishedUpload] = useState(false)
	const [filesCount, setFilesCount] = useState(0)
	const [uploadedCount, setUploadedCount] = useState(0)
	const dir = useRef(null)
	const naviate = useNavigate()

	const postDataToStorage = async () => {
		const files = dir.current?.files
		if (!files) return
		setUploading(true)
		try {
			let pairs = {}
			let metadataTmp = []
			let tmp = [];
			setUploadedCount(0)
			for (let i = 0; i < files.length; i++) {
				const file = files[i]
				const name = file.name
				const spl = name.split('.')
				const fileName = spl[0]
				const ext = spl[1]
				if (ext === 'json') {
					metadataTmp = JSON.parse(await readFileAsText(file))
				}
				else if (ext === 'csv') {
					const metadataTmp1 = await readFileAsText(file)
					var arr = metadataTmp1.toString().split('\r')
					let header = arr[0].split(',')
					for (let i = 1; i < arr.length - 1; i++) {
						let obj = {};
						let content = arr[i].split(',')
						for (let j = 0; j < header.length; j++) {
							console.log(content[j])
							if (content[j].length !== 0) {
								obj[header[j]] = content[j]
							}
						}
						metadataTmp.push(obj)
					}
				}
				else {
					const pair = pairs[fileName] || {}
					pair.image = file
					pairs[fileName] = pair
				}
			}
			let cnt = 0;
			console.log("===========", pairs)
			for (let fileName in pairs) {
				pairs[fileName].metadata = metadataTmp[cnt];
				tmp.push({
					tokenId: fileName,
					...metadataTmp[cnt]
				})
				cnt++;
			}

			const props = await loadProps(collectionId)
			const propsByName = {}
			props.forEach(p => propsByName[p.name] = p)

			const options = await loadOptions(collectionId)
			const optionsByName = {}
			options.forEach(o => {
				const m = optionsByName[o.propId] || {}
				m[o.name] = o
				optionsByName[o.propId] = m
			})

			let tokenCount = 0
			for (let fileName in pairs) {
				let { image, metadata } = pairs[fileName]
				if (!metadata) {
					metadata = { name: image.name.split('.')[0], description: '' }
				}
				const imageUrl = await uploadToIPFSAsync(image)

				console.log('imageurl', imageUrl, metadata)

				const d = {
					collectionId,
					status: ItemStatus.approved,
					file: imageUrl,
					name: metadata.name,
					desc: metadata.description,
					creatorId: userId
				}
				metadata.image = imageUrl
				tmp[tokenCount].image = imageUrl
				const itemId = await createItem(d)

				const { attributes: attrs } = metadata
				if (attrs?.length) {
					const optionIds = []
					for (let i = 0; i < attrs.length; i++) {
						const { trait_type: propName, value: optionName } = attrs[i]
						let p = propsByName[propName]
						if (!p) {
							const propId = await createProp(collectionId, propName)
							p = { name: propName, propId }
							propsByName[propName] = p
						}
						let m = optionsByName[p.propId] || {}
						let o = m[optionName]
						if (!o) {
							const optionId = await createOption(p.propId, optionName)
							o = { name: optionName, optionId, propId: p.propId }
							m[optionName] = o
							optionsByName[p.propId] = m
						}
						optionIds.push(o.optionId)
					}
					await mergeItemOptions(itemId, optionIds)
				}
				tokenCount++
				setUploadedCount(tokenCount)
			}

			toast('Done adding batch!')
			setFinishedUpload(true)
		} finally {
			setUploading(false)
		}
	}
	const clickOnDir = () => dir.current?.click()

	useEffect(() => {
		if (setSidebarState) {
			setSidebarState(3)
		}
		// eslint-disable-next-line
	}, [])

	if (!userId || !collectionId) return null

	const addAnotherBatch = () => {
		if (dir.current) dir.current.value = ''
		setFilesCount(0)
		setFinishedUpload(false)
	}
	const nextStep = () => {
		naviate(`/my-collection-items/${collectionId}`)
	}

	if (finishedUpload) {
		return (<>
			<TextPhrase padTop5={true} isMain={true}>Upload is complete</TextPhrase>
			<StickyButtonContainer>
				<button className="secondary" onClick={addAnotherBatch}>Add another batch</button>
				<button className="primary" onClick={nextStep}>Continue</button>
			</StickyButtonContainer>
		</>)
	}
	return (
		<>
			<TextPhrase padTop={true}>Add your NFTs in batches</TextPhrase>
			<TextPhrase padTop={false} isMain={false}>You can either upload an entire directory of images and metadata<br />Or contact us and we'll do it for you</TextPhrase>
			<TextPhrase padTop={true}>Requirements</TextPhrase>
			<TextPhrase padTop={false} isMain={false}>Files must contain ONE .json file with metadata. The json must have a name field, which defines the name of the NFT. Asset names must be sequential 0,1,2,3...n.[extension]. It doesn't matter at what number you begin. (Example: 131.png, 132.png).</TextPhrase>
			<FormContainer>
				<div className="app-control app-control-dir" disabled={uploading}>
					<label>Select folder with nft images and/or metadata</label>
					<div className="dir-box" onClick={clickOnDir}>
						<label>{filesCount > 0 ? `${filesCount} files selected` : "Select folder"}</label>
						<input type="file" ref={dir} webkitdirectory="" directory="" multiple="" onChange={e => setFilesCount(e.target.files?.length || 0)} disabled={uploading} />
					</div>
					{filesCount > 0 && <progress min={0} max={filesCount} value={uploadedCount} style={{ width: '100%' }}></progress>}
				</div>
			</FormContainer>
			<TextPhrase padTop={true} isMain={false}>
				* Compatible with art produced by these NFT generators:<br />swiftnft.io, nfthost.app, bueno.art, niftygenerator.xyz, nft-generator.art, nft-inator.com
			</TextPhrase>
			<StickyButtonContainer>
				<SaveButton onClick={postDataToStorage} saving={uploading} text="Start uploading" disabled={filesCount === 0} />
			</StickyButtonContainer>
			<AppPopup visible={uploading} setVisible={() => { }}>
				<TextPhrase isMain={true} style={{ color: 'white', fontSize: 48 }}>To allow the upload to finish<br />keep the tab open</TextPhrase>
			</AppPopup>
		</>
	)
}