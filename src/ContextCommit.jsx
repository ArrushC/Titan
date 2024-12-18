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

const initialState = {
	isLookupSLogsOn: false,
	setIsLookupSLogsOn: (_) => {},
	isLookupTrelloOn: false,
	setIsLookupTrelloOn: (_) => {},
	sourceBranch: "",
	setSourceBranch: (_) => {},
	issueNumber: {},
	setIssueNumber: (_) => {},
	commitMessage: "",
	setCommitMessage: (_) => {},
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
	const selectedBranches = useApp((ctx) => ctx.selectedBranches);
	const appMode = useApp((ctx) => ctx.appMode);

	const [isLookupSLogsOn, setIsLookupSLogsOn] = useState(false);
	const [isLookupTrelloOn, setIsLookupTrelloOn] = useState(false);
	const [sourceBranch, setSourceBranch] = useState("");
	const [issueNumber, setIssueNumber] = useState({});
	const [commitMessage, setCommitMessage] = useState("");
	const isCommitMode = useMemo(() => appMode === "commit", [appMode]);
	const selectedBranchesCount = useMemo(() => Object.keys(selectedBranches).length, [selectedBranches]);

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
			issueNumber,
			setIssueNumber,
			commitMessage,
			setCommitMessage,
			isCommitMode,
			selectedBranchesCount,
			accordionSection,
			commitStage,
			setCommitStage,
		}),
		[isLookupSLogsOn, isLookupTrelloOn, sourceBranch, issueNumber, commitMessage, isCommitMode, selectedBranchesCount, accordionSection, commitStage]
	);

	useEffect(() => {
		if (!isCommitMode) return;
		setTimeout(() => document.getElementById("sectionCommit")?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" }), 400);
	}, [isCommitMode]);

	return <ContextCommit.Provider value={value}>{children}</ContextCommit.Provider>;
};
