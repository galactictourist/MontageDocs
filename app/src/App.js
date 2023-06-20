import 'rc-tooltip/assets/bootstrap.css';
import './css/app.scss';
import WebFont from "webfontloader";
import Topbar from './page/parts/Topbar';
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Teaser from './page/teaser/Teaser';
import Profile from './page/teaser/Profile';
import ThankYou from './page/teaser/ThankYou';
import { useEffect, useMemo, useState } from 'react';

import AuthContext from './ctx/Auth';
import MyCollectionContext from './ctx/MyCollection';
import CollectionContext from './ctx/Collection';
import { toastNoWeb3Support } from './util/toasts';
import AdminUsers from './page/AdminUsers';
import Sidebar from './page/parts/Sidebar';
import AdminAddCurator from './page/AdminAddCurator';
import MyProfile from './page/MyProfile';
import MyCollections from './page/MyCollections';
import MyCollectionStory from './page/MyCollectionStory';
import LoginAs from './page/LoginAs';
import Footer from './page/parts/Footer';
import Terms from './page/Terms';
import RequestToAddCollection from './page/RequestToAddCollection';
import MyPermissions from './page/MyPermissions';
import AdminInviteCurator from './page/AdminInviteCurator';
import MyCollectionPie from './page/MyCollectionPie';
import MyBalance from './page/MyBalance';
import MyActivity from './page/MyActivity';
import MyCollectedItems from './page/MyCollectedItems';
import MyCollectionOptions from './page/MyCollectionOptions';
import MyCollectionTeam from './page/MyCollectionTeam';
import MyCollectionCreators from './page/MyCollectionCreators';
import MyCollectionCommunity from './page/MyCollectionCommunity';
import MyCollectionItems from './page/MyCollectionItems';
import MyCollectionItem from './page/MyCollectionItem';
import MyCollectionAddBatchItems from './page/MyCollectionAddBatchItems';
import MyCollectionDeploy from './page/MyCollectionDeploy';
import CallForAction from './page/prompts/CallForAction';
import CollectionItems from './page/CollectionItems';
import CollectionActivity from './page/CollectionActivity';
import MyCollectionActivity from './page/MyCollectionActivity';
import Privacy from './page/Privacy';
import Cookies from './page/Cookies';
import Market from './page/Market';
import MyCollectionTeammate from './page/MyCollectionTeammate';
import MyCollectionCreator from './page/MyCollectionCreator';
import MyCollectionMember from './page/MyCollectionMember';
import { loadCreationStages, loadMyCollectionBasics, mergeCreationStages } from './func/collections';
import CollectionItem from './page/CollectionItem';
import CollectionMarketplace from './page/CollectionMarketplace';
import MarketCollectionList from './page/MarketCollectionList';
import TradeContext from './ctx/Trade';
import CartContext from './ctx/Cart';
import SidebarContext from './ctx/Sidebar';
import CartView from './page/parts/CartView';
import ListItemForSale from './page/ListItemForSale';
import ListItemSuccess from './page/ListItemSuccess';
import CollectionPage from './page/CollectionPage';
import MyItemsCreated from './page/MyItemsCreated';
import MyFollowing from './page/MyFollowing';
import MyCollectionGeneral from './page/MyCollectionGeneral';
import MyNotifications from './page/MyNotifications';
import MyCollectionRights from './page/MyCollectionRights';
import AppPopup from './page/parts/AppPopup';
import ConnectWalletPopupContent from './page/parts/ConnectWalletPopupContent';
import { getOrCreateUserId } from './func/users';
import { toast } from 'react-toastify';
import last4 from './util/last4';
import CollectionIntroVideo from './page/CollectionIntroVideo';
import InviteContext from './ctx/Invite';
import { useInviteKey } from './page/teaser/useInviteKey'
import DisconnectWalletPopupContent from './page/parts/DisconnectWalletPopupContent';
import CollectionProgressBarContext from './ctx/CollectionProgressBarContext';
import ConfirmEmail from './page/ConfirmEmail';
import TxFailedContext from './ctx/TxFailedContext';
import FontIcon from './fontIcon/FontIcon';
import TextPhrase from './page/parts/TextPhrase';
import FormContainer from './page/parts/FormContainer';
import MyCollectionMintOnChain from './page/MyCollectionMintOnChain';
import MyCollectionFinalize from './page/MyCollectionFinalize';
import Home from './page/Home';
import CollectionPageContext from './ctx/CollectionPageContext';
import { isDesktopByMatchMedia, isMobileByMatchMedia } from './util/isDesktopByMatchMedia';
import AdminReferrals from './page/AdminReferrals';
import FAQ from './page/FAQ';
import AdminScanChain from './page/AdminScanChain';
import MyOffers from './page/MyOffers';
import { BuySuccessPopup } from './page/BuySuccessPopup';
import MyEarnings from './page/MyEarnings';
import MyCollectionMintStage from './page/MyCollectionMintStage';

// import { Helmet } from "react-helmet-async"

WebFont.load({
  google: {
    families: ['Montserrat', "Montserrat:300", "Montserrat:400", "Montserrat:500", "Montserrat:600", "Montserrat:700", "Montserrat:900"]
  }
})

