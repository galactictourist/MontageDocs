import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loading from './prompts/Loading';
import StickyButtonContainer from './parts/StickyButtonContainer';
import { AppControl } from './parts/AppControl';
import { SaveButton } from './parts/SaveButton';
import FormContainer from './parts/FormContainer';
import AuthContext from '../ctx/Auth'
import { loadItem, createItem, updateItem, deleteItem } from '../func/items';
import { loadProps, loadOptions, loadItemOptions, createProp, createOption, mergeItemOptions, deleteOption, deleteProp, updateOption, updateProp } from '../func/props';
import { ItemStatus, itemStatusToText } from '../util/itemStatus';
import { getFileRemovedHandler, unpinRemovedFiles } from "../util/uploadToIPFS";
import { RolesMap } from '../util/roles';
import FontIcon from '../fontIcon/FontIcon';
import MyCollectionContext from '../ctx/MyCollection';
import { toastSaved } from '../util/toasts';
import TextPhrase from './parts/TextPhrase';
import { CardImageSpecs, getOptimizeImgUrl, NFTSpecs } from '../util/optimizedImages';
import { loadCollectionArtists, loadCollectionSettings, loadCurrentItemsCount, updateCollection } from '../func/collections';
import { getTitleWithIconAndTooltip } from '../util/getTitleWithIconAndTooltip';
import { PriceKindFieldLabel, PriceKindFieldName, PriceKinds, PriceKindTooltips } from '../util/nftPrice';
import AppPopup, { PreviewPopup } from './parts/AppPopup';
import DeleteItemsPopUp from './parts/DeleteItemsPopUp';
import ButtonsRow from './parts/ButtonsRow';
import CollectionProgressBarContext from '../ctx/CollectionProgressBarContext';
import { ADDED_NFT_STAGE_IDX } from './parts/CollectionProgressBar';
import { toast } from 'react-toastify';
import last4 from '../util/last4';
import { appConfig } from '../app-config';
import { PriceStyleOptions, PriceStylesMap } from '../util/priceStyle';

