import React, { useCallback, useEffect, useState } from "react";
import { useApp } from "../ContextApp.jsx";
import _ from "lodash";

export default function useStoreSVNLogs() {
	const selectedBranches = useApp((ctx) => ctx.selectedBranches);
	const logData = useApp((ctx) => ctx.logsData);
	const setLogData = useApp((ctx) => ctx.setSvnLogs);

	const [rowDataLogs, setRowDataLogs] = useState([]);

	const [quickFilterLogsText, setQuickFilterLogsText] = useState("");
	const onQuickFilterLogsInputChanged = useCallback(
		(e) => {
			setQuickFilterLogsText(e.target.value);
		},
		[setQuickFilterLogsText]
	);

	const refreshLogs = useCallback(() => {
		setLogData([]);
	}, [setLogData]);

	const areLogsFetched = logData.length === selectedBranches.length;

	useEffect(() => {
		if (logData.length === 0) return;
		const newRowDataLogs = logData.map((logData) => logData.logs).flat();
		setRowDataLogs((currRowDataLogs) => {
			if (!_.isEqual(currRowDataLogs, newRowDataLogs)) return newRowDataLogs;
			return currRowDataLogs;
		});
	}, [logData]);

	return {
		rowDataLogs,
		quickFilterLogsText,
		setQuickFilterLogsText,
		onQuickFilterLogsInputChanged,
		refreshLogs,
		areLogsFetched,
	}
}