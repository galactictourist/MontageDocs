import CardsFluidGrid from './CardsFluidGrid'
import { SaveButton } from './SaveButton'
import TextPhrase from './TextPhrase'

const DeleteItemsPopUp = ({ list, onClick, srcKey, getCachedSrc, onCancel, deleteWhat, deleting }) => {
    const doDelete = (e) => {
        new Audio("/wav/trash-can-effect.wav").play()
        onClick(e)
    }
    return (
        <div className="delete-items-popup" style={{ padding: 32, display: 'grid', rowGap: 32, backgroundColor: "white", justifyContent: 'center', borderRadius: 16, border: '1px solid #5D5D5B' }}>
            <div>
                <TextPhrase isMain={false}>Are you sure you want to delete {deleteWhat}?</TextPhrase>
                <TextPhrase isMain={false} cls="bad fw-700">This action can't be undone</TextPhrase>
            </div>
            <CardsFluidGrid
                list={list}
                srcKey={srcKey}
                getCachedSrc={getCachedSrc}
                moreGridCls="single-card"
                gridStyle={{ padding: 0 }}
            />
            <div style={{ display: 'flex', columnGap: 32 }}>
                <button className='primary' style={{ width: 350 }} onClick={onCancel} disabled={deleting}>No, Go back</button>
                <SaveButton text="Yes, delete, I'm sure" className="secondary" onClick={doDelete} saving={deleting} disabled={deleting} style={{ width: 350 }} />
            </div>
        </div>
    )
}

export default DeleteItemsPopUp