export default function MyCollectionItem({ setSidebarState, setCrumbLabel }) {
	const { setProgressStageState } = useContext(CollectionProgressBarContext)
	const { myCollectionRoles, myCollectionName } = useContext(MyCollectionContext)
	const { userId } = useContext(AuthContext)
	const { collectionId, itemId } = useParams()
	const isNewItem = !itemId
	const navigate = useNavigate()
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [savingForPreview, setSavingForPreview] = useState(false)
	const [deleting, setDeleting] = useState(false)
	const [itemData, setItemData] = useState({})
	const [collectionSettings, setCollectionSettings] = useState({})
	const [props, setProps] = useState([])
	const [options, setOptions] = useState([])
	const [itemOptions, setItemOptions] = useState([])
	const [removedFiles, setRemovedFiles] = useState({})
	const [deleteStatus, setDeleteStatus] = useState(false)
	const [propsManagerVisible, setPropsManagerVisible] = useState(false)
	const [previewItemId, setPreviewItemId] = useState(0)
	const [currentItemsCount, setCurrentItemsCount] = useState(0)
	const [addingIsLimited, setAddingIsLimited] = useState(false)
	const [collectionArtistsOptions, setCollectionArtistsOptions] = useState([])

	const isCurator = () => (myCollectionRoles & RolesMap.curator) > 0
	const isCreator = () => (myCollectionRoles & RolesMap.creator) > 0

	useEffect(() => {
		if (isCurator() && isNewItem && collectionId && userId) {
			loadCollectionArtists(collectionId).then((r) => {
				setCollectionArtistsOptions([{ value: userId, text: 'Me' }, ...r.map(a => ({ value: a.userId, text: a.name || last4(a.walletAddress) || a.email || a.userId }))])
			})
		}
		// eslint-disable-next-line
	}, [isNewItem, collectionId, userId])

	useEffect(() => {
		document.querySelector('html').classList.toggle('o-h', propsManagerVisible)
	}, [propsManagerVisible])

	const closePreviewPopup = () => {
		setPreviewItemId(0)
		if (isNewItem) {
			navigate(`/my-collection-item/${collectionId}/${previewItemId}`)
		}
	}

	useEffect(() => {
		if (itemId) {
			setLoading(true)
			loadItem(itemId).then(data => {
				data.bidStartTime = data.bidStartTime?.replace('Z', '')
				data.bidEndTime = data.bidEndTime?.replace('Z', '')
				setItemData(data)
				loadItemOptions(itemId).then(setItemOptions)
			}).finally(() => setLoading(false))
		}
	}, [itemId])

	useEffect(() => {
		if (itemData.name && setCrumbLabel) setCrumbLabel(itemData.name)
	}, [itemData, setCrumbLabel])

	useEffect(() => {
		if (collectionId) {
			loadCollectionSettings(collectionId).then(({ canGrow, maxItems, selfMinted, samePriceForAllNFT, premintPrice, mintPrice, salePrice, defaultItemStatus }) => {
				setCollectionSettings({ canGrow, maxItems, selfMinted, samePriceForAllNFT, premintPrice, mintPrice, salePrice, defaultItemStatus })
				if (!itemId) {
					const initItem = {
						status: isCurator() ? (parseInt(defaultItemStatus) || ItemStatus.approved) : ItemStatus.needApproval,
						priceStyle: PriceStylesMap[appConfig.defaultPriceStyle]
					}
					if (!samePriceForAllNFT) {
						Object.assign(initItem, { premintPrice, mintPrice, salePrice })
					}
					setItemData(initItem)
					if (!canGrow) {
						loadCurrentItemsCount(collectionId).then(setCurrentItemsCount)
					}
				}
			})
			loadOptions(collectionId).then(setOptions)
			loadProps(collectionId).then(setProps)
		}
		// eslint-disable-next-line
	}, [collectionId, itemId])

	const limitedAddingNotice = () => <span className="bad">This collection has reached it's limit of {collectionSettings?.maxItems} items.</span>
	useEffect(() => {
		if (collectionId && collectionSettings && !collectionSettings.canGrow) {
			setAddingIsLimited(currentItemsCount >= collectionSettings.maxItems)
		}
	}, [collectionSettings, collectionId, currentItemsCount])

	useEffect(() => {
		if (setSidebarState) {
			setSidebarState(3)
		}
		// eslint-disable-next-line
	}, [])

	const openDeleteConfirmation = () => setDeleteStatus(true)
	const hideDeleteConfirmation = () => setDeleteStatus(false)
	const handleDelete = async () => {
		setDeleting(true)
		try {
			await deleteItem(itemId)
			hideDeleteConfirmation()
			setDeleting(false)
			navigate(`/my-collection-items/${collectionId}`)
		} catch (e) {
			setDeleting(false)
			throw e
		}
	}

	if (!userId || !collectionId) return null
	if (loading) return <Loading />

	const control = ({ name, data, setData, ...props }) => <AppControl name={name} value={(data || itemData)[name]} setData={setData || setItemData} {...props} />
	const priceControl = (priceKind) => {
		const samePrice = collectionSettings.samePriceForAllNFT
		return control({
			type: "number",
			subtype: "price",
			name: PriceKindFieldName[priceKind],
			data: samePrice ? collectionSettings : itemData,
			setData: samePrice ? setCollectionSettings : setItemData,
			label: getTitleWithIconAndTooltip(`${PriceKindFieldLabel[priceKind]} mint price ${samePrice ? 'of all NFTs' : ''} (eth)`, PriceKindTooltips[priceKind]),
		});
	}
	const onFileRemoved = (name, ipfsPath) => setRemovedFiles(getFileRemovedHandler(name, ipfsPath))
	const postDataToStorage = async (itemId, doPreview) => {
		if (addingIsLimited) {
			toast(limitedAddingNotice())
			return
		}
		if (isCreator() && !isCurator()) {
			if (itemData.status >= ItemStatus.approved) {
				toast("Your item was already approved by the curator")
				return
			}
		}
		// to save priceStyle this needs to be unblocked
		// if (isMyCollectionLive() && itemData.status > ItemStatus.approved) {
		// 	toastLiveCollection()
		// 	return
		// }
		let saved = false
		setSaving(true)
		setSavingForPreview(doPreview)
		try {
			const d = { ...itemData }
			const toJSONDate = (dt) => dt ? new Date(dt).toJSON() : null
			d.bidStartTime = toJSONDate(d.bidStartTime)
			d.bidEndTime = toJSONDate(d.bidEndTime)
			const promises = []
			if (isNewItem) {
				d.collectionId = collectionId
				if (!d.creatorId) d.creatorId = userId
				itemId = await createItem(d)
			} else {
				promises.push(updateItem(itemId, d))
			}
			if (!collectionSettings.samePriceForAllNFT) {
				const cs = {}
				if (collectionSettings.premintPrice === null) cs.premintPrice = itemData.premintPrice
				if (collectionSettings.mintPrice === null) cs.mintPrice = itemData.mintPrice
				if (collectionSettings.salePrice === null) cs.salePrice = itemData.salePrice
				if (Object.keys(cs).length > 0) {
					promises.push(updateCollection(collectionId, cs))
				}
			}
			promises.push(
				mergeItemOptions(itemId, itemOptions.map(io => io.optionId)),
				unpinRemovedFiles(removedFiles, d)
			)
			await Promise.all(promises)
			setRemovedFiles({})

			toastSaved()
			saved = true
		} finally {
			setSaving(false)
			setSavingForPreview(false)
		}

		if (saved) {
			if (doPreview) {
				setPreviewItemId(itemId)
			} else {
				if (isCurator()) {
					setProgressStageState(ADDED_NFT_STAGE_IDX, true)
				}
				navigate(`/my-collection-items/${collectionId}`)
			}
		}
	}

	return (
		<>
			<ButtonsRow doRender={isCurator() && !isNewItem} width600={true}>
				<button className="danger" onClick={openDeleteConfirmation}><FontIcon name="delete" inline={true} />Delete Item</button>
			</ButtonsRow>
			<TextPhrase padTop={true}>{addingIsLimited ? limitedAddingNotice() : `${isNewItem ? "Add" : "Edit"} your NFT`}</TextPhrase>
			<FormContainer>
				<h2>Item details</h2>
				{control({ label: "Add Image, Video, or Audio", name: "file", mimeTypeName: "mimeType", fileNameName: "name", mimeType: itemData?.mimeType, type: "file", accept: {}, onFileRemoved: onFileRemoved, imageSize: NFTSpecs, noRecommendedSize: true })}
				{control({ toggleTitle: "Image is not square", name: "keepAspectRatio", type: "checkbox" })}
				{control({ label: "Name", name: "name", maxLength: 50 })}
				{control({ label: "Item description", name: "desc", type: "textarea", underFieldLabel: "Will be shown in the items detail page" })}

				<h2>NFT Properties & Traits</h2>
				<OptionsPicker collectionId={collectionId}
					props={props} setProps={setProps}
					options={options} setOptions={setOptions}
					selectedOptions={itemOptions} setSelectedOptions={setItemOptions}
					setPropsManagerVisible={setPropsManagerVisible}
				/>

				{collectionSettings.samePriceForAllNFT || collectionSettings.selfMinted ? null :
					appConfig.offers ?
						<>
							<h2>Prices, offers & auctions</h2>
							{control({ type: "select", name: "priceStyle", options: PriceStyleOptions })}
							{(itemData.priceStyle & PriceStylesMap.prices) > 0 ?
								<>
									{priceControl(PriceKinds.Premint)}
									{priceControl(PriceKinds.Mint)}
								</>
								: null}
							{(itemData.priceStyle & PriceStylesMap.offers) > 0 ?
								<>
									{control({ label: "Minimum offer (eth)", name: "offerMinPrice", type: "number", subtype: "price" })}
									{/* {control({ toggleTitle: <>Reject offer automatically<br />if a higher one is waiting</>, name: "autoRejectLowerOffers", type: "checkbox" })} */}
									{control({ type: "select", name: "acceptCasualOffers", options: [{ value: false, text: "Allow ETH and WETH offers" }, { value: true, text: "Allow no commitment offers" }] })}
								</>
								: null}
							{(itemData.priceStyle & PriceStylesMap.bids) > 0 ?
								<>
									{control({ label: "Minimum bid (eth)", name: "bidMinPrice", type: "number", subtype: "price" })}
									{control({ label: "Starting", name: "bidStartTime", type: "datetime-local" })}
									{control({ label: "Ending", name: "bidEndTime", type: "datetime-local" })}
									{control({ type: "select", name: "acceptCasualBids", options: [{ value: false, text: "Allow ETH and WETH bids" }, { value: true, text: "Allow no commitment bids" }] })}
								</>
								: null}
						</>
						:
						<>
							<h2>Price</h2>
							{priceControl(PriceKinds.Premint)}
							{priceControl(PriceKinds.Mint)}
						</>
				}

				{isCurator() && isNewItem && control({ label: "Created by", name: "creatorId", type: "select", options: collectionArtistsOptions })}
				{isCurator() && (isNewItem || itemData.status <= ItemStatus.approved) && control({
					label: "NFT status", name: "status", type: "select", options: [
						{ text: "Choose...", value: 0 },
						{ text: itemStatusToText(ItemStatus.needApproval), value: ItemStatus.needApproval },
						{ text: itemStatusToText(ItemStatus.approved), value: ItemStatus.approved },
					]
				})}
			</FormContainer>
			<StickyButtonContainer>
				<SaveButton className="secondary" onClick={() => postDataToStorage(itemId, true)} saving={saving && savingForPreview} disabled={saving} text="Update & preview" />
				<SaveButton onClick={() => postDataToStorage(itemId)} saving={saving && !savingForPreview} disabled={saving} text="Update" />
			</StickyButtonContainer>

			<AppPopup visible={propsManagerVisible} setVisible={setPropsManagerVisible} insideCls="props-manager">
				<PropsManager props={props} setProps={setProps} options={options} setOptions={setOptions} collectionId={collectionId} setPropsManagerVisible={setPropsManagerVisible} />
			</AppPopup>
			<PreviewPopup
				visible={collectionId > 0 && previewItemId > 0}
				setVisible={closePreviewPopup}
				iframeSrc={collectionId > 0 && previewItemId > 0 ? `/collection-item-preview/${collectionId}/${previewItemId}` : null}
			/>
			<AppPopup visible={deleteStatus} setVisible={hideDeleteConfirmation} insideCls="delete-items-popup">
				<DeleteItemsPopUp
					list={[itemData]}
					onClick={handleDelete}
					onCancel={hideDeleteConfirmation}
					deleting={deleting}
					deleteWhat={<span><b>{itemData.name || `#${itemId}`}</b> of <b>{myCollectionName || 'my collection'}</b></span>}
					srcKey="file"
					getCachedSrc={itemData => getOptimizeImgUrl(itemData.file, CardImageSpecs, itemData.mimeType)}
				/>
			</AppPopup>
		</>
	)
}
function OptionsPicker({ props, options, selectedOptions, setSelectedOptions, setPropsManagerVisible }) {
	const showExample = !props || props.length === 0
	// eslint-disable-next-line
	const propOptions = (propId) => options.filter((o) => o.propId == propId).map(({ optionId, name }) => ({ value: optionId, text: name }))
	const propOptionsWithDefault = (propId) => [{ value: '', text: 'Choose...' }, ...propOptions(propId)]
	const getSelectedOptionIx = (propId) => {
		const po = propOptions(propId)
		// eslint-disable-next-line
		return selectedOptions.findIndex(so => po.findIndex(o => o.value == so.optionId) > -1)
	}
	const getValue = (propId) => {
		const ix = getSelectedOptionIx(propId)
		return ix > -1 ? selectedOptions[ix].optionId : ''
	}
	const setSelectedOption = (propId, optionId) => {
		setSelectedOptions(selectedOptions => {
			const ix = getSelectedOptionIx(propId)
			if (ix > -1) {
				if (optionId) {
					selectedOptions[ix] = { optionId }
					return [...selectedOptions]
				}
				selectedOptions.splice(ix, 1)
				return [...selectedOptions]
			}
			return optionId ? [...selectedOptions, { optionId }] : [...selectedOptions]
		})
	}

	return (<>
		{showExample ? <div style={{ marginTop: '-1em' }}>To add properties and traits to your NFT, click "MANAGE PROPERTIES"</div> : props.map(({ propId, name }) => {
			return <AppControl key={propId} type="select"
				value={getValue(propId)}
				setValue={(optionId) => setSelectedOption(propId, optionId)}
				label={name}
				options={propOptionsWithDefault(propId)}
			/>;
		})}
		<button className="secondary" onClick={() => setPropsManagerVisible(true)}>Manage properties</button>
	</>)
}
function PropsManager({ props, setProps, options, setOptions, collectionId, setPropsManagerVisible }) {
	const [saving, setSaving] = useState(false)
	const propsCount = props?.length || 0
	return (
		<div className="props-manager flex-column">
			<TextPhrase isMain={true} padTop={true}>Add, edit or remove properties and traits under each property</TextPhrase>
			<div className="flex-column pt-2 mx-auto" style={{ maxWidth: 400, rowGap: '1em' }}>
				{props?.map(({ propId, name }, idx) => <PropManager key={idx} setSaving={setSaving} propIdx={idx} propId={propId} propName={name} setProps={setProps} options={options} setOptions={setOptions} collectionId={collectionId} propsCount={propsCount} />)}
				<PropManager key={propsCount} setSaving={setSaving} propIdx={propsCount} propId={0} propName="" setProps={setProps} options={options} setOptions={setOptions} collectionId={collectionId} propsCount={propsCount} />
			</div>
			<StickyButtonContainer>
				<button className="secondary" disabled={saving} onClick={() => setPropsManagerVisible(false)} text="Close">Close</button>
				<SaveButton disabled={saving} saving={saving} text={saving ? "Updating" : "Update"} />
			</StickyButtonContainer>
		</div>
	)
}
function PropManager({ propIdx, propId, propName, setProps, options, setOptions, collectionId, propsCount, setSaving }) {
	// eslint-disable-next-line
	const isNew = propsCount == propIdx
	const optionsCount = options?.length || 0

	const setPropName = (name) => {
		if (name) {
			if (isNew) {
				setSaving(true)
				createProp(collectionId, name).then(propId => {
					setProps(props => [...props, { name, propId }])
					setSaving(false)
				})
			} else {
				setSaving(true)
				updateProp(propId, name).then(() => setSaving(false))
				setProps(props => {
					const p = [...props]
					p[propIdx].name = name
					return p
				})
			}
		}
	}
	const delProp = () => {
		if (isNew) return
		setSaving(true)
		deleteProp(propId).then(() => setSaving(false))
		setProps(props => {
			const p = [...props]
			p.splice(propIdx, 1)
			return p
		})
		setOptions(options => [...options.filter(o => o.propId !== propId)])
	}
	return (<>
		<div className="flex-row ai-c" style={{ flex: 1, columnGap: 16 }}>
			<ClickToEditAppControl value={propName} setValue={setPropName} placeholder="Add property..." />
			<div style={{ width: 24 }}>
				{!isNew && <FontIcon name="delete" onClick={delProp} style={{ cursor: 'pointer', fontSize: 24 }} />}
			</div>
		</div>
		{!isNew && <div className="flex-column" style={{ paddingLeft: 80, rowGap: '1em' }}>
			{options?.map((o, idx) => o.propId === propId ? <OptionManager key={idx} setSaving={setSaving} optionIdx={idx} optionId={o.optionId} optionName={o.name} setOptions={setOptions} propId={propId} optionsCount={optionsCount} /> : null)}
			<OptionManager key={optionsCount} setSaving={setSaving} optionIdx={optionsCount} optionId={0} optionName="" setOptions={setOptions} propId={propId} optionsCount={optionsCount} />
		</div>}
	</>)
}
function OptionManager({ optionIdx, optionId, optionName, setOptions, propId, optionsCount, setSaving }) {
	// eslint-disable-next-line
	const isNew = optionIdx == optionsCount
	const setOptionName = (name) => {
		if (name) {
			if (isNew) {
				setSaving(true)
				createOption(propId, name).then(optionId => {
					setOptions(options => [...options, { optionId, name, propId }]);
					setSaving(false)
				})
			} else {
				setSaving(true)
				updateOption(optionId, name).then(() => setSaving(false))
				setOptions(options => {
					const o = [...options]
					o[optionIdx].name = name
					return o
				})
			}
		}
	}
	const delOption = () => {
		if (isNew) return
		setSaving(true)
		deleteOption(optionId).then(() => setSaving(false))
		setOptions(options => {
			const o = [...options]
			o.splice(optionIdx, 1)
			return o
		})
	}
	return (
		<div className="flex-row ai-c" style={{ columnGap: 16 }}>
			<ClickToEditAppControl value={optionName} setValue={setOptionName} placeholder="Add trait..." />
			<div style={{ width: 24 }}>
				{!isNew && <FontIcon name="delete" onClick={delOption} style={{ cursor: 'pointer', fontSize: 24 }} />}
			</div>
		</div>
	)
}
function ClickToEditAppControl({ value, setValue, placeholder, maxLength = 100 }) {
	const [editing, setEditing] = useState(false)
	const [tempValue, setTempValue] = useState('')
	const startEditing = () => {
		if (!editing) {
			setTempValue(value)
			setEditing(true)
		}
	}
	const endEditing = () => {
		if (value !== tempValue) setValue(tempValue)
		setEditing(false)
	}
	return (
		<div className="app-control app-control-text flex-row" style={{ flex: 1 }}>
			<input maxLength={maxLength} onFocus={startEditing} onBlur={endEditing} onKeyUp={e => e.key === "Enter" ? endEditing() : 0} placeholder={placeholder} onChange={e => setTempValue(e.target.value)} value={editing ? tempValue : value} />
		</div>
	)
}