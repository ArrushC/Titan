import { Box, Button, Flex, FormControl, FormLabel, Icon, Input, Skeleton, Tab, Table, TabList, TabPanel, TabPanels, Tabs, Tbody, Td, Text, Textarea, Th, Thead, Tooltip, Tr, useDisclosure } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "../AppContext";
import { branchPathFolder, branchString, stripBranchInfo } from "../utils/CommonConfig";
import { AgGridReact } from "ag-grid-react";
import { RepeatIcon } from "@chakra-ui/icons";
import { MdCloudUpload } from "react-icons/md";
import { RaiseClientNotificaiton } from "../utils/ChakraUI";
import ModalCommit from "./ModalCommit";
import { CreatableSelect, Select } from "chakra-react-select";
import DiffButton from "./DiffButton";

export default function CommitRegion() {
	const { socket, isDebug, toast, isCommitMode, setIsCommitMode, selectedBranchStatuses, setSelectedBranchStatuses, localChangesGridRef, untrackedChangesGridRef, showCommitView, setShowCommitView, selectedBranches, configurableRowData } = useApp();

	// Form Fields
	const [sourceBranch, setSourceBranch] = useState(null);
	const [issueNumber, setIssueNumber] = useState(null);
	const [issueOptions, setIssueOptions] = useState([]);
	const [commitMessage, setCommitMessage] = useState("");
	const [selectedFiles, setSelectedFiles] = useState([]);
	const [selectedUnseenItems, setSelectedUnseenItems] = useState([]);
	const [socketPayload, setSocketPayload] = useState(null);

	// Data Fields (Controlled Form Fields)
	const [fileUpdates, setFileUpdates] = useState({});
	const [quickFilterFileViewText, setQuickFilterFileViewText] = useState("");
	const [fileViewRowData, setFileViewRowData] = useState([]);
	const [quickFilterUnseenText, setQuickFilterUnseenText] = useState("");
	const [unseenFilesRowData, setUnseenFilesRowData] = useState([]);

	// Commit Modal
	const { isOpen, onOpen, onClose } = useDisclosure();

	/****************************************************
	 * Callback Functions - Form Fields
	 ****************************************************/
	const sourceBranchOptions = useMemo(
		() =>
			selectedBranches.map((row) => ({
				value: row.id,
				label: branchString(row["Branch Folder"], row["Branch Version"], row["SVN Branch"]),
			})),
		[selectedBranches]
	);

	const handleSourceBranchChange = (selectedOption) => {
		setSourceBranch(selectedOption);
	};

	const handleIssueNumberChange = (selectedOption) => {
		setIssueNumber(selectedOption);
		if (selectedOption && !issueOptions.some((option) => option.value === selectedOption.value)) {
			const newOptions = [...issueOptions, selectedOption];
			setIssueOptions(newOptions);
			localStorage.setItem("issueOptions", JSON.stringify(newOptions));
		}
	};

	const handleCommitMessageChange = (e) => {
		setCommitMessage(String(e.target.value).replace(/["`]/g, "'"));
	};

	/****************************************************
	 * Callback Functions - Table Aesthetic Helpers
	 ****************************************************/
	const handleDiffResult = useCallback(
		(result) => {
			if (result.success) RaiseClientNotificaiton(toast, "TortoiseSVN diff opened successfully", "success", 3000);
			else RaiseClientNotificaiton(toast, `Error opening TortoiseSVN diff: ${JSON.stringify(result.error, null, 4)}`, "error", 0);
		},
		[toast]
	);

	/****************************************************
	 * Callback Functions - Table Aesthetics
	 ****************************************************/
	const defaultColDefs = useMemo(
		() => ({
			resizable: true,
			wrapText: true,
			autoHeight: true,
			filter: true,
			suppressMovable: true,
			editable: false,
			wrapHeaderText: true,
			autoHeaderHeight: true,
		}),
		[]
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

	/****************************************************
	 * Callback Functions - Table Operations
	 ****************************************************/
	const onFileViewSelectionChanged = useCallback(() => {
		const selectedBranches = localChangesGridRef?.current?.api?.getSelectedNodes().map((node) => node.data);
		if (isDebug) console.log("CommitRegion.jsx: onFileViewSelectionChanged - selectedBranches", selectedBranches);
		setSelectedFiles(selectedBranches);
	}, [localChangesGridRef]);

	const onUnseenFilesSelectionChanged = useCallback(() => {
		const selectedBranches = untrackedChangesGridRef?.current?.api?.getSelectedNodes().map((node) => node.data);
		if (isDebug) console.log("CommitRegion.jsx: onUnseenFilesSelectionChanged - selectedBranches", selectedBranches);
		setSelectedUnseenItems(selectedBranches);
	}, [untrackedChangesGridRef]);

	const onQuickFilterFileViewInputChanged = useCallback(
		(e) => {
			setQuickFilterFileViewText(e.target.value);
		},
		[setQuickFilterFileViewText]
	);

	const isFileViewRowSelectable = useCallback(
		(rowNode) => {
			const quickFilterText = quickFilterFileViewText.toLowerCase();
			const branchFolder = rowNode.data["Branch Folder"].toLowerCase();
			const branchVersion = rowNode.data["Branch Version"].toLowerCase();
			const filePath = rowNode.data["File Path"].toLowerCase();
			const localStatus = rowNode.data["Local Status"].toLowerCase();
			return branchFolder.includes(quickFilterText) || branchVersion.includes(quickFilterText) || filePath.includes(quickFilterText) || localStatus.includes(quickFilterText);
		},
		[quickFilterFileViewText]
	);

	const onQuickFilterUnseenInputChanged = useCallback(
		(e) => {
			setQuickFilterUnseenText(e.target.value);
		},
		[setQuickFilterUnseenText]
	);

	const isUnseenRowSelectable = useCallback(
		(rowNode) => {
			const quickFilterText = quickFilterUnseenText.toLowerCase();
			const branchFolder = rowNode.data["Branch Folder"].toLowerCase();
			const branchVersion = rowNode.data["Branch Version"].toLowerCase();
			const filePath = rowNode.data["File Path"].toLowerCase();
			const localStatus = rowNode.data["Local Status"].toLowerCase();
			return branchFolder.includes(quickFilterText) || branchVersion.includes(quickFilterText) || filePath.includes(quickFilterText) || localStatus.includes(quickFilterText);
		},
		[quickFilterUnseenText]
	);

	const hanldeRevertUnseenFiles = useCallback(() => {
		socket?.emit("svn-files-revert", { filesToProcess: selectedUnseenItems });
	}, [socket, selectedUnseenItems]);

	const handleRevertFileViewFiles = useCallback(() => {
		socket?.emit("svn-files-revert", { filesToProcess: selectedFiles });
	}, [socket, selectedFiles]);

	const handleAddRemoveFiles = useCallback(() => {
		socket?.emit("svn-files-add-remove", { filesToProcess: selectedUnseenItems });
	}, [socket, selectedUnseenItems]);

	const performCommit = useCallback(() => {
		// Check if the source branch is selected
		if (!sourceBranch) {
			RaiseClientNotificaiton(toast, "Please select the source branch to proceed!", "error");
			return;
		}

		// Check if the issue number and commit message is provided
		if (!issueNumber || commitMessage === "") {
			RaiseClientNotificaiton(toast, "Please provide the issue number and the commit message to proceed!", "error");
			return;
		}

		if (!selectedFiles.map((file) => file.branchId).includes(sourceBranch.value)) {
			RaiseClientNotificaiton(toast, "Please select at least 1 file from the source branch to proceed!", "error");
			return;
		}

		setSocketPayload({ sourceBranch: selectedBranches.find((row) => row.id == sourceBranch.value), issueNumber: issueNumber.value, commitMessage, filesToProcess: selectedFiles });
		onOpen();
	}, [sourceBranch, issueNumber, commitMessage, toast, selectedFiles, socket, selectedBranches]);

	/****************************************************
	 * Hooks setup
	 ****************************************************/
	// Fetch the branch status for each selected branch
	useEffect(() => {
		if (selectedBranches.length < 1 || showCommitView) {
			if (selectedBranches.length < 1) setIsCommitMode(false);
			return;
		}
		setSelectedBranchStatuses([]);
		setSocketPayload(null);
		setFileUpdates({});
		setQuickFilterUnseenText("");
		setUnseenFilesRowData([]);
		setQuickFilterFileViewText("");
		setFileViewRowData([]);
		setSelectedFiles([]);
		setSelectedUnseenItems([]);
		stripBranchInfo(selectedBranches).forEach((row) => {
			socket?.emit("svn-status-single", { selectedBranch: row });
		});
	}, [socket, selectedBranches, showCommitView]);

	useEffect(() => {
		const socketCallback = (data) => {
			if (isDebug) console.debug("Received branch status data:", data);
			setSelectedBranchStatuses((prev) => [...prev, data]);
		};

		socket?.on("branch-status-single", socketCallback);
		return () => socket?.off("branch-status-single", socketCallback);
	}, [socket]);

	// Scroll to the commit region when it is in commit mode
	useEffect(() => {
		if (!isCommitMode) return;
		document.getElementById("commitRegion")?.scrollIntoView({ behavior: "smooth", block: "start" });
	}, [isCommitMode]);

	useEffect(() => {
		if (selectedBranchStatuses.length === selectedBranches.length) {
			console.debug("Branch Status Rows:", selectedBranchStatuses);
			console.debug("Selected Rows:", selectedBranches);
			selectedBranchStatuses.forEach((branchStatus) => {
				let branchId = branchStatus.id;
				let filesToCommit = branchStatus.status.filesToCommit;
				let filesToUpdate = branchStatus.status.filesToUpdate;

				const matchedSelectedRow = configurableRowData.find((row) => row.id === branchId);

				if (filesToUpdate.length > 0) {
					const matchedBranchString = branchString(matchedSelectedRow["Branch Folder"], matchedSelectedRow["Branch Version"], matchedSelectedRow["SVN Branch"]);
					setFileUpdates((prev) => {
						return { ...prev, [matchedBranchString]: [...(prev[matchedBranchString] || []), ...filesToUpdate] };
					});
				}

				// Excluding files which are common
				if (filesToCommit.length > 0) {
					const fileViewRowData = filesToCommit.map((file) => {
						return {
							branchId: branchId,
							"Branch Folder": matchedSelectedRow["Branch Folder"],
							"Branch Version": matchedSelectedRow["Branch Version"],
							"SVN Branch": matchedSelectedRow["SVN Branch"],
							"Full Path": file.path,
							"File Path": `${branchPathFolder(branchStatus.status.branch)}\\${file.pathDisplay}`,
							"Local Status": file.wcStatus,
						};
					});

					setFileViewRowData((prev) => [...prev, ...fileViewRowData.filter((file) => !["unversioned", "missing"].includes(file["Local Status"]))]);
					setUnseenFilesRowData((prev) => [...prev, ...fileViewRowData.filter((file) => ["unversioned", "missing"].includes(file["Local Status"]))]);
				}
			});

			setShowCommitView(true);
		}
	}, [selectedBranchStatuses, selectedBranches, configurableRowData]);

	useEffect(() => {
		const socketCallback = (data) => {
			setShowCommitView(false);
		};

		socket?.on("branch-refresh-unseen", socketCallback);
		return () => socket?.off("branch-refresh-unseen", socketCallback);
	}, [socket]);

	// Load issue options from localStorage on component mount
	useEffect(() => {
		const savedOptions = localStorage.getItem("issueOptions");
		if (savedOptions) {
			setIssueOptions(JSON.parse(savedOptions));
		}
	}, []);

	useEffect(() => {
		if (selectedBranches.length === 1) setSourceBranch(sourceBranchOptions[0]);
	}, [selectedBranches, sourceBranchOptions]);

	const hasChanges = Object.keys(fileUpdates).length > 0 || fileViewRowData.length > 0 || unseenFilesRowData.length > 0;

	return (
		<Box>
			<Box mb={6}>
				<Flex columnGap={2} mb={2}>
					<FormControl width={"50%"} isRequired>
						<FormLabel>Source Branch</FormLabel>
						<Select value={sourceBranch} onChange={handleSourceBranchChange} options={sourceBranchOptions} placeholder="Select branch you would like to commit from" selectedOptionColorScheme="yellow" />
					</FormControl>
					<FormControl width={"50%"} isRequired>
						<FormLabel>Issue Number</FormLabel>
						<CreatableSelect value={issueNumber} onChange={handleIssueNumberChange} options={issueOptions} placeholder="Select or create an issue number" formatCreateLabel={(inputValue) => `Create issue "${inputValue}"`} selectedOptionColorScheme="yellow" />
					</FormControl>
				</Flex>
				<Flex>
					<FormControl width={"100%"} isRequired>
						<FormLabel>Commit Message</FormLabel>
						<Textarea placeholder={"Enter Commit Message"} resize={"vertical"} onInput={handleCommitMessageChange} value={commitMessage} />
					</FormControl>
				</Flex>
			</Box>
			<Skeleton isLoaded={showCommitView && hasChanges} startColor="yelow.500" endColor="yellow.500">
				<Tabs variant={"solid-rounded"} colorScheme="yellow" defaultIndex={Object.keys(fileUpdates).length >= 1 ? 0 : fileViewRowData.length >= 1 ? 1 : 2}>
					<TabList>
						<Tab isDisabled={Object.keys(fileUpdates).length < 1}>
							<Tooltip label={"No files to update!"} isDisabled={Object.keys(fileUpdates).length >= 1}>
								Files to Update
							</Tooltip>
						</Tab>
						<Tab isDisabled={fileViewRowData.length < 1}>
							<Tooltip label={"No files to commit!"} isDisabled={fileViewRowData.length >= 1}>
								Local Changes
							</Tooltip>
						</Tab>
						<Tab isDisabled={unseenFilesRowData.length < 1}>
							<Tooltip label={"No unversioned/missing files!"} isDisabled={unseenFilesRowData.length >= 1}>
								Untracked Changes
							</Tooltip>
						</Tab>
					</TabList>
					<TabPanels>
						<TabPanel>
							{Object.keys(fileUpdates).length > 0 ? (
								<Box>
									<Text mb={4}>Below are the list of files which have been changed on your machine but there exists a newer version of them in the repository:</Text>
									<Box maxHeight="200px" overflowY="auto">
										<Table>
											<Thead>
												<Tr>
													<Th>Branch</Th>
													<Th>Path</Th>
													<Th>
														<Tooltip label="Working Copy" hasArrow>
															Local Status
														</Tooltip>
													</Th>
													<Th>
														<Tooltip label="Repository" hasArrow>
															Remote Status
														</Tooltip>
													</Th>
												</Tr>
											</Thead>
											<Tbody>
												{Object.keys(fileUpdates).map((branch) => (
													<React.Fragment key={branch}>
														{fileUpdates[branch].map((fileRow, index) => (
															<Tr key={index}>
																<Td>{branch}</Td>
																<Td>{fileRow.pathDisplay}</Td>
																<Td>{fileRow.wcStatus}</Td>
																<Td>{fileRow.reposStatus}</Td>
															</Tr>
														))}
													</React.Fragment>
												))}
											</Tbody>
										</Table>
									</Box>
									<Text mt={4}>If you wish to commit these files, please update the associated branches!</Text>
								</Box>
							) : (
								<Box>
									<Text>Your selected branches do not contain any changed files for which a newer version exists in the repository.</Text>
								</Box>
							)}
						</TabPanel>
						<TabPanel>
							{fileViewRowData.length > 0 ? (
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
											rowData={fileViewRowData}
											defaultColDef={defaultColDefs}
											columnDefs={colDefsLocalChanges}
											domLayout="normal"
											rowSelection={"multiple"}
											rowMultiSelectWithClick={true}
											animateRows={true}
											onSelectionChanged={onFileViewSelectionChanged}
											quickFilterText={quickFilterFileViewText}
											columnMenu={"new"}
											isRowSelectable={isFileViewRowSelectable}
										/>
									</div>
									<Flex mt={4} columnGap={2} justifyContent={"flex-end"}>
										<Tooltip label={"Requires you to select at least 1 file"} hasArrow isDisabled={selectedFiles.length > 0}>
											<Button onClick={handleRevertFileViewFiles} colorScheme={"red"} isDisabled={selectedFiles.length < 1}>
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
						</TabPanel>
						<TabPanel>
							{unseenFilesRowData.length > 0 ? (
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
											rowData={unseenFilesRowData}
											defaultColDef={defaultColDefs}
											columnDefs={colDefsUntracked}
											domLayout="normal"
											rowSelection={"multiple"}
											rowMultiSelectWithClick={true}
											animateRows={true}
											onSelectionChanged={onUnseenFilesSelectionChanged}
											quickFilterText={quickFilterUnseenText}
											columnMenu={"new"}
											isRowSelectable={isUnseenRowSelectable}
										/>
									</div>
									<Flex mt={4} columnGap={2} justifyContent={"flex-end"}>
										<Tooltip label={"Requires you to select at least 1 file"} hasArrow isDisabled={selectedUnseenItems.length > 0}>
											<Button onClick={handleAddRemoveFiles} colorScheme={"green"} isDisabled={selectedUnseenItems.length < 1}>
												Add/Remove Selected
											</Button>
										</Tooltip>
										<Tooltip label={"Requires you to select at least 1 file"} hasArrow isDisabled={selectedUnseenItems.length > 0}>
											<Button onClick={hanldeRevertUnseenFiles} colorScheme={"red"} isDisabled={selectedUnseenItems.length < 1}>
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
						</TabPanel>
					</TabPanels>
				</Tabs>
			</Skeleton>
			{showCommitView && !hasChanges ? (
				<Text mt={4} className="pulse-animation" fontWeight={600}>
					No changes have been spotted! Please use the refresh button 👇 if you have recently made a change
				</Text>
			) : (
				<></>
			)}
			<Box mt={6}>
				<Flex columnGap={2} justifyContent={"center"}>
					<Button onClick={() => setShowCommitView(false)} leftIcon={<RepeatIcon />} colorScheme={"yellow"}>
						Refresh Process
					</Button>
					<Tooltip label={"Requires you to select at least 1 file"} hasArrow isDisabled={selectedFiles.length > 0}>
						<Button onClick={performCommit} leftIcon={<Icon as={MdCloudUpload} />} colorScheme={"yellow"} isDisabled={selectedFiles.length < 1}>
							Commit
						</Button>
					</Tooltip>
				</Flex>
			</Box>
			<ModalCommit isModalOpen={isOpen} onModalClose={onClose} socketPayload={socketPayload} />
		</Box>
	);
}
