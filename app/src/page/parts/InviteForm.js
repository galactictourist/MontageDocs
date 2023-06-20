import defaultProfileImage from '../../img/default-profile-image.svg';
import StickyButtonContainer from './StickyButtonContainer';
import { AppControl } from './AppControl';
import { getOptimizeImgUrl, ProfileImageSpecs } from '../../util/optimizedImages';
import FormContainer from './FormContainer';
import { toast } from 'react-toastify';

export function InviteForm({ name, profileImage, inviteLink, invitePrompt }) {
	const copyLinkClick = async () => {
		await navigator.clipboard.writeText(inviteLink)
		toast(`Copied ${inviteLink}`)
	}

	return (
		<FormContainer cls="ta-c">
			<div className="pt-2" style={{ textTransform: 'uppercase', fontWeight: 500 }}>Invite {name}</div>
			<div className="pt-2">
				<img src={getOptimizeImgUrl(profileImage, ProfileImageSpecs) || defaultProfileImage} alt="" style={{ borderRadius: '50%' }} />
			</div>
			<div className="pt-2">{invitePrompt}</div>
			<AppControl name="inviteLink" value={inviteLink} readOnly={true} />

			<StickyButtonContainer>
				<button className="primary" onClick={copyLinkClick}>Copy link</button>
			</StickyButtonContainer>
		</FormContainer>
	);
}
