import './stats-percent.scss'

export default function StatsPercent({ pct }) {
	return <span className={"percent" + (pct >= 0 ? " positive" : " negative")}>{pct > 0 ? '+' : ''}{pct}%</span>
}