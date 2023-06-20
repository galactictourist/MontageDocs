import emptyScreen from '../../img/m-empty-screen.png'

export default function NothingHereYet() {
	return (
		<div className="pt-5 ta-c">
			<img src={emptyScreen} alt="" width={256} />
			<div style={{ textTransform: 'uppercase', fontSize: 32, fontWeight: 600, paddingTop: '2em', color: '#7D7D7D' }}>Nothing to see here</div>
		</div>)
}