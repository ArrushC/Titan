import { Box, Flex, HStack, Input, Table } from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import { useCommit } from "../ContextCommit.jsx";
import ButtonDiff from "./ButtonDiff.jsx";
import useNotifications from "../hooks/useNotifications.jsx";
import { Checkbox } from "./ui/checkbox.jsx";
import { InputGroup } from "./ui/input-group.jsx";
import { LuSearch } from "react-icons/lu";
import DialogModifiedChangesRevert from "./DialogModifiedChangesRevert.jsx";
import { Button } from "./ui/button.jsx";
import useSocketEmits from "../hooks/useSocketEmits.jsx";

// Helper function to sort rows based on the current stack.
// Each step in the stack has the shape { column, direction }.
// Sorting occurs in the order of the stack array.
function sortByStack(rows, sortStack) {
	return [...rows].sort((a, b) => {
		for (const sortItem of sortStack) {
			let aVal, bVal;
			switch (sortItem.column) {
				case "branch":
					aVal = a.branchString.toLowerCase();
					bVal = b.branchString.toLowerCase();
					break;
				case "path":
					aVal = a.file.pathDisplay.toLowerCase();
					bVal = b.file.pathDisplay.toLowerCase();
					break;
				case "remote":
					aVal = a.file.reposStatus.toLowerCase();
					bVal = b.file.reposStatus.toLowerCase();
					break;
				case "status":
					// If you need a custom ordering of statuses, adapt accordingly.
					// For a standard alphabetical sort:
					aVal = a.file.wcStatus.toLowerCase();
					bVal = b.file.wcStatus.toLowerCase();
					break;
				default:
					aVal = 0;
					bVal = 0;
			}

			if (aVal < bVal) return sortItem.direction === "asc" ? -1 : 1;
			if (aVal > bVal) return sortItem.direction === "asc" ? 1 : -1;
			// If they are equal, move on to the next sort column in the stack.
		}
		return 0;
	});
}

function getSortIndicator(columnKey, sortStack) {
	const itemIndex = sortStack.findIndex((s) => s.column === columnKey);
	if (itemIndex === -1) return null;
	return sortStack[itemIndex].direction === "asc" ? "↑" : "↓";
}

