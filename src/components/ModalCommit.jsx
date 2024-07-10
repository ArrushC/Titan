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
import { RaiseClientNotificaiton } from "../utils/ChakraUI";
import _ from "lodash";
import { CopyIcon } from "@chakra-ui/icons";

export default function ModalCommit({ isModalOpen, onModalClose, setIsCommitMode, setBranchStatusRows, setShowFilesView, socketPayload }) {
	const { socket, toast } = useApp();
	const [commitLiveResponses, setCommitLiveResponses] = useState([]);
	const { onCopy, value, setValue, hasCopied } = useClipboard("");

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

	const colDefs = useMemo(() => [{ field: "Branch Folder" }, { field: "Branch Version" }, { field: "File Path", flex: 1 }, { field: "Local Status", headerTooltip: "Working Copy" }], []);

	/****************************************************
	 * Modal Operations
	 ****************************************************/
	const handlePrevious = useCallback(() => {
		setActiveStep((prev) => prev - 1);
	}, [setActiveStep]);

	const handleNext = useCallback(() => {
		setActiveStep((prev) => prev + 1);
	}, [setActiveStep]);

	const handleClipboardOption = useCallback(
		(values) => {
			const branchFolder = (response) => (values.includes("BranchFolder") ? `${response["Branch Folder"]} ` : "");
			const branchVersion = (response) => (values.includes("BranchVersion") ? `${response["Branch Version"]} ` : "");
			const svnBranch = (response) => (values.includes("SVNBranch") ? `${response["branchPathFolder"]} ` : "");
			const issueNumber = (response) => (values.includes("IssueNumber") ? ` Issue [${response["Branch Folder"] == socketPayload["sourceBranch"]["Branch Folder"] ? socketPayload["issueNumber"] : "XXXXXX"}]` : "");
			const revision = (response) => response["revision"];
			const clipboardText = commitLiveResponses.map((response) => `${branchFolder(response).concat(branchVersion(response).concat(svnBranch(response).trim()))}${issueNumber(response)} Revision [${revision(response)}]`).join("\n");
			setValue((current) => {
				if (current === clipboardText) return current;
				return clipboardText;
			});
		},
		[commitLiveResponses, setValue, socketPayload]
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
		socket?.emit("svn-commit", socketPayload);
	}, [activeStep, isModalOpen, socket]);

	// Step 3
	useEffect(() => {
		if (!isModalOpen || activeStep != 3) return;
		RaiseClientNotificaiton(toast, "The commit process has been completed successfully", "success", 5000);
		handleClipboardOption(["BranchFolder", "BranchVersion", "SVNBranch"]);
	}, [activeStep, isModalOpen, handleClipboardOption]);

	// Commmit process completion
	useEffect(() => {
		if (!isModalOpen || activeStep <= 3) return;
		onCopy();
		RaiseClientNotificaiton(toast, "Updating selected branches! Please wait", "info", 1500);
		commitLiveResponses.forEach((response) => {
			socket?.emit("svn-update-single", {
				id: response.id,
				branch: response["SVN Branch"],
				version: response["Branch Version"],
				folder: response["Branch Folder"],
			});
		});
		setIsCommitMode(false);
		setBranchStatusRows([]);
		setShowFilesView(false);
		onModalClose();
		setActiveStep(1);
	}, [activeStep, isModalOpen, socket, commitLiveResponses]);

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
		if (hasCopied) RaiseClientNotificaiton(toast, "Copied to Clipboard", "success", 1500);
	}, [hasCopied]);

	return !isModalOpen || !socketPayload ? (
		<></>
	) : (
		<Modal isOpen={isModalOpen} onClose={onModalClose} isCentered motionPreset="slideInBottom" scrollBehavior="inside" size="xl">
			<ModalOverlay />
			<ModalContent maxH={"95%"} maxW="95%">
				<ModalHeader>
					<Heading as={"h2"} size={"lg"}>
						Commit Selected Files
					</Heading>
				</ModalHeader>
				<ModalCloseButton size={"lg"} />
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
									Current Live Status of the commit process:
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
									<CardHeader p={4}>
										<Flex justifyContent="space-between" alignItems={"center"}>
											<Heading as="h3" size={"md"}>
												SVN Revisions
											</Heading>
											<IconButton aria-label="Copy To Clipboard" onClick={onCopy} icon={<CopyIcon />} colorScheme="yellow">
												Copy
											</IconButton>
										</Flex>
									</CardHeader>
									<CardBody p={4}>
										<Text whiteSpace={"pre-line"}>{value}</Text>
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
					<Tooltip label={"Cannot undo the commit currently"} isDisabled={activeStep < 2}>
						<Button onClick={handlePrevious} mr={3} isDisabled={activeStep >= 2}>
							{activeStep == 1 ? "Cancel" : "Previous"}
						</Button>
					</Tooltip>
					<Tooltip label={"Cannot undo the commit currently"} isDisabled={activeStep != 2}>
						<Button colorScheme="yellow" onClick={handleNext} isDisabled={activeStep == 2}>
							{activeStep == steps.length ? "Complete" : "Next"}
						</Button>
					</Tooltip>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
