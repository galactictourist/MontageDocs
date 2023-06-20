import { useEffect, useState } from "react";
import FontIcon from '../../fontIcon/FontIcon';
import TextPhrase from './TextPhrase';
import FormContainer from "./FormContainer";
import { AppControl } from "./AppControl";
import { isValidEmail } from "../../util/isValidEmail";

export function RequestEmail({ setEmail, setRequestedToBeNotified, doRender = true, requestEmailPhrase = "Add your email so we’ll keep you in the loop when holder royalties are waiting for you" }) {
	const [innerEmail, setInnerEmail] = useState(null);
	const [validationMsg, setValidationMsg] = useState(null);
	const [isLiveValidation, setIsLiveValidation] = useState(false);
	const doRequest = () => {
		if (isValidEmail(innerEmail)) {
			setIsLiveValidation(false);
			setValidationMsg(null);
			setRequestedToBeNotified(true);
			setEmail(innerEmail);
		} else {
			setValidationMsg("Enter a valid email address");
			setIsLiveValidation(true);
		}
	};
	useEffect(() => {
		if (isLiveValidation) {
			const isValid = isValidEmail(innerEmail);
			setValidationMsg(isValid ? null : "Enter a valid email address");
			if (isValid)
				setIsLiveValidation(false);
		}
	}, [innerEmail, isLiveValidation]);
	if (!doRender)
		return null;
	return (
		<FormContainer>
			<TextPhrase fieldText={true}>{requestEmailPhrase}</TextPhrase>
			<AppControl type="text" subtype="email" maxLength={50} placeholder="Your email..." style={{ marginTop: -16 }}
				value={innerEmail} setValue={setInnerEmail} validationMsg={validationMsg}
				onKeyUp={e => e.key === "Enter" && doRequest()}
				fieldOverlay={<FontIcon onClick={doRequest} name="down-arrow" asFabButton={true} moreFabCls="primary rotate-270 smaller" inline={true} />} />
		</FormContainer>
	);
}