async function getEthAccount(method = 'eth_accounts') {
  const accounts = await window.ethereum?.request({ method })
  return accounts?.length > 0 ? accounts[0] : null
}
async function requestEthAccount() {
  if (!window.ethereum) return toastNoWeb3Support()
  return await getEthAccount('eth_requestAccounts')
}

export default function App() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState(null)
  const [impersonatedAccounts, setImpersonatedAccounts] = useState(null)
  const [userId, setUserId] = useState(0)
  const [asUserId, setAsUserId] = useState(0)
  const [asName, setAsName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [mayAddCollection, setMayAddCollection] = useState(false)
  const [wasInvited, setWasInvited] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [isUserAction, setIsUserAction] = useState(false)
  const isImpersonating = !!asUserId

  // eslint-disable-next-line
  const [pageTitle, setPageTitle] = useState('')
  // eslint-disable-next-line
  const [pageDesc, setPageDesc] = useState('')
  // eslint-disable-next-line
  const [pageKeywords, setPageKeywords] = useState('')
  const [doRenderSidebar, setDoRenderSidebar] = useState(false)
  const [doRenderFooter, setDoRenderFooter] = useState(false)
  const [noCartButton, setNoCartButton] = useState(false)
  const [crumbs, setCrumbs] = useState(null)
  const [noWalletConnectButtonWhenConnected, setNoWalletConnectButtonWhenConnected] = useState(false)
  const [moreAppCls, setMoreAppCls] = useState('')
  const [moreMainCls, setMoreMainCls] = useState('')

  const { pathname } = useLocation()
  const [first, second, third] = pathname.substring(1).split('/')
  const myCollectionId = first.startsWith('my-collection-') ? second : ''
  const teammateId = myCollectionId ? third : ''
  const [teammateName, setTeammateName] = useState('')
  const creatorId = myCollectionId ? third : ''
  const [creatorName, setCreatorName] = useState('')
  const memberId = myCollectionId ? third : ''
  const [memberName, setMemberName] = useState('')
  const itemId = myCollectionId ? third : ''
  const [itemName, setItemName] = useState('')
  const [myCollectionRoles, setMyCollectionRoles] = useState(0)
  const [myCollectionStatus, setMyCollectionStatus] = useState('')
  const [myCollectionName, setMyCollectionName] = useState('')
  const [myCollectionPagesPassword, setMyCollectionPagesPassword] = useState('')
  const [myCollectionProfileImage, setMyCollectionProfileImage] = useState('')
  const [isImportExistingCollection, setIsImportExistingCollection] = useState(false)
  const [importedNFTAddress, setImportedNFTAddress] = useState('')
  useEffect(() => {
    const uid = asUserId || userId
    if (uid && myCollectionId) {
      loadMyCollectionBasics(myCollectionId, uid).then(r => {
        setMyCollectionRoles(r.roles)
        setMyCollectionStatus(r.status)
        setMyCollectionName(r.name)
        setMyCollectionPagesPassword(r.pagesPassword)
        setMyCollectionProfileImage(r.profileImage)
        setIsImportExistingCollection(r.isImportExistingCollection)
        setImportedNFTAddress(r.importedNFTAddress)
      })
    }
  }, [userId, asUserId, myCollectionId])

  const [collectionStatus, setCollectionStatus] = useState('')
  const [collectionName, setCollectionName] = useState('')
  const [collectionItemName, setCollectionItemName] = useState('')
  const [collectionPagesPassword, setCollectionPagesPassword] = useState('')
  const [doRenderTopbar, setDoRenderTopbar] = useState(true)

  const [collectionPageValues, setCollectionPageValues] = useState(null)

  const [txFailed, setTxFailed] = useState(false)
  const [txFailedSubject, setTxFailedSubject] = useState(null)
  const [txFailedImg, setTxFailedImg] = useState(null)
  useEffect(() => {
    if (!txFailed) {
      setTxFailedSubject(null)
      setTxFailedImg(null)
    }
  }, [txFailed])
  const hideTxFailedPopup = () => setTxFailed(false)
  const setTxFailedData = (subject = null, img = null) => {
    setTxFailed(true)
    setTxFailedSubject(subject)
    setTxFailedImg(img)
  }

  const login = async () => {
    try {
      return await requestEthAccount()
    } catch (e) {
      console.error(e)
      toastNoWeb3Support()
    }
  }

  const logout = async () => {
    setAccounts(null)
    setUserId(0)
    setIsAdmin(false)
    setImpersonatedAccounts(null)
    setAsUserId(0)
    setAsName('')
    setMayAddCollection(false)
    setWasInvited(false)
    setIsNewUser(false)
    setIsUserAction(false)
  }

  const emptyNode = <div></div>

  const paths = {}
  const pathsReg = []
  const matchReg = pathname => {
    for (let i = 0; i < pathsReg.length; i++) {
      const obj = pathsReg[i]
      const m = pathname.match(obj.reg)
      if (m) return obj
    }
  }
  const getPageMetadata = pathname => {
    return paths[pathname] || matchReg(pathname) || { pageTitle: process.env.REACT_APP_NAME }
  }
  const addPageMetadata = (path, md) => {
    if (md.reg) pathsReg.push(md)
    else paths[path] = md
    return path
  }
  const crumb = (path, label, condition) => condition === undefined || condition === true ? ({ path, label }) : null
  const publicPath = (path, pageTitle, noFooter = false, noPageTitle = false, reg = null, hasSidebar = undefined, noCartButton = false, docTitle = null, noWalletConnectButtonWhenConnected = false, moreAppCls = '') => addPageMetadata(path, { docTitle: docTitle || pageTitle, pageTitle, hasSidebar: hasSidebar !== undefined ? hasSidebar : false, hasFooter: !noFooter, noPageTitle, reg, noCartButton, noWalletConnectButtonWhenConnected, moreAppCls })
  const userPath = (path, pageTitle, hasFooter = false, reg = null, crumbs = null) => addPageMetadata(path, { docTitle: pageTitle, pageTitle, hasSidebar: true, hasFooter, reg, crumbs })
  const location = useLocation()
  const getPageTitle = (fnOrStatic) => typeof (fnOrStatic) === 'function' ? fnOrStatic() : fnOrStatic || ''
  useEffect(() => {
    const p = getPageMetadata(location.pathname)
    document.title = (asName ? `[${asName}] ` : '') + getPageTitle(p.docTitle)
    // eslint-disable-next-line
  }, [location, asName, myCollectionName, collectionName, collectionItemName, itemName])

  useEffect(() => {
    const p = getPageMetadata(location.pathname)
    setPageTitle(p.noPageTitle ? '' : getPageTitle(p.pageTitle))
    setDoRenderSidebar(p.hasSidebar)
    setDoRenderFooter(p.hasFooter)
    setNoCartButton(p.noCartButton || false)
    setCrumbs(p.crumbs || null)
    setNoWalletConnectButtonWhenConnected(p.noWalletConnectButtonWhenConnected || null)
    setMoreAppCls(p.moreAppCls || '')
    // eslint-disable-next-line
  }, [location, myCollectionName, collectionName, collectionItemName, teammateName, creatorName, memberName, itemName])

  const [sidebarChanging, setSidebarChanging] = useState(false)
  const triggerSidebarAnimation = () => setSidebarChanging(true)
  useEffect(() => {
    if (sidebarChanging) {
      const timer = setTimeout(() => setSidebarChanging(false), 300)
      return () => clearTimeout(timer)
    }
  }, [sidebarChanging])

  const [sidebarState, setSidebarState] = useState(isMobileByMatchMedia() ? 0 : 1)
  const [isClickToOpenSideBar, setIsClickToOpenSideBar] = useState(false)
  const toggleSidebarOnMobile = () => {
    if (isMobileByMatchMedia()) {
      setIsClickToOpenSideBar(prevIsClickToOpenSideBar => !prevIsClickToOpenSideBar)
    }
  }
  const toggleSidebarState = () => {
    setSidebarState(prevSidebarState => {
      prevSidebarState--
      return prevSidebarState < 0 ? 1 : prevSidebarState
    })
    if (sidebarState === 3) {
      const p = location.pathname
      if (p.startsWith('/my-collection-teammate/') || p.startsWith('/my-collection-add-teammate/')) {
        navigate(`/my-collection-team/${myCollectionId}`)
      } else if (p.startsWith('/my-collection-creator/') || p.startsWith('/my-collection-add-creator/')) {
        navigate(`/my-collection-creators/${myCollectionId}`)
      } else if (p.startsWith('/my-collection-member/') || p.startsWith('/my-collection-add-member/')) {
        navigate(`/my-collection-community/${myCollectionId}`)
      } else if (p.startsWith('/my-collection-item/') || p.startsWith('/my-collection-add-item/') || p.startsWith('/my-collection-add-batch/')) {
        navigate(`/my-collection-items/${myCollectionId}`)
      }
    } else if (sidebarState === 2) {
      if (isDesktopByMatchMedia()) triggerSidebarAnimation()
      navigate('/my-collections')
    }
  }

  const getTeaser = key => <Teaser key={key} login={login} setUserId={setUserId} setIsAdmin={setIsAdmin} />

  const [quoteCurrency, setQuoteCurrency] = useState('eth')
  const [timeFrame, setTimeFrame] = useState('24h')

  const [cart, setCart] = useState({ items: [] })
  const addToCart = (item) => setCart(cart => ({ ...cart, items: [...cart.items, item] }))
  const removeFromCart = (idx) => setCart(cart => {
    const c = { ...cart }
    const items = [...c.items]
    items.splice(idx, 1)
    c.items = items
    return c
  })
  const [isAfterPurchase, setIsAfterPurchase] = useState(false)
  const [boughtItems, setBoughtItems] = useState([])
  const [buySuccessPopupVisible, setBuySuccessPopupVisible] = useState(false)
  const clearCartClick = (boughtItems) => {
    if (boughtItems?.length) {
      setIsAfterPurchase(true)
      setBoughtItems(boughtItems)
      setBuySuccessPopupVisible(true)
    }
    setCart({ items: [] })
  }
  // eslint-disable-next-line
  const indexOfItemInCart = (id) => cart.items.findIndex(i => i.id == id)
  const toggleItemInCart = (id, item) => {
    const ix = indexOfItemInCart(id)
    ix === -1 ? addToCart(item) : removeFromCart(ix)
  }
  const [cartViewIsVisible, setCartViewIsVisible] = useState(false)
  const toggleCartView = () => setCartViewIsVisible(b => !b)
  const cartTotalETH = () => {
    let sum = 0
    cart.items.forEach(i => sum += i.priceETH)
    return Number(sum.toFixed(4))
  }
  const cartTotalUSD = () => {
    let sum = 0
    cart.items.forEach(i => sum += i.priceUSD)
    return Number(sum.toFixed(2))
  }
  const [cartMarketFee, setCartMarketFee] = useState(0)
  const cartMarketFeeUSD = () => {
    let sum = 0
    if (cartMarketFee > 0) {
      cart.items.forEach(i => sum += i.priceUSD * cartMarketFee / 100)
    }
    return Number(sum.toFixed(2))
  }
  const cartMarketFeeETH = () => {
    let sum = 0
    if (cartMarketFee > 0) {
      cart.items.forEach(i => sum += i.priceETH * cartMarketFee / 100)
    }
    return Number(sum.toFixed(4))
  }
  // crumbs
  useEffect(() => {
    const p = location.pathname
    if (p === '/my-collections') {
      setMyCollectionName('')
      setTeammateName('')
      setCreatorName('')
      setMemberName('')
      setItemName('')
    } else if (p.startsWith('/my-collection-team/')) {
      setTeammateName('')
    } else if (p.startsWith('/my-collection-creators/')) {
      setCreatorName('')
    } else if (p.startsWith('/my-collection-members/')) {
      setMemberName('')
    } else if (p.startsWith('/my-collection-items/')) {
      setItemName('')
    } else if (p.startsWith('/collection-item-preview/') || p.startsWith('/collection-page-preview/')) {
      setDoRenderTopbar(false)
    } else {
      setDoRenderTopbar(true)
    }
  }, [location])
  const myCollectionsCrumb = () => crumb("/my-collections", "My collections")
  const myCollectionNameCrumb = () => crumb(() => `/my-collection-general/${myCollectionId}`, myCollectionName)
  const teamCrumb = () => crumb(() => `/my-collection-team/${myCollectionId}`, "Core team")
  const teammateCrumb = () => crumb(() => `/my-collection-teammate/${myCollectionId}/${teammateId}`, teammateName)
  const creatorsCrumb = () => crumb(() => `/my-collection-creators/${myCollectionId}`, "Artists")
  const creatorCrumb = () => crumb(() => `/my-collection-creator/${myCollectionId}/${creatorId}`, creatorName)
  const membersCrumb = () => crumb(() => `/my-collection-members/${myCollectionId}`, "Collectors")
  const memberCrumb = () => crumb(() => `/my-collection-member/${myCollectionId}/${memberId}`, memberName)
  const itemsCrumb = () => crumb(`/my-collection-items/${myCollectionId}`, "Collection items")
  const itemCrumb = () => crumb(() => `/my-collection-item/${myCollectionId}/${itemId}`, itemName)

  const inviteKey = useInviteKey()

  const [walletConnectPopupVisible, setWalletConnectPopupVisible] = useState(false)
  const openWalletConnectPopup = () => setWalletConnectPopupVisible(true)
  const [walletDisconnectPopupVisible, setWalletDisconnectPopupVisible] = useState(false)
  const openWalletDisconnectPopup = () => setWalletDisconnectPopupVisible(true)
  const [connecting, setConnecting] = useState(false)
  const setWalletAddressAndUserId = async (walletAddress, createNewIfNotExists, isUserAction, invitingUserId) => {
    if (walletAddress) {
      let { userId, isAdmin, mayAddCollection, wasInvited, authToken, isNewUser } = await getOrCreateUserId(walletAddress, createNewIfNotExists, undefined, undefined, invitingUserId)
      if (userId) {
        window.authToken = authToken

        window.__insp?.push(['identify', userId.toString()])
        const tags = { walletAddress }
        if (isAdmin) tags.isAdmin = true
        window.__insp?.push(['tagSession', tags])

        setIsUserAction(isUserAction)
        setAccounts(walletAddress)
        setIsNewUser(isNewUser)
        if (mayAddCollection) setMayAddCollection(mayAddCollection)
        if (wasInvited) setWasInvited(wasInvited)
        if (isAdmin) setIsAdmin(true)
        setUserId(userId)
        return true
      }
    }
  }
  const connectWalletAndLogin = async () => {
    if (!window.ethereum && isMobileByMatchMedia()) {
      const l = window.location
      l.href = 'https://metamask.app.link/dapp/' + l.host + l.pathname + l.search
      return
    }
    setConnecting(true)
    const walletAddress = accounts || (await login())
    if (await setWalletAddressAndUserId(walletAddress, true, true, inviteKey.inviteArgs?.invitingUserId || null)) {
      toast(<span>Wallet <b>{last4(walletAddress)}</b> connected!</span>)
    }
    setConnecting(false)
    setWalletConnectPopupVisible(false)
  }

  useEffect(() => {
    window.addEventListener('load', () => getEthAccount().then((walletAddress) => setWalletAddressAndUserId(walletAddress, false, false)))
  }, [])

  const hasStageProgressBar = useMemo(() => (myCollectionId > 0 || location.pathname === '/add-collection') && !isImportExistingCollection, [myCollectionId, isImportExistingCollection, location])
  const [progressStageStates, setProgressStageStates] = useState([])
  const getProgressStageStates = () => progressStageStates
  const setProgressStageState = async (stageIdx, isCompleted, aCollectionId) => {
    const states = [...progressStageStates]
    states[stageIdx] = isCompleted
    await mergeCreationStages(myCollectionId || aCollectionId, states)
    setProgressStageStates(states => {
      const newStates = [...states]
      newStates[stageIdx] = isCompleted
      return newStates
    })
  }
  useEffect(() => {
    if (myCollectionId) {
      loadCreationStages(myCollectionId).then(setProgressStageStates)
    }
  }, [myCollectionId])
  useEffect(() => {
    if (location.pathname === '/add-collection') {
      setProgressStageStates([])
    }
  }, [location])
  useEffect(() => {
    const { pathname: p } = location
    if (p && !p.startsWith('/collection-')) {
      setMoreMainCls('')
    }
  }, [location])

  return (
    <TxFailedContext.Provider value={{ setTxFailedData }}>
      <InviteContext.Provider value={{ wasInvited, setWasInvited, ...inviteKey }}>
        <AuthContext.Provider value={{ accounts, impersonatedAccounts, isAdmin, isNewUser, setIsNewUser, isUserAction, setIsUserAction, userId: asUserId || userId, adminUserId: isAdmin ? userId : 0, isImpersonating: !!asUserId, openWalletConnectPopup, openWalletDisconnectPopup, mayAddCollection, setMayAddCollection, logout }}>
          <CollectionContext.Provider value={{ collectionName, setCollectionName, collectionItemName, setCollectionItemName, collectionStatus, setCollectionStatus, collectionPagesPassword, setCollectionPagesPassword }}>
            <MyCollectionContext.Provider value={{ userId: asUserId || userId, myCollectionId, myCollectionRoles, setMyCollectionRoles, myCollectionStatus, setMyCollectionStatus, myCollectionName, setMyCollectionName, myCollectionPagesPassword, setMyCollectionPagesPassword, myCollectionProfileImage, isImportExistingCollection, setIsImportExistingCollection, importedNFTAddress, setImportedNFTAddress }}>
              <TradeContext.Provider value={{ quoteCurrency, setQuoteCurrency, timeFrame, setTimeFrame }}>
                <CartContext.Provider value={{ cart, cartMarketFee, setCartMarketFee, cartMarketFeeUSD, cartMarketFeeETH, cartTotalETH, cartTotalUSD, addToCart, removeFromCart, clearCartClick, toggleCartView, indexOfItemInCart, toggleItemInCart, isAfterPurchase, setIsAfterPurchase, boughtItems }}>
                  <SidebarContext.Provider value={{ triggerSidebarAnimation, doRenderSidebar, toggleSidebarState, toggleSidebarOnMobile, sidebarState, setSidebarState, isClickToOpenSideBar, setIsClickToOpenSideBar, sidebarChanging }}>
                    <CollectionProgressBarContext.Provider value={{ hasStageProgressBar, getProgressStageStates, setProgressStageState }}>
                      <CollectionPageContext.Provider value={{ collectionPageValues, setCollectionPageValues, setMoreMainCls }}>
                        <div className={"app" + (moreAppCls ? ' ' + moreAppCls : '')}>
                          {doRenderTopbar && <Topbar pageTitle={pageTitle} noCartButton={noCartButton} crumbs={crumbs} noWalletConnectButtonWhenConnected={noWalletConnectButtonWhenConnected} />}
                          <div className="app-body">
                            {doRenderSidebar && <Sidebar />}
                            <main className={moreMainCls}>
                              <Routes>
                                <Route path={publicPath("/", process.env.REACT_APP_NAME, false, false, null, false, false, null, false, 'app-home dark-mode')} element={<Home />} />
                                <Route path={publicPath("/market", `Private markets`, false, false, null, true)} element={<Market />} />
                                <Route path={publicPath("/market-collection-list", `${process.env.REACT_APP_NAME} Market`, false, false, null, true)} element={<MarketCollectionList />} />

                                <Route path={publicPath("/profile", "Profile", true)} element={<Profile />} />
                                <Route path={publicPath("/thank-you", "You're in", true)} element={<ThankYou />} />

                                <Route path={publicPath("/confirm-email/:key", "Confirm email", false, false, /\/confirm-email\/\w+/)} element={<ConfirmEmail />} />

                                <Route path={publicPath("/invite", () => `Join ${collectionName || process.env.REACT_APP_NAME}`, true, false, null, false, true, null, true)} element={getTeaser(1)} />

                                <Route path={publicPath("/faq", "Frequently asked questions", false, false, null, false, false, null, false, 'app-home dark-mode')} element={<FAQ />} />
                                <Route path={publicPath("/terms", "Terms of use", false, false, null, false, false, null, false, 'app-home dark-mode')} element={<Terms />} />
                                <Route path={publicPath("/privacy", "Privacy policy", false, false, null, false, false, null, false, 'app-home dark-mode')} element={<Privacy />} />
                                <Route path={publicPath("/cookies", "Cookies policy", false, false, null, false, false, null, false, 'app-home dark-mode')} element={<Cookies />} />

                                <Route path={publicPath("/collection-marketplace/:collectionIdOrAddress", () => `${process.env.REACT_APP_NAME} Market - ${collectionName}`, false, false, /\/collection-marketplace\/\w+/, false)} element={<CollectionMarketplace />} />
                                {/* TODO due to extra tests skip this for now and use redirect */}
                                {/* <Route path={publicPath("/artis", "Art Is", false, false, /\/artis/, false)} element={<CollectionPage key={3000} aCollectionId={3} />} /> */}
                                <Route path={publicPath("/collection-page/:collectionId", () => `${collectionName}`, false, false, /\/collection-page\/\d+/, false)} element={<CollectionPage key={0} />}>
                                  <Route path={publicPath(":demoStageOrTabContentId", () => `${collectionName}`, true, false, /\/collection-page\/\d+\/\w+/, false)} element={<CollectionPage key={1} />} />
                                </Route>
                                <Route path={publicPath("/collection-page-preview/:collectionId/:demoStage/:demoTabContentId", () => `${collectionName}`, true, false, /\/collection-page-preview\/\d+\/\d/, false)} element={<CollectionPage isPreview={true} key={2} />} />

                                <Route path={publicPath("/collection-items/:collectionId", () => `${collectionName} items`, false, false, /\/collection-items\/\d+/, false)} element={<CollectionItems />} />
                                <Route path={publicPath("/collection-item/:collectionIdOrAddress/:tokenId", () => `${collectionName} - ${collectionItemName}`, false, false, /\/collection-item\/\w+\/\d+/)} element={<CollectionItem key={0} />} />
                                <Route path={publicPath("/collection-item-preview/:collectionId/:itemId", () => `Preview ${collectionName} - ${collectionItemName}`, true, false, /\/collection-item-preview\/\d+\/\d+/, false)} element={<CollectionItem key={1} isPreviewOrMint={true} />} />
                                <Route path={publicPath("/collection-item-mint/:collectionId/:itemId", () => `Mint ${collectionName} - ${collectionItemName}`, false, false, /\/collection-item-mint\/\d+\/\d+/, false)} element={<CollectionItem key={2} isPreviewOrMint={true} isMint={true} />} />
                                <Route path={publicPath("/collection-activity/:collectionId", () => `${collectionName} activity`, false, false, /\/collection-activity\/\d+/, false)} element={<CollectionActivity />} />

                                <Route path={userPath("/admin", "Admin users", 0, 0, [crumb("/admin", "Admin")])} element={isAdmin ? <AdminUsers /> : emptyNode} />
                                <Route path={userPath("/admin/add-curator", "Add curator", 0, 0, [crumb("/admin", "Admin"), crumb("/admin/add-curator", "Add curator")])} element={isAdmin ? <AdminAddCurator /> : emptyNode} />
                                <Route path={userPath("/admin/invite-curator", "Invite curator", 0, 0, [crumb("/admin", "Admin"), crumb("/admin/invite-curator", "Invite curator")])} element={isAdmin ? <AdminInviteCurator key={0} /> : emptyNode} />
                                <Route path={userPath("/admin/invite-tester", "Invite tester", 0, 0, [crumb("/admin", "Admin"), crumb("/admin/invite-tester", "Invite tester")])} element={isAdmin ? <AdminInviteCurator key={1} inviteTester={true} /> : emptyNode} />
                                <Route path={userPath("/admin/referrals", "Referrals", 0, 0, [crumb("/admin", "Admin"), crumb("/admin/referrals", "Referrals")])} element={isAdmin ? <AdminReferrals /> : emptyNode} />
                                <Route path={userPath("/admin/scan-chain", "Scan chain", 0, 0, [crumb("/admin", "Admin"), crumb("/admin/scan-chain", "Scan chain")])} element={isAdmin ? <AdminScanChain /> : emptyNode} />

                                <Route path={userPath("/login-as", "Logging in")} element={<LoginAs setUserId={setUserId} setIsAdmin={setIsAdmin} setAsUserId={setAsUserId} setAsName={setAsName} setAccounts={setAccounts} setImpersonatedAccounts={setImpersonatedAccounts} setMayAddCollection={setMayAddCollection} />} />

                                <Route path={userPath("/list-item-for-sale/:nftAddress/:tokenId", () => `List ${collectionItemName}`, false, /\/list-item-for-sale\/\w+\/\d+/)} element={<ListItemForSale setCrumbLabel={setCollectionItemName} />} />
                                <Route path={userPath("/list-item-success", "List item success")} element={<ListItemSuccess />} />

                                <Route path={userPath("/my-collections", "My collections")} element={<MyCollections setSidebarState={setSidebarState} />} />
                                <Route path={userPath("/my-items-created", "Items I created")} element={<MyItemsCreated />} />
                                <Route path={userPath("/my-collected-items", "Items I own")} element={<MyCollectedItems />} />
                                <Route path={userPath("/my-offers", "Offers")} element={<MyOffers />} />
                                <Route path={userPath("/my-following", "Following")} element={<MyFollowing />} />

                                <Route path={userPath("/my-profile", "My profile", 0, 0, [crumb("/admin", "Admin", isAdmin && !isImpersonating), crumb("/my-profile", "My profile")])} element={<MyProfile />} />
                                <Route path={userPath("/my-balance", "My balance")} element={<MyBalance />} />
                                <Route path={userPath("/my-earnings", "My earnings")} element={<MyEarnings />} />
                                <Route path={userPath("/my-activity", "Activity updates")} element={<MyActivity />} />
                                <Route path={userPath("/my-notifications", "Notifications")} element={<MyNotifications />} />
                                <Route path={userPath("/my-permissions", "Permissions")} element={isAdmin ? <MyPermissions /> : emptyNode} />

                                <Route path={userPath("/collection-intro-video", "Add collection", false, null, [myCollectionsCrumb, () => crumb('/add-collection', "Add collection")])} element={<CollectionIntroVideo setSidebarState={setSidebarState} />} />
                                <Route path={userPath("/add-collection", "Add collection", false, null, [myCollectionsCrumb, () => crumb('/add-collection', "Add collection")])} element={<MyCollectionGeneral setSidebarState={setSidebarState} key={0} />} />
                                <Route path={userPath("/add-existing-collection", "Add existing collection", false, null, [myCollectionsCrumb, () => crumb('/add-existing-collection', "Add existing collection")])} element={<MyCollectionGeneral setSidebarState={setSidebarState} key={1} />} />
                                <Route path={userPath("/my-collection-general/:collectionId", () => `${myCollectionName} general`, false, /\/my-collection-general\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, () => crumb(() => `/my-collection-general/${myCollectionId}`, "General")])} element={<MyCollectionGeneral setSidebarState={setSidebarState} key={2} />} />
                                <Route path={userPath("/my-collection-story/:collectionId", () => `${myCollectionName} pages`, false, /\/my-collection-story\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, () => crumb(() => `/my-collection-story/${myCollectionId}`, "Pages")])} element={<MyCollectionStory setSidebarState={setSidebarState} />} />
                                <Route path={userPath("/my-collection-pie/:collectionId", () => `${myCollectionName} rev-share`, false, /\/my-collection-pie\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, () => crumb(() => `/my-collection-pie/${myCollectionId}`, "Rev-share")])} element={<MyCollectionPie />} />

                                <Route path={userPath("/my-collection-team/:collectionId", () => `${myCollectionName} core team`, false, /\/my-collection-team\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, teamCrumb])} element={<MyCollectionTeam setSidebarState={setSidebarState} />} />
                                <Route path={userPath("/my-collection-add-teammate/:collectionId", () => `Add teammate to ${myCollectionName}`, false, /\/my-collection-add-teammate\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, teamCrumb, () => crumb(() => `/my-collection-add-teammate/${myCollectionId}`, "Add teammate")])} element={<MyCollectionTeammate key={0} setSidebarState={setSidebarState} />} />
                                <Route path={userPath("/my-collection-teammate/:collectionId/:teammateId", () => `${myCollectionName} teammate`, false, /\/my-collection-teammate\/\d+\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, teamCrumb, teammateCrumb])} element={<MyCollectionTeammate key={1} setSidebarState={setSidebarState} setCrumbLabel={setTeammateName} />} />

                                <Route path={userPath("/my-collection-creators/:collectionId", () => `${myCollectionName} artists`, false, /\/my-collection-creators\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, creatorsCrumb])} element={<MyCollectionCreators setSidebarState={setSidebarState} />} />
                                <Route path={userPath("/my-collection-add-creator/:collectionId", () => `Add artist to ${myCollectionName}`, false, /\/my-collection-add-creator\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, creatorsCrumb, () => crumb(() => `/my-collection-add-creator/${myCollectionId}`, "Add artist")])} element={<MyCollectionCreator key={0} setSidebarState={setSidebarState} />} />
                                <Route path={userPath("/my-collection-creator/:collectionId/:creatorId", () => `${myCollectionName} artist`, false, /\/my-collection-creator\/\d+\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, creatorsCrumb, creatorCrumb])} element={<MyCollectionCreator key={1} setSidebarState={setSidebarState} setCrumbLabel={setCreatorName} />} />

                                <Route path={userPath("/my-collection-community/:collectionId", () => `${myCollectionName} community`, false, /\/my-collection-community\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, membersCrumb])} element={<MyCollectionCommunity setSidebarState={setSidebarState} />} />
                                <Route path={userPath("/my-collection-add-member/:collectionId", () => `Add collector to ${myCollectionName}`, false, /\/my-collection-add-member\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, membersCrumb, () => crumb(() => `/my-collection-add-member/${myCollectionId}`, "Add collector")])} element={<MyCollectionMember key={0} setSidebarState={setSidebarState} />} />
                                <Route path={userPath("/my-collection-member/:collectionId/:memberId", () => `${myCollectionName} collector`, false, /\/my-collection-member\/\d+\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, membersCrumb, memberCrumb])} element={<MyCollectionMember key={1} setSidebarState={setSidebarState} setCrumbLabel={setMemberName} />} />

                                <Route path={userPath("/my-collection-items/:collectionId", () => `${myCollectionName} NFTs`, false, /\/my-collection-items\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, itemsCrumb])} element={<MyCollectionItems setSidebarState={setSidebarState} />} />
                                <Route path={userPath("/my-collection-add-item/:collectionId", () => `Add NFT to ${myCollectionName}`, false, /\/my-collection-add-item\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, itemsCrumb, () => crumb(() => `/my-collection-add-item/${myCollectionId}`, "Add NFT")])} element={<MyCollectionItem key={0} setSidebarState={setSidebarState} />} />
                                <Route path={userPath("/my-collection-item/:collectionId/:itemId", () => `${myCollectionName} ${itemName}`, false, /\/my-collection-item\/\d+\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, itemsCrumb, itemCrumb])} element={<MyCollectionItem key={1} setSidebarState={setSidebarState} setCrumbLabel={setItemName} />} />

                                <Route path={userPath("/my-collection-add-batch/:collectionId", () => `Add batch to ${myCollectionName}`, false, /\/my-collection-add-batch\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, itemsCrumb, () => crumb(`/my-collection-add-batch/${myCollectionId}`, "Add batch")])} element={<MyCollectionAddBatchItems setSidebarState={setSidebarState} />} />

                                <Route path={userPath("/my-collection-options/:collectionId", () => `${myCollectionName} options`, false, /\/my-collection-options\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, () => crumb(() => `/my-collection-options/${myCollectionId}`, "Options")])} element={<MyCollectionOptions />} />
                                <Route path={userPath("/my-collection-rights/:collectionId", () => `${myCollectionName} rights & IP`, false, /\/my-collection-rights\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, () => crumb(`/my-collection-rights/${myCollectionId}`, "Rights & IP")])} element={<MyCollectionRights />} />
                                <Route path={userPath("/my-collection-deploy/:collectionId", () => `Deploy ${myCollectionName}`, false, /\/my-collection-deploy\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, () => crumb(`/my-collection-deploy/${myCollectionId}`, "Deploy")])} element={<MyCollectionDeploy />} />
                                <Route path={userPath("/my-collection-mint-on-chain/:collectionId", () => `Mint ${myCollectionName} on chain`, false, /\/my-collection-mint-on-chain\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, () => crumb(`/my-collection-mint-on-chain/${myCollectionId}`, "Mint on chain")])} element={<MyCollectionMintOnChain />} />
                                <Route path={userPath("/my-collection-finalize/:collectionId", () => `Finalize ${myCollectionName}`, false, /\/my-collection-finalize\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, () => crumb(`/my-collection-finalize/${myCollectionId}`, "Finalize")])} element={<MyCollectionFinalize />} />
                                <Route path={userPath("/my-collection-mint-stage/:collectionId", () => `Set mint stage of ${myCollectionName}`, false, /\/my-collection-mint-stage\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, () => crumb(`/my-collection-finalize/${myCollectionId}`, "Finalize")])} element={<MyCollectionMintStage />} />
                                <Route path={userPath("/my-collection-activity/:collectionId", () => `${myCollectionName} activity`, false, /\/my-collection-activity\/\d+/, [myCollectionsCrumb, myCollectionNameCrumb, () => crumb(`/my-collection-activity/${myCollectionId}`, "Activity")])} element={<MyCollectionActivity />} />

                                <Route path={userPath("/request-to-add-collection", "Request to add collection")} element={<RequestToAddCollection />} />

                                <Route path="*" element={<CallForAction title="Page not found 404" />} />
                              </Routes>
                            </main>
                            <CartView visible={cartViewIsVisible} setVisible={setCartViewIsVisible} />
                          </div>
                          {doRenderFooter ? <Footer /> : null}
                        </div>
                        <AppPopup visible={walletConnectPopupVisible} setVisible={() => setWalletConnectPopupVisible(false)} insideCls="connect-wallet-popup-content">
                          <ConnectWalletPopupContent connecting={connecting} handleConnectWallet={connectWalletAndLogin} setWalletConnectPopupVisible={setWalletConnectPopupVisible} />
                        </AppPopup>
                        <AppPopup visible={walletDisconnectPopupVisible} setVisible={() => setWalletDisconnectPopupVisible(false)} insideCls="connect-wallet-popup-content">
                          <DisconnectWalletPopupContent setWalletDisconnectPopupVisible={setWalletDisconnectPopupVisible} />
                        </AppPopup>
                        <AppPopup visible={txFailed} setVisible={hideTxFailedPopup} insideCls="notice-popup-content">
                          <div className="notice-popup-content">
                            <FontIcon name="cancel-circle-full" onClick={hideTxFailedPopup} moreCls="close-popup-x" />
                            <TextPhrase isTitle={true}>Transaction failed!</TextPhrase>
                            <TextPhrase isMain={false} padTop={true} doRender={!!txFailedSubject}>{txFailedSubject}</TextPhrase>
                            {txFailedImg !== null && <div className="ta-c pt-2">
                              <div className="card">
                                <img src={txFailedImg} alt="" />
                              </div>
                            </div>}
                            <TextPhrase fieldText={true} padTop={true}>Please try again</TextPhrase>
                            <FormContainer>
                              <button className="primary" onClick={hideTxFailedPopup}>Close</button>
                            </FormContainer>
                          </div>
                        </AppPopup>
                        <BuySuccessPopup visible={buySuccessPopupVisible} setVisible={setBuySuccessPopupVisible} />
                      </CollectionPageContext.Provider>
                    </CollectionProgressBarContext.Provider>
                  </SidebarContext.Provider>
                </CartContext.Provider>
              </TradeContext.Provider>
            </MyCollectionContext.Provider>
          </CollectionContext.Provider>
        </AuthContext.Provider>
      </InviteContext.Provider>
    </TxFailedContext.Provider>
  )
}