export function TimeAgo({ value, label }) {
	return (
		<span className="flex-column">
			<span className="bold">{value}</span>
			<span>{label}</span>
		</span>
	);
}
