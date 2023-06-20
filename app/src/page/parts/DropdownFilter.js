import './flyout-list.scss'
import RoundIconButton from "./RoundIconButton"

export default function DropdownFilter({ icons, labels, selected, setSelected, disabled }) {
	const getButtonList = () => {
		if (icons?.length > 0) {
			return icons.map((icon, idx) => <RoundIconButton onClick={() => setSelected(icon)} key={idx} icon={icon} isSelected={icon === selected} />)
		} else if (labels?.length > 0) {
			return labels.map((label, idx) => <RoundIconButton onClick={() => setSelected(label)} key={idx} label={label} isSelected={label === selected} />)
		}
		return []
	}

	const list = getButtonList()

	const getSelectedButton = () => {
		// console.log("list", list)
		const ix = list.findIndex(btn => btn.props.icon === selected || btn.props.label === selected)
		return list[ix] || list[0]
	}

	return <span className="flyout-list-ct" disabled={disabled}>{getSelectedButton()}<span className="flyout-list">{getButtonList()}</span></span>
}