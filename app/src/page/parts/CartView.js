import './cartview.scss'
import { useContext, useEffect, useState } from "react";
import CartContext from "../../ctx/Cart";
import emptyCart from '../../img/empty-cart.svg'
import { toast } from 'react-toastify';
import FontIcon from '../../fontIcon/FontIcon';
import CollectionItemSourceMarket from './CollectionItemSourceMarket';
import AuthContext from '../../ctx/Auth';
import { getMarketContract } from '../../frontend/contractsData/addresses'
import { toastNoWeb3Support } from '../../util/toasts';
import { SaveButton } from './SaveButton';
import { updateBoughtItems } from '../../func/liveCollections';
import { itemStatusToListingStatus } from '../../util/itemStatus';
import TxFailedContext from '../../ctx/TxFailedContext';
import { CardImageSpecs, getOptimizeImgUrl } from '../../util/optimizedImages';

export default function CartView({ visible, setVisible }) {
	const { setTxFailedData } = useContext(TxFailedContext)
	const { cart, cartTotalETH, cartTotalUSD, clearCartClick } = useContext(CartContext)
	const { cartMarketFee, cartMarketFeeUSD, cartMarketFeeETH } = useContext(CartContext)
	const itemsInCart = cart?.items?.length || 0
	const cartHasItems = itemsInCart > 0
	const [processingBuy, setProcessingBuy] = useState(false)
	const { accounts: accountAddress } = useContext(AuthContext)

	useEffect(() => {
		if (visible && !processingBuy) {
			const bodyClick = function (e) {
				const { target: t } = e
				if (t.classList.contains('cart-toggler') || t.classList.contains('cartview') || t.closest('.cartview')) {

				} else {
					setVisible(false)
				}
			}
			document.body.addEventListener('click', bodyClick)
			return () => {
				document.body.removeEventListener('click', bodyClick)
			}
		}
	}, [visible, setVisible, processingBuy])

	const buyNowClick = async () => {
		if (!window.ethereum) {
			toastNoWeb3Support()
			return
		}
		if (!accountAddress) {
			toast("Please connect your wallet")
			return
		}
		const doBuy = async () => {
			setProcessingBuy(true)
			const { BigNumber } = await import('ethers')

			const toWei = (num) => {
				const bn = BigNumber.from(Math.round(num * 1e18).toString())
				return bn
			}

			try {
				const cartTotal = parseFloat(cartTotalETH())
				const ethAmount = toWei(cartTotal)
				const nftContracts = cart.items.map(i => i.contract_address)
				const tokenIds = cart.items.map(i => i.id)
				const listingStatuses = cart.items.map(i => itemStatusToListingStatus(i.status))
				const sellers = cart.items.map(i => i.seller)
				const prices = cart.items.map(i => toWei(i.salePrice))
				const conductKeys = cart.items.map(i => i.conductKey)
				const marketContract = await getMarketContract()
				console.log('createBulkMarketSale: nftContracts, tokenIds, listingStatuses, sellers, prices, conductKeys', nftContracts, tokenIds, listingStatuses, sellers, prices, conductKeys)
				console.log('createBulkMarketSale: from, value', accountAddress, ethAmount)
				await marketContract.methods.createBulkMarketSale(nftContracts, tokenIds, listingStatuses, sellers, prices, conductKeys).send({ from: accountAddress, value: ethAmount })
				await updateBoughtItems(cart.items.map(({ contract_address: nftAddress, id: tokenId }) => ({ nftAddress, tokenId })))

				clearCartClick(cart.items)
				setVisible(false)
			} catch (e) {
				const i0 = cart.items[0]
				setTxFailedData('Purchase could not be completed', getOptimizeImgUrl(i0.file, CardImageSpecs, i0.mimeType))
				throw e
			} finally {
				setProcessingBuy(false)
			}
		}
		await doBuy()
	}

	return (
		<div className={"cartview" + (visible ? " visible" : "")}>
			<div className="cartview-header">
				<span><span className={"bold" + (itemsInCart > 0 ? " good" : "")}>{itemsInCart}</span> item{itemsInCart === 1 ? '' : 's'} in cart</span>
				{cartHasItems && <button className="secondary" style={{ marginLeft: 'auto' }} onClick={() => clearCartClick()}>Clear</button>}
			</div>
			<div className="cartview-items">
				{cartHasItems ? cart.items.map((item, idx) => <CartItemView key={idx} item={item} idx={idx} />) : <img src={emptyCart} alt="" className="empty-cart" />}
			</div>
			{cartHasItems && (
				<div className="cartview-fees-and-total">
					{/* <PriceLine title="Estimated gas fee" eth={cart.estimatedGasFeeETH} usd={cart.estimatedGasFeeUSD} /> */}
					<PriceLine title={`${process.env.REACT_APP_NAME} fee`} eth={cartMarketFeeETH()} usd={cartMarketFeeUSD()} doRender={cartMarketFee > 0} />
					{/* TODO when implemented by yul - saves gas */}
					{/* <PriceLine title="Market savings" eth={cart.marketSavingsETH} usd={cart.marketSavingsUSD} /> */}
					<div className="cartview-total-separator"></div>
					<PriceLine title="Total" eth={cartTotalETH()} usd={cartTotalUSD()} black={true} />
				</div>
			)}
			<div className="cartview-footer">
				<SaveButton disabled={!cartHasItems || processingBuy} saving={processingBuy} onClick={async () => await buyNowClick()} text="Buy now" />
			</div>
		</div>
	)
}

function PriceLine({ title, eth, usd, black, doRender = true }) {
	if (!doRender) return null
	return (
		<div className={"priceline" + (black ? " black" : "")}>
			<label>{title}</label>
			<span><FontIcon name="eth" inline={true} />{eth || "0.00"}</span>
			<span><FontIcon name="dollar" inline={true} />{usd || "0.00"}</span>
		</div>
	)
}

// TODO relevant when buying an NFT listed on external market 
// const marketFeeUSDDemo = 35

function CartItemView({ item, idx }) {
	const { removeFromCart } = useContext(CartContext)
	return (
		<div className="cartitemview">
			<FontIcon name="cancel-circle-full" onClick={() => removeFromCart(idx)} />
			<span className="cartitemview-img-ct">
				<img src={item.cached_images?.tiny_100_100 || item.image} alt="" className="cartitemview-img" />
				<CollectionItemSourceMarket sourceMarket={item.sourceMarket} />
			</span>
			<span className="cartitemview-column" style={{ flex: 1 }}>
				<span className="main token-name">{item.token_name}</span>
				<span className="sub">{item.collectionName}</span>
				{/* TODO relevant when buying an NFT listed on external market */}
				{/* <span className="fee">Source market transaction fee (included)</span> */}
			</span>
			<span className="cartitemview-column ta-r">
				<span className="main">{item.priceETH}{item.priceETH && <FontIcon name="eth" inline={true} />}</span>
				<span className="sub">{item.priceUSD}{item.priceUSD && <FontIcon name="dollar" inline={true} />}</span>
				{/* TODO relevant when buying an NFT listed on external market */}
				{/* <span className="fee">~{item.marketFeeUSD || marketFeeUSDDemo}<FontIcon name="dollar" inline={true} /></span> */}
			</span>
		</div>
	)
}