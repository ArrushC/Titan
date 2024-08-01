import { Box, Flex, FormControl, FormLabel, IconButton, Textarea, Tooltip } from "@chakra-ui/react";
import { CreatableSelect, Select } from "chakra-react-select";
import React, { useCallback, useEffect, useMemo } from "react";
import { useApp } from "../AppContext";
import { branchString } from "../utils/CommonConfig";
import { CloseIcon } from "@chakra-ui/icons";

export default function FormSVNMessage() {
	const { sourceBranch, setSourceBranch, issueNumber, setIssueNumber, commitMessage, setCommitMessage, issueOptions, setIssueOptions, selectedBranches, isCommitMode } = useApp();

	const sourceBranchOptions = useMemo(
		() =>
			selectedBranches.map((row) => ({
				value: row.id,
				label: branchString(row["Branch Folder"], row["Branch Version"], row["SVN Branch"]),
			})),
		[selectedBranches]
	);

	const handleSourceBranchChange = useCallback(
		(selectedOption) => {
			setSourceBranch(selectedOption);
		},
		[setSourceBranch]
	);

	const handleIssueNumberChange = (selectedOption) => {
		setIssueNumber(selectedOption);
		if (selectedOption && !issueOptions.some((option) => String(option.value).trim() === String(selectedOption.value).trim())) {
			const newOptions = [...issueOptions, selectedOption];
			setIssueOptions(newOptions);
			localStorage.setItem("issueOptions", JSON.stringify(newOptions));
		}
	};

	const handleClearIssueOptions = () => {
		setIssueOptions([]);
		localStorage.removeItem("issueOptions");
	};

	const handleCommitMessageChange = useCallback(
		(e) => {
			setCommitMessage(String(e.target.value).replace(/["`]/g, "'"));
		},
		[setCommitMessage]
	);

	// Load options from localStorage on component mount
	useEffect(() => {
		const savedIssueOptions = localStorage.getItem("issueOptions");
		if (savedIssueOptions) setIssueOptions(JSON.parse(savedIssueOptions));
	}, []);

	useEffect(() => {
		if (selectedBranches.length === 1) setSourceBranch(sourceBranchOptions[0]);
		else setSourceBranch(null);
	}, [selectedBranches, sourceBranchOptions]);

	useEffect(() => {
		if (!isCommitMode) return;
		setSourceBranch(null);
		setIssueNumber(null);
		setCommitMessage("");
	}, [isCommitMode]);

	return (
		<Box>
			<Flex columnGap={2} mb={2}>
				<Box width={"50%"}>
					<FormControl isRequired>
						<FormLabel>Source Branch</FormLabel>
						<Select value={sourceBranch} onChange={handleSourceBranchChange} options={sourceBranchOptions} placeholder="Select branch you would like to commit from" selectedOptionStyle="check" selectedOptionColorScheme="yellow" isClearable />
					</FormControl>
				</Box>
				<Flex width={"50%"} alignItems={"flex-end"} columnGap={2}>
					<FormControl isRequired>
						<FormLabel>Issue Number</FormLabel>
						<CreatableSelect
							value={issueNumber}
							onChange={handleIssueNumberChange}
							options={issueOptions}
							placeholder="Select or create an issue number"
							formatCreateLabel={(inputValue) => `Create issue "${inputValue}"`}
							selectedOptionStyle="check"
							selectedOptionColorScheme="yellow"
							isClearable
							isSearchable
							createOptionPosition="first"
						/>
					</FormControl>
					<Tooltip label="Clear All Issue Number Options" hasArrow>
						<IconButton colorScheme={"red"} aria-label="Clear Issue Number Options" size="md" onClick={handleClearIssueOptions} icon={<CloseIcon />} />
					</Tooltip>
				</Flex>
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
