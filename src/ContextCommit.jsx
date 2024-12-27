import React, { useEffect, useMemo, useState } from "react";
import { createContext, useContextSelector } from "use-context-selector";
import { useApp } from "./ContextApp.jsx";
import { AccordionItem, AccordionItemContent, AccordionItemTrigger } from "./components/ui/accordion.jsx";
import { Flex, Stack, Text } from "@chakra-ui/react";
import { BiMessageDetail } from "react-icons/bi";
import SubSectionCommitDetails from "./components/SubSectionCommitDetails.jsx";
import { IoWarning } from "react-icons/io5";
import SubSectionConflictingChanges from "./components/SubSectionConflictingChanges.jsx";
import SubSectionModifiedChanges from "./components/SubSectionModifiedChanges.jsx";
import { FiEdit, FiHelpCircle } from "react-icons/fi";
import SubSectionUnknownChanges from "./components/SubSectionUnknownChanges.jsx";
import useSocketEmits from "./hooks/useSocketEmits.jsx";
import { branchString } from "./utils/CommonConfig.jsx";

const initialState = {
	isLookupSLogsOn: false,
	setIsLookupSLogsOn: (_) => {},
	isLookupTrelloOn: false,
	setIsLookupTrelloOn: (_) => {},
	sourceBranch: "",
	setSourceBranch: (_) => {},
	sourceIssueNumber: "",
	setSourceIssueNumber: (_) => {},
	issueNumber: {},
	setIssueNumber: (_) => {},
	commitMessage: "",
	setCommitMessage: (_) => {},
	conflictingChanges: {},
	unknownChanges: {},
	modifiedChanges: {},
	selectedConflictingChanges: {},
	setSelectedConflictingChanges: (_) => {},
	selectedUnknownChanges: {},
	setSelectedUnknownChanges: (_) => {},
	selectedModifiedChanges: {},
	setSelectedModifiedChanges: (_) => {},
	trelloData: {},
	setTrelloData: (_) => {},
	isCommitMode: false,
	selectedBranchesCount: 0,
	accordionSection: [],
	commitStage: [],
	setCommitStage: (_) => {},
};

const ContextCommit = createContext(initialState);

export const useCommit = (selector) => {
	const context = useContextSelector(ContextCommit, selector);
	return context;
};

