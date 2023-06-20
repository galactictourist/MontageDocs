import './manage-cart-item-button.scss'
import addToCart from '../../img/cart/add-to-cart.svg'
import inCart from '../../img/cart/in-cart.svg'
import removeFromCart from '../../img/cart/remove-from-cart.svg'

export default function ManageCartItemButton({ isInCart }) {
	return (
		<span className={"manage-cart-item-button" + (isInCart ? " is-in-cart" : "")}>
			<img className="add-to-cart" src={addToCart} alt="" />
			<img className="in-cart" src={inCart} alt="" />
			<img className="remove-from-cart" src={removeFromCart} alt="" />
		</span>
	)
}