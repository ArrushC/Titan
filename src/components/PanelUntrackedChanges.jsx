import { Box, Button, Flex, Input, Text, Tooltip } from "@chakra-ui/react";
import { AgGridReact } from "ag-grid-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "../AppContext";
import useSocketEmits from "../hooks/useSocketEmits";

export default function PanelUntrackedChanges({rowDataUntrackedChanges, setRowDataUntrackedChanges, defaultColDefsCommit}) {
	const {untrackedChangesGridRef, selectedUntrackedChanges, setSelectedUntrackedChanges, isDebug, selectedBranches, showCommitView} = useApp();
	const {emitFilesAddRemove, emitFilesRevert} = useSocketEmits();

	const [quickFilterUnseenText, setQuickFilterUnseenText] = useState("");

	const onQuickFilterUnseenInputChanged = useCallback(
		(e) => {
			setQuickFilterUnseenText(e.target.value);
		},
		[setQuickFilterUnseenText]
	);

	const onUnseenFilesSelectionChanged = useCallback(() => {
		const selectedBranches = untrackedChangesGridRef?.current?.api?.getSelectedNodes().map((node) => node.data);
		if (isDebug) console.log("CommitRegion.jsx: onUnseenFilesSelectionChanged - selectedBranches", selectedBranches);
		setSelectedUntrackedChanges(selectedBranches);
	}, [untrackedChangesGridRef, isDebug]);

	const handleAddRemoveFiles = useCallback(() => {
		emitFilesAddRemove(selectedUntrackedChanges);
	}, [emitFilesAddRemove, selectedUntrackedChanges]);

	const hanldeRevertUnseenFiles = useCallback(() => {
		emitFilesRevert(selectedUntrackedChanges);
	}, [emitFilesRevert, selectedUntrackedChanges]);

	const colDefsUntracked = useMemo(
		() => [
			{ headerCheckboxSelection: true, checkboxSelection: true, headerCheckboxSelectionFilteredOnly: true, width: 20, resizable: false, suppressMovable: false, filter: false, editable: false, headerClass: "branch-table-header-cell", cellClass: "branch-table-body-cell" },
			{ field: "Branch Folder" },
			{ field: "Branch Version" },
			{ field: "File Path", flex: 1 },
			{ field: "Local Status", headerTooltip: "Working Copy" },
		],
		[]
	);

	useEffect(() => {
		if (selectedBranches.length < 1 || showCommitView) return;
		setQuickFilterUnseenText("");
		setRowDataUntrackedChanges([])
		setSelectedUntrackedChanges([]);
	}, [selectedBranches, showCommitView]);

	return (
		<Box>
			{rowDataUntrackedChanges.length > 0 ? (
				<Box>
					<Text mb={4}>Below are the list of files which are either unversioned or missing in the repository:</Text>
					<Flex mb={4} alignItems={"center"}>
						<Text mr={2} fontWeight={"600"} whiteSpace={"nowrap"}>
							Quick Filter:
						</Text>
						<Input placeholder="Type to search..." onInput={onQuickFilterUnseenInputChanged} width={"100%"} />
					</Flex>
					<div className="ag-theme-quartz-dark" style={{ height: "390px", width: "100%" }}>
						<AgGridReact
							ref={untrackedChangesGridRef}
							rowData={rowDataUntrackedChanges}
							defaultColDef={defaultColDefsCommit}
							columnDefs={colDefsUntracked}
							onSelectionChanged={onUnseenFilesSelectionChanged}
							quickFilterText={quickFilterUnseenText}
							domLayout="normal"
							rowSelection={"multiple"}
							rowMultiSelectWithClick={true}
							animateRows={true}
							columnMenu={"new"}
						/>
					</div>
					<Flex mt={4} columnGap={2} justifyContent={"flex-end"}>
						<Tooltip label={"Requires you to select at least 1 file"} hasArrow isDisabled={selectedUntrackedChanges.length > 0}>
							<Button onClick={handleAddRemoveFiles} colorScheme={"green"} isDisabled={selectedUntrackedChanges.length < 1}>
								Add/Remove Selected
							</Button>
						</Tooltip>
						<Tooltip label={"Requires you to select at least 1 file"} hasArrow isDisabled={selectedUntrackedChanges.length > 0}>
							<Button onClick={hanldeRevertUnseenFiles} colorScheme={"red"} isDisabled={selectedUntrackedChanges.length < 1}>
								Revert Selected
							</Button>
						</Tooltip>
					</Flex>
				</Box>
			) : (
				<Box>
					<Text>Your selected branches do not contain any unversioned or missing files.</Text>
				</Box>
			)}
		</Box>
	);
}
