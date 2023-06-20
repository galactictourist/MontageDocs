import FontIcon from '../../fontIcon/FontIcon'
import { AppControl } from './AppControl'
import './flyout-list.scss'

export default function PropOptionFilter({ prop, propsFilter, setPropsFilter }) {
	const { options, id: propId } = prop
	const findIndex = (optionId) => options?.findIndex(option => option.id === optionId)
	const propFilter = propsFilter[propId] || {}
	const getSetValue = (optionId) => (isOn) => setPropsFilter(props => ({ ...props, [propId]: { ...props[propId], [optionId]: isOn } }))
	const getOptionList = () => options?.map((option, idx) => <AppControl type="checkbox" name={prop.name + '-' + option.name} toggleTitle={option.name} value={propFilter[option.id]} setValue={getSetValue(option.id)} key={idx} />) || []
	const getCheckedOptions = () => Object.keys(propFilter)
		.filter(optionId => propFilter[optionId] === true)
		.map(optionId => options[findIndex(parseInt(optionId))]?.name)
		.filter(name => name?.trim().length > 0)
		.join(', ')
	return (
		<div className="prop-filter">
			<label>{prop.name}</label>
			<div className="flyout-list-ct">
				<span className="selected-text">{getCheckedOptions() || 'Any'}</span>
				<FontIcon name="down-arrow" inline={true} />
				<span className="flyout-list">{getOptionList()}</span>
			</div>
		</div>
	)
}
