import Tooltip from 'rc-tooltip'
import './sidebar.scss'
import { Link, useLocation } from 'react-router-dom';
import { RolesMap } from "../../util/roles"
import AuthContext from "../../ctx/Auth"
import { useContext } from "react"
import FontIcon from '../../fontIcon/FontIcon';
import CollectionStatusMap from "../../util/collectionStatus";
import MyCollectionContext from '../../ctx/MyCollection';
import Beta from './Beta';
import { isDesktopByMatchMedia, isMobileByMatchMedia } from '../../util/isDesktopByMatchMedia';
import SidebarContext from '../../ctx/Sidebar';
import { appConfig } from '../../app-config';

export default function Sidebar() {
	const { sidebarState, sidebarChanging, isClickToOpenSideBar } = useContext(SidebarContext)
	const { isAdmin, userId, isImpersonating } = useContext(AuthContext)
	const { myCollectionId, myCollectionRoles, myCollectionStatus, isImportExistingCollection } = useContext(MyCollectionContext)
	const { pathname } = useLocation()
	const [first, second] = pathname.substring(1).split('/')
	const collectionId = first.startsWith('collection-') ? second : ''

	if (!collectionId && !userId) return null

	const isCurator = () => (myCollectionRoles & RolesMap.curator) > 0
	const isPartner = () => (myCollectionRoles & RolesMap.partner) > 0
	const isCreator = () => (myCollectionRoles & RolesMap.creator) > 0
	const isMyCollectionLive = () => myCollectionStatus === CollectionStatusMap.live
	const collectionPageLink = () => myCollectionId ? `/collection-page/${myCollectionId}` : null

	return (
		<aside className={"sidebar" + ((sidebarState > 0 && isDesktopByMatchMedia()) || (isClickToOpenSideBar && isMobileByMatchMedia()) ? "" : " closed") + (sidebarChanging ? " changing" : "")}>
			{collectionId && (
				<>
					<SidebarLink to={`/collections/${collectionId}`} iconName="details" label="Story" />
					<SidebarLink to={`/collections/${collectionId}/pie`} iconName="pie" label="Rev-share" />
					<SidebarLink to={`/collections/${collectionId}/items`} iconName="nft" label="Items" />
				</>
			)}
			{!collectionId && isAdmin && !isImpersonating &&
				<>
					<SidebarLink to="/my-profile" iconName="profile-menu" label="Profile" />
					<SidebarLink to={`/my-earnings`} iconName="dollar" label="Earnings" tip="View earnings, royalties & withdraw funds" />
					<SidebarLink to={`/my-collected-items`} iconName="nft" label="Collected" tip="Browse your NFTs" />
					<Splitter />
					<SidebarLink to="/admin" iconName="team" label="Users" />
					<SidebarLink to="/admin/add-curator" iconName="plus-full" label="Add curator" />
					<SidebarLink to="/admin/invite-tester" iconName="invitation" label="Invite tester" />
					<SidebarLink to="/admin/referrals" iconName="profile-menu" label="Referrals" />
					<SidebarLink to="/admin/scan-chain" iconName="profile-menu" label="Scan chain" />
				</>
			}
			{(!collectionId && userId && (!isAdmin || isImpersonating)) &&
				<>
					{!myCollectionId && (
						<>
							<SidebarLink to={`/`} iconName="search" label={<>Launchpad<Beta /></>} tip="Helping the community launch new types of collections" />
							<SidebarLink to={`/market`} iconName="search" label="Private markets" tip="Create your own private marketplace" />
							<Splitter />
							<SidebarLink to={`/my-collections`} iconName="collections" label="My collections" tip="Create & edit your collections" />
							<SidebarLink to={`/my-items-created`} iconName="nft" label="Items I created" tip="Browse & edit your NFTs" />
							<SidebarLink to={`/my-activity`} iconName="activity" label="Activity updates" tip="View activities related to you and your collections" />
							<SidebarLink to={`/my-earnings`} iconName="dollar" label="Earnings" tip="View earnings, royalties & withdraw funds" />
							<Splitter />
							<SidebarLink to={`/my-collected-items`} iconName="nft" label="Collected" tip="Browse your NFTs" />
							{appConfig.offers && <SidebarLink to={`/my-offers`} iconName="nft" label="Offers" tip="Accept/decline buy offers I received" />}
							<SidebarLink to={`/my-following`} iconName="nft" label="Following" disabled={true} tip="Items & collections you follow" />
							<Splitter />
							<SidebarLink to={`/my-profile`} iconName="profile-menu" label="Profile" tip="Update your profile" />
							<SidebarLink to={`/my-wallets`} iconName="crypto-wallet" label="Wallets" tip="Manage your wallets" disabled={true} />
							<SidebarLink to={`/my-notifications`} iconName="notifcations" label="Notifications" disabled={true} tip="We'll send you notifications & alerts" />
							{isAdmin && <SidebarLink to={`/my-permissions`} iconName="permissions" label="Permissions" tip="Your permissions" />}
							{isAdmin && <SidebarLink to={`/admin/invite-curator?curatorUserId=${userId}`} iconName="invitation" label="Invite curator (S)" tip="Only admins see this option - as admin you can invite curators that you are in their account right now." />}
						</>
					)}
					{myCollectionId && (
						<>
							<SidebarLink to={`/my-collection-general/${myCollectionId}`} iconName="story" label="General" tip="Edit name, images & description of colleciton" />
							{(isCurator() || isPartner()) && <SidebarLink to={`/my-collection-team/${myCollectionId}`} iconName="team" label="Core team" tip="Assemble your team" />}
							{!isImportExistingCollection && isCurator() && <SidebarLink to={`/my-collection-creators/${myCollectionId}`} iconName="creator" label="Artists" tip="Invite & manage artists" />}
							<SidebarLink to={`/my-collection-pie/${myCollectionId}`} iconName="pie" label="Rev-share" tip="Edit revenue share of minting & secondary sales" />
							{!isImportExistingCollection && <Splitter />}
							{!isImportExistingCollection && <SidebarLink to={`/my-collection-story/${myCollectionId}`} iconName="story" label="Pages" tip="Edit your collection pages & story" />}
							{!isImportExistingCollection && (isCurator() || isPartner()) && <SidebarLink to={`/my-collection-community/${myCollectionId}`} iconName="community" label="Collectors" tip="Add or invite your allowlist & collectors" />}
							{!isImportExistingCollection && <Splitter />}
							{!isImportExistingCollection && (isCurator() || isCreator()) && <SidebarLink to={`/my-collection-add-item/${myCollectionId}`} iconName="plus-full" label="Add NFT" tip="Add your NFTs item by item" />}
							{!isImportExistingCollection && isCurator() && <SidebarLink to={`/my-collection-add-batch/${myCollectionId}`} iconName="plus" label="Add batch" tip="Add your NFTs in batches" />}
							{!isImportExistingCollection && <SidebarLink to={`/my-collection-items/${myCollectionId}`} iconName="nft" label="Collection items" tip="Edit & approve the items in this collection" />}
							<Splitter />
							{!isImportExistingCollection && isCurator() && <SidebarLink to={`/my-collection-options/${myCollectionId}`} iconName="options" label="Markets" tip="Choose markets that respect & enfoce creator royalties" />}
							{!isImportExistingCollection && isCurator() && <SidebarLink to={`/my-collection-rights/${myCollectionId}`} iconName="collection-status" label="Rights & IP" tip="Choose the rights you want to give collectors" />}
							{isCurator() && <SidebarLink to={`/my-collection-deploy/${myCollectionId}`} iconName="collection-status" label="Deploy contract" tip="Make it real - deploy your contract & collection on the blockchain" />}
							{!isImportExistingCollection && isCurator() && <SidebarLink to={`/my-collection-mint-on-chain/${myCollectionId}`} iconName="collection-status" label="Mint on chain" tip="Self mint with 0 price" />}
							{!isImportExistingCollection && isCurator() && <SidebarLink to={`/my-collection-finalize/${myCollectionId}`} iconName="collection-status" label="Finalize" tip="Upload newly added NFTs to never-changing storage" />}
							{!isImportExistingCollection && isCurator() && <SidebarLink to={`/my-collection-mint-stage/${myCollectionId}`} iconName="collection-status" label="Activate mint" tip="Set mint stage manually on the nft contract" />}
							<SidebarLink to={`/my-collection-activity/${myCollectionId}`} iconName="activity" label="Activity" tip="View all collection activities" />
							{!isImportExistingCollection && (isCurator() || isPartner() || isMyCollectionLive()) && <SidebarLink to={(isImpersonating ? `/login-as?key=${window.qsKey}&next=${collectionPageLink()}` : collectionPageLink())} iconName="openlink" label="Preview page" target="_blank" tip="Open the collection preview page" />}
						</>
					)}
				</>
			}
		</aside>
	)
}

function SidebarLink({ to, iconName, label, target, disabled, tip }) {
	const location = useLocation()
	const { setIsClickToOpenSideBar } = useContext(SidebarContext)
	const onClick = () => {
		if (isMobileByMatchMedia()) {
			setIsClickToOpenSideBar(false)
		}
	}
	const link = () => (
		<Link to={to} target={target} className={"sidebar-link" + (to === location.pathname ? " selected" : "")} disabled={disabled} onClick={onClick}>
			<FontIcon name={iconName} />
			<span>{label}</span>
		</Link>
	)

	return tip ? <Tooltip overlayClassName="app-tooltip" overlay={tip} transitionName="rc-tooltip-zoom" placement="right" offsetX={0} offsetY={0} destroyTooltipOnHide={true} >{link()}</Tooltip> : link()
}

function Splitter() {
	return <div className="sidebar-splitter"></div>
}