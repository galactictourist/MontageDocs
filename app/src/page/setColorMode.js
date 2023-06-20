import { LookNFeelMap } from '../util/lookNfeel';

export function setColorMode(lookNfeel, myOwnBGColor, myOwnNavBGColor, setMoreMainCls) {
	if (lookNfeel === LookNFeelMap.myOwn) {
		const bgcolor = myOwnBGColor || '#000000';
		const root = document.querySelector(':root');
		const textColor = myOwnNavBGColor || '#000000';
		root.style.setProperty('--my-own-bg-color', bgcolor);
		root.style.setProperty('--my-own-text-color', textColor === '#000000' ? '#ffffff' : textColor);
		setMoreMainCls('my-own-mode');
	} else if (lookNfeel === LookNFeelMap.darkMode) {
		setMoreMainCls('dark-mode');
	} else {
		setMoreMainCls('');
	}
}
