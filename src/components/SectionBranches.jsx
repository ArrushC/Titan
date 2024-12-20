import React, { useCallback, useEffect, useState, useRef } from "react";
import { useApp } from "../AppContext";
import { Button, Flex, Icon, Tooltip, Wrap } from "@chakra-ui/react";
import { CloseIcon, RepeatIcon, SmallAddIcon, TimeIcon } from "@chakra-ui/icons";
import { FaUndo } from "react-icons/fa";
import AlertConfirmRowDelete from "./AlertConfirmRowDelete";
import { stripBranchInfo } from "../utils/CommonConfig";
import { MdCloudDownload, MdCloudUpload, MdOutlineSwitchAccessShortcut } from "react-icons/md";
import { AiFillDelete } from "react-icons/ai";
import TableBranches from "./TableBranches";
import useSocketEmits from "../hooks/useSocketEmits";
import useNotifications from "../hooks/useNotifications";
import useManagedRowDataBranches from "../hooks/useManagedRowDataBranches";

export default function SectionBranches() {
	const { socket, updateConfig, isDebug, setShowSelectedBranchesLog, configurableRowData, branchTableGridRef, selectedBranches, setSelectedBranches, isCommitMode, setIsCommitMode, setShowCommitView } = useApp();
	const { emitUpdateSingle, emitInfoSingle } = useSocketEmits();
	const { RaiseClientNotificaiton } = useNotifications();

	const [isAlertOpen, setIsAlertOpen] = useState(false);
	const cancelRef = useRef();
	const onCloseAlert = () => setIsAlertOpen(false);

	const { rowDataBranches, setRowDataBranches, onRowValueChanged } = useManagedRowDataBranches();
	const [lastInfoTaskTime, setLastInfoTaskTime] = useState(0);

	const [outdatedBranches, setOutdatedBranches] = useState([]);

	/****************************************************
	 * Callback Functions - Table Operations
	 ****************************************************/
	const clearSelection = useCallback(() => {
		if (isDebug) console.log("SectionBranches.jsx: clearSelection: START");
		branchTableGridRef?.current?.api?.deselectAll();
		setSelectedBranches([]);
		setIsCommitMode(false);
	}, [isDebug, branchTableGridRef, setSelectedBranches]);

	/****************************************************
	 * Callback Functions - Alert Dialog
	 ****************************************************/
	const openAlertDialog = useCallback(() => {
		const selectedBranches = branchTableGridRef?.current?.api?.getSelectedNodes().map((node) => node.data);
		setSelectedBranches(selectedBranches);
		setIsAlertOpen(true);
	}, [branchTableGridRef, setSelectedBranches]);

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
	}, [updateConfig]);

	const updateSelectedBranches = useCallback(() => {
		selectedBranches.forEach((row) => {
			emitUpdateSingle(row.id, row["SVN Branch"], row["Branch Version"], row["Branch Folder"]);
		});
	}, [selectedBranches, emitUpdateSingle]);

	const updateOutdatedBranches = useCallback(() => {
		outdatedBranches.forEach((row) => {
			emitUpdateSingle(row.id, row["SVN Branch"], row["Branch Version"], row["Branch Folder"]);
		});
	}, [outdatedBranches, emitUpdateSingle]);

	const removeSelectedRows = useCallback(() => {
		const selectedIds = selectedBranches.map((row) => row.id);
		const updatedData = rowDataBranches.filter((row) => !selectedIds.includes(row.id));
		console.log("SectionBranches.jsx: removeSelectedRows - updatedData", updatedData);
		updateConfig((currentConfig) => ({ ...currentConfig, branches: stripBranchInfo(updatedData) }));
		clearSelection();
		onCloseAlert();
	}, [selectedBranches, rowDataBranches, updateConfig]);

	const viewSelectedBranchesLog = useCallback(() => {
		setShowSelectedBranchesLog(true);
	}, []);

	const refreshSelected = useCallback(() => {
		setRowDataBranches((currentRowData) => {
			const newRowData = [...currentRowData];
			selectedBranches.forEach((row) => {
				const index = newRowData.findIndex((r) => r.id === row.id);
				newRowData[index]["Branch Info"] = "Refreshing";
			});
			return newRowData;
		});
		selectedBranches.forEach((row) => {
			emitInfoSingle(row.id, row["SVN Branch"], row["Branch Version"], row["Branch Folder"]);
		});
	}, [selectedBranches, emitInfoSingle]);

	const refreshAll = useCallback((forceRefresh = false) => {
		if (isCommitMode && !forceRefresh) return;
		RaiseClientNotificaiton("Refreshing all branches. Please wait until this is done!", "info", 3000);
		const now = Date.now();
		configurableRowData.forEach((row) => {
			emitInfoSingle(row.id, row["SVN Branch"], row["Branch Version"], row["Branch Folder"]);
		});
		setLastInfoTaskTime(now);
	}, [configurableRowData, emitInfoSingle, RaiseClientNotificaiton, isCommitMode]);

	const toggleCommitSelectedBranches = useCallback(() => {
		setIsCommitMode((currentIsCommitMode) => !currentIsCommitMode);
		setShowCommitView(false);
	}, [setIsCommitMode]);

	/****************************************************
	 * Hooks setup
	 ****************************************************/

	// Check for outdated branches when rowDataBranches changes
	useEffect(() => {
		const outdatedBranches = rowDataBranches.filter((row) => String(row["Branch Info"]).toLowerCase().includes("-"));
		setOutdatedBranches(outdatedBranches);
	}, [rowDataBranches]);

	// Create and change intervals for refreshAll when configurableRowData changes
	useEffect(() => {
		const intervalDuration = 60_000 * 5; // 5 minutes
		const now = Date.now();

		if (configurableRowData.length > 0) {
			if (now - lastInfoTaskTime > intervalDuration) refreshAll();

			const interval = setInterval(() => {
				refreshAll();
			}, intervalDuration);
			return () => clearInterval(interval);
		}
	}, [configurableRowData, lastInfoTaskTime, refreshAll]);

	// Emit svn-info-single when branch-success-single is received as a result of a successful SVN operation
	useEffect(() => {
		const socketCallback = (data) => {
			if (isDebug) console.debug("branch-success-single data received:", data);
			emitInfoSingle(data.id, data.branch, data.version, data.folder);
		};

		socket?.on("branch-success-single", socketCallback);
		return () => socket?.off("branch-success-single", socketCallback);
	}, [isDebug, socket, emitInfoSingle]);

	return (
		<div>
			<Wrap mb={4} justify={"space-between"}>
				<Flex columnGap={2}>
					{/* <Tooltip label="Requires at least 1 branch" isDisabled={selectedBranches.length > 0} hasArrow>
						<Button onClick={refreshSelected} leftIcon={<RepeatIcon />} colorScheme={"yellow"} isDisabled={selectedBranches.length < 1}>
							Refresh {selectedBranches.length > 0 ? `${selectedBranches.length} Branch` : ""}
							{selectedBranches.length > 1 ? "es" : ""}
						</Button>
					</Tooltip> */}
					<Tooltip label="Requires at least 1 branch" isDisabled={selectedBranches.length > 0} hasArrow>
						<Button onClick={updateSelectedBranches} leftIcon={<Icon as={MdCloudDownload} />} colorScheme={"yellow"} isDisabled={selectedBranches.length < 1}>
							Update {selectedBranches.length > 0 ? `${selectedBranches.length} Branch` : ""}
							{selectedBranches.length > 1 ? "es" : ""}
						</Button>
					</Tooltip>
					<Tooltip label="Requires at least 1 branch" isDisabled={selectedBranches.length > 0} hasArrow>
						<Button onClick={toggleCommitSelectedBranches} leftIcon={<Icon as={isCommitMode ? FaUndo : MdCloudUpload} />} colorScheme={"yellow"} isDisabled={selectedBranches.length < 1}>
							{isCommitMode ? "Undo Commit" : "Commit"}
						</Button>
					</Tooltip>
					<Tooltip label="Requires at least 1 branch" isDisabled={selectedBranches.length > 0} hasArrow>
						<Button onClick={viewSelectedBranchesLog} leftIcon={<TimeIcon />} colorScheme={"yellow"} isDisabled={selectedBranches.length < 1}>
							View Logs
						</Button>
					</Tooltip>
				</Flex>
				<Flex columnGap={2}>
					<Tooltip label="No outdated branches to update" isDisabled={outdatedBranches.length > 0} hasArrow>
						<Button onClick={updateOutdatedBranches} leftIcon={<MdOutlineSwitchAccessShortcut />} colorScheme={"yellow"} isDisabled={outdatedBranches.length < 1}>
							Update All
						</Button>
					</Tooltip>
				</Flex>
			</Wrap>
			<TableBranches rowData={rowDataBranches} onRowValueChanged={onRowValueChanged} refreshAll={refreshAll} />
			<Flex columnGap={2} mt={4}>
				<Tooltip label="Please select at least 1 branch" isDisabled={selectedBranches.length > 0} hasArrow>
					<Button onClick={clearSelection} leftIcon={<CloseIcon />} colorScheme={"red"} isDisabled={selectedBranches.length < 1}>
						Deselect {selectedBranches.length > 0 ? `${selectedBranches.length} Branch` : ""}
						{selectedBranches.length > 1 ? "es" : ""}
					</Button>
				</Tooltip>
				<Tooltip label="Please select at least 1 branch" isDisabled={selectedBranches.length > 0} hasArrow>
					<Button onClick={openAlertDialog} leftIcon={<AiFillDelete />} colorScheme={"red"} isDisabled={selectedBranches.length < 1}>
						Delete {selectedBranches.length > 0 ? `${selectedBranches.length} Branch` : ""}
						{selectedBranches.length > 1 ? "es" : ""}
					</Button>
				</Tooltip>
				<Button onClick={addNewRow} leftIcon={<SmallAddIcon boxSize={8} />} colorScheme={"green"}>
					New Row
				</Button>
			</Flex>
			<AlertConfirmRowDelete isAlertOpen={isAlertOpen} onCloseAlert={onCloseAlert} cancelRef={cancelRef} removeSelectedRows={removeSelectedRows} />
		</div>
	);
}
