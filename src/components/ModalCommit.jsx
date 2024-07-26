import {
	Box,
	Button,
	Card,
	CardBody,
	CardHeader,
	Checkbox,
	CheckboxGroup,
	Code,
	Flex,
	Heading,
	IconButton,
	List,
	ListIcon,
	ListItem,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Step,
	StepDescription,
	StepIcon,
	StepIndicator,
	StepNumber,
	Stepper,
	StepSeparator,
	StepStatus,
	StepTitle,
	Text,
	Tooltip,
	useClipboard,
	useSteps,
	Wrap,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "../AppContext";
import { branchString } from "../utils/CommonConfig";
import { MdCheckCircle, MdError } from "react-icons/md";
import { AgGridReact } from "ag-grid-react";
import _ from "lodash";
import { CopyIcon } from "@chakra-ui/icons";
import DiffButton from "./DiffButton";
import useSocketEmits from "../hooks/useSocketEmits";
import useNotifications from "../hooks/useNotifications";

export default function ModalCommit({ isModalOpen, onModalClose }) {
	const { socket, setIsCommitMode, setSelectedBranchStatuses, setShowCommitView, socketPayload } = useApp();
	const {emitUpdateSingle, emitCommitPayload} = useSocketEmits();
	const {RaiseClientNotificaiton} = useNotifications();
	const [commitLiveResponses, setCommitLiveResponses] = useState([]);
	const { onCopy, value, setValue, hasCopied } = useClipboard("");

	/****************************************************
	 * Modal Aesthetic Functions
	 ****************************************************/
	const handleDiffResult = useCallback(
		(result) => {
			if (result.success) RaiseClientNotificaiton("TortoiseSVN diff opened successfully", "success", 3000);
			else RaiseClientNotificaiton(`Error opening TortoiseSVN diff: ${JSON.stringify(result.error, null, 4)}`, "error", 0);
		},
		[RaiseClientNotificaiton]
	);

	/****************************************************
	 * Modal Asthetics
	 ****************************************************/
	const steps = [
		{ title: "Review", description: "Confirm SVN changes" },
		{ title: "Commit", description: "Commit changes" },
		{ title: "Complete", description: "Process Completed" },
	];

	const { activeStep, setActiveStep } = useSteps({
		index: 1,
		count: steps.length,
	});

	const defaultColDefs = useMemo(
		() => ({
			resizable: false,
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
			{ field: "Branch Folder" },
			{ field: "Branch Version" },
			{ field: "File Path", flex: 1 },
			{ field: "Local Status", headerTooltip: "Working Copy" },
			{
				headerName: "Diff",
				filter: false,
				sortable: false,
				cellRenderer: DiffButton,
				cellRendererParams: {
					onDiffResult: handleDiffResult,
				},
				width: 90,
			},
		],
		[]
	);

	/****************************************************
	 * Modal Operations
	 ****************************************************/
	const handlePrevious = useCallback(() => {
		setActiveStep((prev) => prev - 1);
	}, [setActiveStep]);

	const handleNext = useCallback(() => {
		setActiveStep((prev) => prev + 1);
	}, [setActiveStep]);

	const formatForClipboard = useCallback(
		(responses, options) => {
			const zeroWidthSpace = "\u200B".repeat(7);
			const newline = options.includes("MarkupSupport") ? `\r\n${zeroWidthSpace}` : "\r\n";
			const sortedResponses = responses.sort((a, b) => a["Branch Version"].localeCompare(b["Branch Version"]));
			return sortedResponses
				.map((response) => {
					const parts = [];
					if (options.includes("BranchFolder")) parts.push(response["Branch Folder"]);
					if (options.includes("BranchVersion")) parts.push(response["Branch Version"]);
					if (options.includes("SVNBranch")) parts.push(response["branchPathFolder"]);

					let line = parts.join(" ").trim();

					if (options.includes("IssueNumber")) {
						const issueNumber = response["Branch Folder"] === socketPayload["sourceBranch"]["Branch Folder"] ? socketPayload["issueNumber"] : "XXXXXX";
						line += ` Issue [${issueNumber}]`;
					}

					const revision = response["revision"] ? response["revision"] : response["errorMessage"] || "Error";
					line += ` Revision [${revision}]`;

					return line;
				})
				.join(newline);
		},
		[socketPayload]
	);

	const handleClipboardOption = useCallback(
		(values) => {
			const formattedText = formatForClipboard(commitLiveResponses, values);
			setValue(formattedText);
		},
		[commitLiveResponses, formatForClipboard, setValue]
	);

	/****************************************************
	 * Hooks
	 ****************************************************/
	useEffect(() => {
		setActiveStep(1);
		setCommitLiveResponses([]);
		setValue("");
	}, [isModalOpen, setCommitLiveResponses]);

	// Below Step 1
	useEffect(() => {
		if (!isModalOpen || activeStep != 0) return;
		onModalClose();
		setActiveStep(1);
		setCommitLiveResponses([]);
		setValue("");
	}, [activeStep, isModalOpen]);

	// Step 2
	useEffect(() => {
		if (!isModalOpen || activeStep != 2) return;
		emitCommitPayload(socketPayload);
	}, [activeStep, isModalOpen, emitCommitPayload, socketPayload]);

	// Step 3
	useEffect(() => {
		if (!isModalOpen || activeStep != 3) return;
		RaiseClientNotificaiton("The commit process has been completed successfully", "success", 5000);
		handleClipboardOption(["BranchFolder", "BranchVersion", "SVNBranch"]);
	}, [RaiseClientNotificaiton, activeStep, isModalOpen, handleClipboardOption]);

	// Commmit process completion
	useEffect(() => {
		if (!isModalOpen || activeStep <= 3) return;
		onCopy();
		RaiseClientNotificaiton("Updating selected branches! Please wait", "info", 1500);
		commitLiveResponses.forEach((response) => {
			emitUpdateSingle(response.branchId, response["SVN Branch"], response["Branch Version"], response["Branch Folder"]);
		});
		setIsCommitMode(false);
		setSelectedBranchStatuses([]);
		setShowCommitView(false);
		onModalClose();
		setActiveStep(1);
	}, [RaiseClientNotificaiton, activeStep, isModalOpen, commitLiveResponses, emitUpdateSingle]);

	useEffect(() => {
		const socketCallback = (data) => {
			setCommitLiveResponses((prev) => [...prev, data]);
		};

		socket?.on("svn-commit-status-live", socketCallback);
		return () => socket?.off("svn-commit-status-live", socketCallback);
	}, [socket]);

	useEffect(() => {
		if (activeStep != 2) return;
		const hookTimeoutCallback = setTimeout(() => {
			if (commitLiveResponses.length > 0 && commitLiveResponses[0].bulkCommitLength == commitLiveResponses.length) setActiveStep(3);
		}, 3000);
		return () => clearTimeout(hookTimeoutCallback);
	}, [activeStep, commitLiveResponses]);

	useEffect(() => {
		if (hasCopied) RaiseClientNotificaiton("Copied to Clipboard", "success", 1500);
	}, [hasCopied, RaiseClientNotificaiton]);

	return !isModalOpen || !socketPayload ? (
		<></>
	) : (
		<Modal isOpen={isModalOpen} onClose={onModalClose} isCentered motionPreset="slideInBottom" scrollBehavior="inside" size="xl" closeOnOverlayClick={activeStep == 1}>
			<ModalOverlay />
			<ModalContent maxH={"95%"} maxW="95%">
				<ModalHeader>
					<Heading as={"h2"} size={"lg"}>
						Commit Selected Files
					</Heading>
				</ModalHeader>
				{activeStep == 1 ? <ModalCloseButton size={"lg"} /> : <></>}
				<ModalBody>
					<Stepper index={activeStep} mb={6} size="lg" colorScheme="yellow">
						{steps.map((step, index) => (
							<Step key={index}>
								<StepIndicator>
									<StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} />
								</StepIndicator>
								<Box flexShrink="0">
									<StepTitle>{step.title}</StepTitle>
									<StepDescription>{step.description}</StepDescription>
								</Box>
								<StepSeparator />
							</Step>
						))}
					</Stepper>
					<Box>
						{activeStep != 1 ? (
							<></>
						) : (
							<Box>
								<Box mb={4}>
									<Text fontWeight={600}>Please confirm that the following information is correct before proceeding to commit your files:</Text>
									<List spacing={3}>
										<ListItem>
											<ListIcon as={MdCheckCircle} color="yellow.500" />
											Source Branch: <Code>{branchString(socketPayload["sourceBranch"]["Branch Folder"], socketPayload["sourceBranch"]["Branch Version"], socketPayload["sourceBranch"]["SVN Branch"])}</Code>
										</ListItem>
										<ListItem>
											<ListIcon as={MdCheckCircle} color="yellow.500" />
											Issue Number: <Code>{socketPayload["issueNumber"]}</Code>
										</ListItem>
										<ListItem>
											<ListIcon as={MdCheckCircle} color="yellow.500" />
											Commit Message: <Code>{socketPayload["commitMessage"]}</Code>
										</ListItem>
									</List>
								</Box>
								<Box>
									<div className="ag-theme-quartz-dark" style={{ height: "350px", width: "100%" }}>
										<AgGridReact rowData={socketPayload["filesToProcess"]} defaultColDef={defaultColDefs} columnDefs={colDefs} domLayout="normal" columnMenu={"new"} />
									</div>
								</Box>
							</Box>
						)}

						{activeStep != 2 ? (
							<></>
						) : (
							<Box>
								<Text fontWeight={600}>
									Please wait while the files are being committed to the SVN repository.
									<br />
									Current live status of the commit process:
								</Text>
								<Box>
									<List spacing={3}>
										{commitLiveResponses.map((response, index) => (
											<ListItem key={index}>
												<ListIcon as={response.errorMessage ? MdError : MdCheckCircle} color={response.errorMessage ? "red.500" : "yellow.500"} />
												{response.branchString}:&nbsp;<Code>{response.errorMessage || response.revision}</Code>
											</ListItem>
										))}
									</List>
								</Box>
							</Box>
						)}

						{activeStep != 3 ? (
							<></>
						) : (
							<Box>
								<Box mb={4}>
									<Text fontWeight={600}>
										The commit process has been completed successfully.
										<br />
										Please find your revisions here for view and copy:
									</Text>
								</Box>
								<Card size="lg" variant={"filled"}>
									<CardHeader px={4} py={0}>
										<Flex justifyContent="space-between" alignItems={"center"}>
											<Heading as="h3" size={"md"}>
												SVN Revisions
											</Heading>
											<IconButton aria-label="Copy To Clipboard" onClick={onCopy} icon={<CopyIcon />} colorScheme="yellow">
												Copy
											</IconButton>
										</Flex>
									</CardHeader>
									<CardBody px={4} py={0}>
										<pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>{value}</pre>
									</CardBody>
								</Card>
								<Box my={4}>
									<Text fontWeight={600}>Modify the clipboard text to include...</Text>
									<CheckboxGroup colorScheme="yellow" defaultValue={["BranchFolder", "BranchVersion", "SVNBranch"]} onChange={handleClipboardOption}>
										<Wrap>
											<Checkbox value="BranchFolder">Branch Folder</Checkbox>
											<Checkbox value="BranchVersion">Branch Version</Checkbox>
											<Checkbox value="SVNBranch">SVN Branch</Checkbox>
											<Checkbox value="IssueNumber">Issue Number</Checkbox>
											<Checkbox value="MarkupSupport">Markup Support</Checkbox>
										</Wrap>
									</CheckboxGroup>
								</Box>
								<Box>
									<Text fontWeight={600}>Here is your SVN commit message for the source branch:</Text>
									<Code>{`Issue ${socketPayload["issueNumber"]} (${socketPayload["sourceBranch"]["Branch Folder"]} ${socketPayload["sourceBranch"]["Branch Version"]}): ${socketPayload["commitMessage"]}`}</Code>
								</Box>
							</Box>
						)}
					</Box>
				</ModalBody>
				<ModalFooter>
					<Tooltip hasArrow label={"Cannot undo the commit currently"} isDisabled={activeStep < 2}>
						<Button onClick={handlePrevious} mr={3} isDisabled={activeStep >= 2}>
							{activeStep == 1 ? "Cancel" : "Previous"}
						</Button>
					</Tooltip>
					<Tooltip hasArrow label={"Cannot undo the commit currently"} isDisabled={activeStep != 2}>
						<Button colorScheme="yellow" onClick={handleNext} isDisabled={activeStep == 2}>
							{activeStep == steps.length ? "Complete" : "Next"}
						</Button>
					</Tooltip>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
