import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createToastConfig } from "./utils/Constants.jsx";
import { toaster } from "./components/ui/toaster.jsx";
import { useApp } from "./ContextApp.jsx";

const initialState = {
	branchInfos: {},
	setBranchInfos: (_) => {},
	branchTableGridRef: null,
	selectedBranches: {},
	setSelectedBranches: (_) => {},
	isDialogSBLogOpen: false,
	setIsDialogSBLogOpen: (_) => {},
	showSelectedBranchesLog: false,
	setShowSelectedBranchesLog: (_) => {},
	customScripts: [],
	setCustomScripts: (_) => {},
};

const ContextBranches = createContext(initialState);

export const useBranches = () => {
	const context = useContext(ContextBranches);
	if (!context) throw new Error("useApp must be used within a BranchesProvider");
	return context;
};

export const BranchesProvider = ({ children }) => {
	const { configurableRowData, selectedBranches, setSelectedBranches } = useApp();

	const [isDialogSBLogOpen, setIsDialogSBLogOpen] = useState(false);
	const [customScripts, setCustomScripts] = useState([]);

	const selectionMetrics = useMemo(() => {
		const selectedCount = Object.keys(selectedBranches).length;
		return {
			selectedBranchesCount: selectedCount,
			indeterminate: selectedCount > 0 && selectedCount < configurableRowData.length,
			hasSelection: selectedCount > 0,
		};
	}, [selectedBranches, configurableRowData]);

	useEffect(() => {
		if (!window.electron) return;
		window.electron.fetchCustomScripts().then((data) => {
			if (data.success) {
				setCustomScripts(data.scripts);
				return;
			}
			toaster.create(createToastConfig(data.error, "error", 0));
		});
	}, [configurableRowData]);

	useEffect(() => {
		const validBranchIds = new Set(configurableRowData.map((branch) => branch.id));
		const selectedBranchIds = Object.keys(selectedBranches).filter((id) => selectedBranches[id]);

		const hasInvalidSelections = selectedBranchIds.some((id) => !validBranchIds.has(id));

		if (hasInvalidSelections) {
			const validSelectedBranches = Object.entries(selectedBranches).reduce((acc, [id, isSelected]) => {
				if (isSelected && validBranchIds.has(id)) {
					acc[id] = true;
				}
				return acc;
			}, {});

			setSelectedBranches(validSelectedBranches);
		}
	}, [configurableRowData, selectedBranches, setSelectedBranches]);

	const value = useMemo(
		() => ({
			isDialogSBLogOpen,
			setIsDialogSBLogOpen,
			customScripts,
			setCustomScripts,
			selectionMetrics,
		}),
		[isDialogSBLogOpen, customScripts, selectionMetrics]
	);

	return <ContextBranches.Provider value={value}>{children}</ContextBranches.Provider>;
};
