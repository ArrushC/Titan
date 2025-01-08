import { Box, chakra, CheckboxGroup, Flex, Heading, HStack, List, Text } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useCommit } from "../ContextCommit.jsx";
import useSocketEmits from "../hooks/useSocketEmits.jsx";
import { useApp } from "../ContextApp.jsx";
import { ProgressBar, ProgressLabel, ProgressRoot, ProgressValueText } from "./ui/progress.jsx";
import { MdError } from "react-icons/md";
import ButtonClipboard from "./ButtonClipboard.jsx";
import { Checkbox } from "./ui/checkbox.jsx";
import { branchPathFolder } from "../utils/CommonConfig.jsx";
import { Button } from "./ui/button.jsx";
import { FaCheck, FaCircleCheck, FaTrello } from "react-icons/fa6";

export default function ProcessCommit() {
	const socket = useApp((ctx) => ctx.socket);
	const trelloData = useCommit((ctx) => ctx.trelloData);
	const commitPayload = useCommit((ctx) => ctx.commitPayload);
	const { commitMessage, selectedModifiedChanges, selectedBranchProps } = commitPayload;
	const isProcessCommit = useCommit((ctx) => ctx.isProcessCommit);
	const setIsProcessCommit = useCommit((ctx) => ctx.setIsProcessCommit);
	const { emitTrelloCardUpdate } = useSocketEmits();

	const finalCommitMessage = useMemo(
		() =>
			commitMessage
				?.trim()
				.replace(/\s*\n+\s*/g, "; ")
				.replace(/[;\s]+$/, "")
				.trim(),
		[commitMessage]
	);
	const [liveCommits, setLiveCommits] = useState([]);
	const selectedBranchesCount = useMemo(() => {
		const uniqueBranches = new Set();
		if (!selectedModifiedChanges) return 0;
		for (const { branchPath } of Object.values(selectedModifiedChanges)) {
			uniqueBranches.add(branchPath);
		}
		return uniqueBranches.size;
	}, [selectedModifiedChanges]);
	const progressValue = selectedBranchesCount > 0 ? (liveCommits.length / selectedBranchesCount) * 100 : 0;
	const [clipboardOptions, setClipboardOptions] = useState(["BranchFolder", "BranchVersion"]);
	const [revisionsText, setRevisionsText] = useState("");

	const formatForClipboard = useCallback(() => {
		// Zero-width spaces to offset line wrapping if "MarkupSupport" is included
		const newline = clipboardOptions.includes("MarkupSupport") ? `\r\n\n${"\u200B".repeat(7)}` : "\r\n";

		const versionCompare = (a, b) => {
			const parseVersion = (version) => {
				const match = version.match(/([A-Za-z]+)?(\d+(?:\.\d+)*)/);
				if (!match) return { prefix: "", parts: [] };
				const [, prefix, versionNumber] = match;
				const parts = versionNumber.split(".").map(Number);
				return { prefix: prefix || "", parts };
			};

			const aParsed = parseVersion(a);
			const bParsed = parseVersion(b);

			// Compare prefixes (e.g., "CA")
			if (aParsed.prefix !== bParsed.prefix) {
				return aParsed.prefix.localeCompare(bParsed.prefix);
			}

			// Compare version parts (e.g., 3.18.3 vs. 3.20.3)
			for (let i = 0; i < Math.max(aParsed.parts.length, bParsed.parts.length); i++) {
				const aPart = aParsed.parts[i] || 0;
				const bPart = bParsed.parts[i] || 0;
				if (aPart !== bPart) {
					return aPart - bPart;
				}
			}

			return 0; // If all parts are identical
		};

		const sortedCommits = [...liveCommits].sort((a, b) => {
			const folderA = selectedBranchProps[a.svnBranch]?.folder || "";
			const folderB = selectedBranchProps[b.svnBranch]?.folder || "";

			if (folderA !== folderB) {
				return folderA.localeCompare(folderB); // Sort by folder name ascending
			}

			const versionA = selectedBranchProps[a.svnBranch]?.version || "";
			const versionB = selectedBranchProps[b.svnBranch]?.version || "";

			return versionCompare(versionA, versionB); // Sort by version
		});

		const copiedCommitMsg = clipboardOptions.includes("CommitMsg") ? `${finalCommitMessage}\n` : "";

		const lines = sortedCommits.map((commit) => {
			const parts = [];

			if (clipboardOptions.includes("BranchFolder")) {
				parts.push(selectedBranchProps[commit.svnBranch]?.folder);
			}
			if (clipboardOptions.includes("BranchVersion")) {
				parts.push(selectedBranchProps[commit.svnBranch]?.version);
			}
			if (clipboardOptions.includes("SVNBranch")) {
				parts.push(branchPathFolder(commit.svnBranch) || "[SVN-branch-unknown]");
			}
			if (clipboardOptions.includes("IssueNumber")) {
				parts.push(`Issue [${commit.branchIssueNumber || "??"}]`);
			}

			// Always include revision or error
			const revisionOrError = commit.revision ? `Revision [${commit.revision}]` : `Error: ${commit.errorMessage || "Unknown"}`;
			parts.push(revisionOrError);

			return parts.join(" ").trim();
		});

		return copiedCommitMsg + lines.join(newline);
	}, [liveCommits, clipboardOptions, finalCommitMessage, selectedBranchProps, branchPathFolder]);

	useEffect(() => {
		const socketCallback = (data) => {
			setLiveCommits((currentCommits) => [...currentCommits, data]);
		};

		socket?.on("svn-commit-live", socketCallback);
		return () => socket?.off("svn-commit-live", socketCallback);
	}, [socket]);

	useEffect(() => {
		const newText = formatForClipboard();
		setRevisionsText(newText);
	}, [formatForClipboard]);

	useEffect(() => {
		if (isProcessCommit) return;
		setLiveCommits([]);
		setRevisionsText("");
		setClipboardOptions(["BranchFolder", "BranchVersion"]);
	}, [isProcessCommit]);

	const handleCheckboxOption = useCallback((newValues) => {
		setClipboardOptions(newValues);
	}, []);

	const handleCompleteCommit = useCallback(() => {
		setIsProcessCommit(false);
	}, []);

	const handleUpdateTrelloCard = useCallback(() => {
		const newline = clipboardOptions.includes("MarkupSupport") ? `\r\n\n${"\u200B".repeat(7)}` : "\r\n";
		emitTrelloCardUpdate(trelloData, revisionsText.split(newline), finalCommitMessage);
	}, [trelloData, liveCommits, finalCommitMessage, revisionsText, clipboardOptions, emitTrelloCardUpdate]);

	return (
		<Box>
			<Heading as={"h2"} size={"lg"} lineClamp={1} mb={4} className="animation-pulse" lineHeight={"1.4"}>
				Committing {selectedBranchesCount} branch{selectedBranchesCount > 1 ? "es" : ""}:
			</Heading>

			<Box mt={6} colorPalette={"yellow"}>
				{liveCommits.length < selectedBranchesCount ? (
					<Box>
						<ProgressRoot value={progressValue} size={"lg"} colorPalette={"yellow"} variant={"subtle"} striped animated mb={4}>
							<HStack gap={5}>
								<ProgressLabel>Committed</ProgressLabel>
								<ProgressBar flex="0.5" />
								<ProgressValueText>
									{liveCommits.length} / {selectedBranchesCount}
								</ProgressValueText>
							</HStack>
						</ProgressRoot>
						<List.Root gap="2" variant="plain" align="center" colorPalette={"yellow"}>
							{liveCommits.map((commit, i) => (
								<List.Item key={i} alignItems={"center"}>
									<List.Indicator color={commit.revision ? "colorPalette.fg" : "red.500"} display={"flex"} alignItems={"center"}>
										{commit.revision ? <FaCircleCheck /> : <MdError />}
									</List.Indicator>
									{commit.branchString}&nbsp;&nbsp;&#8594;&nbsp;&nbsp;{commit.revision ? commit.revision : commit.errorMessage}
								</List.Item>
							))}
						</List.Root>
					</Box>
				) : (
					<Box>
						<Text mb={3} color={"colorPalette.inverted"}>
							The commit process has been <chakra.span color={"colorPalette.fg"}>completed</chakra.span>! Please see he commit details below:
						</Text>

						<Flex direction={"row"} gap={3} alignItems={"center"}>
							<Text>Commit message:</Text>
							<Text color={"colorPalette.fg"}>{finalCommitMessage || "Commit message not found. This is a fatal error!"}</Text>
							<ButtonClipboard value={finalCommitMessage || "Commit message not found. This is a fatal error!"} />
						</Flex>

						<Box my={4}>
							<Text fontWeight="bold">Choose fields to include in your revision text:</Text>
							<CheckboxGroup defaultValue={clipboardOptions} onValueChange={handleCheckboxOption}>
								<HStack spacing={4} mt={2}>
									<Checkbox value="BranchFolder">Branch Folder</Checkbox>
									<Checkbox value="BranchVersion">Branch Version</Checkbox>
									<Checkbox value="SVNBranch">SVN Branch</Checkbox>
									<Checkbox value="IssueNumber">Issue Number</Checkbox>
									<Checkbox value="CommitMsg">Commit Message</Checkbox>
									<Checkbox value="MarkupSupport">Markup Support</Checkbox>
								</HStack>
							</CheckboxGroup>
						</Box>

						<Box my={4}>
							<Text>Your Revisions:</Text>
							<Flex alignItems="center" gap={3}>
								<Box my={2} p={2} bg="yellow.subtle" color={"yellow.fg"} borderRadius="md" overflowX="auto" whiteSpace="pre-wrap" wordBreak="break-word">
									{revisionsText || "Commit message not displayed. This is a fatal error!"}
								</Box>
								<ButtonClipboard value={revisionsText || "Commit message not copied. This is a fatal error!"} />
							</Flex>
						</Box>

						<HStack gap={3} colorPalette={"yellow"}>
							<Button onClick={handleCompleteCommit}>
								<FaCheck />
								Complete
							</Button>
							<Button onClick={handleUpdateTrelloCard} disabled={!trelloData?.name || trelloData?.name?.trim() === ""}>
								<FaTrello />
								Update Card
							</Button>
						</HStack>
					</Box>
				)}
			</Box>
		</Box>
	);
}
