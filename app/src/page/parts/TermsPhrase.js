import { Link } from 'react-router-dom';

export function TermsPhrase({ keepKey }) {
	return (<div className="ta-c terms-phrase">
		by using our site you agree to our <Link to={"/terms" + keepKey}>Terms</Link>, <Link to={"/privacy" + keepKey}>Privacy</Link> & <Link to={"/cookies" + keepKey}>Cookie policy</Link>
	</div>);
}
