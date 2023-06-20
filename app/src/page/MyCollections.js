import Tooltip from 'rc-tooltip'
import { useState, useEffect, useContext } from 'react'
import Loading from './prompts/Loading'
import CallForAction from './prompts/CallForAction'
import CardsFluidGrid from './parts/CardsFluidGrid'
import AuthContext from '../ctx/Auth'
import { addUserCollectionRoles, loadMyCollections, removeUserCollectionRoles } from '../func/collections'
import { useNavigate } from 'react-router'
import { mayAddItem, RolesMap, rolesToText } from '../util/roles'
import { AppControl } from './parts/AppControl'
import FormContainer from './parts/FormContainer'
import SidebarContext from '../ctx/Sidebar'
import TextPhrase from './parts/TextPhrase'
import ButtonsRow from './parts/ButtonsRow'
import AppPopup from './parts/AppPopup'
import FontIcon from '../fontIcon/FontIcon'
import appLogo from '../img/logo.svg'
import puzzle from '../img/puzzle.svg'
import blackHole from '../img/black-hole.svg'
import webAddress from '../img/web-address.svg'
import MyCollectionContext from '../ctx/MyCollection'

const ANY_ROLE = 0
const DEFAULT_ROLE_FILTER = ANY_ROLE

export default function MyCollections({ setSidebarState }) {
  const { triggerSidebarAnimation } = useContext(SidebarContext)
  const { userId, mayAddCollection } = useContext(AuthContext)
  const [loading, setLoading] = useState(false)
  const [collections, setCollections] = useState([])
  const [mayHaveMore, setMayHaveMore] = useState(true)
  const navigate = useNavigate()
  const [filter, setFilter] = useState({ roleFilter: DEFAULT_ROLE_FILTER })

  const doLoadCollections = async (fetchOffset) => {
    const pageLimit = 9
    const tmp = await loadMyCollections(userId, fetchOffset, pageLimit, filter.roleFilter)
    if (tmp?.length) {
      setCollections(prevCollections => fetchOffset > 0 ? [...prevCollections, ...tmp] : [...tmp])
      if (tmp.length < pageLimit)
        setMayHaveMore(false)
    } else {
      if (fetchOffset === 0) {
        setCollections([])
      }
      setMayHaveMore(false)
    }
  }

  useEffect(() => {
    if (userId) {
      setLoading(true)
      doLoadCollections(0).then(() => setLoading(false))
    }
    // eslint-disable-next-line
  }, [userId, filter])

  useEffect(() => {
    if (setSidebarState) {
      setSidebarState(1)
    }
    // eslint-disable-next-line
  }, [])

  const [oldOrNewCollectionPopupOpen, setOldOrNewCollectionPopupOpen] = useState(false)
  const [ableToUpdateCreatorsFeeAddressPopupOpen, setAbleToUpdateCreatorsFeeAddressPopupOpen] = useState(false)
  const [tryAnotherWayPopupOpen, setTryAnotherWayPopupOpen] = useState(false)
  const [addContractAddressPopupOpen, setAddContractAddressPopupOpen] = useState(false)
  const addCollectionLink = () => mayAddCollection ? "/add-collection" : "/request-to-add-collection"
  const addCollectionText = () => mayAddCollection ? "Add collection" : "Request to add collection"
  const addCollection = () => mayAddCollection ? setOldOrNewCollectionPopupOpen(true) : navigate(addCollectionLink())

  const onFavToggleClick = (collectionId, isFollower, idx) => {
    (isFollower ? removeUserCollectionRoles(userId, collectionId, RolesMap.follower) : addUserCollectionRoles(userId, collectionId, RolesMap.follower))
    setCollections(prevCollections => {
      const tmp = [...prevCollections]
      tmp[idx].roles ^= RolesMap.follower
      return tmp
    })
  }

  const addItemButton = () => {
    const addItemTo = (collectionId) => { navigate(`/my-collection-add-item/${collectionId}`) }
    const btn = (onClick) => <button className="secondary" onClick={onClick}>Add item</button>

    const mayCreateCollections = collections?.filter(c => mayAddItem(c.roles))
    const len = mayCreateCollections?.length || 0
    if (len < 1) return null
    if (len === 1) return btn(() => addItemTo(mayCreateCollections[0].collectionId))
    return <Tooltip overlayClassName="app-dropdown" overlay={mayCreateCollections.map(c => <div className="app-dropdown-item" onClick={() => addItemTo(c.collectionId)} key={c.collectionId}>{c.name}</div>)} transitionName="rc-tooltip-zoom" placement="bottom" trigger={["click"]} offsetX={0} offsetY={0} destroyTooltipOnHide={true}>{btn()}</Tooltip>
  }

  if (!userId) return null
  if (loading) return <Loading />

  return (
    <div>
      <TextPhrase padTop={true}>To get started, create a new collection or add to an existing one.</TextPhrase>

      <ButtonsRow>
        {addItemButton()}
        <button className="primary" onClick={addCollection}>{addCollectionText()}</button>
      </ButtonsRow>

      <FormContainer style={{ width: '100%', maxWidth: 936 }}>
        <AppControl type="select" name="roleFilter" value={filter.roleFilter} setData={setFilter} style={{ width: '100%' }} options={[
          { value: DEFAULT_ROLE_FILTER, text: 'All' },
          { value: RolesMap.curator, text: 'Collections I created' },
          { value: RolesMap.curator | RolesMap.partner, text: 'Collections I\'m on the team' },
          { value: RolesMap.creator, text: 'Collections I created for' },
          { value: RolesMap.invited, text: 'Collections I\'m invited to' },
        ]} />
      </FormContainer>

      <CardsFluidGrid
        list={collections}
        idKey="collectionId"
        cardTo={collectionId => `/my-collection-general/${collectionId}`}
        cardClick={triggerSidebarAnimation}
        onEmpty={<CallForAction title="No collections yet" />}
        actionButton={mayHaveMore && <button className="primary" onClick={() => doLoadCollections(collections.length)}>Show more</button>}
        hasFavToggleButton={true}
        onFavToggleClick={onFavToggleClick}
        isFav={data => (data.roles & RolesMap.follower) > 0}
        moreFooter={(_collectionId, data) => <div className="card-footer-sub-line">{rolesToText(data.roles)}</div>}
      />

      <OldOrNewCollectionPopup visible={oldOrNewCollectionPopupOpen} setVisible={setOldOrNewCollectionPopupOpen} setAbleToUpdateCreatorsFeeAddressPopupOpen={setAbleToUpdateCreatorsFeeAddressPopupOpen} />
      <AbleToUpdateCreatorsFeeAddressPopup visible={ableToUpdateCreatorsFeeAddressPopupOpen} setVisible={setAbleToUpdateCreatorsFeeAddressPopupOpen}
        setAddContractAddressPopupOpen={setAddContractAddressPopupOpen}
        setTryAnotherWayPopupOpen={setTryAnotherWayPopupOpen}
      />
      <TryAnotherWayPopup visible={tryAnotherWayPopupOpen} setVisible={setTryAnotherWayPopupOpen} />
      <AddContractAddressPopup visible={addContractAddressPopupOpen} setVisible={setAddContractAddressPopupOpen} />
    </div>
  )
}

