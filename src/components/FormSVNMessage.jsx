import { Box, Flex, FormControl, FormLabel, IconButton, Textarea, Tooltip, Text } from "@chakra-ui/react";
import { Select } from "chakra-react-select";
import React, { useCallback, useEffect } from "react";
import { useApp } from "../ContextApp.jsx";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import IssueNumberInput from "./IssueNumberInput";
import useCommitOptions from "../hooks/useCommitOptions";
import useConfigUtilities from "../hooks/useConfigUtilities";

export default function FormSVNMessage({ openMessageAutoFillModal }) {
	const { sourceBranch, setSourceBranch, branchOptions, setIssueNumber, commitMessage, setCommitMessage, isCommitMode, selectedBranches } = useApp();
	const commitOptions = useCommitOptions();
	const { getBranchFolderById, selectedBranchFolders } = useConfigUtilities();

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
							<FormControl required>
								<FormLabel>Source Branch</FormLabel>
								<Select value={sourceBranch} onChange={handleSourceBranchChange} options={branchOptions} placeholder="SVN Branch you're commiting from" selectedOptionStyle="check" selectedOptioncolorPalette="yellow" isClearable classNamePrefix={"chakra-react-select"} />
							</FormControl>
						</Box>
						<Flex width={"50%"} alignItems={"flex-end"} columnGap={2}>
							<IssueNumberInput branchFolder={sourceBranch && sourceBranch.value ? getBranchFolderById(sourceBranch.value) : null} />
						</Flex>
					</Flex>
					<Flex columnGap={2} height={"auto"}>
						<FormControl width={commitOptions?.useIssuePerFolder ? "50%" : "100%"} required>
							<FormLabel>Commit Message</FormLabel>
							<Textarea placeholder={"Enter Commit Message"} height={"76%"} resize={"none"} onInput={handleCommitMessageChange} value={commitMessage} />
						</FormControl>

						{commitOptions?.useIssuePerFolder ? (
							sourceBranch?.value ? (
								<Flex width="50%" flexDir="column" rowGap={2}>
									{selectedBranchFolders.map((branchFolder) => (
										<IssueNumberInput key={branchFolder} branchFolder={branchFolder} />
									))}
								</Flex>
							) : (
								<Box width="50%" textAlign="center" m="auto">
									<Text fontSize="lg" fontWeight="600" color="yellow.500">
										Please select source branch first!
									</Text>
								</Box>
							)
						) : null}
					</Flex>
				</Box>
				<Box pt={8}>
					<Tooltip label={sourceBranch?.value ? "Auto Fill Message" : "Please select source branch first!"} showArrow placement="bottom-end">
						<IconButton colorPalette={"yellow"} aria-label="Auto Fill Message" size="md" onClick={() => openMessageAutoFillModal()} icon={<ExternalLinkIcon />} disabled={!sourceBranch?.value} />
					</Tooltip>
				</Box>
			</Flex>
		</Box>
	);
}
