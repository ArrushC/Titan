import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { isEqual } from "lodash";
import { createToastConfig, URL_SOCKET_CLIENT } from "./utils/Constants.jsx";
import { toaster } from "./components/ui/toaster.jsx";
import socketIOClient from "socket.io-client";
import { flushSync } from "react-dom";

const initialState = {
	socket: null,
	config: null,
	updateConfig: () => {},
	emitSocketEvent: (_) => {},
	configurableRowData: [],
	selectedBranches: {},
	setSelectedBranches: (_) => {},
	logData: [],
	setLogData: (_) => {},
	appMode: "app",
	setAppMode: (_) => {},
};

const ContextApp = createContext(initialState);

export const useApp = () => {
	const context = useContext(ContextApp);
	if (!context) throw new Error("useApp must be used within an AppProvider");
	return context;
};

export const AppProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [config, setConfig] = useState({});
	const [selectedBranches, setSelectedBranches] = useState({});
	const [logData, setLogData] = useState([]);
	const [appMode, setAppMode] = useState("app");

	const _handleTitanConfigEvent = useCallback((response) => {
		if (!response) {
			toaster.create(createToastConfig("Couldn't load data from the server", "error", 0));
			return;
		}
		setConfig(response.config);
	}, []);

	useEffect(() => {
		const newSocket = socketIOClient(URL_SOCKET_CLIENT);
		setSocket(newSocket);

		const onConnect = () => {
			newSocket.emit("titan-config-get", null, _handleTitanConfigEvent);
		};

		const onDisconnect = () => {
			toaster.create(createToastConfig("Server Has Been Disconnected", "warning", 0));
		};

		const onReconnect = () => {
			toaster.create(createToastConfig("Server Has Been Reconnected", "success", 2000));
		};

		const onNotification = (data) => {
			toaster.create(createToastConfig(data.description, data.type, data.duration));
		};

		// Register event listeners
		newSocket.on("connect", onConnect);
		newSocket.on("disconnect", onDisconnect);
		newSocket.on("reconnect", onReconnect);
		newSocket.on("notification", onNotification);

		// Cleanup on unmount
		return () => {
			newSocket.off("connect", onConnect);
			newSocket.off("disconnect", onDisconnect);
			newSocket.off("reconnect", onReconnect);
			newSocket.off("notification", onNotification);
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

	const handleBranchSelection = useCallback((branchId, isSelected) => {
		flushSync(() => {
			setSelectedBranches((prev) => {
				const newState = { ...prev };
				if (isSelected) {
					newState[branchId] = true;
				} else {
					delete newState[branchId];
				}
				return newState;
			});
		});
	}, []);

	const handleBulkSelection = useCallback((branchIds, isSelected) => {
		flushSync(() => {
			setSelectedBranches((prev) => {
				const newState = { ...prev };
				branchIds.forEach((id) => {
					if (isSelected) {
						newState[id] = true;
					} else {
						delete newState[id];
					}
				});
				return newState;
			});
		});
	}, []);

	const configurableRowData = useMemo(() => config?.branches || [], [config?.branches]);

	const value = useMemo(
		() => ({
			socket,
			config,
			updateConfig,
			emitSocketEvent,
			configurableRowData,
			selectedBranches,
			setSelectedBranches,
			logData,
			setLogData,
			appMode,
			setAppMode,
			handleBranchSelection,
			handleBulkSelection,
		}),
		[socket, config, updateConfig, emitSocketEvent, configurableRowData, selectedBranches, logData, appMode, handleBranchSelection, handleBulkSelection]
	);

	return <ContextApp.Provider value={value}>{children}</ContextApp.Provider>;
};
