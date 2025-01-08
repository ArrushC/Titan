import React, { useCallback, useEffect, useState } from "react";
import { useApp } from "../ContextApp.jsx";
import { Box, Table } from "@chakra-ui/react";
import { Checkbox } from "./ui/checkbox.jsx";
import DialogRowDeletion from "./DialogRowDeletion.jsx";
import SectionBranchesRow from "./SectionBranchesRow.jsx";
import useSocketEmits from "../hooks/useSocketEmits.jsx";
import useNotifications from "../hooks/useNotifications.jsx";
import { useBranches } from "../ContextBranches.jsx";
import ActionBarSelection from "./ActionBarSelection.jsx";
import DialogBranchesLog from "./DialogBranchesLog.jsx";

export default function SectionBranches() {
	const updateConfig = useApp((ctx) => ctx.updateConfig);
	const configurableRowData = useApp((ctx) => ctx.configurableRowData);
	const selectedBranchesData = useApp((ctx) => ctx.selectedBranchesData);
	const selectedBranches = useApp((ctx) => ctx.selectedBranches);
	const selectedBrachesData = useApp((ctx) => ctx.selectedBranchesData);
	const setSelectedBranches = useApp((ctx) => ctx.setSelectedBranches);
	const setAppMode = useApp((ctx) => ctx.setAppMode);
	const handleBulkSelection = useApp((ctx) => ctx.handleBulkSelection);
	const setIsDialogSBLogOpen = useBranches((ctx) => ctx.setIsDialogSBLogOpen);
	const selectionMetrics = useBranches((ctx) => ctx.selectionMetrics);
	const { RaisePromisedClientNotification } = useNotifications();
	const { emitInfoSingle, emitUpdateSingle, emitStatusSingle } = useSocketEmits();

	const [isRowDialogOpen, setIsRowDialogOpen] = useState(false);
	const fireRowDialogAction = useCallback(() => {
		updateConfig((currentConfig) => {
			const newBranches = configurableRowData.filter((branch) => !selectedBranches[branch["SVN Branch"]]);
			return { ...currentConfig, branches: newBranches };
		});
	}, [updateConfig, configurableRowData, selectedBranches]);

	const updateSelectedBranches = useCallback(() => {
		const selectedBranchRows = selectedBranchesData;

		RaisePromisedClientNotification({
			title: "Updating Selected Branches",
			totalItems: selectedBranchRows.length,
			onProgress: async (index, { onSuccess }) => {
				const branchRow = selectedBranchRows[index];

				await new Promise((resolveUpdate) => {
					emitUpdateSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"], (response) => {
						if (response.success) {
							onSuccess();
							emitInfoSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"]);
							if (window.electron)
								window.electron
									.runCustomScript({
										scriptType: "powershell",
										scriptPath: "C:\\Titan\\Titan_PostUpdate_BranchSingle.ps1",
										branchData: branchRow,
									})
									.then((result) => {
										console.log("Custom Script Result: ", JSON.stringify(result, null, 4));
									})
									.catch((err) => {
										console.error("Custom Script error: " + JSON.stringify(err, null, 4));
									});
						}
						resolveUpdate();
					});
				});
			},
			successMessage: (count) => `Successfully updated ${count} branches`,
			errorMessage: (id) => `Failed to update branch ${id}`,
			loadingMessage: (current, total) => `Updating ${current} of ${total} branches`,
		}).catch(console.error);
	}, [RaisePromisedClientNotification, selectedBranchesData, emitUpdateSingle, emitInfoSingle]);

	const commitSelectedBranches = useCallback(() => {
		setAppMode((current) => (current == "commit" ? "branches" : "commit"));
	}, [setAppMode]);

	const refreshChangesSelectedBranches = useCallback(() => {
		selectedBrachesData.forEach((branchRow) => {
			console.log("Emitting status single for branch", branchRow["SVN Branch"]);
			emitStatusSingle(branchRow);
		});
	}, [selectedBrachesData, emitStatusSingle]);

	const logsSelectedBranches = useCallback(() => {
		setIsDialogSBLogOpen((prev) => !prev);
	}, [setIsDialogSBLogOpen]);

	useEffect(() => {
		if (!selectionMetrics.hasSelection) return;

		const handleKeyDown = (event) => {
			const eventKey = event?.key?.toLowerCase();
			if (!event.altKey) return;
			if (eventKey === "delete") {
				setIsRowDialogOpen(true);
			} else if (eventKey === "u") {
				updateSelectedBranches();
			} else if (eventKey === "c") {
				commitSelectedBranches();
			} else if (eventKey === "r") {
				refreshChangesSelectedBranches();
			} else if (eventKey === "l") {
				logsSelectedBranches();
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [selectionMetrics.hasSelection, updateSelectedBranches, refreshChangesSelectedBranches]);

	const selectAllBranches = useCallback(
		(checked) => {
			const paths = configurableRowData.map((row) => row["SVN Branch"]);
			handleBulkSelection(paths, checked);
		},
		[configurableRowData, setSelectedBranches]
	);

	return (
		<Box>
			<Table.Root size={"sm"} variant={"outline"} transition={"backgrounds"}>
				<Table.ColumnGroup>
					<Table.Column width="1%" />
					<Table.Column width="12%" />
					<Table.Column width="12%" />
					<Table.Column />
					<Table.Column />
					<Table.Column />
				</Table.ColumnGroup>
				<Table.Header>
					<Table.Row>
						<Table.ColumnHeader ps={3.5} pe={0.75}>
							<Checkbox aria-label="Select all rows" variant="subtle" colorPalette="yellow" checked={selectionMetrics.indeterminate ? "indeterminate" : selectionMetrics.selectedBranchesCount === configurableRowData.length} onCheckedChange={(e) => selectAllBranches(e.checked)} />
						</Table.ColumnHeader>
						<Table.ColumnHeader>Branch Folder</Table.ColumnHeader>
						<Table.ColumnHeader>Branch Version</Table.ColumnHeader>
						<Table.ColumnHeader>SVN Branch</Table.ColumnHeader>
						<Table.ColumnHeader>Branch Info</Table.ColumnHeader>
						<Table.ColumnHeader ps={3.5}>Custom Scripts</Table.ColumnHeader>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{configurableRowData.map((branchRow) => (
						<SectionBranchesRow key={branchRow.id} branchRow={branchRow} isSelected={!!selectedBranches[branchRow["SVN Branch"]]} />
					))}
				</Table.Body>
			</Table.Root>

			<ActionBarSelection selectedCount={selectionMetrics.selectedBranchesCount} onDelete={() => setIsRowDialogOpen(true)} onUpdate={updateSelectedBranches} onCommit={commitSelectedBranches} onRefreshChanges={refreshChangesSelectedBranches} onLogs={logsSelectedBranches} onClear={() => setSelectedBranches({})} />

			<DialogRowDeletion selectedCount={selectionMetrics.selectedBranchesCount} isDialogOpen={isRowDialogOpen} closeDialog={() => setIsRowDialogOpen(false)} fireDialogAction={fireRowDialogAction} />
			<DialogBranchesLog />
		</Box>
	);
}
