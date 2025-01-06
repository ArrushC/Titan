import React, { useCallback } from "react";
import { Button } from "./ui/button.jsx";
import { useCommit } from "../ContextCommit.jsx";
import useNotifications from "../hooks/useNotifications";
import useSocketEmits from "../hooks/useSocketEmits.jsx";
import { useApp } from "../ContextApp.jsx";

export default function ButtonProcessCommit() {
	const selectedBranchProps = useApp((ctx) => ctx.selectedBranchProps);
	const isCommitMode = useCommit((ctx) => ctx.isCommitMode);
	const issueNumber = useCommit((ctx) => ctx.issueNumber);
	const sourceBranch = useCommit((ctx) => ctx.sourceBranch);
	const sourceIssueNumber = useCommit((ctx) => ctx.sourceIssueNumber);
	const commitMessage = useCommit((ctx) => ctx.commitMessage);
	const trelloData = useCommit((ctx) => ctx.trelloData);
	const selectedModifiedChanges = useCommit((ctx) => ctx.selectedModifiedChanges);
	const isProcessCommit = useCommit((ctx) => ctx.isProcessCommit);
	const setIsProcessCommit = useCommit((ctx) => ctx.setIsProcessCommit);
	const setCommitPayload = useCommit((ctx) => ctx.setCommitPayload);
	const { emitCommitPayload } = useSocketEmits();
	const { RaiseClientNotificaiton } = useNotifications();

	const handleProcessCommit = useCallback(() => {
		console.debug("Processing commit for selected files: ", selectedModifiedChanges);

		const hasFilledIssueNumbers = Object.values(issueNumber).every((issue) => issue && issue !== "");
		const hasFilledCommitMessage = commitMessage && commitMessage.trim() !== "";
		if (!hasFilledIssueNumbers || !hasFilledCommitMessage) {
			const messageString = !hasFilledIssueNumbers && !hasFilledCommitMessage ? "issue number and commit message" : !hasFilledIssueNumbers ? "issue number" : "commit message";
			RaiseClientNotificaiton(`Please provide the ${messageString} to proceed!`, "error");
			return;
		}

		setIsProcessCommit(true);

		const commitPayload = {
			issueNumber,
			sourceBranch,
			sourceIssueNumber,
			commitMessage,
			selectedModifiedChanges,
			selectedBranchProps,
		};

		setCommitPayload({
			...commitPayload,
			trelloData
		});
		emitCommitPayload(commitPayload);
	}, [selectedModifiedChanges, issueNumber, sourceBranch, sourceIssueNumber, commitMessage, selectedBranchProps, RaiseClientNotificaiton]);

	return (
		<Button onClick={() => handleProcessCommit()} colorPalette={"yellow"} disabled={Object.keys(selectedModifiedChanges).length < 1 || (isCommitMode && isProcessCommit)}>
			Commit
		</Button>
	);
}
