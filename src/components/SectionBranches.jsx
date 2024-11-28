import React, { useCallback, useEffect, useState } from "react";
import { useApp } from "../AppContext.jsx";
import { Box, Button, Flex, IconButton, Kbd, Mark, Table, Text } from "@chakra-ui/react";
import { Checkbox } from "./ui/checkbox.jsx";
import { ActionBarContent, ActionBarRoot, ActionBarSelectionTrigger, ActionBarSeparator } from "./ui/action-bar.jsx";
import DialogRowDeletion from "./DialogRowDeletion.jsx";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import SectionBranchesRow from "./SectionBranchesRow.jsx";
import ButtonIconTooltip from "./ButtonIconTooltip.jsx";
import useSocketEmits from "../hooks/useSocketEmits.jsx";
import { MdUpdate } from "react-icons/md";
import useNotifications from "../hooks/useNotifications.jsx";

export default function SectionBranches() {
	const { updateConfig, configurableRowData, selectedBranches, setSelectedBranches } = useApp();
	const { RaisePromisedClientNotification } = useNotifications();
	const { emitInfoSingle, emitUpdateSingle } = useSocketEmits();
	const [selectionMetrics, setSelectionMetrics] = useState({
		selectedBranchesCount: 0,
		indeterminate: false,
		hasSelection: false,
	});

	useEffect(() => {
		const validBranchIds = new Set(configurableRowData.map((branch) => branch.id));
		const selectedBranchIds = Object.keys(selectedBranches).filter((id) => selectedBranches[id]);

		const hasInvalidSelections = selectedBranchIds.some((id) => !validBranchIds.has(id));

		if (hasInvalidSelections) {
			const validSelectedBranches = Object.entries(selectedBranches).reduce((acc, [id, isSelected]) => {
				if (isSelected && validBranchIds.has(id)) {
					acc[id] = true;
				}
				return acc;
			}, {});

			setSelectedBranches(validSelectedBranches);
		}
	}, [configurableRowData, selectedBranches, setSelectedBranches]);

	useEffect(() => {
		const selectedCount = Object.keys(selectedBranches).filter((key) => selectedBranches[key]).length;
		setSelectionMetrics({
			selectedBranchesCount: selectedCount,
			indeterminate: selectedCount > 0 && selectedCount < configurableRowData.length,
			hasSelection: selectedCount > 0,
		});
	}, [selectedBranches, configurableRowData]);

	const [isRowDialogOpen, setIsRowDialogOpen] = useState(false);
	const fireRowDialogAction = useCallback(() => {
		updateConfig((currentConfig) => {
			const newBranches = configurableRowData.filter((branch) => !selectedBranches[branch.id]);
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
							emitInfoSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"], null);
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
			.filter((branchRow) => selectedBranches[branchRow.id])
			.forEach((branchRow) => {
				emitInfoSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"], null);
			});
	}, [configurableRowData, selectedBranches]);

	const updateSelectedBranches = useCallback(() => {
		const selectedBranchRows = configurableRowData.filter((branchRow) => selectedBranches[branchRow.id]);

		RaisePromisedClientNotification({
			title: "Updating Selected Branches",
			totalItems: selectedBranchRows.length,
			onProgress: async (index, { onSuccess }) => {
				const branchRow = selectedBranchRows[index];

				await new Promise((resolveUpdate) => {
					emitUpdateSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"], (response) => {
						if (response.success) {
							onSuccess();
							emitInfoSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"], null);
						}
						resolveUpdate();
					});
				});
			},
			successMessage: (count) => `Successfully updated ${count} branches`,
			errorMessage: (id) => `Failed to update branch ${id}`,
			loadingMessage: (current, total) => `Updating ${current} of ${total} branches`,
		}).catch(console.error);
	}, [RaisePromisedClientNotification, configurableRowData, selectedBranches, emitUpdateSingle, emitInfoSingle]);

	const commitSelectedBranches = useCallback(() => {
		console.log("Committing selected branches");
	}, []);

	const logsSelectedBranches = useCallback(() => {
		console.log("Logs selected branches");
	}, []);

	useEffect(() => {
		if (!selectionMetrics.hasSelection) return;

		const handleKeyDown = (event) => {
			if (event.key === "Delete") {
				setIsRowDialogOpen(true);
			} else if (event.key === "r" && event.altKey) {
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
	}, [selectionMetrics.hasSelection, setIsRowDialogOpen, refreshSelectedBranches, updateSelectedBranches]);

	const selectAllBranches = useCallback(
		(checked) => {
			console.log("Select All: ", checked);
			if (checked) {
				const newSelection = configurableRowData.reduce((acc, branch) => {
					acc[branch.id] = true;
					return acc;
				}, {});
				setSelectedBranches(newSelection);
			} else {
				setSelectedBranches({});
			}
		},
		[configurableRowData, setSelectedBranches]
	);

	return (
		<Box>
			<Table.Root size={"sm"} variant={"outline"} transition={"backgrounds"}>
				<Table.ColumnGroup>
					<Table.Column width="1%" />
					<Table.Column width="15%" />
					<Table.Column width="15%" />
					<Table.Column />
					<Table.Column width="15%%" />
					<Table.Column width="15%" />
				</Table.ColumnGroup>
				<Table.Header>
					<Table.Row>
						<Table.ColumnHeader w="6">
							<Checkbox top="0" aria-label="Select all rows" variant={"subtle"} colorPalette={"yellow"} checked={selectionMetrics.indeterminate ? "indeterminate" : selectionMetrics.selectedBranchesCount === configurableRowData.length} onCheckedChange={(e) => selectAllBranches(e.checked)} />
						</Table.ColumnHeader>
						<Table.ColumnHeader>Branch Folder</Table.ColumnHeader>
						<Table.ColumnHeader>Branch Version</Table.ColumnHeader>
						<Table.ColumnHeader>SVN Branch</Table.ColumnHeader>
						<Table.ColumnHeader>Branch Info</Table.ColumnHeader>
						<Table.ColumnHeader>Custom Scripts</Table.ColumnHeader>
					</Table.Row>
				</Table.Header>
				<Table.Body>{configurableRowData && configurableRowData.length > 0 ? configurableRowData.map((branchRow) => <SectionBranchesRow key={branchRow.id} branchRow={branchRow} />) : null}</Table.Body>
				<Table.Footer>
					<Table.Row>
						<Table.Cell colSpan={6}>
							<Flex justifyContent={"space-between"} p={2}>
								<Flex>
									<Mark variant={"solid"} colorPalette={"yellow"} px={2} py={2} rounded={"md"} textAlign={"center"}>
										Total Branches:{" "}
										<Text as="span" fontWeight={"bold"}>
											{configurableRowData.length}
										</Text>
									</Mark>
								</Flex>
								<Flex gapX={2}>
									<ButtonIconTooltip icon={<MdUpdate />} colorPalette={"yellow"} variant={"subtle"} label={"Update All"} placement={"bottom-end"} onClick={updateAll} />
									<ButtonIconTooltip icon={<IoMdAdd />} colorPalette={"yellow"} variant={"subtle"} label={"Add Row"} placement={"bottom-end"} onClick={addRow} />
								</Flex>
							</Flex>
						</Table.Cell>
					</Table.Row>
				</Table.Footer>
			</Table.Root>

			<ActionBarRoot open={selectionMetrics.hasSelection} closeOnEscape={false}>
				<ActionBarContent>
					<ActionBarSelectionTrigger>{selectionMetrics.selectedBranchesCount} Selected</ActionBarSelectionTrigger>
					<ActionBarSeparator />
					<Button variant="outline" size="sm" onClick={() => setIsRowDialogOpen(true)}>
						Delete <Kbd wordSpacing={0}>Del</Kbd>
					</Button>
					<Button variant="outline" size="sm" onClick={() => refreshSelectedBranches()}>
						Refresh <Kbd wordSpacing={0}>Alt&nbsp;+&nbsp;R</Kbd>
					</Button>
					<Button variant="outline" size="sm" onClick={() => updateSelectedBranches()}>
						Update <Kbd wordSpacing={0}>U</Kbd>
					</Button>
					<Button variant="outline" size="sm" onClick={() => commitSelectedBranches()}>
						Commit <Kbd wordSpacing={0}>C</Kbd>
					</Button>
					<Button variant="outline" size="sm" onClick={() => logsSelectedBranches()}>
						Logs <Kbd wordSpacing={0}>L</Kbd>
					</Button>
					<ActionBarSeparator />
					<IconButton variant={"ghost"} size={"sm"} onClick={() => setSelectedBranches({})} disabled={!window.electron}>
						<IoMdClose />
					</IconButton>
				</ActionBarContent>
			</ActionBarRoot>

			<DialogRowDeletion isDialogOpen={isRowDialogOpen} closeDialog={() => setIsRowDialogOpen(false)} fireDialogAction={fireRowDialogAction} />
		</Box>
	);
}
