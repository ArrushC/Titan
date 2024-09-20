import { useCallback, useEffect, useState } from "react";
import { useApp } from "../AppContext";
import { stripBranchInfo } from "../utils/CommonConfig";
import _ from "lodash";

export default function useManagedRowDataBranches() {
	const { updateConfig, isDebug, socket, configurableRowData, setConfigurableRowData, branchInfos, config, setBranchInfos, setSelectedBranches, setSelectedBranchStatuses, showCommitView,  setShowCommitView } = useApp();
	const [rowDataBranches, setRowDataBranches] = useState([]);

	const onRowValueChanged = useCallback(
		(event) => {
			// Event isn't used, but it's here for debugging purposes
			if (isDebug) console.log("AG Grid: onRowValueChanged - event", event);
			if (isDebug) console.log("AG Grid: onRowValueChanged - rowDataBranches", rowDataBranches);
			updateConfig((currentConfig) => ({ ...currentConfig, branches: stripBranchInfo(rowDataBranches) }));
		},
		[rowDataBranches, updateConfig, isDebug]
	);

	// Update rowDataBranches when configurableRowData or branchInfo changes
	useEffect(() => {
		const updateRowData = _.debounce(() => {
			const newRowData = configurableRowData.map((row) => ({
				...row,
				"Branch Info": branchInfos[row.id] || "Unrefreshed",
			}));

			setRowDataBranches((currentRowData) => {
				if (!_.isEqual(newRowData, currentRowData)) return newRowData;
				return currentRowData;
			});
		}, 300);

		updateRowData();

		return () => updateRowData.cancel();
	}, [configurableRowData, branchInfos]);

	// Update configurableRowData when config changes.
	useEffect(() => {
		setConfigurableRowData((currentData) => {
			if (config && config.branches && !_.isEqual(config.branches, currentData)) return config.branches;
			return currentData;
		});
	}, [config]);

	// Update branchInfos when socket receives branch-info-single (SVN Info) events
	useEffect(() => {
		const socketCallback = (data) => {
			setBranchInfos((currentBranchInfos) => {
				const newBranchInfos = { ...currentBranchInfos, [data.id]: data.info };
				console.debug("branch-info-single data received:", data);
				console.debug("branch-info-single newBranchInfos", newBranchInfos);
				// If branch id is in selectedBranches, refresh the commit region.
				// ? We're not using the getter function here because we do not want to miss an event fired before the state is updated.
				setSelectedBranches((currentSelectedRows) => {
					const selectedRow = currentSelectedRows.find((row) => row.id === data.id);
					if (selectedRow && showCommitView) {
						setSelectedBranchStatuses([]);
						setShowCommitView(false);
					}
					return currentSelectedRows;
				});
				return newBranchInfos;
			});
		};

		socket?.on("branch-info-single", socketCallback);
		return () => socket?.off("branch-info-single");
	}, [socket, showCommitView]);

	return {
		rowDataBranches,
		setRowDataBranches,
		onRowValueChanged,
	};
}
