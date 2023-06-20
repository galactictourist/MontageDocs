import FontIcon from "../../fontIcon/FontIcon"

export default function FollowUs({ label, marginTop, subLabel, href }) {
	return (
		<div className="ta-c" style={{ marginTop }}>
			{label && <div className="follow-us">{label}</div>}
			<div style={{ marginTop: "1em" }}>
				<a href={href || "https://twitter.com/montageDapp"} target="_blank" rel="noreferrer" className="colorfull-twitter"><FontIcon name="twitter" /></a>
			</div>
			{subLabel && <div className="follow-us" style={{ margin: '1em' }}>{subLabel}</div>}
		</div>
	)
}