import { useEffect, useState } from 'react'
import './collection-charts.scss'

const options = {
	responsive: true,
	plugins: {
		legend: {
			position: 'top',
		},
		title: {
			display: false,
			text: 'Chart.js Line Chart',
		},
	},
}

const getDataset = (label, positive, labels, data) => {
	return ({
		labels,
		datasets: [
			{
				label,
				data,
				borderColor: positive ? 'rgb(0, 189, 155)' : 'rgb(255, 71, 175)',
				backgroundColor: positive ? 'rgba(0, 189, 155, 0.25)' : 'rgba(255, 71, 175, 0.25)',
				fill: true
			}
		]
	})
}

export default function CollectionCharts({ collectionAddress }) {
	const [Line, setLine] = useState(null)
	const [chartElems, setChartElems] = useState(null)
	const [chartElemsRegistered, setChartElemsRegistered] = useState(false)
	useEffect(() => { import('react-chartjs-2').then(({ Line }) => setLine(Line)) }, [])
	useEffect(() => { import('chart.js').then(setChartElems) }, [])
	useEffect(() => {
		if (chartElems) {
			const { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } = chartElems
			Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)
			setChartElemsRegistered(true)
		}
	}, [chartElems])

	const [data, setData] = useState(null)
	useEffect(() => {
		if (collectionAddress) {
			fetch('https://api.quicknode.com/graphql', {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'x-api-key': 'QN_d61f98af965f46a2819fa075a245537c' },
				body: JSON.stringify({
					query: `query Ethereum($contractAddress: String!, $filter: CollectionOhlcvChartInput) {
  ethereum {
    collection(contractAddress: $contractAddress) {
      ohlcvChart(filter: $filter) {
				count
        volume
        timestamp
      }
    }
  }
}`, variables: { contractAddress: collectionAddress, filter: { interval: 'ONE_DAY' } }
				})
			})
				.then(res => res.json()).then(res => {
					const { data: { ethereum: { collection: { ohlcvChart: data } } } } = res
					const map = {}
					data.forEach(i => {
						const date = new Date(i.timestamp).toLocaleDateString()
						if (!map[date]) map[date] = { count: 0, volume: 0 }
						map[date].count += i.count
						map[date].volume += i.volume
					})
					Object.keys(map).forEach(date => map[date].avg = map[date].volume / map[date].count)
					setData(map)
				})
		}
	}, [collectionAddress])

	const getChart = (label, positive, key) => data ? <div className="chart-ct"><Line options={options} data={getDataset(label, positive, Object.keys(data), Object.values(data).map(v => v[key]))} /></div> : null

	if (!chartElems || !Line || !chartElemsRegistered) return null
	return (
		<div className="charts-ct">
			{getChart('PRICE', true, 'avg')}
			{getChart('SALES', true, 'count')}
			{getChart('VOLUME', true, 'volume')}
			{/* {getChart('AVAILABLITY -33%')} */}
			{/* {getChart('OWNERS -33%')} */}
			{/* {getChart('OFFERS -33%')} */}
		</div>
	)

}