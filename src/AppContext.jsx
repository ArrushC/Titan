import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import socketIOClient from "socket.io-client";
import { useToast } from "@chakra-ui/react";
import _ from "lodash";
import { branchString, stripBranchInfo } from "./utils/CommonConfig";
import { createToastConfig, URL_SOCKET_CLIENT } from "./utils/Constants";

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
	branchOptions: [],
	issueNumber: {},
	setIssueNumber: (_) => {},
	commitMessage: "",
	setCommitMessage: (_) => {},
	selectedLocalChanges: [],
	setSelectedLocalChanges: (_) => {},
	selectedUntrackedChanges: [],
	setSelectedUntrackedChanges: (_) => {},
	socketPayload: null,
	setSocketPayload: (_) => {},
	postCommitData: {},
	setPostCommitData: (_) => {},
	logData: [],
	setLogData: (_) => {},
});

export const useApp = () => {
	return useContext(AppContext);
};

export const AppProvider = ({ children }) => {
	const [config, setConfig] = useState(null);
	const [socket, setSocket] = useState(null);
	const toast = useToast();
	const [isDebug, setIsDebug] = useState(() => localStorage.getItem("isDebug") === "true");

	useEffect(() => {
		const newSocket = socketIOClient(URL_SOCKET_CLIENT);
		setSocket(newSocket);

		newSocket.on("connect", () => {
			newSocket.emit("titan-config-get", "fetch");
			newSocket.once("titan-config-get", (data) => {
				setConfig(data);
				toast(createToastConfig("Configurations Loaded", "success", 2000));
			});
		});

		newSocket.on("notification", (data) => {
			toast(createToastConfig(data.description, data.status, data.duration, true));
		});

		newSocket.on("disconnect", () => {
			toast(createToastConfig("Server Has Been Disconnected", "warning", 0, true));
		});

		newSocket.on("reconnect", () => {
			toast(createToastConfig("Server Has Been Reconnected", "success", 2000, true));
		});

		return () => {
			newSocket.disconnect();
		};
	}, []);

	useEffect(() => {
		localStorage.setItem("isDebug", String(isDebug));
	}, [isDebug]);

	const saveConfig = useCallback(
		(configToSave) => {
			if (configToSave === null || configToSave === undefined) return;
			console.log("Saving config:", configToSave);
			socket?.emit("titan-config-set", configToSave);
		},
		[socket]
	);

	const updateConfig = useCallback(
		(updateFunction) => {
			setConfig((currentConfig) => {
				const newConfig = updateFunction(currentConfig);
				if (_.isEqual(currentConfig, newConfig)) return currentConfig;
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
	const branchOptions = useMemo(() => {
		// if (config && config.commitOptions && config.commitOptions.useIssuePerFolder) {
		// 	return selectedBranches.filter((row) => row["Branch Folder"] && row["Branch Version"] && row["SVN Branch"] && row["Branch Folder"] !== "" && row["Branch Version"] !== "" && row["SVN Branch"] !== "").map((row) => ({
		// 		value: row.id,
		// 		label: branchString(row["Branch Folder"], row["Branch Version"], row["SVN Branch"]),
		// 	}));
		// }

		return configurableRowData
			.filter((row) => row["Branch Folder"] && row["Branch Version"] && row["SVN Branch"] && row["Branch Folder"] !== "" && row["Branch Version"] !== "" && row["SVN Branch"] !== "")
			.map((row) => ({
				value: row.id,
				label: branchString(row["Branch Folder"], row["Branch Version"], row["SVN Branch"]),
			}));
	}, [config, selectedBranches, configurableRowData]);
	const [issueNumber, setIssueNumber] = useState({});
	const [commitMessage, setCommitMessage] = useState("");
	const [selectedLocalChanges, setSelectedLocalChanges] = useState([]);
	const [selectedUntrackedChanges, setSelectedUntrackedChanges] = useState([]);
	const [socketPayload, setSocketPayload] = useState(null);
	const [postCommitData, setPostCommitData] = useState({});

	// Props used in the entire application
	const [logData, setLogData] = React.useState([]);

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
		if (!isCommitMode || !showCommitView) return;
		const hookTimeoutCallback = setTimeout(() => {
			document.getElementById("sectionCommit")?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
		}, 100);

		return () => clearTimeout(hookTimeoutCallback);
	}, [isCommitMode, showCommitView]);

	// Fetch the branch status for each selected branch
	useEffect(() => {
		if (selectedBranches.length < 1 || showCommitView) {
			if (selectedBranches.length < 1) setIsCommitMode(false);
			return;
		}
		setSelectedBranchStatuses([]);
		setSocketPayload(null);
		stripBranchInfo(selectedBranches).forEach((selectedBranch) => {
			console.debug("Emitting svn-status-single for branch:", selectedBranch);
			socket?.emit("svn-status-single", { selectedBranch: selectedBranch });
		});
	}, [socket, selectedBranches, showCommitView]);

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

	useEffect(() => {
		setLogData([]);
	}, [selectedBranches]);

	useEffect(() => {
		if (logData.length === 0 && socket)
			setSelectedBranches((currSelectedBranches) => {
				if (currSelectedBranches.length > 0) socket.emit("svn-log-selected", { selectedBranches: selectedBranches });
				return currSelectedBranches;
			});
	}, [logData, socket]);

	useEffect(() => {
		const socketCallback = (data) => {
			console.debug("Received svn-log-result from socket in SectionBranchLog component in background");
			setLogData((prevData) => {
				const isDataExist = prevData.some((logBranch) => logBranch.id === data.id);
				if (!isDataExist) return [...prevData, data];
				return prevData;
			});
		};

		socket?.on("svn-log-result", socketCallback);

		return () => socket?.off("svn-log-result", socketCallback);
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
				branchOptions,
				issueNumber,
				setIssueNumber,
				commitMessage,
				setCommitMessage,
				selectedLocalChanges,
				setSelectedLocalChanges,
				selectedUntrackedChanges,
				setSelectedUntrackedChanges,
				socketPayload,
				setSocketPayload,
				postCommitData,
				setPostCommitData,
				logData,
				setLogData,
			}}>
			{children}
		</AppContext.Provider>
	);
};
