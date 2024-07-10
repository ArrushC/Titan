import { Box, Button, CircularProgress, CircularProgressLabel, Flex, FormControl, FormLabel, Heading, Icon, Input, Select, Tab, Table, TabList, TabPanel, TabPanels, Tabs, Tbody, Td, Text, Textarea, Th, Thead, Tooltip, Tr, useDisclosure } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "../AppContext";
import { branchPathFolder, branchString, stripBranchInfo } from "../utils/CommonConfig";
import IssueNumberInput from "./IssueNumberInput";
import { CSSTransition } from "react-transition-group";
import { AgGridReact } from "ag-grid-react";
import { RepeatIcon } from "@chakra-ui/icons";
import { MdCloudUpload } from "react-icons/md";
import { RaiseClientNotificaiton } from "../utils/ChakraUI";
import ModalCommit from "./ModalCommit";

export default function CommitRegion({ isCommitMode, setIsCommitMode, branchStatusRows, setBranchStatusRows, fileViewGridRef, unseenFilesGridRef, showFilesView, setShowFilesView, selectedRows, setSelectedRows }) {
	const { socket, isDebug, toast } = useApp();

	// Form Fields
	const [sourceBranch, setSourceBranch] = useState("");
	const [issueNumber, setIssueNumber] = useState("");
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
	const handleSourceBranchChange = (e) => {
		setSourceBranch(e.target.value);
	};

	const handleCommitMessageChange = (e) => {
		setCommitMessage(String(e.target.value).replace(/["`]/g, "'"));
	};

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

	const colDefs = useMemo(
		() => [
			{ headerCheckboxSelection: true, checkboxSelection: true, width: 20, resizable: false, suppressMovable: false, filter: false, editable: false, headerClass: "branch-table-header-cell", cellClass: "branch-table-body-cell" },
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
		const selectedRows = fileViewGridRef?.current?.api?.getSelectedNodes().map((node) => node.data);
		if (isDebug) console.log("CommitRegion.jsx: onFileViewSelectionChanged - selectedRows", selectedRows);
		setSelectedFiles(selectedRows);
	}, [fileViewGridRef]);

	const onUnseenFilesSelectionChanged = useCallback(() => {
		const selectedRows = unseenFilesGridRef?.current?.api?.getSelectedNodes().map((node) => node.data);
		if (isDebug) console.log("CommitRegion.jsx: onUnseenFilesSelectionChanged - selectedRows", selectedRows);
		setSelectedUnseenItems(selectedRows);
	}, [unseenFilesGridRef]);

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
		if (sourceBranch === "") {
			RaiseClientNotificaiton(toast, "Please select the source branch to proceed!", "error");
			return;
		}

		// Check if the issue number and commit message is provided
		if (issueNumber === "" || commitMessage === "") {
			RaiseClientNotificaiton(toast, "Please provide the issue number and the commit message to proceed!", "error");
			return;
		}

		setSocketPayload({ sourceBranch: selectedRows.find((row) => row.id == sourceBranch), issueNumber, commitMessage, filesToProcess: selectedFiles });
		onOpen();
	}, [sourceBranch, issueNumber, commitMessage, toast, selectedFiles, socket, selectedRows]);

	/****************************************************
	 * Hooks setup
	 ****************************************************/
	// Fetch the branch status for each selected branch
	useEffect(() => {
		if (selectedRows.length < 1 || showFilesView) {
			if (selectedRows.length < 1) setIsCommitMode(false);
			return;
		}
		setBranchStatusRows([]);
		setSocketPayload(null);
		setFileUpdates({});
		setQuickFilterUnseenText("");
		setUnseenFilesRowData([]);
		setQuickFilterFileViewText("");
		setFileViewRowData([]);
		setSelectedFiles([]);
		setSelectedUnseenItems([]);
		stripBranchInfo(selectedRows).forEach((row) => {
			socket?.emit("svn-status-single", { selectedBranch: row });
		});
	}, [socket, selectedRows, showFilesView]);

	useEffect(() => {
		const socketCallback = (data) => {
			if (isDebug) console.debug("Received branch status data:", data);
			setBranchStatusRows((prev) => [...prev, data]);
		};

		socket?.on("branch-status-single", socketCallback);
		return () => socket?.off("branch-status-single", socketCallback);
	}, [socket]);

	// Scroll to the commit region when it is in commit mode
	useEffect(() => {
		if (!isCommitMode) return;
		if (selectedRows.length == 1) setSourceBranch(selectedRows[0].id);
		document.getElementById("commitRegion")?.scrollIntoView({ behavior: "smooth", block: "start" });
	}, [isCommitMode, selectedRows]);

	useEffect(() => {
		if (branchStatusRows.length === selectedRows.length) {
			console.debug("Branch Status Rows:", branchStatusRows);
			console.debug("Selected Rows:", selectedRows);
			branchStatusRows.forEach((branchStatus) => {
				let branchId = branchStatus.id;
				let filesToCommit = branchStatus.status.filesToCommit;
				let filesToUpdate = branchStatus.status.filesToUpdate;

				const matchedSelectedRow = selectedRows.find((row) => row.id === branchId);

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
							id: branchId,
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

			setShowFilesView(true);
		}
	}, [branchStatusRows, selectedRows]);

	useEffect(() => {
		const socketCallback = (data) => {
			setShowFilesView(false);
		};

		socket?.on("branch-refresh-unseen", socketCallback);
		return () => socket?.off("branch-refresh-unseen", socketCallback);
	}, [socket]);

	return (
		<Box>
			<Box mb={6}>
				<Heading as={"h3"} size={"md"} noOfLines={1} mb={2}>
					SVN Commit Message
				</Heading>
				<Flex columnGap={2} mb={2}>
					<FormControl width={"50%"} isRequired>
						<FormLabel>Source Branch</FormLabel>
						<Select value={sourceBranch} onChange={handleSourceBranchChange} placeholder={"Select branch you would like to commit from"}>
							{selectedRows.map((row) => {
								return (
									<option key={row.id} value={row.id}>
										{branchString(row["Branch Folder"], row["Branch Version"], row["SVN Branch"])}
									</option>
								);
							})}
						</Select>
					</FormControl>
					<FormControl width={"50%"} isRequired>
						{/* Issue Number is only for ATCOM. Should be removed when publishing this tool to the public */}
						<FormLabel>Issue Number</FormLabel>
						<IssueNumberInput issueNumber={issueNumber} setIssueNumber={setIssueNumber} />
					</FormControl>
				</Flex>
				<Flex>
					<FormControl width={"100%"} isRequired>
						<FormLabel>Commit Message</FormLabel>
						<Textarea placeholder={"Enter Commit Message"} resize={"vertical"} onInput={handleCommitMessageChange} value={commitMessage} />
					</FormControl>
				</Flex>
			</Box>
			<CSSTransition in={!showFilesView} timeout={600} classNames="fade" unmountOnExit>
				<Flex justifyContent={"center"} alignItems={"center"}>
					<CircularProgress value={(branchStatusRows.length / selectedRows.length) * 360} color="yellow.300" size="100px">
						<CircularProgressLabel>
							{branchStatusRows.length} / {selectedRows.length}
						</CircularProgressLabel>
					</CircularProgress>
				</Flex>
			</CSSTransition>
			<CSSTransition in={showFilesView} timeout={600} classNames="fade" unmountOnExit>
				<Box>
					<Box mb={6}>
						<Tabs variant={"solid-rounded"} colorScheme="yellow" defaultIndex={Object.keys(fileUpdates).length >= 1 ? 0 : fileViewRowData.length >= 1 ? 1 : 2}>
							<TabList>
								<Tab isDisabled={Object.keys(fileUpdates).length < 1}>
									<Tooltip label={"No files to update!"} isDisabled={Object.keys(fileUpdates).length >= 1}>
										Files to Update
									</Tooltip>
								</Tab>
								<Tab isDisabled={fileViewRowData.length < 1}>
									<Tooltip label={"No files to commit!"} isDisabled={fileViewRowData.length >= 1}>
										File View Table
									</Tooltip>
								</Tab>
								<Tab isDisabled={unseenFilesRowData.length < 1}>
									<Tooltip label={"No unversioned/missing files!"} isDisabled={unseenFilesRowData.length >= 1}>
										Unversioned/Missing Files
									</Tooltip>
								</Tab>
							</TabList>
							<TabPanels>
								<TabPanel>
									<Heading as={"h3"} size={"md"} noOfLines={1} mb={2}>
										Files to Update
									</Heading>
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
									<Heading as={"h3"} size={"md"} noOfLines={1} mb={2}>
										File View Table
									</Heading>
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
													ref={fileViewGridRef}
													rowData={fileViewRowData}
													defaultColDef={defaultColDefs}
													columnDefs={colDefs}
													domLayout="normal"
													rowSelection={"multiple"}
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
														Revert Selected Files
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
									<Heading as={"h3"} size={"md"} noOfLines={1} mb={2}>
										Unversioned/Missing Files
									</Heading>
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
													ref={unseenFilesGridRef}
													rowData={unseenFilesRowData}
													defaultColDef={defaultColDefs}
													columnDefs={colDefs}
													domLayout="normal"
													rowSelection={"multiple"}
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
														Add/Remove Selected Files
													</Button>
												</Tooltip>
												<Tooltip label={"Requires you to select at least 1 file"} hasArrow isDisabled={selectedUnseenItems.length > 0}>
													<Button onClick={hanldeRevertUnseenFiles} colorScheme={"red"} isDisabled={selectedUnseenItems.length < 1}>
														Revert Selected Files
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
					</Box>
					<Box>
						<Flex columnGap={2} justifyContent={"flex-end"}>
							<Button onClick={() => setShowFilesView(false)} leftIcon={<RepeatIcon />} colorScheme={"yellow"}>
								Refresh Process
							</Button>
							<Tooltip label={"Requires you to select at least 1 file"} hasArrow isDisabled={selectedFiles.length > 0}>
								<Button onClick={performCommit} leftIcon={<Icon as={MdCloudUpload} />} colorScheme={"yellow"} isDisabled={selectedFiles.length < 1}>
									Perform Commit
								</Button>
							</Tooltip>
						</Flex>
					</Box>
					<ModalCommit isModalOpen={isOpen} onModalClose={onClose} setIsCommitMode={setIsCommitMode} setBranchStatusRows={setBranchStatusRows} setShowFilesView={setShowFilesView} socketPayload={socketPayload} />
				</Box>
			</CSSTransition>
		</Box>
	);
}
