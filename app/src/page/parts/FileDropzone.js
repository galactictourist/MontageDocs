import '../../css/progress.scss'
import './fileDropzone.scss'
import { useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone'
import FontIcon from '../../fontIcon/FontIcon';
import { isGifImage, isImage, isVideo } from '../../util/mimeTypes';
import Spinner from '../../util/Spinner';
import { toast } from 'react-toastify';
import { readFileAsDataURL } from '../../util/readFile';

export default function FileDropzone({ accept, mimeType = 'image/*', onFileAccepted, onFileRemoved, inputName, label, isUploading, bytesReceived, totalBytes, theFile, disabled, imageSize, renderDropzone = true }) {
	const [Cropper, setCropper] = useState(null)
	useEffect(() => {
		import('cropperjs/dist/cropper.css')
		import('react-cropper').then(({ Cropper }) => setCropper(Cropper))
	}, [])
	const [droppedFile, setDroppedFile] = useState(null)
	const [croppedImage, setCroppedImage] = useState(null)
	const [croppedImageLoaded, setCroppedImageLoaded] = useState(false)
	const cropperRef = useRef(null)
	const [autoAcceptCroppedImage, setAutoAcceptCroppedImage] = useState(true)

	useEffect(() => { setCroppedImageLoaded(false) }, [croppedImage])

	const needsCropping = (type) => imageSize && isImage(type) && !isGifImage(type)

	const { getRootProps, getInputProps } = useDropzone({
		accept: accept || { [mimeType]: [] },
		onDrop: async ([aFile]) => {
			if (!aFile) {
				if (mimeType) toast(`This is not an ${mimeType.split('/')[0]} file`)
				return
			}
			setDroppedFile(aFile)
			if (needsCropping(aFile.type)) {
				setAutoAcceptCroppedImage(true)
				readFileAsDataURL(aFile).then(setCroppedImage)
			} else {
				if (onFileAccepted) onFileAccepted(aFile)
			}
		},
		maxFiles: 1
	})

	const acceptCroppedImage = (aFile) => {
		const { name, type } = aFile
		cropperRef?.current?.cropper?.getCroppedCanvas({ ...imageSize }).toBlob((blob) => {
			const croppedFile = new File([blob], name, { type })
			if (onFileAccepted) onFileAccepted(croppedFile, aFile)
			setCroppedImage(null)
		}, type)
	}

	const cancelCropImage = () => {
		setCroppedImage(null)
	}

	const removeFile = (file) => {
		setDroppedFile(null)
		if (onFileRemoved) onFileRemoved(file)
	}

	const getThumb = (file) => {
		if (!file) return null
		const { previewUrl, originalUrl, type } = file
		if (!previewUrl || (needsCropping(type) && originalUrl === undefined)) return <Spinner />
		const startManualCropping = () => {
			setAutoAcceptCroppedImage(false)
			setCroppedImage(originalUrl)
		}
		return (
			<div className="thumb">
				<div className="thumb-inner">
					{isVideo(type) ?
						<video autoPlay={true} controls={true} muted={true} loop={true} src={file.ipfsPath} />
						:
						<img alt="" src={previewUrl}
							onClick={originalUrl ? startManualCropping : undefined}
							title={originalUrl ? "Click to crop & resize" : undefined}
							style={{ cursor: originalUrl ? "pointer" : "default" }} />
					}
				</div>
				<div className="file-op-buttons-ct">
					{originalUrl ? <FontIcon name="crop" moreCls="file-op-button" title="Crop & resize" tabIndex={0} onClick={startManualCropping} /> : null}
					<FontIcon name="delete" moreCls="file-op-button" tabIndex={0} title="Delete" onClick={() => removeFile(file)} />
				</div>
			</div>
		)
	}
	const theThumb = getThumb(theFile)

	if (!Cropper) return null

	const onCropperReady = () => {
		setCroppedImageLoaded(true)
		if (autoAcceptCroppedImage) {
			acceptCroppedImage(droppedFile)
		}
	}

	return (
		<div className="app-control" disabled={disabled}>
			{label && <label>{label}</label>}
			{!croppedImage && renderDropzone && <div {...getRootProps({ className: "dropzone" })} disabled={isUploading}>
				<input {...getInputProps({ name: inputName })} disabled={isUploading} />
				<div className="drop-prompt">
					<FontIcon name="upload-cloud" />
					<div className="main-prompt">Click/drag to select file</div>
				</div>
				{isUploading && <progress max={totalBytes} value={bytesReceived} min={0}></progress>}
			</div>}
			{!croppedImage && theThumb && <aside className="thumbs-container">{theThumb}</aside>}
			{croppedImage && !autoAcceptCroppedImage && (
				<div className="flex-row jc-sa">
					<button className="secondary" onClick={cancelCropImage}>Cancel</button>
					<button className="primary" onClick={() => acceptCroppedImage(theFile)}>Done cropping</button>
				</div>
			)}
			{croppedImage && <div className="cropper-with-loader">
				{!croppedImageLoaded && <div className="cropper-loader-box"><Spinner /></div>}
				<Cropper
					style={{ height: 360, width: "100%" }}
					aspectRatio={imageSize.width / imageSize.height}
					src={croppedImage}
					viewMode={1}
					minCropBoxHeight={50}
					minCropBoxWidth={50}
					background={false}
					responsive={true}
					autoCropArea={1}
					checkOrientation={false} // https://github.com/fengyuanchen/cropperjs/issues/671
					guides={true}
					ref={cropperRef}
					ready={onCropperReady}
				/>
			</div>}
		</div>
	)
}