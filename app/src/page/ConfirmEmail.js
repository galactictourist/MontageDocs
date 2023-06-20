import { decrypt } from "../func/crypto";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { updateUser } from "../func/users";
import TextPhrase from "./parts/TextPhrase";
import Loading from "./prompts/Loading";
import AuthContext from "../ctx/Auth";
import FormContainer from "./parts/FormContainer";

export default function ConfirmEmail() {
	const { userId: authUserId } = useContext(AuthContext)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const { key } = useParams()
	useEffect(() => {
		if (key && authUserId) {
			decrypt(key).then(s => {
				const args = JSON.parse(s)
				// eslint-disable-next-line 
				if (args?.userId == authUserId) {
					updateUser(authUserId, { emailConfirmed: true }).then(() => {
						setLoading(false)
					})
				} else {
					setLoading(false)
					setError(<FormContainer>
						<TextPhrase isMain={true} padTop5={true}>Email was not confirmed:</TextPhrase>
						<TextPhrase fw400={400}>Authenticated user doesn't match confirmed user</TextPhrase>
					</FormContainer>)
				}
			})
		}
	}, [key, authUserId])

	if (!authUserId) return <FormContainer><TextPhrase isMain={true} padTop5={true}>To confirm your email please connect wallet</TextPhrase></FormContainer>
	if (loading) return <Loading />
	if (error) return error
	return (
		<FormContainer>
			<TextPhrase isMain={true} padTop5={true}>YOUR EMAIL WAS SUCCESSFULLY CONFIRMED</TextPhrase>
			<TextPhrase padTop={true} fw400={true}>Thanks for signing up to receive updates on new earnings, royalties and collections on our platform</TextPhrase>
		</FormContainer>
	)
}