import { CardImageSpecs } from '../../util/optimizedImages';
import FormContainer from './FormContainer';

export function UserProfileFields({ control, onFileRemoved }) {
	return (
		<FormContainer>
			{control({ label: "Name", name: "name" })}
			{control({ label: "Email", name: "email" })}
			{control({ label: "Twitter (handle or link)", name: "twitter", placeholder: "https://twitter.com/@..." })}
			{control({ label: "Profile image", name: "profileImage", type: "file", onFileRemoved: onFileRemoved, imageSize: CardImageSpecs })}
			{control({ label: "A little about yourself or your team (optional)", name: "desc", type: "textarea" })}
			{control({ label: "Video link (YouTube/Vimeo - optional)", name: "videoLink" })}
			{control({ label: "Discord ID", name: "discord", placeholder: "Username#_ _ _ _" })}
			{control({ label: "Tik Tok (handle or link)", name: "tiktok", placeholder: "https://tiktok.com/@..." })}
			{control({ label: "YouTube channel", name: "youtube", placeholder: "https://youtube.com/..." })}
			{control({ label: "Instagram (handle or link)", name: "instagram", placeholder: "https://instagram.com/@..." })}
			{control({ label: "Website/linktree", name: "website", placeholder: "https://..." })}
			{control({ label: "Wallet", name: "walletAddress" })}
		</FormContainer>
	);
}
