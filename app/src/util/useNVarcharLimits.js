import { useEffect, useState } from 'react';
import { getNVarcharLimits } from '../func/db';

export function useNVarcharLimits(tableName) {
	const [nvarcharLimits, setNVarcharLimits] = useState(null)
	useEffect(() => {
		getNVarcharLimits(tableName).then(setNVarcharLimits)
	}, [tableName])
	return { nvarcharLimits }
}
