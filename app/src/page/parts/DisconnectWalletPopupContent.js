import logo from '../../img/logo.svg'
import './connect-wallet.scss'
import { useContext, useEffect, useState } from 'react'
import AuthContext from '../../ctx/Auth'
import { useNavigate } from 'react-router'

export default function DisconnectWalletPopupContent({ setWalletDisconnectPopupVisible }) {
	const { accounts: accountAddress, logout } = useContext(AuthContext)
	const navigate = useNavigate()
	const [balance, setBalance] = useState(Number(0).toFixed(4))

	useEffect(() => {
		if (accountAddress) {
			window.ethereum?.request({ method: 'eth_getBalance', params: [accountAddress] }).then(wei => setBalance((parseInt(wei) / 1e18).toFixed(4)))
		}
	}, [accountAddress])

	const handleDisconnect = async () => {
		await logout()
		setWalletDisconnectPopupVisible(false)
		navigate("/")
	}

	const seeItems = () => {
		setWalletDisconnectPopupVisible(false)
		navigate("/my-collected-items")
	}

	return (
		<div className="connect-wallet-popup-content">
			<div className="ta-c"><img src={logo} alt="" width={96} /></div>
			<div className="connect-wallet--call-for-action">You are connected with<div style={{ fontSize: '50%', textTransform: 'lowercase' }}>{accountAddress}</div></div>
			<div className="ta-c">
				<div style={{ fontSize: 48, lineHeight: "48px" }}>{balance}</div>
				<div style={{ fontSize: 18, lineHeight: "48px", textTransform: 'uppercase' }}>ETH in wallet</div>
			</div>
			<div className="connect-wallet-buttons">
				<button className="secondary" onClick={seeItems}>See items</button>
				<button className="primary" onClick={handleDisconnect}>Disconnect</button>
			</div>
		</div>
	)
}