export default function SubSectionConflictingChanges() {
	const { emitFilesRevert } = useSocketEmits();
	const { RaiseClientNotificaiton } = useNotifications();
	const conflictingChanges = useCommit((ctx) => ctx.conflictingChanges);
	const selectedConflictingChanges = useCommit((ctx) => ctx.selectedConflictingChanges);
	const setSelectedConflictingChanges = useCommit((ctx) => ctx.setSelectedConflictingChanges);

	const [searchTerm, setSearchTerm] = useState("");
	const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);

	const [sortStack, setSortStack] = useState([
		{ column: "status", direction: "asc" },
		{ column: "remote", direction: "desc" },
	]);

	const getStatusColor = useCallback((status) => {
		switch (status) {
			case "modified":
				return "cyan.500";
			case "deleted":
			case "missing":
				return "red.500";
			case "added":
			case "unversioned":
				return "green.500";
			default:
				return "purple.600";
		}
	}, []);

	// Toggle or move a given column to top of the stack.
	// Clicking again toggles its direction between asc and desc.
	const handleSort = useCallback((columnKey) => {
		setSortStack((prev) => {
			const existingIndex = prev.findIndex((s) => s.column === columnKey);
			if (existingIndex === -1) {
				// Not in stack yet, push it to the front with ascending.
				return [{ column: columnKey, direction: "asc" }, ...prev];
			}

			// Already in stack. Toggle asc <-> desc, move that item to the front.
			const updatedSort = { ...prev[existingIndex] };
			updatedSort.direction = updatedSort.direction === "asc" ? "desc" : "asc";

			const newStack = [...prev];
			newStack.splice(existingIndex, 1);
			newStack.unshift(updatedSort);
			return newStack;
		});
	}, []);

	const handlePathSelection = useCallback(
		(path, pathStatus, checked) => {
			setSelectedConflictingChanges((currentSelection) => {
				if (checked) return { ...currentSelection, [path]: pathStatus };
				const { [path]: _, ...newSelection } = currentSelection;
				return newSelection;
			});
		},
		[setSelectedConflictingChanges]
	);

	const handleDiffResult = useCallback(
		(result) => {
			if (result.success) RaiseClientNotificaiton("TortoiseSVN diff opened successfully", "success", 3000);
			else RaiseClientNotificaiton(`Error opening TortoiseSVN diff: ${JSON.stringify(result.error, null, 4)}`, "error", 0);
		},
		[RaiseClientNotificaiton]
	);

	const filteredUnknownChanges = useMemo(() => {
		if (!searchTerm) return conflictingChanges;

		const lowerSearch = searchTerm.toLowerCase();
		const filtered = {};

		Object.keys(conflictingChanges).forEach((branchPath) => {
			const branchData = conflictingChanges[branchPath];
			const { branchString, filesToUpdate, "Branch Folder": branchFolder, "Branch Version": branchVersion } = branchData;

			const filteredFiles = filesToUpdate.filter((file) => {
				const fieldsToCheck = [branchString, branchFolder, branchVersion, branchPath, file.pathDisplay, file.wcStatus, file.reposStatus];
				return fieldsToCheck.some((field, i) => field?.toString().toLowerCase().includes(i === 4 ? lowerSearch.replace(/\//g, '\\') : lowerSearch));
			});

			if (filteredFiles.length > 0) {
				filtered[branchPath] = {
					...branchData,
					filesToUpdate: filteredFiles,
				};
			}
		});

		return filtered;
	}, [conflictingChanges, searchTerm]);

	// Flatten all filtered changes into a single array so we can sort globally.
	const allFilteredRows = useMemo(() => {
		const rows = [];
		Object.keys(filteredUnknownChanges).forEach((branchPath) => {
			const { branchString, branchFolder, branchVersion, filesToUpdate } = filteredUnknownChanges[branchPath];
			filesToUpdate.forEach((file) => {
				rows.push({
					branchPath,
					branchString,
					branchFolder,
					branchVersion,
					file,
				});
			});
		});
		return rows;
	}, [filteredUnknownChanges]);

	// Apply sorting based on sortStack.
	const sortedRows = useMemo(() => {
		return sortByStack(allFilteredRows, sortStack);
	}, [allFilteredRows, sortStack]);

	// Figure out which paths appear in the filtered set (post-search).
	const allFilteredPaths = useMemo(() => {
		return sortedRows.map((row) => row.file.path);
	}, [sortedRows]);

	// For the top checkbox in the table header, we do "select all/deselect all"
	const { allSelected, someSelected } = useMemo(() => {
		if (allFilteredPaths.length === 0) {
			return { allSelected: false, someSelected: false };
		}
		const selectedCount = allFilteredPaths.filter((p) => selectedConflictingChanges[p]).length;
		return {
			allSelected: selectedCount === allFilteredPaths.length,
			someSelected: selectedCount > 0 && selectedCount < allFilteredPaths.length,
		};
	}, [allFilteredPaths, selectedConflictingChanges]);

	const handleHeaderCheckboxChange = useCallback(
		(checked) => {
			if (checked) {
				setSelectedConflictingChanges((currentSelection) => {
					const newSelection = { ...currentSelection };
					for (const path of allFilteredPaths) {
						newSelection[path] = true;
					}
					return newSelection;
				});
			} else {
				setSelectedConflictingChanges((currentSelection) => {
					const newSelection = { ...currentSelection };
					for (const path of allFilteredPaths) {
						delete newSelection[path];
					}
					return newSelection;
				});
			}
		},
		[allFilteredPaths, setSelectedConflictingChanges]
	);

	const handleRevertFileViewFiles = useCallback(() => {
		console.debug("Reverting selected files: ", selectedConflictingChanges);
		const filesToRevert = Object.entries(selectedConflictingChanges).map(([path, status]) => ({
			path,
			status,
		}));
		emitFilesRevert(filesToRevert);
		setSelectedConflictingChanges({});
	}, [selectedConflictingChanges, setSelectedConflictingChanges]);

	return (
		<Box ms={9}>
			<HStack gap="6" mb={4} width="full" colorPalette="yellow">
				<InputGroup flex="1" startElement={<LuSearch />} startElementProps={{ color: "colorPalette.fg" }}>
					<Input placeholder="Quick search..." variant="flushed" borderColor="colorPalette.fg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
				</InputGroup>
			</HStack>
			<Table.ScrollArea borderWidth="1px" maxH={"xl"}>
				<Table.Root size="sm" variant="outline" colorPalette={"yellow"}>
					<Table.Header>
						<Table.Row bgColor={"colorPalette.400"}>
							<Table.ColumnHeader>
								<Checkbox aria-label="Select Filtered" variant="subtle" colorPalette="yellow" checked={someSelected && !allSelected ? "indeterminate" : allSelected} onCheckedChange={(e) => handleHeaderCheckboxChange(e.checked)} />
							</Table.ColumnHeader>
							<Table.ColumnHeader color="black" fontWeight={900} cursor="pointer" onClick={() => handleSort("branch")}>
								Branch {getSortIndicator("branch", sortStack)}
							</Table.ColumnHeader>
							<Table.ColumnHeader color="black" fontWeight={900} cursor="pointer" onClick={() => handleSort("path")}>
								Path {getSortIndicator("path", sortStack)}
							</Table.ColumnHeader>
							<Table.ColumnHeader color="black" fontWeight={900} cursor="pointer" onClick={() => handleSort("status")}>
								Status {getSortIndicator("status", sortStack)}
							</Table.ColumnHeader>
							<Table.ColumnHeader color="black" fontWeight={900} cursor="pointer" onClick={() => handleSort("remote")}>
								Remote {getSortIndicator("remote", sortStack)}
							</Table.ColumnHeader>
							<Table.ColumnHeader></Table.ColumnHeader>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{Object.keys(sortedRows).length == 0 ? (
							<Table.Row>
								<Table.Cell colSpan={6} textAlign="center">
									No results found
								</Table.Cell>
							</Table.Row>
						) : (
							sortedRows.map((row) => {
								const { branchPath, branchString, branchFolder, branchVersion, file } = row;
								return (
									<Table.Row key={file.path}>
										<Table.Cell>
											<Checkbox aria-label="Select path" variant="subtle" colorPalette="yellow" checked={!!selectedConflictingChanges[file.path]} onCheckedChange={(e) => handlePathSelection(file.path, file.wcStatus, e.checked)} />
										</Table.Cell>
										<Table.Cell color={getStatusColor(file.wcStatus)}>{branchString}</Table.Cell>
										<Table.Cell color={getStatusColor(file.wcStatus)}>{`${branchPath.split("\\").at(-1)}\\${file.pathDisplay}`}</Table.Cell>
										<Table.Cell color={getStatusColor(file.wcStatus)}>{file.wcStatus}</Table.Cell>
										<Table.Cell color={getStatusColor(file.reposStatus)}>{file.reposStatus}</Table.Cell>
										<Table.Cell>
											<ButtonDiff fullPath={file.path} branchFolder={branchFolder} branchVersion={branchVersion} onDiffResult={handleDiffResult} />
										</Table.Cell>
									</Table.Row>
								);
							})
						)}
					</Table.Body>
				</Table.Root>
			</Table.ScrollArea>
			<Flex gap="6" mt={4} justifyContent={"space-between"} alignItems={"center"} colorPalette="yellow">
				<Flex gap={2} alignItems={"center"}>
					Selected paths:{" "}
					<Box bgColor={"yellow.subtle"} color={"yellow.fg"} rounded={"md"} px={3} py={"auto"}>
						{Object.keys(selectedConflictingChanges).length}
					</Box>
				</Flex>
				<Flex color={"yellow.fg"}>
					Revert them or update the branch and resolve potential conflicts
				</Flex>
				<HStack gap={3}>
					<Button onClick={() => setIsRevertDialogOpen(true)} colorPalette={"red"} disabled={Object.keys(selectedConflictingChanges).length < 1}>
						Revert Selected
					</Button>
				</HStack>
			</Flex>

			<DialogModifiedChangesRevert selectedCount={Object.keys(selectedConflictingChanges).length} isDialogOpen={isRevertDialogOpen} closeDialog={() => setIsRevertDialogOpen(false)} fireDialogAction={handleRevertFileViewFiles} />
		</Box>
	);
}
