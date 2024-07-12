import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import socketIOClient from "socket.io-client";
import { ENDPOINT_URL } from "./utils/Constants";
import { useToast } from "@chakra-ui/react";
import { RaiseClientNotificaiton } from "./utils/ChakraUI";

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
	selectedRows: [],
	setSelectedRows: (_) => {},
	isCommitMode: false,
	setIsCommitMode: (_) => {},
	branchStatusRows: [],
	setBranchStatusRows: (_) => {},
	fileViewGridRef: null,
	unseenFilesGridRef: null,
	showFilesView: false,
	setShowFilesView: (_) => {},
});

export const useApp = () => {
	return useContext(AppContext);
};

export const AppProvider = ({ children }) => {
	const [config, setConfig] = useState(null);
	const [socket, setSocket] = useState(null);
	const toast = useToast();
	const [isDebug, setIsDebug] = useState(true);

	useEffect(() => {
		const socket = socketIOClient(ENDPOINT_URL);
		setSocket(socket);

		socket.on("connect", () => {
			socket.emit("get-Config", "fetch");
			socket.once("get-Config", (data) => {
				setConfig(data);
				RaiseClientNotificaiton(toast, "Configurations Loaded", "success", 2000);
			});
		});

		socket.on("notification", (data) => {
			toast({
				position: "top",
				variant: "solid",
				title: "Server Notification",
				description: data.description,
				status: data.status,
				duration: data.duration && data.duration >= 1 ? data.duration : null,
				isClosable: true,
			});
		});

		socket.on("disconnect", () => {
			RaiseClientNotificaiton(toast, "Server Has Been Disconnected", "warning", 0);
		});

		return () => {
			socket.disconnect();
		};
	}, []);

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

	// Props used in BranchTable
	const [configurableRowData, setConfigurableRowData] = useState([]);
	const [branchInfos, setBranchInfos] = useState({});
	const branchTableGridRef = useRef(null);
	const [selectedRows, setSelectedRows] = useState([]);

	// Props used in CommitRegion
	const [isCommitMode, setIsCommitMode] = useState(false);
	const [branchStatusRows, setBranchStatusRows] = useState([]);
	const fileViewGridRef = useRef(null);
	const unseenFilesGridRef = useRef(null);
	const [showFilesView, setShowFilesView] = useState(false);

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
				selectedRows,
				setSelectedRows,
				isCommitMode,
				setIsCommitMode,
				branchStatusRows,
				setBranchStatusRows,
				fileViewGridRef,
				unseenFilesGridRef,
				showFilesView,
				setShowFilesView,
			}}>
			{children}
		</AppContext.Provider>
	);
};
