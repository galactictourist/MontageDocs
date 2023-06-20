import { useState } from "react"
import { useNavigate } from "react-router"
import { AppControl } from "./parts/AppControl"
import { createUser } from "../func/users"
import FormContainer from "./parts/FormContainer"
import { SaveButton } from "./parts/SaveButton"
import StickyButtonContainer from "./parts/StickyButtonContainer"
import { toastSaved } from "../util/toasts"
import { useNVarcharLimits } from "../util/useNVarcharLimits"
import Loading from "./prompts/Loading"

export default function AdminAddCurator() {
	const [data, setData] = useState({})
	const [saving, setSaving] = useState(false)
	const navigate = useNavigate()
	const { nvarcharLimits } = useNVarcharLimits("users")

	const postDataToStorage = async () => {
		setSaving(true)
		const d = { ...data, mayAddCollection: true }
		await createUser(d)
		setSaving(false)
		toastSaved()
		navigate('/admin')
	}

	if (nvarcharLimits == null) return <Loading />

	const control = ({ name, ...props }) => <AppControl maxLength={nvarcharLimits[name]} name={name} value={data[name]} setData={setData} {...props} />

	return (
		<FormContainer>
			{control({ name: "name", label: "Name" })}
			{control({ name: "email", label: "Email" })}
			{control({ name: "twitter", label: "Twitter (handle or link)", placeholder: "https://twitter.com/@..." })}
			<StickyButtonContainer>
				<SaveButton onClick={postDataToStorage} saving={saving} />
			</StickyButtonContainer>
		</FormContainer>
	)
}