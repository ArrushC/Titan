import React, { useCallback, useEffect, useState } from "react";
import { useApp } from "../ContextApp.jsx";
import { Box, Flex, Heading, Table } from "@chakra-ui/react";
import { Checkbox } from "./ui/checkbox.jsx";
import DialogRowDeletion from "./DialogRowDeletion.jsx";
import { IoMdAdd } from "react-icons/io";
import SectionBranchesRow from "./SectionBranchesRow.jsx";
import ButtonIconTooltip from "./ButtonIconTooltip.jsx";
import useSocketEmits from "../hooks/useSocketEmits.jsx";
import { MdUpdate } from "react-icons/md";
import useNotifications from "../hooks/useNotifications.jsx";
import { useBranches } from "../ContextBranches.jsx";
import ActionBarSelection from "./ActionBarSelection.jsx";
import DialogBranchesLog from "./DialogBranchesLog.jsx";

export default function SectionBranches() {
	const updateConfig = useApp((ctx) => ctx.updateConfig);
	const configurableRowData = useApp((ctx) => ctx.configurableRowData);
	const selectedBranchesData = useApp((ctx) => ctx.selectedBranchesData);
	const selectedBranches = useApp((ctx) => ctx.selectedBranches);
	const setSelectedBranches = useApp((ctx) => ctx.setSelectedBranches);
	const setAppMode = useApp((ctx) => ctx.setAppMode);
	const handleBulkSelection = useBranches((ctx) => ctx.handleBulkSelection);
	const setIsDialogSBLogOpen = useBranches(ctx => ctx.setIsDialogSBLogOpen);
	const selectionMetrics = useBranches(ctx => ctx.selectionMetrics);
	const { RaisePromisedClientNotification } = useNotifications();
	const { emitInfoSingle, emitUpdateSingle } = useSocketEmits();

	const [isRowDialogOpen, setIsRowDialogOpen] = useState(false);
	const fireRowDialogAction = useCallback(() => {
		updateConfig((currentConfig) => {
			const newBranches = configurableRowData.filter((branch) => !selectedBranches[branch["SVN Branch"]]);
			return { ...currentConfig, branches: newBranches };
		});
	}, [updateConfig, configurableRowData, selectedBranches]);

	const updateAll = useCallback(() => {
		RaisePromisedClientNotification({
			title: "Updating Branches",
			totalItems: configurableRowData.length,
			onProgress: async (index, { onSuccess }) => {
				const branchRow = configurableRowData[index];

				await new Promise((resolveUpdate) => {
					emitUpdateSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"], (response) => {
						if (response.success) {
							onSuccess();
							emitInfoSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"]);
						}
						resolveUpdate();
					});
				});
			},
			successMessage: (count) => `${count} branches successfully updated`,
			errorMessage: (id) => `Failed to update branch ${id}`,
			loadingMessage: (current, total) => `Updating ${current} of ${total} branches`,
		}).catch(console.error);
	}, [RaisePromisedClientNotification, configurableRowData, emitUpdateSingle, emitInfoSingle]);

	const addRow = useCallback(() => {
		updateConfig((currentConfig) => {
			const newBranch = {
				id: `${Date.now()}`,
				"Branch Folder": "",
				"Branch Version": "",
				"SVN Branch": "",
				"Branch Info": "Please add branch path",
			};
			return { ...currentConfig, branches: [...configurableRowData, newBranch] };
		});
	}, [updateConfig, configurableRowData]);

	const refreshSelectedBranches = useCallback(() => {
		configurableRowData
			.filter((branchRow) => selectedBranches[branchRow["SVN Branch"]])
			.forEach((branchRow) => {
				emitInfoSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"]);
			});
	}, [configurableRowData, selectedBranches]);

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

	const logsSelectedBranches = useCallback(() => {
		setIsDialogSBLogOpen((prev) => !prev);
	}, [setIsDialogSBLogOpen]);

	useEffect(() => {
		if (!selectionMetrics.hasSelection) return;

		const handleKeyDown = (event) => {
			if (!event.altKey) return;

			if (event.key === "Delete") {
				setIsRowDialogOpen(true);
			} else if (event.key === "r") {
				refreshSelectedBranches();
			} else if (event.key === "u") {
				updateSelectedBranches();
			} else if (event.key === "c") {
				commitSelectedBranches();
			} else if (event.key === "l") {
				logsSelectedBranches();
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [selectionMetrics.hasSelection, refreshSelectedBranches, updateSelectedBranches]);

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
						<Table.ColumnHeader w="6">
							<Checkbox top="0" aria-label="Select all rows" variant="subtle" colorPalette="yellow" checked={selectionMetrics.indeterminate ? "indeterminate" : selectionMetrics.selectedBranchesCount === configurableRowData.length} onCheckedChange={(e) => selectAllBranches(e.checked)} />
						</Table.ColumnHeader>
						<Table.ColumnHeader>Branch Folder</Table.ColumnHeader>
						<Table.ColumnHeader>Branch Version</Table.ColumnHeader>
						<Table.ColumnHeader>SVN Branch</Table.ColumnHeader>
						<Table.ColumnHeader>Branch Info</Table.ColumnHeader>
						<Table.ColumnHeader>Custom Scripts</Table.ColumnHeader>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{configurableRowData.map((branchRow) => (
						<SectionBranchesRow key={branchRow.id} branchRow={branchRow} isSelected={!!selectedBranches[branchRow["SVN Branch"]]}  />
					))}
				</Table.Body>
				<Table.Footer>
					<Table.Row>
						<Table.Cell colSpan={6}>
							<Flex justifyContent={"start"} p={2}>
								<Flex gapX={2}>
									<ButtonIconTooltip icon={<IoMdAdd />} colorPalette={"yellow"} variant={"subtle"} label={"Add Row"} placement={"bottom-end"} onClick={addRow} />
									<ButtonIconTooltip icon={<MdUpdate />} colorPalette={"yellow"} variant={"subtle"} label={"Update All"} placement={"bottom-end"} onClick={updateAll} disabled={configurableRowData.length < 1} />
								</Flex>
							</Flex>
						</Table.Cell>
					</Table.Row>
				</Table.Footer>
			</Table.Root>

			<ActionBarSelection
                selectedCount={selectionMetrics.selectedBranchesCount}
                onDelete={() => setIsRowDialogOpen(true)}
                onRefresh={refreshSelectedBranches}
                onUpdate={updateSelectedBranches}
                onCommit={commitSelectedBranches}
                onLogs={logsSelectedBranches}
                onClear={() => setSelectedBranches({})}
            />

			<DialogRowDeletion selectedCount={selectionMetrics.selectedBranchesCount} isDialogOpen={isRowDialogOpen} closeDialog={() => setIsRowDialogOpen(false)} fireDialogAction={fireRowDialogAction} />
			<DialogBranchesLog />
		</Box>
	);
}
