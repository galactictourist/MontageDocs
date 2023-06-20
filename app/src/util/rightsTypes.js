export const RightsTypeMap = {
	personal: 1,
	commercial: 2,
	cc0: 3,
	cc_by: 4,
	cc_by_sa: 5,
	cc_by_nc: 6,
	cc_by_nc_sa: 7,
	cc_by_nd: 8,
	cc_by_nc_nd: 9,
	other: 100,
}

export const RightsTypeOptions = [
	{ value: RightsTypeMap.personal, text: 'Personal' },
	{ value: RightsTypeMap.commercial, text: 'Commercial' },
	{ value: RightsTypeMap.cc0, text: 'CC0' },
	{ value: RightsTypeMap.cc_by, text: 'CC BY' },
	{ value: RightsTypeMap.cc_by_sa, text: 'CC BY-SA' },
	{ value: RightsTypeMap.cc_by_nc, text: 'CC BY-NC' },
	{ value: RightsTypeMap.cc_by_nc_sa, text: 'CC BY-NC-SA' },
	{ value: RightsTypeMap.cc_by_nd, text: 'CC BY-ND' },
	{ value: RightsTypeMap.cc_by_nc_nd, text: 'CC BY-NC-ND' },
	{ value: RightsTypeMap.other, text: 'Other' },
]

export const RightsDesciption = {
	[RightsTypeMap.personal]: `Under a personal license, buyers can only use the NFT artwork for non-commercial purposes. For example, a collector can use the NFT as their profile picture on social media or display the art in their home using a digital frame, but holders can’t use their asset to make a profit, like selling prints of the artwork or using the artwork to create a spin-off book series.`,
	[RightsTypeMap.commercial]: `A commercial license allows a creator to designate some rights to a buyer while still retaining ownership and control of the IP. In some cases, this includes allowing the buyer to sell the NFT artwork on merchandise, creating a TV show with an NFT character or even plastering the image on a food truck, as seen with the BAYC and the Bored & Hungry restaurant.`,
	[RightsTypeMap.cc0]: `<a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer" class="primary">CC0</a> (aka CC Zero) is a public dedication tool, which allows creators to give up their copyright and put their works into the worldwide public domain. CC0 allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, with no conditions.`,
	[RightsTypeMap.cc_by]: `<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" class="primary">CC BY</a>: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use.<br/><br/>CC BY includes the following elements:<br/>BY – Credit must be given to the creator`,
	[RightsTypeMap.cc_by_sa]: `<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" class="primary">CC BY-SA</a>: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.<br/><br/>CC BY-SA includes the following elements:<br/>BY – Credit must be given to the creator<br/>SA – Adaptations must be shared under the same terms`,
	[RightsTypeMap.cc_by_nc]: `<a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noreferrer" class="primary">CC BY-NC</a>: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator.<br/>It includes the following elements:<br/>BY – Credit must be given to the creator<br/>NC – Only noncommercial uses of the work are permitted`,
	[RightsTypeMap.cc_by_nc_sa]: `<a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer" class="primary">CC BY-NC-SA</a>: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.<br/><br/>CC BY-NC-SA includes the following elements:<br/>BY – Credit must be given to the creator<br/>NC – Only noncommercial uses of the work are permitted<br/>SA – Adaptations must be shared under the same terms`,
	[RightsTypeMap.cc_by_nd]: `<a href="https://creativecommons.org/licenses/by-nd/4.0/" target="_blank" rel="noreferrer" class="primary">CC BY-ND</a>: This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, and only so long as attribution is given to the creator. The license allows for commercial use.<br/><br/>CC BY-ND includes the following elements:<br/>BY – Credit must be given to the creator<br/>ND – No derivatives or adaptations of the work are permitted`,
	[RightsTypeMap.cc_by_nc_nd]: `<a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" target="_blank" rel="noreferrer" class="primary">CC BY-NC-ND</a>: This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, for noncommercial purposes only, and only so long as attribution is given to the creator.<br/><br/>CC BY-NC-ND includes the following elements:<br/>BY – Credit must be given to the creator<br/>NC – Only noncommercial uses of the work are permitted<br/>ND – No derivatives or adaptations of the work are permitted`,
}