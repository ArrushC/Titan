import { Box, Flex, FormControl, FormLabel, IconButton, Textarea, Tooltip, Text } from "@chakra-ui/react";
import { Select } from "chakra-react-select";
import React, { useCallback, useEffect } from "react";
import { useApp } from "../AppContext";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import IssueNumberInput from "./IssueNumberInput";
import useCommitOptions from "../hooks/useCommitOptions";
import useConfigUtilities from "../hooks/useConfigUtilities";

export default function FormSVNMessage({ openMessageAutoFillModal }) {
	const { sourceBranch, setSourceBranch, branchOptions, setIssueNumber, commitMessage, setCommitMessage, isCommitMode, selectedBranches } = useApp();
	const commitOptions = useCommitOptions();
	const { getBranchFolderById } = useConfigUtilities();

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
		if (!isCommitMode) return;
		setSourceBranch(null);
		setIssueNumber({});
	}, [isCommitMode]);

	// Clear commit message if commit mode has been changed and cannot reuse the same message
	useEffect(() => {
		if (!commitOptions?.reusePreviousCommitMessage) {
			setCommitMessage("");
		}
	}, [commitOptions?.reusePreviousCommitMessage, setCommitMessage, isCommitMode]);

	// Clear issue number for branches that are not selected
	useEffect(() => {
		setIssueNumber((currIssueNumber) => Object.fromEntries(Object.entries(currIssueNumber).filter(([folder]) => selectedBranches.some((branch) => branch["Branch Folder"] === folder))));
	}, [selectedBranches]);

	return (
		<Box>
			<Flex columnGap={3}>
				<Box flexGrow={1}>
					<Flex columnGap={2} mb={2}>
						<Box width={"50%"}>
							<FormControl isRequired>
								<FormLabel>Source Branch</FormLabel>
								<Select value={sourceBranch} onChange={handleSourceBranchChange} options={branchOptions} placeholder="Enter source branch" selectedOptionStyle="check" selectedOptionColorScheme="yellow" isClearable />
							</FormControl>
						</Box>
						<Flex width={"50%"} alignItems={"flex-end"} columnGap={2}>
							<IssueNumberInput branchFolder={sourceBranch && sourceBranch.value ? getBranchFolderById(sourceBranch.value) : null} />
						</Flex>
					</Flex>
					<Flex columnGap={2} height={"auto"}>
						<FormControl width={commitOptions?.useIssuePerFolder ? "50%" : "100%"} isRequired>
							<FormLabel>Commit Message</FormLabel>
							<Textarea placeholder={"Enter Commit Message"} height={"76%"} resize={"none"} onInput={handleCommitMessageChange} value={commitMessage} />
						</FormControl>

						{commitOptions?.useIssuePerFolder && sourceBranch && sourceBranch.value ? (
							<Flex width="50%" flexDir={"column"} rowGap={2}>
								{selectedBranches.length > 0
									? [...new Set(selectedBranches.filter((branch) => branch["Branch Folder"] !== getBranchFolderById(sourceBranch.value)).map((branch) => branch["Branch Folder"]))].map((branchFolder) => <IssueNumberInput key={branchFolder} branchFolder={branchFolder} />)
									: null}
							</Flex>
						) : commitOptions?.useIssuePerFolder && (!sourceBranch || !sourceBranch.value) ? (
							<Box width={"50%"} textAlign={"center"} m={"auto"}>
								<Text fontSize={"lg"} fontWeight={"600"} color={"yellow.500"}>
									Please select source branch first!
								</Text>
							</Box>
						) : null}
					</Flex>
				</Box>
				<Box pt={8}>
					<Tooltip label="Auto Fill Message" hasArrow>
						<IconButton colorScheme={"yellow"} aria-label="Auto Fill Message" size="md" onClick={() => openMessageAutoFillModal()} icon={<ExternalLinkIcon />} />
					</Tooltip>
				</Box>
			</Flex>
		</Box>
	);
}
