import { useContext, useEffect, useState } from 'react';
import Loading from './prompts/Loading';
import StickyButtonContainer from './parts/StickyButtonContainer';
import { AppControl } from './parts/AppControl';
import { SaveButton } from './parts/SaveButton';
import FormContainer from './parts/FormContainer';
import AuthContext from '../ctx/Auth'
import { loadAdminForNotifications, loadUserProfile } from '../func/users';
import { sendRequestToAddCollection } from '../func/emails';

export default function RequestToAddCollection() {
	const { userId } = useContext(AuthContext)
	const [loading, setLoading] = useState(false)
	const [sending, setSending] = useState(false)
	const [sent, setSent] = useState(false)
	const [user, setUser] = useState({})
	const [data, setData] = useState({})

	useEffect(() => {
		(async (userId) => {
			setLoading(true)
			setUser(await loadUserProfile(userId))
			setLoading(false)
		})(userId)
		// eslint-disable-next-line
	}, [userId])

	const sendRequestToAdmin = async () => {
		setSending(true)
		const adminData = loadAdminForNotifications()
		await sendRequestToAddCollection(adminData, { ...user, userId }, data)
		setSending(false)
		setSent(true)
	}

	if (!userId) return null
	if (loading) return <Loading />

	const control = ({ name, ...props }) => <AppControl name={name} value={data[name]} setData={setData} {...props} />

	if (sent) {
		return <h2 className="ta-c pt-5"><span>Thank you!<br />Your request was sent<br />We will review it and let you know<br /><br />The {process.env.REACT_APP_NAME} team</span></h2>
	}
	return (
		<FormContainer>
			{control({ label: "Collection description", name: "collectionDesc", type: "textarea" })}

			<StickyButtonContainer>
				<SaveButton onClick={sendRequestToAdmin} saving={sending} text="Send the request to admin for review" />
			</StickyButtonContainer>
		</FormContainer>
	)
}