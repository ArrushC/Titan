import { AgGridReact } from "ag-grid-react";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useApp } from "../AppContext";
import { Button, Flex, Icon, Tooltip, Wrap } from "@chakra-ui/react";
import { CloseIcon, DownloadIcon, DragHandleIcon, RepeatIcon, SmallAddIcon } from "@chakra-ui/icons";
import AlertConfirmRowDelete from "./AlertConfirmRowDelete";
import { stripBranchInfo } from "../utils/CommonConfig";
import _ from "lodash";
import { MdCloudDownload, MdCloudUpload } from "react-icons/md";
import { RaiseClientNotificaiton } from "../utils/ChakraUI";

export default function BranchTable({ configurableRowData, setConfigurableRowData, branchInfos, setBranchInfos, branchTableGridRef, selectedRows, setSelectedRows, isCommitMode, setIsCommitMode, setBranchStatusRows, setShowFilesView }) {
	const { socket, config, updateConfig, isDebug, toast } = useApp();

	const [isAlertOpen, setIsAlertOpen] = useState(false);
	const cancelRef = useRef();
	const onCloseAlert = () => setIsAlertOpen(false);

	const [rowData, setRowData] = useState([]);
	const [lastInfoTaskTime, setLastInfoTaskTime] = useState(0);

	/****************************************************
	 * Callback Functions - Socket.io
	 ****************************************************/
	const emitUpdateSingle = useCallback(
		(row) => {
			socket?.emit("svn-update-single", { id: row.id, branch: row["SVN Branch"], version: row["Branch Version"], folder: row["Branch Folder"] });
		},
		[socket]
	);

	const emitInfoSingle = useCallback(
		(row) => {
			socket?.emit("svn-info-single", { id: row.id, branch: row["SVN Branch"], version: row["Branch Version"], folder: row["Branch Folder"] });
		},
		[socket]
	);

	/****************************************************
	 * Callback Functions - Table Aesthetics
	 ****************************************************/
	const getRowStyle = useCallback(
		(params) => {
			const color = config?.branchFolderColours[params.data["Branch Folder"]];
			return {
				backgroundColor: color ? `${color}20` : "transparent", // Adding some transparency
			};
		},
		[config?.branchFolderColours]
	);

	const defaultColDef = useMemo(
		() => ({
			resizable: true,
			wrapText: true,
			autoHeight: true,
			filter: true,
			suppressMovable: true,
			editable: true,
			wrapHeaderText: true,
			autoHeaderHeight: true,
		}),
		[]
	);

	const colDefs = useMemo(
		() => [
			{ field: "", rowDrag: true, resizable: false, filter: false, suppressMovable: false, editable: false, width: 20, cellRenderer: DragHandleIcon, headerClass: "branch-table-header-cell", cellClass: "branch-table-body-cell" },
			{ headerCheckboxSelection: true, checkboxSelection: true, width: 20, resizable: false, suppressMovable: false, filter: false, editable: false, headerClass: "branch-table-header-cell", cellClass: "branch-table-body-cell" },
			{ field: "Branch Folder", resizable: false, width: 130, valueFormatter: (params) => params.value.toUpperCase() },
			{ field: "Branch Version", resizable: false, width: 130 },
			{ field: "SVN Branch", flex: 1 },
			{ field: "Branch Info", editable: false, resizable: false, width: 200 },
		],
		[config]
	);

	/****************************************************
	 * Callback Functions - Table Operations
	 ****************************************************/
	const clearSelection = useCallback(() => {
		branchTableGridRef?.current?.api?.deselectAll();
		setSelectedRows([]);
		setIsCommitMode(false);
	}, [branchTableGridRef, setSelectedRows]);

	const onSelectionChanged = useCallback(() => {
		const selectedRows = branchTableGridRef?.current?.api?.getSelectedNodes().map((node) => node.data);
		if (isDebug) console.log("BranchTable.jsx: onSelectionChanged - selectedRows", selectedRows);
		setSelectedRows(selectedRows);
		setBranchStatusRows([]);
		setShowFilesView(false);
	}, [branchTableGridRef, setSelectedRows, setShowFilesView]);

	const onRowDragEnd = useCallback(
		(event) => {
			const movedRowData = [];
			event.api.forEachNode((node) => movedRowData.push(node.data));
			if (isDebug) console.debug("BranchTable.jsx: onRowDragEnd - movedRowData", movedRowData);
			updateConfig((currentConfig) => ({ ...currentConfig, branches: stripBranchInfo(movedRowData) }));
		},
		[updateConfig]
	);

	const onRowValueChanged = useCallback(
		(event) => {
			// Event isn't used, but it's here for debugging purposes
			if (isDebug) console.log("AG Grid: onRowValueChanged - event", event);
			if (isDebug) console.log("AG Grid: onRowValueChanged - rowData", rowData);
			updateConfig((currentConfig) => ({ ...currentConfig, branches: stripBranchInfo(rowData) }));
		},
		[rowData, updateConfig]
	);

	/****************************************************
	 * Callback Functions - Alert Dialog
	 ****************************************************/
	const openAlertDialog = useCallback(() => {
		const selectedRows = branchTableGridRef?.current?.api?.getSelectedNodes().map((node) => node.data);
		setSelectedRows(selectedRows);
		setIsAlertOpen(true);
	}, [branchTableGridRef, setSelectedRows]);

	/****************************************************
	 * Callback Functions - Table Actions
	 ****************************************************/
	const addNewRow = useCallback(() => {
		const newRow = {
			id: String(Date.now()),
			"Branch Folder": "",
			"Branch Version": "",
			"SVN Branch": "",
			"Branch Info": "",
		};
		updateConfig((currentConfig) => ({ ...currentConfig, branches: stripBranchInfo([...currentConfig.branches, newRow]) }));
	}, [rowData, updateConfig]);

	const updateSelectedBranches = useCallback(() => {
		selectedRows.forEach((row) => {
			emitUpdateSingle(row);
		});
	}, [selectedRows, emitUpdateSingle]);

	const removeSelectedRows = useCallback(() => {
		const selectedIds = selectedRows.map((row) => row.id);
		const updatedData = rowData.filter((row) => !selectedIds.includes(row.id));
		console.log("BranchTable.jsx: removeSelectedRows - updatedData", updatedData);
		updateConfig((currentConfig) => ({ ...currentConfig, branches: stripBranchInfo(updatedData) }));
		clearSelection();
		onCloseAlert();
	}, [selectedRows, rowData, updateConfig]);

	const refreshSelected = useCallback(() => {
		setIsCommitMode(false);
		setRowData((currentRowData) => {
			const newRowData = [...currentRowData];
			selectedRows.forEach((row) => {
				const index = newRowData.findIndex((r) => r.id === row.id);
				newRowData[index]["Branch Info"] = "Refreshing...";
			});
			return newRowData;
		});
		selectedRows.forEach((row) => {
			emitInfoSingle(row);
		});
	}, [selectedRows, emitInfoSingle]);

	const refreshAll = useCallback(() => {
		if (isCommitMode) {
			RaiseClientNotificaiton(toast, "Unable to refresh branches while in commit mode", "warning", 0);
			return;
		}
		RaiseClientNotificaiton(toast, "Refreshing all branches. Please wait until this is done!", "info", 4000);
		const now = Date.now();
		configurableRowData.forEach((row) => {
			emitInfoSingle(row);
		});
		setLastInfoTaskTime(now);
	}, [configurableRowData, emitInfoSingle, isCommitMode]);

	const toggleCommitSelectedBranches = useCallback(() => {
		setIsCommitMode((currentIsCommitMode) => !currentIsCommitMode);
		setBranchStatusRows([]);
		setShowFilesView(false);
	}, [setIsCommitMode]);

	/****************************************************
	 * Hooks setup
	 ****************************************************/
	// Update configurableRowData when config changes.
	useEffect(() => {
		setConfigurableRowData((currentData) => {
			if (config && config.branches && !_.isEqual(config.branches, currentData)) return config.branches;
			return currentData;
		});
	}, [config]);

	// Update rowData when configurableRowData changes
	useEffect(() => {
		const updateRowData = _.debounce(() => {
			const newRowData = configurableRowData.map(row => ({
				...row,
				"Branch Info": branchInfos[row.id] || "Hasn't been refreshed"
			}));
			
			if (!_.isEqual(newRowData, rowData)) {
				setRowData(newRowData);
			}
		}, 300);
	
		updateRowData();
	
		return () => updateRowData.cancel();
	}, [configurableRowData, branchInfos]);

	// Create and change intervals for refreshAll when configurableRowData changes
	useEffect(() => {
		const intervalDuration = 60_000 * 5; // 5 minutes
		const now = Date.now();

		if (isDebug) console.debug("BranchTable.jsx: useEffect - intervals setup");
		if (isDebug) console.debug("BranchTable.jsx: useEffect - configurableRowData", configurableRowData);

		if (configurableRowData.length > 0) {
			if (now - lastInfoTaskTime > intervalDuration) {
				if (isDebug) console.debug("BranchTable.jsx: useEffect - initial refreshAll() call");
				refreshAll();
			}

			const interval = setInterval(() => {
				refreshAll();
			}, intervalDuration);
			return () => clearInterval(interval);
		}
	}, [configurableRowData, lastInfoTaskTime, refreshAll]);

	// Update branchInfos when socket receives branch-info-single (SVN Info) events
	useEffect(() => {
		const socketCallback = (data) => {
			setBranchInfos((currentBranchInfos) => {
				if (isDebug) console.debug("branch-info-single data received:", data);
				const newBranchInfos = { ...currentBranchInfos, [data.id]: data.info };
				if (isDebug) console.debug("branch-info-single newBranchInfos", newBranchInfos);
				return newBranchInfos;
			});
		};

		socket?.on("branch-info-single", socketCallback);
		return () => socket?.off("branch-info-single");
	}, [socket]);

	// Emit svn-info-single when branch-success-single is received as a result of a successful SVN operation
	useEffect(() => {
		const socketCallback = (data) => {
			if (isDebug) console.debug("branch-success-single data received:", data);
			socket?.emit("svn-info-single", { id: data.id, branch: data.branch, version: data.version, folder: data.folder });
		};

		socket?.on("branch-success-single", socketCallback);
		return () => socket?.off("branch-success-single", socketCallback);
	}, [socket]);

	return (
		<div>
			<Wrap mb={4} justify={"space-between"}>
				<Flex columnGap={2}>
					<Tooltip label="Please select at least 1 branch" isDisabled={selectedRows.length > 0} hasArrow>
						<Button onClick={updateSelectedBranches} leftIcon={<Icon as={MdCloudDownload} />} colorScheme={"yellow"} isDisabled={selectedRows.length < 1}>
							Update Selected
						</Button>
					</Tooltip>
					<Tooltip label="Please select at least 1 branch" isDisabled={selectedRows.length > 0} hasArrow>
						<Button onClick={toggleCommitSelectedBranches} leftIcon={<Icon as={MdCloudUpload} />} colorScheme={"yellow"} isDisabled={selectedRows.length < 1}>
							{isCommitMode ? "Undo Commit" : "Commit Selected"}
						</Button>
					</Tooltip>
					<Tooltip label="Please select at least 1 branch" isDisabled={selectedRows.length > 0} hasArrow>
						<Button onClick={refreshSelected} leftIcon={<RepeatIcon />} colorScheme={"yellow"} isDisabled={selectedRows.length < 1}>
							Refresh Selected
						</Button>
					</Tooltip>
				</Flex>
				<Flex columnGap={2}>
					<Button onClick={addNewRow} leftIcon={<SmallAddIcon boxSize={8} />} colorScheme={"green"}>
						Add New Row
					</Button>
					<Tooltip label="Please select at least 1 branch" isDisabled={selectedRows.length > 0} hasArrow>
						<Button onClick={openAlertDialog} leftIcon={<CloseIcon />} colorScheme={"red"} isDisabled={selectedRows.length < 1}>
							Delete Selected
						</Button>
					</Tooltip>
				</Flex>
			</Wrap>
			<div className="ag-theme-quartz-dark">
				<AgGridReact
					ref={branchTableGridRef}
					rowData={rowData}
					defaultColDef={defaultColDef}
					columnDefs={colDefs}
					getRowStyle={getRowStyle}
					onRowDragEnd={onRowDragEnd}
					domLayout="autoHeight"
					rowSelection={"multiple"}
					animateRows={true}
					rowDragManaged={true}
					onSelectionChanged={onSelectionChanged}
					onRowValueChanged={onRowValueChanged}
					columnMenu={"new"}
					editType={"fullRow"}
					deltaRowDataMode={true}
					getRowNodeId={(data) => data.id}
					immutableData={true}
					suppressFlash={true}
				/>
			</div>
			<Flex mt={4} justifyContent={"end"}>
				<Flex columnGap={2}>
					<Tooltip label="Please select at least 1 branch" isDisabled={selectedRows.length > 0} hasArrow>
						<Button onClick={clearSelection} leftIcon={<CloseIcon />} colorScheme={"red"} isDisabled={selectedRows.length < 1}>
							Deselect {selectedRows.length} Branch{selectedRows.length > 1 ? "es" : ""}
						</Button>
					</Tooltip>
				</Flex>
			</Flex>
			<AlertConfirmRowDelete isAlertOpen={isAlertOpen} onCloseAlert={onCloseAlert} cancelRef={cancelRef} removeSelectedRows={removeSelectedRows} />
		</div>
	);
}
