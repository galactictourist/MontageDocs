import { useEffect, useMemo, useState } from 'react'
import { uploadToIPFSAsync, urlToCID } from '../../util/uploadToIPFS'
import './appControl.scss'
import FileDropzone from './FileDropzone'
import FontIcon from '../../fontIcon/FontIcon'
import YoutubePlayer from './YoutubePlayer'
import { getOptimizeImgUrl, imageSizeSpec, getThumbImageSpecs } from '../../util/optimizedImages'
import { isImage } from '../../util/mimeTypes'
import { loadOriginalImage, saveOriginalImage } from '../../func/originalImages'

const getFileNameWithoutExt = (name) => name?.split('.').slice(0, -1).join('.') || name
export function AppControl({ value, setData, label, appendAfterLabel, name, mimeTypeName, mimeType, fileNameName, id, type, subtype, readOnly, placeholder, onFileRemoved, options, numTypeLabel, disabled, toggleTitle, noLabel, renderMainLabelOverride, rowIdx, setValue, moreChange, numberBoxStyle, borderedNumberBox, isVideoUrl, imageSize, accept, noRecommendedSize, underFieldLabel, onChange, style, inputStyle, inputPrefix, inputPostix, noSpinners, renderDropzone, min, max, fieldOverlay, doRender = true, validationMsg, ...rest }) {
	if (!type) type = "text"
	if (!moreChange) moreChange = row => row
	const isColor = type === "color"
	const isText = type === "text"
	const isSelect = type === "select"
	const isChips = type === "chips"
	const isTextarea = type === "textarea"
	const isNumber = type === "number"
	const isPrice = isNumber && subtype === "price"
	const isPercent = isNumber && subtype === "percent"
	const isFile = type === "file"
	const isCheckbox = type === "checkbox"
	const isRadio = type === "radio"
	const isCheckable = isCheckbox || isRadio
	const defNumberValue = isNumber && isNaN(value) ? '' : (value || (isNumber && value === 0 ? 0 : ''))
	const isReadOnlyOrDisabled = readOnly || disabled
	const defValueProp = !isReadOnlyOrDisabled ? {} : isCheckable ? { defaultChecked: !!value } : isNumber ? { defaultValue: value || defNumberValue } : isColor ? { defaultValue: value || '#000000' } : { defaultValue: value || '' }
	const valueProp = isReadOnlyOrDisabled ? {} : isCheckable ? { checked: !!value } : isNumber ? { value: value || defNumberValue } : isColor ? { value: value || '#000000' } : { value: value || '' }
	const defaultPlaceholder = isNumber ? "" : "Start typing ..."
	const placeholderProp = isText || isTextarea || isNumber ? { placeholder: placeholder || defaultPlaceholder } : {}
	const htmlFor = isCheckable ? `id-${id || ''}-${name || ''}-${rowIdx || ''}-${new Date().getTime().toString()}` : null
	const htmlForProp = htmlFor ? { id: htmlFor } : {}
	const changeHandler = isReadOnlyOrDisabled ? undefined : (onChange || getSetDataFromControl(setData, rowIdx, setValue, moreChange))
	const commonInputProps = {
		name,
		id,
		disabled,
		readOnly,
		onChange: changeHandler,
		...placeholderProp,
		...defValueProp,
		...valueProp,
		...rest
	}
	const step = isPrice ? 1e-4 : isPercent ? 0.1 : 1
	const minNum = isNumber ? min || 0 : undefined
	const maxNum = isPercent ? 100 : max
	if (isNumber) {
		Object.assign(commonInputProps, { min: minNum, max: maxNum, step: isPrice || isPercent ? step : "any" }) // step=any to prevent :invalid on decimals
	}

	const [isUploading, setIsUploading] = useState(false)
	const [bytesReceived, setBytesReceived] = useState(0)
	const [totalBytes, setTotalBytes] = useState(0)
	const initFile = useMemo(() => isFile && value ? {
		name: urlToCID(value),
		previewUrl: getOptimizeImgUrl(value, getThumbImageSpecs(imageSize), mimeType),
		ipfsPath: value,
		type: mimeType
		// eslint-disable-next-line
	} : null, [mimeType, value])
	const [theFile, setTheFile] = useState(initFile)

	useEffect(() => {
		const f = theFile
		if (f && f.originalUrl === undefined && f.name && isImage(f.type)) {
			loadOriginalImage(f.ipfsPath).then(originalUrl => {
				setTheFile(file => ({ ...file, originalUrl: originalUrl || null }))
			})
		}
	}, [theFile])

	const uploadFile = async (aFile) => {
		if (!aFile) return null
		setTotalBytes(aFile.size)
		return await uploadToIPFSAsync(aFile, setBytesReceived)
	}

	const acceptFile = async (aFile, anOriginalFile) => {
		setIsUploading(true)
		try {
			const { type: aMimeType } = aFile
			const ipfsPath = await uploadFile(aFile)

			if (setValue) setValue(ipfsPath)
			else {
				setData(data => {
					const d = ({ ...data, [name]: ipfsPath })
					if (mimeTypeName) d[mimeTypeName] = aMimeType
					if (fileNameName) d[fileNameName] = getFileNameWithoutExt(aFile.name)
					return d
				})
			}

			const theFile = {
				name: aFile.name,
				previewUrl: getOptimizeImgUrl(ipfsPath, getThumbImageSpecs(imageSize), aMimeType),
				ipfsPath,
				type: aMimeType,
				originalUrl: anOriginalFile?.originalUrl || (await uploadFile(anOriginalFile))
			}
			await saveOriginalImage(ipfsPath, theFile.originalUrl)

			setTheFile(theFile)
		} finally {
			setIsUploading(false)
		}
	}

	if (isFile) {
		if (!name && !setValue) throw Error("Missing name in file AppControl")
		return <FileDropzone
			disabled={disabled}
			isUploading={isUploading}
			bytesReceived={bytesReceived}
			totalBytes={totalBytes}
			onFileAccepted={acceptFile}
			onFileRemoved={(file) => {
				setTheFile(null)
				if (setValue) setValue('')
				else setData(prevData => ({ ...prevData, [name]: '' }))
				if (onFileRemoved) onFileRemoved(name, [file.ipfsPath, file.originalUrl])
			}}
			inputName={name}
			label={label + (imageSize && !noRecommendedSize ? ` ${imageSizeSpec(imageSize)}` : '')}
			theFile={theFile}
			imageSize={imageSize}
			accept={accept}
			renderDropzone={renderDropzone}
		/>
	}

	const handleSpinNumber = e => {
		const { step } = e.target.dataset
		let val = (value || 0) + parseFloat(step)
		if (isPrice) val = Math.round(val * 1e4) / 1e4
		else if (isPercent) val = Math.round(val * 10) / 10
		if ((minNum === undefined || val >= minNum) && (maxNum === undefined || val <= maxNum)) {
			if (setValue) {
				setValue(moreChange(val))
			} else {
				if (!name) throw Error("Missing name in number AppControl")
				setData(prev => {
					if (Array.isArray(prev)) {
						if (rowIdx >= 0) {
							const rows = [...prev]
							const row = rows[rowIdx]
							rows[rowIdx] = moreChange({ ...row, [name]: val })
							return rows
						} else {
							throw new Error("Missing rowIdx")
						}
					}
					return moreChange({ ...prev, [name]: val })
				})
			}
		}
		e.stopPropagation()
	}
	const chooseNumTypeLabel = () => {
		switch (subtype) {
			case "percent": return numTypeLabel || "Choose percentage"
			case "price": return numTypeLabel || "Choose amount"
			default: return numTypeLabel || "Choose number"
		}
	}

	const onChipClick = (chipValue) => {
		if (isReadOnlyOrDisabled) return
		changeHandler({ target: { name, value: chipValue, type } })
	}

	if (!doRender) return null

	return (
		<div className={`app-control app-control-${type} ${subtype || ''}${fieldOverlay ? ' has-field-overlay' : ''}`} disabled={disabled} style={style}>
			{label && (!noLabel || renderMainLabelOverride) ? <label>{label}{appendAfterLabel && appendAfterLabel()}</label> : null}
			{!isTextarea && !isNumber && !isSelect && !isCheckable && !isChips && <input type={type} {...commonInputProps} />}
			{isNumber && (
				<div className={"number-box" + (borderedNumberBox ? " bordered-box" : "")} style={numberBoxStyle}>
					{inputPrefix}
					{!noLabel ? <label>{chooseNumTypeLabel()}</label> : null}
					{!noSpinners && <FontIcon name="minus-outline" moreCls="spin-button" tabIndex={0} data-step={-step} onClick={handleSpinNumber} />}
					<input type="number" {...commonInputProps} onClick={e => e.stopPropagation()} style={inputStyle} />
					{!noSpinners && <FontIcon name="plus-outline" moreCls="spin-button" tabIndex={0} data-step={step} onClick={handleSpinNumber} />}
					{inputPostix}
				</div>
			)}
			{isCheckable && (
				<div className="checkbox-box">
					<label className="toggle-title" htmlFor={htmlFor}>{toggleTitle}</label>
					<input type={type} {...commonInputProps} {...htmlForProp} />
					<label className="toggle" htmlFor={htmlFor}></label>
				</div>
			)}
			{isTextarea && <textarea {...commonInputProps} />}
			{isSelect && <select {...commonInputProps}>{options?.map((o, idx) => <option key={idx} value={o.value} disabled={o.disabled}>{o.text}</option>)}</select>}
			{isChips && <div className="chips">{options?.map((o, idx) => <Chip key={idx} onClick={() => onChipClick(o.value)} value={o.value} selected={o.value.toString() === value?.toString()} text={o.text} icons={o.icons} disabled={o.disabled} />)}</div>}
			{underFieldLabel && <label>{underFieldLabel}</label>}
			{validationMsg && <label className="validation-msg">{validationMsg}</label>}
			{isText && <YoutubePlayer str={value} />}
			{fieldOverlay ? <span className="field-overlay-ct">{fieldOverlay}</span> : null}
		</div>
	)
}

