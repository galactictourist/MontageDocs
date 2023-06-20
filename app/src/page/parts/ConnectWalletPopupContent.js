import logo from '../../img/logo.svg'
import './connect-wallet.scss'
import metamask from '../../img/metamask.png'
// import coinbaseWallet from '../../img/coinbase-wallet.png'
// import walletConnect from '../../img/wallet-connect.png'
import Spinner from '../../util/Spinner'
import { METAMASK/*, COINBASE*/ } from '../../web3/adapters'
// import { METAMASK, COINBASE, WALLET_CONNECT_V1 } from '../../web3/adapters'
import { TermsPhrase } from './TermsPhrase'
import { HookMeUp } from './HookMeUp'
// import { isDesktopByMatchMedia, isMobileByMatchMedia } from '../../util/isDesktopByMatchMedia'
import TextPhrase from './TextPhrase'
import FormContainer from './FormContainer'

export default function ConnectWalletPopupContent({ connecting, adapterType, handleConnectWallet, setWalletConnectPopupVisible }) {
	const isDesktop = true
	const isMobile = false
	// const isDesktop = isDesktopByMatchMedia()
	// const isMobile = isMobileByMatchMedia()
	return (
		<div className="connect-wallet-popup-content">
			<div className="ta-c"><img src={logo} alt="" width={96} /></div>
			<div className="connect-wallet--call-for-action">{isDesktop ? "Connect your wallet" : "Please connect via desktop"}</div>
			<TextPhrase doRender={isMobile} fieldText={true}>Montage's mobile experience is on its way and will be available later this week. Until then, please connect via desktop.</TextPhrase>
			<FormContainer doRender={isMobile} cls="pt-0">
				<button onClick={() => setWalletConnectPopupVisible(false)} className="primary">Back</button>
			</FormContainer>
			{isDesktop && <div className="connect-wallet-buttons">
				<button className="connect-wallet-button" disabled={connecting} onClick={async () => await handleConnectWallet("getMetamaskAdapter", METAMASK)}>
					<img src={metamask} alt="MetaMask" /> MetaMask {connecting && adapterType === METAMASK && <Spinner />}
				</button>
				{/* <button className="connect-wallet-button" disabled={connecting} onClick={async () => await handleConnectWallet("getCoinbaseAdapter", COINBASE)}>
					<img src={coinbaseWallet} alt="Coinbase wallet" /> Coinbase wallet {connecting && adapterType === COINBASE && <Spinner />}
				</button> */}
				{/* <button className="connect-wallet-button" disabled={connecting} onClick={async () => await handleConnectWallet("getWalletConnectV1Adapter", WALLET_CONNECT_V1)}>
					<img src={walletConnect} alt="WalletConnect" /> WalletConnect {connecting && adapterType === WALLET_CONNECT_V1 && <Spinner />}
				</button> */}
			</div>}
			{isDesktop && <HookMeUp />}
			{isDesktop && <TermsPhrase />}
		</div>
	)
}