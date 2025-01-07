import React, { useState, useEffect, useCallback, useMemo } from "react";
import { isEqual } from "lodash";
import { createToastConfig, URL_SOCKET_CLIENT } from "./utils/Constants.jsx";
import { toaster } from "./components/ui/toaster.jsx";
import socketIOClient from "socket.io-client";
import { flushSync } from "react-dom";
import { createContext, useContextSelector } from "use-context-selector";

const initialState = {
	appClosing: false,
	setAppClosing: (_) => {},
	socket: null,
	config: null,
	updateConfig: (_) => {},
	emitSocketEvent: (_) => {},
	configurableRowData: [],
	selectedBranchesData: [],
	selectedBranchPaths: new Set(),
	selectedBranchProps: {},
	selectedBranches: {},
	setSelectedBranches: (_) => {},
	svnLogs: {},
	setSvnLogs: (_) => {},
	logsData: [],
	appMode: "app",
	setAppMode: (_) => {},
};

const ContextApp = createContext(initialState);

export const useApp = (selector) => {
	const context = useContextSelector(ContextApp, selector);
	return context;
};

export const AppProvider = ({ children }) => {
	const [appClosing, setAppClosing] = useState(false);
	const [socket, setSocket] = useState(null);
	const [config, setConfig] = useState({});
	const [selectedBranches, setSelectedBranches] = useState({});
	const [svnLogs, setSvnLogs] = useState({});
	const [appMode, setAppMode] = useState("app");

	useEffect(() => {
		const newSocket = socketIOClient(URL_SOCKET_CLIENT);
		setSocket(newSocket);

		const onConnect = () => {
			console.debug("=== CONECTED TO SERVER ===");
		};

		const onDisconnect = () => {
			toaster.create(createToastConfig("Server Disconnected", "warning", 0));
		};

		const onReconnect = () => {
			toaster.create(createToastConfig("Server Reconnected", "success", 2000));
		};

		const onNotification = (data) => {
			toaster.create(createToastConfig(data.description, data.type, data.duration));
		};

		// Register event listeners
		newSocket.on("connect", onConnect);
		newSocket.on("disconnect", onDisconnect);
		newSocket.on("reconnect", onReconnect);
		newSocket.on("notification", onNotification);

		const onTitanConfigGet = (response) => {
			if (!response) {
				toaster.create(createToastConfig("Couldn't load data from the server", "error", 0));
				return;
			}
			setConfig(response.config);
		};
		newSocket.once("titan-config-get", onTitanConfigGet);

		// Cleanup on unmount
		return () => {
			newSocket.off("connect", onConnect);
			newSocket.off("disconnect", onDisconnect);
			newSocket.off("reconnect", onReconnect);
			newSocket.off("notification", onNotification);
			newSocket.off("titan-config-get", onTitanConfigGet);
			newSocket.disconnect();
		};
	}, []);

	const updateConfig = useCallback(
		(updateFunction) => {
			setConfig((currentConfig) => {
				const newConfig = updateFunction(currentConfig);
				if (isEqual(currentConfig, newConfig)) return currentConfig;
				socket?.emit("titan-config-set", newConfig);
				return newConfig;
			});
		},
		[socket]
	);

	const emitSocketEvent = useCallback(
		(eventName, data) => {
			if (!socket.connected) {
				toaster.create(createToastConfig("Socket not connected", "error", 2000));
				return;
			}
			socket?.emit(eventName, data);
		},
		[socket]
	);

	const handleBranchSelection = useCallback((branchPath, isSelected) => {
		flushSync(() => {
			setSelectedBranches((prev) => {
				const newState = { ...prev };
				if (isSelected) newState[branchPath] = true;
				else delete newState[branchPath];
				return newState;
			});
		});
	}, []);

	const handleBulkSelection = useCallback((branchPaths, isSelected) => {
		flushSync(() => {
			setSelectedBranches((prev) => {
				const newState = { ...prev };
				branchPaths.forEach((path) => {
					if (isSelected) newState[path] = true;
					else delete newState[path];
				});
				return newState;
			});
		});
	}, []);

	const configurableRowData = useMemo(() => config?.branches || [], [config]);
	const selectedBranchesData = useMemo(() => configurableRowData.filter((branchRow) => selectedBranches[branchRow["SVN Branch"]]), [configurableRowData, selectedBranches]);
	const selectedBranchPaths = useMemo(() => new Set(Object.keys(selectedBranches)), [selectedBranches]);
	const selectedBranchProps = useMemo(() => Object.fromEntries(selectedBranchesData.map((branchRow) => [branchRow["SVN Branch"], {
		folder: branchRow["Branch Folder"],
		version: branchRow["Branch Version"],
	}])), [selectedBranchesData]);
	const selectedBranchFolders = useMemo(() => {
		return Array.from(selectedBranchesData.reduce((acc, branchRow) => acc.add(branchRow["Branch Folder"]), new Set()));
	}, [selectedBranchesData]);

	useEffect(() => {
		if (configurableRowData?.length < 1 || Object.keys(selectedBranches).length < 1) return;
		console.debug("Emitting svn-logs-selected event in DialogBranchesLog component in background");
		socket?.emit("svn-logs-selected", { selectedBranches: selectedBranchesData });
	}, [selectedBranches, configurableRowData, selectedBranchesData, socket]);

	useEffect(() => {
		const socketCallback = (data) => {
			console.debug("Received svn-log-result from socket in DialogBranchesLog component in background");
			setSvnLogs((prevData) => {
				const newData = {};
				Object.entries(prevData).forEach(([branch, logs]) => {
					if (selectedBranches[branch]) {
						newData[branch] = logs;
					}
				});
				newData[data["SVN Branch"]] = data.logs;
				return newData;
			});
		};

		socket?.on("svn-log-result", socketCallback);
		return () => socket?.off("svn-log-result", socketCallback);
	}, [socket, selectedBranches]);

	useEffect(() => {
		socket?.emit("watcher-branches-update", { selectedBranchPaths: Array.from(selectedBranchPaths), ignoredUnknownPaths: config?.ignoredUnknownPaths, ignoredModifiedPaths: config?.ignoredModifiedPaths });
	}, [socket, config?.ignoredUnknownPaths, config?.ignoredModifiedPaths, selectedBranchPaths]);

	const logsData = useMemo(() => {
		const allLogs = Object.values(svnLogs || {}).flat();
		return allLogs.filter((log) => !!log.revision).sort((a, b) => parseInt(b.revision, 10) - parseInt(a.revision, 10));
	}, [svnLogs]);

	const value = useMemo(
		() => ({
			appClosing,
			setAppClosing,
			socket,
			config,
			updateConfig,
			emitSocketEvent,
			configurableRowData,
			selectedBranches,
			selectedBranchesData,
			selectedBranchPaths,
			selectedBranchProps,
			selectedBranchFolders,
			setSelectedBranches,
			svnLogs,
			setSvnLogs,
			logsData,
			appMode,
			setAppMode,
			handleBranchSelection,
			handleBulkSelection,
		}),
		[appClosing, socket, config, updateConfig, emitSocketEvent, configurableRowData, selectedBranches, selectedBranchesData, selectedBranchPaths, selectedBranchProps, selectedBranchFolders, svnLogs, logsData, appMode, handleBranchSelection, handleBulkSelection]
	);

	return <ContextApp.Provider value={value}>{children}</ContextApp.Provider>;
};