function getSetDataFromControl(setData, rowIdx, setValue, moreChange) {
	return (e) => {
		const { name, value, type, checked } = e.target
		const getTypedValue = () => type === "number" ? (value !== '' ? parseFloat(value) : null) : type === "checkbox" || type === "radio" ? checked : value

		switch (type) {
			case "number":
			case "text":
			case "password":
			case "textarea":
			case "checkbox":
			case "radio":
			case "select-one":
			case "datetime-local":
			case "color":
			case "chips":
				if (setValue) {
					setValue(getTypedValue())
				} else {
					if (!name) throw new Error("Can not setData of AppControl without name")
					setData(prev => {
						if (Array.isArray(prev)) {
							if (rowIdx >= 0) {
								const rows = [...prev]
								const row = rows[rowIdx]
								rows[rowIdx] = moreChange({ ...row, [name]: getTypedValue() })
								return rows
							} else {
								throw new Error("Missing rowIdx")
							}
						}
						return moreChange({ ...prev, [name]: getTypedValue() })
					})
				}
				break
			default:
				break
		}
	}
}

function Chip({ value, text, icons, disabled, selected, onClick }) {
	return (<div className={"chip" + (selected ? " selected" : "")} disabled={disabled} onClick={onClick}>
		<div className="chip-icons">{icons?.map(name => typeof (name) === "string" ? <FontIcon key={name} name={name} inline={true} /> : <span className="chip-icons chip-icons--col" key={name.join('-')}>{name.map(vname => <FontIcon key={vname} name={vname} inline={true} />)}</span>)}</div>
		<div className="chip-text">{text}</div>
	</div>)
}