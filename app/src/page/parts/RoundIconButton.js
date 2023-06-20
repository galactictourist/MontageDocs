import FontIcon from "../../fontIcon/FontIcon"
import './round-icon-button.scss'

export default function RoundIconButton({ icon, label, isSelected, ...rest }) {
	return <span {...rest} className={"round-icon-button" + (isSelected ? " selected" : "")}>{icon ? <FontIcon name={icon} /> : label}</span>
}