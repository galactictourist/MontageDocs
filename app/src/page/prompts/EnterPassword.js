import './prompts.scss'
import FormContainer from '../parts/FormContainer'
import { AppControl } from '../parts/AppControl'
import { useState } from 'react'
import { toast } from 'react-toastify'

export default function EnterPassword({ validPwd, setValidPwdEnteredYet }) {
	const [pwd, setPwd] = useState('')
	const checkPwdClick = () => {
		if (pwd === validPwd) {
			setValidPwdEnteredYet(true)
		} else {
			toast('Wrong password...')
		}
	}
	return (
		<div className="centered-prompt">
			<h2>This page is password protected</h2>
			<FormContainer>
				<p>Please enter password:</p>
				<AppControl type="password" name="pwd" setValue={setPwd} value={pwd} label="Password" />
				<button className="primary" onClick={checkPwdClick}>Login</button>
			</FormContainer>
		</div>
	)
}