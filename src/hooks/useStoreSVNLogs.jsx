import React, { useCallback, useEffect, useState } from "react";
import { useApp } from "../AppContext";

export default function useStoreSVNLogs() {
	const {selectedBranches, logData, setLogData} = useApp();
	const rowDataLogs = logData.map((logData) => logData.logs).flat();

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

	useEffect(() => {
		setLogData([]);
	}, [selectedBranches]);

	const areLogsFetched = logData.length === selectedBranches.length;

	return {
		rowDataLogs,
		quickFilterLogsText,
		setQuickFilterLogsText,
		onQuickFilterLogsInputChanged,
		refreshLogs,
		areLogsFetched,
	}
}