import { Box, Skeleton, Tab, TabList, TabPanel, TabPanels, Tabs, Text, Tooltip, useDisclosure } from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../AppContext";
import { branchPathFolder, branchString } from "../utils/CommonConfig";
import ModalCommit from "./ModalCommit";
import PanelUpdates from "./PanelUpdates";
import PanelLocalChanges from "./PanelLocalChanges";
import PanelUntrackedChanges from "./PanelUntrackedChanges";
import FormSVNMessage from "./FormSVNMessage";
import FooterSectionCommit from "./FooterSectionCommit";
import ModalMessageAutoFill from "./ModalMessageAutoFill";
import OptionsCommit from "./OptionsCommit";

export default function SectionCommit() {
	const { setIsCommitMode, selectedBranchStatuses, showCommitView, setShowCommitView, selectedBranches, configurableRowData } = useApp();

	// Form Data Fields
	const [fileUpdates, setFileUpdates] = useState({});
	const [rowDataLocalChanges, setRowDataLocalChanges] = useState([]);
	const [rowDataUntrackedChanges, setRowDataUntrackedChanges] = useState([]);

	// Modals
	const { open: isCommitModalOpen, onOpen: openCommitModal, onClose: closeCommitModal } = useDisclosure();
	const { open: isMessageAutoFillModalOpen, onOpen: openMessageAutoFillModal, onClose: closeMessageAutoFillModal } = useDisclosure();

	const defaultColDefsCommit = useMemo(
		() => ({
			resizable: true,
			wrapText: true,
			autoHeight: true,
			filter: true,
			suppressMovable: true,
			editable: false,
			wrapHeaderText: true,
			autoHeaderHeight: true,
		}),
		[]
	);

	// Fetch the branch status for each selected branch
	useEffect(() => {
		if (selectedBranches.length < 1 || showCommitView) {
			if (selectedBranches.length < 1) setIsCommitMode(false);
			return;
		}
		setFileUpdates({});
	}, [selectedBranches, showCommitView]);

	useEffect(() => {
		if (selectedBranchStatuses.length === selectedBranches.length) {
			selectedBranchStatuses.forEach((branchStatus) => {
				let branchId = branchStatus.id;
				let filesToCommit = branchStatus.status.filesToCommit;
				let filesToUpdate = branchStatus.status.filesToUpdate;

				const matchedSelectedRow = configurableRowData.find((row) => row.id === branchId);

				if (filesToUpdate.length > 0) {
					const matchedBranchString = branchString(matchedSelectedRow["Branch Folder"], matchedSelectedRow["Branch Version"], matchedSelectedRow["SVN Branch"]);
					setFileUpdates((prev) => {
						return { ...prev, [matchedBranchString]: [...(prev[matchedBranchString] || []), ...filesToUpdate] };
					});
				}

				// Excluding files which are common
				if (filesToCommit.length > 0) {
					const rowDataLocalChanges = filesToCommit.map((file) => {
						return {
							branchId: branchId,
							"Branch Folder": matchedSelectedRow["Branch Folder"],
							"Branch Version": matchedSelectedRow["Branch Version"],
							"SVN Branch": matchedSelectedRow["SVN Branch"],
							"Full Path": file.path,
							"File Path": `${branchPathFolder(branchStatus.status.branch)}\\${file.pathDisplay}`,
							"Local Status": file.wcStatus,
						};
					});

					setRowDataLocalChanges((prev) => [...prev, ...rowDataLocalChanges.filter((file) => !["unversioned", "missing", "external"].includes(file["Local Status"]))]);
					setRowDataUntrackedChanges((prev) => [...prev, ...rowDataLocalChanges.filter((file) => ["unversioned", "missing"].includes(file["Local Status"]))]);
				}
			});

			setShowCommitView(true);
		}
	}, [selectedBranchStatuses, selectedBranches, configurableRowData]);

	// Check if there are any changes
	const hasFileUpdates = Object.keys(fileUpdates).length > 0;
	const hasLocalChanges = rowDataLocalChanges.length > 0;
	const hasUntrackedChanges = rowDataUntrackedChanges.length > 0;
	const hasChanges = hasFileUpdates || hasLocalChanges || hasUntrackedChanges;

	return (
		<Box>
			<OptionsCommit />
			<Box mb={6}>
				<FormSVNMessage openMessageAutoFillModal={openMessageAutoFillModal} />
			</Box>
			<Skeleton isLoaded={showCommitView && hasChanges} startColor="yelow.500" endColor="yellow.500">
				<Tabs variant={"solid-rounded"} colorPalette="yellow" defaultIndex={hasFileUpdates ? 0 : hasLocalChanges ? 1 : 2} isLazy={false}>
					<TabList>
						<Tab disabled={!hasFileUpdates}>
							<Tooltip label={"No files to update!"} showArrow disabled={hasFileUpdates}>
								Files to Update
							</Tooltip>
						</Tab>
						<Tab disabled={!hasLocalChanges}>
							<Tooltip label={"No files to commit!"} showArrow disabled={hasLocalChanges}>
								Local Changes
							</Tooltip>
						</Tab>
						<Tab disabled={!hasUntrackedChanges}>
							<Tooltip label={"No unversioned/missing files!"} showArrow disabled={hasUntrackedChanges}>
								Untracked Changes
							</Tooltip>
						</Tab>
					</TabList>
					<TabPanels>
						<TabPanel px={0}>
							<PanelUpdates fileUpdates={fileUpdates} />
						</TabPanel>
						<TabPanel px={0}>
							<PanelLocalChanges rowDataLocalChanges={rowDataLocalChanges} setRowDataLocalChanges={setRowDataLocalChanges} defaultColDefsCommit={defaultColDefsCommit} />
						</TabPanel>
						<TabPanel px={0}>
							<PanelUntrackedChanges rowDataUntrackedChanges={rowDataUntrackedChanges} setRowDataUntrackedChanges={setRowDataUntrackedChanges} defaultColDefsCommit={defaultColDefsCommit} />
						</TabPanel>
					</TabPanels>
				</Tabs>
			</Skeleton>
			{showCommitView && !hasChanges ? (
				<Text mt={4} className="animation-pulse" fontWeight={600} textAlign={"center"}>
					No changes have been spotted!
					<br />
					Please use the refresh button 👇 if you have recently made a change
				</Text>
			) : (
				<></>
			)}
			<Box mt={6}>
				<FooterSectionCommit openCommitModal={openCommitModal} />
			</Box>
			<ModalCommit isModalOpen={isCommitModalOpen} closeModal={closeCommitModal} />
			<ModalMessageAutoFill isModalOpen={isMessageAutoFillModalOpen} closeModal={closeMessageAutoFillModal} />
		</Box>
	);
}
