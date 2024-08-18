import { RepeatIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Icon, Tooltip } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { MdCloudUpload } from "react-icons/md";
import { useApp } from "../AppContext";
import useNotifications from "../hooks/useNotifications";

export default function FooterSectionCommit({ openCommitModal }) {
	const { setShowCommitView, selectedLocalChanges, sourceBranch, issueNumber, commitMessage, setSocketPayload, selectedBranches } = useApp();
	const { RaiseClientNotificaiton } = useNotifications();

	const performCommit = useCallback(() => {
		// Check if the source branch is selected
		if (!sourceBranch) {
			RaiseClientNotificaiton("Please select the source branch to proceed!", "error");
			return;
		}

		// Check if the issue number and commit message is provided
		if (!issueNumber || commitMessage === "") {
			RaiseClientNotificaiton("Please provide the issue number and the commit message to proceed!", "error");
			return;
		}

		// 16/07/2024 AC: Commented this validation logic to allow users to commit without selecting files from the source branch for added flexibility.
		// if (!selectedLocalChanges.map((file) => file.branchId).includes(sourceBranch.value)) {
		// 	RaiseClientNotificaiton("Please select at least 1 file from the source branch to proceed!", "error");
		// 	return;
		// }

		setSocketPayload({ sourceBranch: selectedBranches.find((row) => row.id == sourceBranch.value), issueNumber: issueNumber.value, commitMessage, filesToProcess: selectedLocalChanges });
		openCommitModal();
	}, [sourceBranch, issueNumber, commitMessage, RaiseClientNotificaiton, selectedLocalChanges, selectedBranches]);

	return (
		<Box>
			<Flex columnGap={2} justifyContent={"center"}>
				<Button onClick={() => setShowCommitView(false)} leftIcon={<RepeatIcon />} colorScheme={"yellow"}>
					Refresh Process
				</Button>
				<Tooltip label={"Select at least 1 file"} hasArrow isDisabled={selectedLocalChanges.length > 0}>
					<Button onClick={performCommit} leftIcon={<Icon as={MdCloudUpload} />} colorScheme={"yellow"} isDisabled={selectedLocalChanges.length < 1}>
						Commit {selectedLocalChanges.length > 0 ? `${selectedLocalChanges.length} File` : ""}{selectedLocalChanges.length > 1 ? "s" : ""}
					</Button>
				</Tooltip>
			</Flex>
		</Box>
	);
}
