import { Link } from 'react-router-dom'
import { ScheduleStages, ScheduleStagesTexts } from '../../util/scheduleStages'
import './tabs.scss'

export const TRADE_TABS = {
	ITEMS: { id: "items-tab", label: "Items" },
	SALES: { id: "sales-tab", label: "Sales" },
	OFFERS: { id: "offers-tab", label: "Offers" },
	TRANSFERS: { id: "transfers-tab", label: "Transfers" },
	MINTS: { id: "mints-tab", label: "Mints" },

	INFO: { id: "info-tab", label: "Info" },
}

export const PIE_TABS = {
	MINT: { id: "mint-tab", label: "At mint" },
	SECONDARY: { id: "secondary-tab", label: "At secondary sales" },
}

export const PAGE_TABS = {
	ABOUT: { id: "about", label: "About" },
	NO_MINT_YET: { id: "no-mint-yet", label: "Mint" },
	PREMINT: { id: "premint", label: "Private Mint" },
	MINT: { id: "mint", label: "Mint" },
	TRADE: { id: "trade", label: "Marketplace" },
	ROYALTIES: { id: "royalties", label: "Royalties" },
}

export const USER_TABS = {
	PROFILE: { id: "profile-tab", label: "Profile" },
	INVITE: { id: "invite-tab", label: "Invite" },
}

export const STORY_TABS = {
	ABOUT: { id: "about-tab", label: `${ScheduleStagesTexts[ScheduleStages.teaser]} page` },
	PREMINT: { id: "premint-tab", label: `${ScheduleStagesTexts[ScheduleStages.premint]} page` },
	MINT: { id: "mint-tab", label: `${ScheduleStagesTexts[ScheduleStages.mint]} page` },
	MARKET: { id: "market-tab", label: `Market page` },
}

export default function TabButtons({ tabContentId, setTabContentId, buttons, moreCls, moreDisabled, style, getBasePath }) {
	return (
		<div className={`tab-buttons` + (moreCls ? " " + moreCls : "")} style={style}>
			{buttons?.filter(tb => !!tb).map((tb => <TabButton key={tb.id} tabId={tb.id} disabled={(moreDisabled && moreDisabled[tb.id]) || tb.disabled} label={tb.label} setTabContentId={setTabContentId} selectedTabContentId={tabContentId} getBasePath={getBasePath} />))}
		</div>
	)
}

export function TabButton({ label, selectedTabContentId, tabId, setTabContentId, disabled, getBasePath }) {
	const selected = selectedTabContentId === tabId
	const attrs = { disabled, className: "tab-button" + (selected ? " selected" : "") }
	const children = <>{label}<span className="selection-marker"></span></>
	return setTabContentId ? <span {...attrs} onClick={() => setTabContentId(tabId)}>{children}</span> : <Link to={(getBasePath ? getBasePath() : '') + '/' + tabId} {...attrs}>{children}</Link>
}
