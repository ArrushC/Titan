import { Code, Flex, Stack, Text } from "@chakra-ui/react";
import React, { useMemo, useEffect } from "react";
import { useApp } from "../ContextApp.jsx";
import FieldIssueNumber from "./FieldIssueNumber.jsx";
import { FieldSourceBranch } from "./FieldSourceBranch.jsx";
import { FieldCommitMessage } from "./FieldCommitMessage.jsx";
import { FieldLookup } from "./FieldLookup.jsx";
import { useCommit } from "../ContextCommit.jsx";

export default function SubSectionCommitDetails() {
	const { selectedBranches, configurableRowData } = useApp();
	const { commitMessage } = useCommit();
	const selectedFolders = useMemo(() => configurableRowData.filter((branchRow) => selectedBranches[branchRow.id]).map((branchRow) => branchRow["Branch Folder"]), [configurableRowData, selectedBranches]);

	useEffect(() => {
		console.log("SubSectionCommitDetails rendered");
	}, []);

	return (
		<Flex ms={9} flexDirection={"column"}>
			<Stack gap="6" maxW="8xl" css={{ "--field-label-width": "96px" }} flex={1}>
				<FieldLookup />
				{selectedFolders.map((branchFolder, i) => (
					<FieldIssueNumber key={i} branchFolder={branchFolder} />
				))}
				<FieldSourceBranch />
				<FieldCommitMessage />
			</Stack>

			<Text mt={6}>
				Your final commit message: <Code>Issue XXXX (YYY): {commitMessage.trim() == "" ? "Enter commit message above" : commitMessage.replace(/\n/g, "; ")}</Code>
			</Text>
		</Flex>
	);
}
