import { Flex, Input, Stack, Textarea } from "@chakra-ui/react";
import { Field } from "./ui/field.jsx";
import React, { useMemo, memo, useEffect } from "react";
import { useApp } from "../ContextApp.jsx";
import FieldIssueNumber from "./FieldIssueNumber.jsx";



const SourceBranchField = memo(() => (
	<Field orientation="horizontal" label="Source branch" labelFlex="0.4">
		<Input placeholder="Where your changes came from" ms={4} flex="0.95" size="sm" variant="flushed" borderColor="colorPalette.fg" />
	</Field>
));

const CommitMessageField = memo(() => (
	<Field orientation="vertical" label="Commit Message" required>
		<Textarea placeholder="Main body of the commit message" variant="outline" size="sm" rows={8} borderColor="colorPalette.fg" />
	</Field>
));

export default function SubSectionCommitDetails() {
	const { selectedBranches, configurableRowData } = useApp();
	const selectedFolders = useMemo(
		() => configurableRowData.filter((branchRow) => selectedBranches[branchRow.id]).map((branchRow) => branchRow["Branch Folder"]),
		[configurableRowData, selectedBranches]
	);

	console.log("SubSectionCommitDetails");
	console.warn("Maybe create two separate contexts, one for branches and one for commits, and create a universal context for the app");

	useEffect(() => {
		console.log("SubSectionCommitDetails rendered");
	}, []);

	return (
		<Flex ms={9}>
			<Stack gap="6" maxW="5xl" css={{ "--field-label-width": "96px" }} flex={1}>
				{selectedFolders.map((branchFolder, i) => (
					<FieldIssueNumber key={i} branchFolder={branchFolder} />
				))}
				<SourceBranchField />
				<CommitMessageField />
			</Stack>
		</Flex>
	);
}
