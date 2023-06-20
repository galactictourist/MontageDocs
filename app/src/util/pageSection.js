export const PageSectionTypeMap = {
	story: 1,
	roadmap: 2,
	utility: 3,
	premint: 4,
	mint: 5,
	royalties: 6,
	noMintYet: 7,
	noTradeYet: 8,
	aboutCustom1: 101,
	aboutCustom2: 102,
	aboutCustom3: 103,
	aboutCustom4: 104,
	aboutCustom5: 105,
	aboutCustom6: 106,
	aboutCustom7: 107,
	aboutCustom8: 108,
	aboutCustom9: 109,
}
export const ABOUT_CUSTOM_SECTIONS_COUNT = 9

export const PageSectionStyleMap = {
	text: 1,
	image: 2,
	video: 4,
	post: 8,
	textNimage: 1 | 2,
	textNvideo: 1 | 4,
	textNpost: 1 | 8,
}

export const PageSectionStyleOptions = [
	{ value: PageSectionStyleMap.textNimage, text: 'Text & image', icons: ['left-align', 'image'] },
	{ value: PageSectionStyleMap.text, text: 'Text only', icons: ['center-align'] },
	{ value: PageSectionStyleMap.image, text: 'Image only', icons: ['image'] },
	{ value: PageSectionStyleMap.video, text: 'Video only', icons: ['video'] },
	{ value: PageSectionStyleMap.textNvideo, text: 'Text & video', icons: ['left-align', 'video'] },
	{ value: PageSectionStyleMap.textNpost, text: 'Text & post', icons: ['left-align', 'post'] },
]
export const PageSectionStyleOptions_ColumnView = [
	{ value: PageSectionStyleMap.textNimage, text: 'Text & image', icons: [['left-align', 'image'], 'mint'] },
	{ value: PageSectionStyleMap.text, text: 'Text only', icons: ['left-align', 'mint'] },
	{ value: PageSectionStyleMap.image, text: 'Image only', icons: ['image', 'mint'] },
	{ value: PageSectionStyleMap.video, text: 'Video only', icons: ['video', 'mint'] },
	{ value: PageSectionStyleMap.textNvideo, text: 'Text & video', icons: [['left-align', 'video'], 'mint'] },
	{ value: PageSectionStyleMap.textNpost, text: 'Text & post', icons: [['left-align', 'post'], 'mint'] },
]