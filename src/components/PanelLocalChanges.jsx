import { Box, Button, Flex, Tooltip, Text, Input } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "../AppContext";
import useSocketEmits from "../hooks/useSocketEmits";
import { AgGridReact } from "ag-grid-react";
import DiffButton from "./DiffButton";
import useNotifications from "../hooks/useNotifications";

export default function PanelLocalChanges({ rowDataLocalChanges, setRowDataLocalChanges, defaultColDefsCommit }) {
	const { localChangesGridRef, isDebug, selectedBranches, showCommitView, setSelectedLocalChanges, selectedLocalChanges } = useApp();
	const { emitFilesRevert } = useSocketEmits();
	const { RaiseClientNotificaiton } = useNotifications();

	const [quickFilterFileViewText, setQuickFilterFileViewText] = useState("");

	const handleRevertFileViewFiles = useCallback(() => {
		emitFilesRevert(selectedLocalChanges);
	}, [emitFilesRevert, selectedLocalChanges]);

	const onQuickFilterFileViewInputChanged = useCallback(
		(e) => {
			setQuickFilterFileViewText(e.target.value);
		},
		[setQuickFilterFileViewText]
	);

	const onFileViewSelectionChanged = useCallback(() => {
		const selectedBranches = localChangesGridRef?.current?.api?.getSelectedNodes().map((node) => node.data);
		if (isDebug) console.log("CommitRegion.jsx: onFileViewSelectionChanged - selectedBranches", selectedBranches);
		setSelectedLocalChanges(selectedBranches);
	}, [localChangesGridRef, isDebug]);

	const handleDiffResult = useCallback(
		(result) => {
			if (result.success) RaiseClientNotificaiton("TortoiseSVN diff opened successfully", "success", 3000);
			else RaiseClientNotificaiton(`Error opening TortoiseSVN diff: ${JSON.stringify(result.error, null, 4)}`, "error", 0);
		},
		[RaiseClientNotificaiton]
	);

	const colDefsLocalChanges = useMemo(
		() => [
			{ headerCheckboxSelection: true, checkboxSelection: true, headerCheckboxSelectionFilteredOnly: true, width: 20, resizable: false, suppressMovable: false, filter: false, editable: false, headerClass: "branch-table-header-cell", cellClass: "branch-table-body-cell" },
			{ field: "Branch Folder" },
			{ field: "Branch Version" },
			{ field: "File Path", flex: 1 },
			{ field: "Local Status", headerTooltip: "Working Copy" },
			{
				headerName: "Diff",
				filter: false,
				sortable: false,
				resizable: false,
				cellRenderer: DiffButton,
				cellRendererParams: {
					onDiffResult: handleDiffResult,
				},
				width: 90,
			},
		],
		[]
	);

	useEffect(() => {
		if (selectedBranches.length < 1 || showCommitView) return;
		setQuickFilterFileViewText("");
		setRowDataLocalChanges([]);
		setSelectedLocalChanges([]);
	}, [selectedBranches, showCommitView])

	return (
		<Box>
			{rowDataLocalChanges.length > 0 ? (
				<Box>
					<Flex mb={4} alignItems={"center"}>
						<Text mr={2} fontWeight={"600"} whiteSpace={"nowrap"}>
							Quick Filter:
						</Text>
						<Input placeholder="Type to search..." onInput={onQuickFilterFileViewInputChanged} width={"100%"} />
					</Flex>
					<div className="ag-theme-quartz-dark" style={{ height: "480px", width: "100%" }}>
						<AgGridReact
							ref={localChangesGridRef}
							rowData={rowDataLocalChanges}
							defaultColDef={defaultColDefsCommit}
							columnDefs={colDefsLocalChanges}
							onSelectionChanged={onFileViewSelectionChanged}
							quickFilterText={quickFilterFileViewText}
							domLayout="normal"
							rowSelection={"multiple"}
							suppressRowClickSelection={true}
							rowMultiSelectWithClick={true}
							animateRows={true}
							columnMenu={"new"}
						/>
					</div>
					<Flex mt={4} columnGap={2} justifyContent={"flex-end"}>
						<Tooltip label={"Requires you to select at least 1 file"} hasArrow isDisabled={selectedLocalChanges.length > 0}>
							<Button onClick={handleRevertFileViewFiles} colorScheme={"red"} isDisabled={selectedLocalChanges.length < 1}>
								Revert Selected
							</Button>
						</Tooltip>
					</Flex>
				</Box>
			) : (
				<Box>
					<Text>Your selected branches do not contain any files to commit.</Text>
				</Box>
			)}
		</Box>
	);
}