function OldOrNewCollectionPopup({ visible, setVisible, setAbleToUpdateCreatorsFeeAddressPopupOpen }) {
  const { setIsImportExistingCollection, setImportedNFTAddress } = useContext(MyCollectionContext)
  const navigate = useNavigate()
  if (!visible) return null
  const hide = () => setVisible(false)
  const addNewCollection = () => {
    hide()
    setIsImportExistingCollection(false)
    setImportedNFTAddress("")
    navigate("/add-collection")
  }
  const addExistingCollection = () => {
    hide()
    setAbleToUpdateCreatorsFeeAddressPopupOpen(true)
  }

  return <AppPopup visible={visible} setVisible={hide} insideCls="notice-popup-content">
    <div className="notice-popup-content">
      <FontIcon name="cancel-circle-full" onClick={hide} moreCls="close-popup-x" />
      <div className="ta-c pt-2">
        <img src={appLogo} alt="logo" className="notice-img--any-resolution" />
      </div>
      <FormContainer>
        <TextPhrase fw400={true}>Do you want to start a new collection or add to an existing one?</TextPhrase>
        <button className="primary" onClick={addNewCollection}>Start a new collection</button>
        <button className="primary" onClick={addExistingCollection}>Add an existing collection</button>
      </FormContainer>
    </div>
  </AppPopup>
}

