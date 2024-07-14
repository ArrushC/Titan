import { Box, Flex, FormControl, FormLabel, Textarea } from "@chakra-ui/react";
import { CreatableSelect, Select } from "chakra-react-select";
import React, { useCallback, useEffect, useMemo } from "react";
import { useApp } from "../AppContext";
import { branchString } from "../utils/CommonConfig";

export default function FormSVNMessage() {
	const {sourceBranch, setSourceBranch,  issueNumber, setIssueNumber, commitMessage, setCommitMessage, issueOptions, setIssueOptions, selectedBranches} = useApp();

	const sourceBranchOptions = useMemo(
		() =>
			selectedBranches.map((row) => ({
				value: row.id,
				label: branchString(row["Branch Folder"], row["Branch Version"], row["SVN Branch"]),
			})),
		[selectedBranches]
	);

	const handleSourceBranchChange = useCallback((selectedOption) => {
		setSourceBranch(selectedOption);
	}, [setSourceBranch]);

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


	return (
		<Box>
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
	);
}
