import { InstagramEmbed } from 'react-social-media-embed';
import { TwitterEmbed } from 'react-social-media-embed';
import { TikTokEmbed } from 'react-social-media-embed';

export function parseLinkAndGetEmbed(link) {
	const getEmbed = (EmbedComponent) => <div className="flex-row jc-c"><EmbedComponent url={link} width={325} /></div>;
	if (link.indexOf('twitter.com') > -1)
		return getEmbed(TwitterEmbed);
	if (link.indexOf('instagram.com') > -1)
		return getEmbed(InstagramEmbed);
	if (link.indexOf('tiktok.com') > -1)
		return getEmbed(TikTokEmbed);
}
