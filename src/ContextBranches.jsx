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
	const { configurableRowData } = useApp();

	const [isDialogSBLogOpen, setIsDialogSBLogOpen] = useState(false);
	const [customScripts, setCustomScripts] = useState([]);

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

	const value = useMemo(
		() => ({
			isDialogSBLogOpen,
			setIsDialogSBLogOpen,
			customScripts,
			setCustomScripts,
		}),
		[isDialogSBLogOpen, customScripts]
	);

	return <ContextBranches.Provider value={value}>{children}</ContextBranches.Provider>;
};

// https://socket.io/how-to/use-with-react#remarks-about-the-useeffect-hook
// Also, take a look at useDeferredValue to take out re-renders.
