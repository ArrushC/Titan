import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import socketIOClient from "socket.io-client";
import { useToast } from "@chakra-ui/react";
import _ from "lodash";

const AppContext = createContext({
	socket: null,
	toast: null,
	config: null,
	updateConfig: (_) => {},
	isDebug: false,
	setIsDebug: (_) => {},
	configurableRowData: [],
	setConfigurableRowData: (_) => {},
	branchInfos: {},
	setBranchInfos: (_) => {},
	branchTableGridRef: null,
	selectedBranches: [],
	setSelectedBranches: (_) => {},
	showSelectedBranchesLog: false,
	setShowSelectedBranchesLog: (_) => {},
	isCommitMode: false,
	setIsCommitMode: (_) => {},
	selectedBranchStatuses: [],
	setSelectedBranchStatuses: (_) => {},
	localChangesGridRef: null,
	untrackedChangesGridRef: null,
	showCommitView: false,
	setShowCommitView: (_) => {},
	sourceBranch: null,
	setSourceBranch: (_) => {},
	issueNumber: null,
	setIssueNumber: (_) => {},
	issueOptions: [],
	setIssueOptions: (_) => {},
	commitMessage: "",
	setCommitMessage: (_) => {},
	selectedLocalChanges: [],
	setSelectedLocalChanges: (_) => {},
	selectedUntrackedChanges: [],
	setSelectedUntrackedChanges: (_) => {},
	socketPayload: null,
	setSocketPayload: (_) => {},
});

export const useApp = () => {
	return useContext(AppContext);
};

function createToastConfig(isServer = true, description, status = "info", duration = 3000) {
	return {
		position: "top",
		variant: "solid",
		title: isServer ? "Server Notification" : "Client Notification",
		description: description,
		status: status,
		duration: duration && duration >= 1 ? duration : null,
		isClosable: true,
	};
}

export const AppProvider = ({ children }) => {
	const [config, setConfig] = useState(null);
	const [socket, setSocket] = useState(null);
	const toast = useToast();
	const [isDebug, setIsDebug] = useState(localStorage.getItem("isDebug") === "true");

	useEffect(() => {
		const socket = socketIOClient("http://localhost:4000");
		setSocket(socket);

		socket.on("connect", () => {
			socket.emit("get-Config", "fetch");
			socket.once("get-Config", (data) => {
				setConfig(data);
				toast(createToastConfig(false, "Configurations Loaded", "success", 2000));
			});
		});

		socket.on("notification", (data) => {
			toast(createToastConfig(true, data.description, data.status, data.duration));
		});

		socket.on("disconnect", () => {
			toast(createToastConfig(true, "Server Has Been Disconnected", "warning", 0));
		});

		socket.on("reconnect", () => {
			toast(createToastConfig(true, "Server Has Been Reconnected", "success", 2000));
		});

		return () => {
			socket.disconnect();
		};
	}, []);

	useEffect(() => {
		localStorage.setItem("isDebug", String(isDebug));
	}, [isDebug]);

	const saveConfig = useCallback(
		(configToSave) => {
			if (configToSave === null || configToSave === undefined) return;
			console.log("Saving config:", configToSave);
			socket?.emit("set-Config", configToSave);
		},
		[socket]
	);

	const updateConfig = useCallback(
		(updateFunction) => {
			setConfig((currentConfig) => {
				const newConfig = updateFunction(currentConfig);
				saveConfig(newConfig);
				return newConfig;
			});
		},
		[setConfig, saveConfig]
	);

	// Props used in SectionBranches
	const [configurableRowData, setConfigurableRowData] = useState([]);
	const [branchInfos, setBranchInfos] = useState({});
	const branchTableGridRef = useRef(null);
	const [selectedBranches, setSelectedBranches] = useState([]);
	const [showSelectedBranchesLog, setShowSelectedBranchesLog] = useState(false);

	// Props used in SectionCommit
	const [isCommitMode, setIsCommitMode] = useState(false);
	const [selectedBranchStatuses, setSelectedBranchStatuses] = useState([]);
	const localChangesGridRef = useRef(null);
	const untrackedChangesGridRef = useRef(null);
	const [showCommitView, setShowCommitView] = useState(false);
	const [sourceBranch, setSourceBranch] = useState(null);
	const [issueNumber, setIssueNumber] = useState(null);
	const [issueOptions, setIssueOptions] = useState([]);
	const [commitMessage, setCommitMessage] = useState("");
	const [selectedLocalChanges, setSelectedLocalChanges] = useState([]);
	const [selectedUntrackedChanges, setSelectedUntrackedChanges] = useState([]);
	const [socketPayload, setSocketPayload] = useState(null);

	/*****************************************
	 *  Hooks used in both sections
	 *****************************************/
	/**** SectionBranches ****/	
	// Refresh commit view when configurableRowData changes
	useEffect(() => {
		setSelectedBranchStatuses([]);
		setShowCommitView(false);
	}, [configurableRowData]);

	/**** SectionCommit ****/
	// Scroll to the commit region when it is in commit mode
	useEffect(() => {
		if (!isCommitMode) return;
		document.getElementById("sectionCommit")?.scrollIntoView({ behavior: "smooth", block: "start" });
	}, [isCommitMode]);

	// Refresh the commit section whenever there has been an update on untracked files being tracked by SVN.
	useEffect(() => {
		const socketCallback = () => {
			setShowCommitView(false);
		};

		socket?.on("branch-refresh-unseen", socketCallback);
		return () => socket?.off("branch-refresh-unseen", socketCallback);
	}, [socket]);

	useEffect(() => {
		const socketCallback = (data) => {
			if (isDebug) console.debug("Received branch status data:", data);
			setSelectedBranchStatuses((prev) => [...prev, data]);
		};

		socket?.on("branch-status-single", socketCallback);
		return () => socket?.off("branch-status-single", socketCallback);
	}, [socket]);

	return (
		<AppContext.Provider
			value={{
				socket,
				toast,
				config,
				updateConfig,
				isDebug,
				setIsDebug,
				configurableRowData,
				setConfigurableRowData,
				branchInfos,
				setBranchInfos,
				branchTableGridRef,
				selectedBranches,
				setSelectedBranches,
				showSelectedBranchesLog,
				setShowSelectedBranchesLog,
				isCommitMode,
				setIsCommitMode,
				selectedBranchStatuses,
				setSelectedBranchStatuses,
				localChangesGridRef,
				untrackedChangesGridRef,
				showCommitView,
				setShowCommitView,
				sourceBranch,
				setSourceBranch,
				issueNumber,
				setIssueNumber,
				issueOptions,
				setIssueOptions,
				commitMessage,
				setCommitMessage,
				selectedLocalChanges,
				setSelectedLocalChanges,
				selectedUntrackedChanges,
				setSelectedUntrackedChanges,
				socketPayload,
				setSocketPayload,
			}}>
			{children}
		</AppContext.Provider>
	);
};
