import { Box, Button, Flex, Heading, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Tooltip, Text, Input, IconButton } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { RepeatIcon } from "@chakra-ui/icons";
import useStoreSVNLogs from "../hooks/useStoreSVNLogs";
import _ from "lodash";
import TableLogs from "./TableLogs";

export default function ModalMessageAutoFill({ isModalOpen, closeModal }) {
	const { rowDataLogs, quickFilterLogsText, onQuickFilterLogsInputChanged, refreshLogs } = useStoreSVNLogs();

	const [rowDataLogsAutoFill, setRowDataLogsAutoFill] = useState([]);

	const [autofillSelection, setAutoFillSelection] = useState(null);
	const [disableSelect, setDisableSelect] = useState(true);
	const handleSelect = useCallback(() => {
		console.debug("Selected logs:", autofillSelection);
		console.warn("Nothing has been developed for this button yet.");
		closeModal();
	}, [closeModal]);

	useEffect(() => {
		setDisableSelect(autofillSelection && autofillSelection != null ? false : true);
	}, [autofillSelection]);

	useEffect(() => {
		setRowDataLogsAutoFill((currRowDataLogs) => {
			if (!_.isEqual(currRowDataLogs, rowDataLogs)) return rowDataLogs;
			return currRowDataLogs;
		});
	}, [rowDataLogs]);

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
						<Box height={"100%"}>
							<Flex mb={4} width={"100%"} alignItems={"center"} columnGap={4}>
								<Flex alignItems={"center"} width={"100%"}>
									<Text mr={2} fontWeight={"600"} whiteSpace={"nowrap"}>
										Quick Filter:
									</Text>
									<Input placeholder="Type to search..." onInput={onQuickFilterLogsInputChanged} width={"100%"} />
								</Flex>
								<Box>
									<Tooltip label={"Refresh"} hasArrow>
										<IconButton onClick={refreshLogs} icon={<RepeatIcon />} colorScheme={"yellow"} aria-label="Refresh" />
									</Tooltip>
								</Box>
							</Flex>
							<TableLogs rowDataLogs={rowDataLogsAutoFill} quickFilterLogsText={quickFilterLogsText} setAutoFillSelection={setAutoFillSelection} isAutofill={true} />
						</Box>
					</Box>
				</ModalBody>
				<ModalFooter>
					<Button mr={3} onClick={() => closeModal()}>
						Cancel
					</Button>
					<Tooltip hasArrow label={"Please select exactly one row!"} isDisabled={!disableSelect}>
						<Button colorScheme="yellow" onClick={handleSelect} isDisabled={disableSelect}>
							Select
						</Button>
					</Tooltip>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
