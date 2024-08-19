import { Box, Flex, FormControl, FormLabel, IconButton, Textarea, Tooltip } from "@chakra-ui/react";
import { Select } from "chakra-react-select";
import React, { useCallback, useEffect } from "react";
import { useApp } from "../AppContext";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import IssueNumberInput from "./IssueNumberInput";

export default function FormSVNMessage({ openMessageAutoFillModal }) {
	const { sourceBranch, setSourceBranch, sourceBranchOptions, setIssueNumber, commitMessage, setCommitMessage, selectedBranches, isCommitMode } = useApp();

	const handleSourceBranchChange = useCallback(
		(selectedOption) => {
			setSourceBranch(selectedOption);
		},
		[setSourceBranch]
	);

	const handleCommitMessageChange = useCallback(
		(e) => {
			setCommitMessage(String(e.target.value).replace(/["`]/g, "'"));
		},
		[setCommitMessage]
	);

	useEffect(() => {
		if (selectedBranches.length === 1) setSourceBranch(sourceBranchOptions[0]);
		else setSourceBranch(null);
	}, [selectedBranches, sourceBranchOptions]);

	useEffect(() => {
		if (!isCommitMode) return;
		setSourceBranch(null);
		setIssueNumber("");
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
						<IssueNumberInput />
					</FormControl>
					<Tooltip label="Auto Fill Message" hasArrow>
						<IconButton colorScheme={"yellow"} aria-label="Auto Fill Message" size="md" onClick={() => openMessageAutoFillModal()} icon={<ExternalLinkIcon />} />
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
