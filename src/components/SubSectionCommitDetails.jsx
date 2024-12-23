import { chakra, Code, Flex, Link, Stack, Text } from "@chakra-ui/react";
import React, { useMemo, useEffect } from "react";
import { useApp } from "../ContextApp.jsx";
import FieldIssueNumber from "./FieldIssueNumber.jsx";
import FieldSourceBranch from "./FieldSourceBranch.jsx";
import FieldCommitMessage from "./FieldCommitMessage.jsx";
import { FieldLookup } from "./FieldLookup.jsx";
import { useCommit } from "../ContextCommit.jsx";
import { LuExternalLink } from "react-icons/lu";
import { MdError } from "react-icons/md";
import { FaTrello } from "react-icons/fa6";

export default function SubSectionCommitDetails() {
	const selectedBranchesData = useApp((ctx) => ctx.selectedBranchesData);
	const sourceBranch = useCommit((ctx) => ctx.sourceBranch);
	const sourceIssueNumber = useCommit((ctx) => ctx.sourceIssueNumber);
	const commitMessage = useCommit((ctx) => ctx.commitMessage);
	const trelloData = useCommit((ctx) => ctx.trelloData);
	const selectedFolders = useMemo(() => {
		return Array.from(selectedBranchesData.reduce((acc, branchRow) => acc.add(branchRow["Branch Folder"]), new Set()));
	}, [selectedBranchesData]);

	return (
		<Flex ms={9} flexDirection={"column"}>
			<Stack gap="6" maxW="8xl" css={{ "--field-label-width": "96px" }} flex={1}>
				<FieldLookup />
				{selectedFolders.map((branchFolder, i) => (
					<FieldIssueNumber key={branchFolder} branchFolder={branchFolder} />
				))}
				<FieldSourceBranch />
				<FieldCommitMessage />
			</Stack>

			<Flex flexDirection={"column"} mt={6} gap={2}>
				<Flex gap={3}>
					Your final commit message:{" "}
					<Code>
						Issue XYZ{sourceBranch.trim() !== "" ? ` (${sourceBranch.trim()}${sourceIssueNumber !== "" ? " #" + String(sourceIssueNumber) : ""})` : ""}:{" "}
						{commitMessage.trim() == ""
							? "Enter commit message above"
							: commitMessage
									.trim()
									.replace(/\s*\n+\s*/g, "; ")
									.replace(/[;\s]+$/, "")
									.trim()}
					</Code>
				</Flex>

				{trelloData?.name ? (
					<Flex gap={3}>
						Your selected Trello card:{" "}
						<Link onClick={() => window.open(trelloData.url)} display={"flex"} alignItems={"center"} width={"fit-content"}>
							<chakra.span color="yellow.fg" fontSize={"16px"}>
								<FaTrello />
							</chakra.span>
							{trelloData.name}
						</Link>
					</Flex>
				) : null}

				{trelloData?.id && (!trelloData.checklistIds?.length || !trelloData.checklists?.length || !trelloData.checklists?.every((cl) => cl?.id) || !trelloData.checklistIds?.every((id) => id)) ? (
					<Flex color={"red.focusRing"} alignItems={"center"} gap={3}>
						<chakra.span color="yellow.fg" fontSize={"16px"}>
							<MdError />
						</chakra.span>{" "}
						Your trello card is missing checklists, please try again.
					</Flex>
				) : null}
			</Flex>
		</Flex>
	);
}
