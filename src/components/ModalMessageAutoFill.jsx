import { Box, Button, Heading, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Tooltip, Tabs, TabList, Tab, TabPanels, TabPanel } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import _ from "lodash";
import FilterableTableLogs from "./FilterableTableLogs";
import FilterableTableTrello from "./FilterableTableTrello";
import { useApp } from "../AppContext";
import useConfigUtilities from "../hooks/useConfigUtilities";

export default function ModalMessageAutoFill({ isModalOpen, closeModal }) {
	const { setSourceBranch, branchOptions, setIssueNumber, setCommitMessage, setPostCommitData } = useApp();
	const { getBranchFolderById } = useConfigUtilities();

	const [tabIndex, setTabIndex] = useState(0);
	const [autofillSelection, setAutoFillSelection] = useState([null, null]);
	const [disableSelect, setDisableSelect] = useState(true);

	const handleTabIndexChange = useCallback(
		(index) => {
			setTabIndex(index);

			// Clear the selection of the other tab but keep the current selection
			if (index === 0) setAutoFillSelection((currAutoFillSelection) => [currAutoFillSelection[0], null]);
			else setAutoFillSelection((currAutoFillSelection) => [null, currAutoFillSelection[1]]);
		},
		[setTabIndex]
	);

	const setSVNLogsSelection = useCallback(
		(logs) => {
			setAutoFillSelection((currAutoFillSelection) => [logs, ...currAutoFillSelection.slice(1)]);
		},
		[setAutoFillSelection]
	);

	const setTrelloSelection = useCallback(
		(trello) => {
			setAutoFillSelection((currAutoFillSelection) => [currAutoFillSelection[0], trello]);
		},
		[setAutoFillSelection]
	);

	const handleSelect = useCallback(() => {
		console.debug("Selected tab index:", tabIndex);
		console.debug("Selected autofill selection:", JSON.stringify(autofillSelection, null, 4));

		let selection = autofillSelection[tabIndex];

		if (tabIndex === 0) {
			const message = selection.message;

			const sourceBranchId = selection.branchId;
			const issueNumMatch = message.match(/\s*(Issue)*\s*(\d+)\s*/);
			const issueNumber = issueNumMatch ? issueNumMatch[2] : null;
			const formattedMessage = message.replace(/\s*(Issue)*\s*(\d+)?\s*(\([^\)]+\))*\s?:?\s*/, "");

			if (sourceBranchId) setSourceBranch(branchOptions.find((option) => option.value === sourceBranchId));
			if (issueNumber)
				setIssueNumber((currIssueNumber) => ({
					...currIssueNumber,
					[getBranchFolderById(selection.branchId)]: issueNumber,
				}));
			if (formattedMessage.trim() !== "") setCommitMessage(formattedMessage);
		} else {
			const cardName = selection.name;

			const issueNumMatch = cardName.match(/\s*(Issue)*\s*(\d+)\s*/);
			const issueNumber = issueNumMatch ? issueNumMatch[2] : null;
			const formattedMessage = cardName.replace(/\s*(Issue)*\s*(\d+)/, "");

			if (issueNumber) setIssueNumber((currIssueNumber) => Object.fromEntries(Object.keys(currIssueNumber).map((key) => [key, issueNumber])));
			if (formattedMessage.trim() !== "") setCommitMessage(formattedMessage);

			setPostCommitData({ type: "trello", data: selection });
		}
		closeModal();
	}, [tabIndex, autofillSelection, closeModal]);

	useEffect(() => {
		setDisableSelect(!(autofillSelection.length == 2 && (autofillSelection[0] || autofillSelection[1])));
	}, [autofillSelection]);

	useEffect(() => {
		setAutoFillSelection([null, null]);
		setTabIndex(0);
	}, [isModalOpen]);

	return (
		<Modal isOpen={isModalOpen} onClose={closeModal} isCentered motionPreset="slideInBottom" scrollBehavior="inside" size="xl" closeOnOverlayClick={true}>
			<ModalOverlay />
			<ModalContent maxH={"95%"} maxW="95%">
				<ModalHeader>
					<Heading as={"h2"} size={"lg"}>
						Autofill Commit Message
					</Heading>
				</ModalHeader>
				<ModalCloseButton size={"lg"} />
				<ModalBody>
					<Box height={"70vh"}>
						<Tabs variant={"solid-rounded"} colorScheme="yellow" defaultIndex={0} isLazy={true} h={"100%"} onChange={(index) => handleTabIndexChange(index)}>
							<TabList>
								<Tab>SVN Logs</Tab>
								<Tab>Trello</Tab>
							</TabList>
							<TabPanels h={"90%"}>
								<TabPanel px={0} pb={0} h={"100%"}>
									<FilterableTableLogs setAutoFillSelection={setSVNLogsSelection} isAutofill={true} />
								</TabPanel>
								<TabPanel px={0} pb={0} h={"100%"}>
									<FilterableTableTrello setAutoFillSelection={setTrelloSelection} />
								</TabPanel>
							</TabPanels>
						</Tabs>
					</Box>
				</ModalBody>
				<ModalFooter>
					<Button mr={3} onClick={() => closeModal()}>
						Cancel
					</Button>
					<Tooltip hasArrow label={"Please select exactly one row!"} placement={"top-start"} isDisabled={!disableSelect}>
						<Button colorScheme="yellow" onClick={handleSelect} isDisabled={disableSelect}>
							Select
						</Button>
					</Tooltip>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