export const CommitProvider = ({ children }) => {
	const socket = useApp((ctx) => ctx.socket);
	const configurableRowData = useApp((ctx) => ctx.configurableRowData);
	const selectedBranches = useApp((ctx) => ctx.selectedBranches);
	const selectedBrachesData = useApp((ctx) => ctx.selectedBranchesData);
	const selectedBranchPaths = useApp((ctx) => ctx.selectedBranchPaths);
	const appMode = useApp((ctx) => ctx.appMode);
	const isCommitMode = useMemo(() => appMode === "commit", [appMode]);
	const { emitStatusSingle } = useSocketEmits();
	const selectedBranchesCount = useMemo(() => Object.keys(selectedBranches).length, [selectedBranches]);

	const [isLookupSLogsOn, setIsLookupSLogsOn] = useState(false);
	const [isLookupTrelloOn, setIsLookupTrelloOn] = useState(false);
	const [sourceBranch, setSourceBranch] = useState("");
	const [sourceIssueNumber, setSourceIssueNumber] = useState("");
	const [issueNumber, setIssueNumber] = useState({});
	const [commitMessage, setCommitMessage] = useState("");

	const [conflictingChanges, setConflictingChanges] = useState({});
	const [unknownChanges, setUnknownChanges] = useState({});
	const [modifiedChanges, setModifiedChanges] = useState({});

	const [selectedConflictingChanges, setSelectedConflictingChanges] = useState({});
	const [selectedUnknownChanges, setSelectedUnknownChanges] = useState({});
	const [selectedModifiedChanges, setSelectedModifiedChanges] = useState({});

	const [trelloData, setTrelloData] = useState({});

	const [commitStage, setCommitStage] = useState(["commitDetails"]);
	const accordionSections = useMemo(
		() => [
			{
				value: "commitDetails",
				icon: BiMessageDetail,
				title: "Commit Details",
				description: "Enter issue, branch and message details",
				component: SubSectionCommitDetails,
			},
			{
				value: "conflictingChanges",
				icon: IoWarning,
				title: "Conflicting Changes",
				description: "Modified changes that will conflict with the remote version",
				component: SubSectionConflictingChanges,
			},
			{
				value: "unknownChanges",
				icon: FiHelpCircle,
				title: "Unknown Changes",
				description: "Added and deleted files currently not tracked by SVN",
				component: SubSectionUnknownChanges,
			},
			{
				value: "modifiedChanges",
				icon: FiEdit,
				title: "Modified Changes",
				description: "Files and directories listed for committing",
				component: SubSectionModifiedChanges,
			},
		],
		[]
	);

	const accordionSection = useMemo(
		() =>
			accordionSections.map((accSection, i) => (
				<AccordionItem key={i} value={accSection.value}>
					<AccordionItemTrigger>
						<Flex fontSize="lg" color="colorPalette.fg">
							<accSection.icon />
						</Flex>
						<Stack gap="1">
							<Text>{accSection.title}</Text>
							<Text fontSize="xs" color="fg.muted">
								{accSection.description}
							</Text>
						</Stack>
					</AccordionItemTrigger>
					<AccordionItemContent>
						<accSection.component />
					</AccordionItemContent>
				</AccordionItem>
			)),
		[accordionSections]
	);

	const value = useMemo(
		() => ({
			isLookupSLogsOn,
			setIsLookupSLogsOn,
			isLookupTrelloOn,
			setIsLookupTrelloOn,
			sourceBranch,
			setSourceBranch,
			sourceIssueNumber,
			setSourceIssueNumber,
			issueNumber,
			setIssueNumber,
			commitMessage,
			setCommitMessage,
			conflictingChanges,
			unknownChanges,
			modifiedChanges,
			selectedConflictingChanges,
			setSelectedConflictingChanges,
			selectedUnknownChanges,
			setSelectedUnknownChanges,
			selectedModifiedChanges,
			setSelectedModifiedChanges,
			trelloData,
			setTrelloData,
			isCommitMode,
			selectedBranchesCount,
			accordionSection,
			commitStage,
			setCommitStage,
		}),
		[
			isLookupSLogsOn,
			isLookupTrelloOn,
			sourceBranch,
			sourceIssueNumber,
			issueNumber,
			commitMessage,
			conflictingChanges,
			unknownChanges,
			modifiedChanges,
			selectedConflictingChanges,
			selectedUnknownChanges,
			selectedModifiedChanges,
			trelloData,
			isCommitMode,
			selectedBranchesCount,
			accordionSection,
			commitStage,
		]
	);

	useEffect(() => {
		if (!isCommitMode) return;
		setTimeout(() => document.getElementById("sectionCommit")?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" }), 400);
	}, [isCommitMode]);

	useEffect(() => {
		if (!isCommitMode) return;
		selectedBrachesData.forEach((branchRow) => {
			console.log("Emitting status single for branch", branchRow["SVN Branch"]);
			emitStatusSingle(branchRow);
		});
	}, [isCommitMode, selectedBrachesData]);

	useEffect(() => {
		if (!isCommitMode || selectedBranchesCount < 1) return;
		const socketCallback = (data) => {
			console.log("Received status single from socket in ContextCommit component in background", data);
			const branchId = data.id;
			const { branch: branchPath, filesToUpdate, filesToTrack, filesToCommit } = data.status;

			const matchedSelectedRow = configurableRowData.find((branchRow) => branchRow.id === branchId);
			const matchedBranchString = branchString(matchedSelectedRow["Branch Folder"], matchedSelectedRow["Branch Version"], matchedSelectedRow["SVN Branch"]);

			setConflictingChanges((prevData) => {
				const newData = {};
				Object.entries(prevData).forEach(([branchPath, branchData]) => {
					if (selectedBranchPaths.has(branchPath)) {
						newData[branchPath] = branchData;
					}
				});

				if (filesToUpdate?.length > 0)
					newData[branchPath] = {
						branchString: matchedBranchString,
						"Branch Folder": matchedSelectedRow["Branch Folder"],
						"Branch Version": matchedSelectedRow["Branch Version"],
						"SVN Branch": branchPath,
						filesToUpdate,
					};
				else delete newData[branchPath];
				return newData;
			});

			setUnknownChanges((prevData) => {
				const newData = {};
				Object.entries(prevData).forEach(([branchPath, branchData]) => {
					if (selectedBranchPaths.has(branchPath)) {
						newData[branchPath] = branchData;
					}
				});

				if (filesToTrack?.length > 0)
					newData[branchPath] = {
						branchString: matchedBranchString,
						"Branch Folder": matchedSelectedRow["Branch Folder"],
						"Branch Version": matchedSelectedRow["Branch Version"],
						"SVN Branch": branchPath,
						filesToTrack,
					};
				else delete newData[branchPath];
				return newData;
			});

			setModifiedChanges((prevData) => {
				const newData = {};
				Object.entries(prevData).forEach(([branchPath, branchData]) => {
					if (selectedBranchPaths.has(branchPath)) {
						newData[branchPath] = branchData;
					}
				});

				if (filesToCommit?.length > 0)
					newData[branchPath] = {
						branchString: matchedBranchString,
						"Branch Folder": matchedSelectedRow["Branch Folder"],
						"Branch Version": matchedSelectedRow["Branch Version"],
						"SVN Branch": branchPath,
						filesToCommit,
					};
				else delete newData[branchPath];
				return newData;
			});
		};

		socket?.on("branch-status-single", socketCallback);
		return () => socket?.off("branch-status-single", socketCallback);
	}, [socket, isCommitMode, selectedBranchesCount, configurableRowData, selectedBranchPaths]);

	useEffect(() => {
		if (!isCommitMode || selectedBranchesCount < 1) return;
		const socketCallback = (data) => {
			console.log("Received branch-paths-update from socket in ContextCommit component in background", data);
			const { paths } = data;

			// List of actions: add, delete, untrack, revert, modify, conflict, commit, normal
			const addedPaths = paths.filter((path) => path.action === "add");
			const deletedPaths = paths.filter((path) => path.action === "delete");
			const untrackedPaths = paths.filter((path) => path.action === "untrack");
			const revertedPaths = paths.filter((path) => path.action === "revert");
			const modifiedPaths = paths.filter((path) => path.action === "modify");
			const conflictingPaths = paths.filter((path) => path.action === "conflict");
			const committedPaths = paths.filter((path) => path.action === "commit"); // TODO: Not used, but maybe useful in the future -- show committed paths in a new history tab?
			const normalPaths = paths.filter((path) => path.action === "normal"); // TOOD: Not used, might be removed

			// When adding paths, we must remove the action

			setConflictingChanges((prevData) => {
				const newData = {};
				Object.entries(prevData).forEach(([branchPath, branchData]) => {
					if (selectedBranchPaths.has(branchPath)) {
						newData[branchPath] = branchData;
					}
				});

				for (const branchPath of Object.keys(newData)) {
					let newFilesToUpdate = newData[branchPath].filesToUpdate;

					newFilesToUpdate = newFilesToUpdate.filter((f) => {
						const path = paths.find((p) => p.path === f.path);
						return !path || ["conflict"].includes(path.action);
					});

					// Add new paths to the current array if they have conflict action and are not already in the array.
					for (const path of conflictingPaths) {
						const index = newFilesToUpdate.findIndex((f) => f.path === path.path);
						if (index === -1) {
							const { action, ...rest } = path;
							newFilesToUpdate.push({
								...rest
							});
						}
					}

					newData[branchPath] = {
						...newData[branchPath],
						filesToUpdate: newFilesToUpdate,
					};
				}

				return newData;
			});

			setUnknownChanges((prevData) => {
				const newData = {};
				Object.entries(prevData).forEach(([branchPath, branchData]) => {
					if (selectedBranchPaths.has(branchPath)) {
						newData[branchPath] = branchData;
					}
				});

				for (const branchPath of Object.keys(newData)) {
					let newFilesToTrack = newData[branchPath].filesToTrack;

					newFilesToTrack = newFilesToTrack.filter((f) => {
						const path = paths.find((p) => p.path === f.path);
						return !path || ["untrack"].includes(path.action);
					});

					// Add new paths to the current array if they have untrack action or revert action with wcStatus unversioned or missing and are not already in the array.
					for (const path of [...untrackedPaths, ...revertedPaths.filter((p) => ["unversioned", "missing"].includes(p.wcStatus))]) {
						const index = newFilesToTrack.findIndex((f) => f.path === path.path);
						if (index === -1) {
							const { action, ...rest } = path;
							newFilesToTrack.push({
								...rest,
							});
						}
					}

					newData[branchPath] = {
						...newData[branchPath],
						filesToTrack: newFilesToTrack,
					};
				}

				return newData;
			});

			setModifiedChanges((prevData) => {
				const newData = {};
				Object.entries(prevData).forEach(([branchPath, branchData]) => {
					if (selectedBranchPaths.has(branchPath)) {
						newData[branchPath] = branchData;
					}
				});

				for (const branchPath of Object.keys(newData)) {
					let newFilesToCommit = newData[branchPath].filesToCommit;

					// Filter out current paths that are in the new paths and the new paths having a revert or commit action.
					newFilesToCommit = newFilesToCommit.filter((f) => {
						const path = paths.find((p) => p.path === f.path);
						return !path || ["add", "delete", "modify"].includes(path.action);
					});

					// Add new paths to the current array if they have add, delete or modify action and are not already in the array.
					for (const path of [...addedPaths, ...deletedPaths, ...modifiedPaths]) {
						const index = newFilesToCommit.findIndex((f) => f.path === path.path);
						if (index === -1) {
							const {action, ...rest} = path;
							newFilesToCommit.push({
								...rest,
							});
						}
					}

					newData[branchPath] = {
						...newData[branchPath],
						filesToCommit: newFilesToCommit,
					};
				}

				return newData;
			});
		};

		socket?.on("branch-paths-update", socketCallback);
		return () => socket?.off("branch-paths-update", socketCallback);
	}, [socket, isCommitMode, selectedBranchesCount, configurableRowData, selectedBranchPaths]);

	return <ContextCommit.Provider value={value}>{children}</ContextCommit.Provider>;
};
