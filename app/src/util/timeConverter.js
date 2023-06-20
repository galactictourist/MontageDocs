export const timeConvert = (secs) => {
	if (secs < 60) {
        return {value: Math.floor(secs), units: 'sec'}
    } else if (secs >= 60 && secs < 3600) {
        return {value: Math.floor(secs / 60), units: 'min'}
    } else if (secs >= 3600 && secs < 86400) {
        return {value: Math.floor(secs / 3600), units: 'hr'}
    } else if (secs >= 86400) {
        return {value: Math.floor(secs / 86400), units: 'day'}
    }
}