import { RepeatIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Icon, Tooltip } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { MdCloudUpload } from "react-icons/md";
import { useApp } from "../ContextApp.jsx";
import useNotifications from "../hooks/useNotifications";
import _ from "lodash";
import useConfigUtilities from "../hooks/useConfigUtilities";
import useCommitOptions from "../hooks/useCommitOptions";

export default function FooterSectionCommit({ openCommitModal }) {
	const { setShowCommitView, selectedLocalChanges, sourceBranch, issueNumber, commitMessage, setSocketPayload, configurableRowData, selectedBranches } = useApp();
	const { RaiseClientNotificaiton } = useNotifications();
	const commitOptions = useCommitOptions();
	const { selectedBranchFolders } = useConfigUtilities();

	const performRefresh = useCallback(() => {
		setShowCommitView(false);
	}, [setShowCommitView]);

	const performCommit = useCallback(() => {
		// Check if the source branch is selected
		if (!sourceBranch || sourceBranch.value === "") {
			RaiseClientNotificaiton("Please select the source branch to proceed!", "error");
			return;
		}

		const sourceBranchRow = configurableRowData.find((row) => row.id == sourceBranch.value);
		const hasFilledIssueNumbers = commitOptions?.useIssuePerFolder ? selectedBranchFolders.every((branchFolder) => issueNumber[branchFolder] && issueNumber[branchFolder] !== "") : true;
		const hasFilledSourceIssueNumber = commitOptions?.useIssuePerFolder ? !selectedBranches.some((branch) => branch["Branch Folder"] === sourceBranchRow["Branch Folder"]) || issueNumber[sourceBranchRow["Branch Folder"]] : issueNumber[sourceBranchRow["Branch Folder"]];

		// Check if the issue number and commit message is provided
		if (!issueNumber || _.isEmpty(issueNumber) || !hasFilledIssueNumbers || !hasFilledSourceIssueNumber) {
			RaiseClientNotificaiton("Please provide the issue number to proceed!", "error");
			return;
		}

		// Check if the commit message is provided
		if (!commitMessage || commitMessage.trim() === "") {
			RaiseClientNotificaiton("Please provide the commit message to proceed!", "error");
			return;
		}

		// 16/07/2024 AC: Commented this validation logic to allow users to commit without selecting files from the source branch for added flexibility.
		// if (!selectedLocalChanges.map((file) => file.branchId).includes(sourceBranch.value)) {
		// 	RaiseClientNotificaiton("Please select at least 1 file from the source branch to proceed!", "error");
		// 	return;
		// }

		setSocketPayload({ sourceBranch: sourceBranchRow, issueNumber: issueNumber, commitMessage, filesToProcess: selectedLocalChanges, commitOptions: commitOptions });
		openCommitModal();
	}, [RaiseClientNotificaiton, sourceBranch, configurableRowData, commitOptions, selectedBranchFolders, issueNumber, selectedBranches, commitMessage, selectedLocalChanges]);

	return (
		<Box>
			<Flex columnGap={2} justifyContent={"center"}>
				<Button onClick={performRefresh} leftIcon={<RepeatIcon />} colorPalette={"yellow"}>
					Refresh Process
				</Button>
				<Tooltip label={"Select at least 1 file"} showArrow disabled={selectedLocalChanges.length > 0}>
					<Button onClick={performCommit} leftIcon={<Icon as={MdCloudUpload} />} colorPalette={"yellow"} disabled={selectedLocalChanges.length < 1}>
						Commit {selectedLocalChanges.length > 0 ? `${selectedLocalChanges.length} File` : ""}
						{selectedLocalChanges.length > 1 ? "s" : ""}
					</Button>
				</Tooltip>
			</Flex>
		</Box>
	);
}
