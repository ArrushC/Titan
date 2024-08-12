import { Box, Button, Flex, Heading, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Tooltip, Text, Input, IconButton } from "@chakra-ui/react";
import React, { useCallback } from "react";
import TableLogs from "./TableLogs";
import { RepeatIcon } from "@chakra-ui/icons";
import useStoreSVNLogs from "../hooks/useStoreSVNLogs";

export default function ModalMessageAutoFill({ isModalOpen, closeModal }) {
	const { rowDataLogs, quickFilterLogsText, onQuickFilterLogsInputChanged, refreshLogs, areLogsFetched } = useStoreSVNLogs();

	const disableSelect = false;
	const handleSelect = useCallback(() => {}, []);

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
						{!areLogsFetched ? (
							<Flex justifyContent={"center"} alignItems={"center"} height={"100%"}>
								<Text>Loading logs...</Text>
							</Flex>
						) : (
							<Box>
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
								<TableLogs rowDataLogs={rowDataLogs} quickFilterLogsText={quickFilterLogsText} />
							</Box>
						)}
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