function AbleToUpdateCreatorsFeeAddressPopup({ visible, setVisible, setTryAnotherWayPopupOpen, setAddContractAddressPopupOpen }) {
  if (!visible) return null
  const hide = () => setVisible(false)
  const tryAnotherWay = () => {
    hide()
    setTryAnotherWayPopupOpen(true)
  }
  const isCompatible = () => {
    hide()
    setAddContractAddressPopupOpen(true)
  }

  return <AppPopup visible={visible} setVisible={hide} insideCls="notice-popup-content">
    <div className="notice-popup-content">
      <FontIcon name="cancel-circle-full" onClick={hide} moreCls="close-popup-x" />
      <div className="ta-c pt-2">
        <img src={puzzle} alt="" className="notice-img--any-resolution" />
      </div>
      <FormContainer>
        <TextPhrase fw400={true}>Is your NFT contract a standard ERC-721, 721-A, or 1155 NFT contract - and not a hybrid or other exotic type of contract (example: Manfiold’s Open Edition)?</TextPhrase>
        <button className="primary" onClick={isCompatible}>Yes</button>
        <button className="secondary" onClick={tryAnotherWay}>No</button>
      </FormContainer>
    </div>
  </AppPopup>
}

function TryAnotherWayPopup({ visible, setVisible }) {
  if (!visible) return null
  const hide = () => setVisible(false)
  return <AppPopup visible={visible} setVisible={hide} insideCls="notice-popup-content">
    <div className="notice-popup-content">
      <FontIcon name="cancel-circle-full" onClick={hide} moreCls="close-popup-x" />
      <div className="ta-c pt-2">
        <img src={blackHole} alt="" className="notice-img--any-resolution" />
      </div>
      <FormContainer>
        <TextPhrase fw400={true}>Sorry you can’t use our buffer contract at the moment. Please contact us if you want to try to do wrapping or wormhole</TextPhrase>
        <button className="primary" onClick={hide}>Close</button>
      </FormContainer>
    </div>
  </AppPopup>
}

function AddContractAddressPopup({ visible, setVisible }) {
  const navigate = useNavigate()
  const [importedNFTAddress, setImportedNFTAddress] = useState("")
  const { setIsImportExistingCollection, setImportedNFTAddress: setImportedNFTAddressInContext } = useContext(MyCollectionContext)

  if (!visible) return null
  const hide = () => setVisible(false)
  const nextClick = () => {
    hide()
    setIsImportExistingCollection(true)
    setImportedNFTAddressInContext(importedNFTAddress)
    navigate("/add-existing-collection")
  }

  return <AppPopup visible={visible} setVisible={hide} insideCls="notice-popup-content">
    <div className="notice-popup-content">
      <FontIcon name="cancel-circle-full" onClick={hide} moreCls="close-popup-x" />
      <div className="ta-c pt-2">
        <img src={webAddress} alt="" className="notice-img--any-resolution" />
      </div>
      <FormContainer>
        <TextPhrase fw400={true}>Add the contract address of your collection</TextPhrase>
        <AppControl value={importedNFTAddress} setValue={setImportedNFTAddress} placeholder="0x..." label="Contract address" />
        <button className="primary" onClick={nextClick}>Next</button>
      </FormContainer>
    </div>
  </AppPopup>
}