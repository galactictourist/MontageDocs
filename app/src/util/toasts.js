import { toast } from 'react-toastify'

export function toastNoWeb3Support() {
	toast(<span>Web3 support not found.<br />Install <a href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en" target="_blank" rel="noreferrer">MetaMask</a>?</span>, { type: 'error' })
}

export function toastSaved() {
	toast('Saved successfully')
}

export function toastLiveCollection() {
	toast('Collection is on chain. Please contact us for assistance')
}

export function toastTBD(featureName) {
	toast('TBD feature' + (featureName ? ': ' + featureName : ''))
}