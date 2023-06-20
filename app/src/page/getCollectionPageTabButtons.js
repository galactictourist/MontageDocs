import { ScheduleStages } from '../util/scheduleStages'
import TabButtons, { PAGE_TABS as TABS } from './parts/Tabs'
import { LookNFeelMap } from '../util/lookNfeel'

export function getCollectionPageTabButtons(values) {
	if (!values)
		return null
	const { isExternalCollection, currentScheduleStage, demoStageInt, selfMinted, lookNfeel, myOwnNavBGColor, tabContentId, getBasePath } = values
	const btns = isExternalCollection ? [TABS.TRADE] : [TABS.ABOUT, TABS.TRADE, TABS.ROYALTIES]
	if (!selfMinted && !isExternalCollection) {
		const stage = demoStageInt || currentScheduleStage || ScheduleStages.teaser
		switch (stage) {
			case ScheduleStages.teaser:
				btns.splice(1, 0, TABS.NO_MINT_YET)
				break
			case ScheduleStages.premint:
				btns.splice(1, 0, TABS.PREMINT)
				break
			case ScheduleStages.mint:
				btns.splice(1, 0, TABS.MINT)
				break
			default:
				break
		}
	}
	const style = { paddingTop: 14 }
	if (lookNfeel === LookNFeelMap.myOwn) {
		const color = myOwnNavBGColor || '#000000'
		style.backgroundColor = color
		if (color === '#000000')
			style.color = '#ffffff'
	}
	return btns.length > 1 ? <TabButtons buttons={btns} tabContentId={tabContentId} moreCls="jc-c" style={style} getBasePath={getBasePath} /> : null
}
