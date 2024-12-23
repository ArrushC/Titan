import { Code, Flex, Stack, Text } from "@chakra-ui/react";
import React, { useMemo, useEffect } from "react";
import { useApp } from "../ContextApp.jsx";
import FieldIssueNumber from "./FieldIssueNumber.jsx";
import FieldSourceBranch from "./FieldSourceBranch.jsx";
import FieldCommitMessage from "./FieldCommitMessage.jsx";
import { FieldLookup } from "./FieldLookup.jsx";
import { useCommit } from "../ContextCommit.jsx";

export default function SubSectionCommitDetails() {
	const selectedBranchesData = useApp((ctx) => ctx.selectedBranchesData);
	const sourceBranch = useCommit((ctx) => ctx.sourceBranch);
	const sourceIssueNumber = useCommit((ctx) => ctx.sourceIssueNumber);
	const commitMessage = useCommit((ctx) => ctx.commitMessage);
	const selectedFolders = useMemo(() => {
		return Array.from(selectedBranchesData.reduce((acc, branchRow) => acc.add(branchRow["Branch Folder"]), new Set()));
	}, [selectedBranchesData]);

	return (
		<Flex ms={9} flexDirection={"column"}>
			<Stack gap="6" maxW="8xl" css={{ "--field-label-width": "96px" }} flex={1}>
				<FieldLookup />
				{selectedFolders.map((branchFolder, i) => (
					<FieldIssueNumber key={branchFolder} branchFolder={branchFolder} />
				))}
				<FieldSourceBranch />
				<FieldCommitMessage />
			</Stack>

			<Text mt={6}>
				Your final commit message:{" "}
				<Code>
					Issue XYZ{sourceBranch.trim() !== "" ? ` (${sourceBranch.trim()}${sourceIssueNumber !== "" ? " #" + String(sourceIssueNumber) : ""})` : ""}:{" "}
					{commitMessage.trim() == ""
						? "Enter commit message above"
						: commitMessage
								.trim()
								.replace(/\s*\n+\s*/g, "; ")
								.replace(/[;\s]+$/, "")
								.trim()}
				</Code>
			</Text>
		</Flex>
	);
}
