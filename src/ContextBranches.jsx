import React, {  useEffect, useMemo, useState } from "react";
import { createContext, useContextSelector } from "use-context-selector";
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

export const useBranches = (selector) => {
	const context = useContextSelector(ContextBranches, selector);
	return context;
};

export const BranchesProvider = ({ children }) => {
	const configurableRowData = useApp(ctx => ctx.configurableRowData);
	const selectedBranches = useApp(ctx => ctx.selectedBranches);
	const setSelectedBranches = useApp(ctx => ctx.setSelectedBranches);

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
		const validBranchPaths = new Set(configurableRowData.map((branch) => branch["SVN Branch"]));
		const selectedBranchPaths = Object.keys(selectedBranches).filter((path) => selectedBranches[path]);

		const hasInvalidSelections = selectedBranchPaths.some((path) => !validBranchPaths.has(path));

		if (hasInvalidSelections) {
			const validSelectedBranches = Object.entries(selectedBranches).reduce((acc, [path, isSelected]) => {
				if (isSelected && validBranchPaths.has(path)) {
					acc[path] = true;
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
