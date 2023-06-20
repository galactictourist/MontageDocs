import FontIcon from '../../fontIcon/FontIcon'
import './flyout-list.scss'
import greenCheckCircle from '../../img/collection-progress-bar/green-check-circle.svg'
import hourglass from '../../img/collection-progress-bar/hourglass.svg'
import '../../css/progress.scss'
import '../../css/collection-stage-progress.scss'
import CollectionProgressBarContext from '../../ctx/CollectionProgressBarContext'
import { useContext } from 'react'

export const NAME_AND_COVER_IMAGE_STAGE_IDX = 0
export const CORE_TEAM_STAGE_IDX = 1
export const ARTISTS_STAGE_IDX = 2
export const REV_SHARE_STAGE_IDX = 3
export const PAGES_STAGE_IDX = 4
export const ADDED_NFT_STAGE_IDX = 5
export const RIGHTS_AND_IP_STAGE_IDX = 6
export const SCHEDULE_STAGE_IDX = 7
export const SUBMIT_STAGE_IDX = 8

const stageTitles = ["Name & cover image", "Core team", "Artists", "Set rev-share", "Pages & story", "Added NFT", "Rights & IP", "Schedule", "Submitted"]
const totalStages = stageTitles.length

const getStagePoints = (stageIdx) => {
	const allPoints = 100
	const fullPoints = Math.floor(allPoints / (totalStages - 1))
	return stageIdx < totalStages - 1 ? fullPoints : allPoints - (fullPoints * (totalStages - 1))
}

const getPercentCompleted = (stageStates) => {
	let total = 0
	if (stageStates?.length > 0) {
		for (let stageIdx = 0; stageIdx < stageTitles.length; stageIdx++) {
			if (stageStates[stageIdx])
				total += getStagePoints(stageIdx)
		}
	}
	return total
}

const Stage = ({ title, isCompleted }) => <div className="collection-stage-progress"><img src={isCompleted ? greenCheckCircle : hourglass} alt="" /><span>{title}</span></div>

export function CollectionProgressBar() {
	const { getProgressStageStates } = useContext(CollectionProgressBarContext)
	const stageStates = getProgressStageStates()
	const percentCompleted = getPercentCompleted(stageStates)
	return (
		<div className="collection-progressbar-bar flyout-list-ct">
			<span className="flex-column">
				<span className="flex-row ai-c" style={{ columnGap: 8 }}>
					<span className="fw-700">{percentCompleted}%</span>
					<span>completed</span>
					<FontIcon name="down-arrow" inline={true} moreCls="flyout-down-arrow" style={{ marginLeft: 'auto' }} />
				</span>
				<progress value={percentCompleted} max={100} min={0} className="ok-green-style"></progress>
			</span>
			<span className="flyout-list">
				{stageTitles.map((title, idx) => <Stage key={idx} title={title} isCompleted={idx < stageStates?.length ? stageStates[idx] : false} />)}
			</span>
		</div>
	)
}
