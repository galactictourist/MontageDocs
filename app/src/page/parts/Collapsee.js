export function Collapsee({ children, collapsed }) {
	return <div className={"content collapsee" + (collapsed ? " collapsed" : "")}>{children}</div>;
}
