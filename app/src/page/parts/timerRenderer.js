import './timerRenderer.scss'

export function getTimerRenderer(onCompleted, moreTimePartsCls) {
	return (args) => timerRenderer(args, onCompleted, moreTimePartsCls)
}

export function timerRenderer({ formatted, completed }, onCompleted, moreTimePartsCls) {
	if (completed) {
		if (onCompleted) {
			if (typeof onCompleted === "string") return onCompleted
			onCompleted()
		} else {
			window.location.reload();
			return 'Refreshing page...';
			// return timerParts(formatted)
		}
	} else {
		return timerParts(formatted, moreTimePartsCls);
	}
}

function timerParts({ days, hours, minutes, seconds }, moreTimePartsCls) {
	return (
		<span className={"timer-parts-ct" + (moreTimePartsCls ? " " + moreTimePartsCls : "")}>
			{timerPart(days, 'd')}
			{timerPart(hours, 'h')}
			{timerPart(minutes, 'm')}
			{timerPart(seconds, 's')}
		</span>);
}

function timerPart(num, postfix) {
	return (
		<span className="timer-part">
			<span className="timer-part--num">{num}</span>
			<span className="timer-part--postfix">{postfix}</span>
		</span>);
}
