import FontIcon from '../../fontIcon/FontIcon';

export function Collapser({ title, collapsed, setCollapsed }) {
	return <h2 className={"as-form-container collapser" + (collapsed ? " collapsed" : "")} onClick={() => setCollapsed(b => !b)}><FontIcon name="down-arrow" moreCls="collapse-arrow" /> {title}</h2>;
}
