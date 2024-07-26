import React, { useCallback, useEffect, useState } from "react";
import { useApp } from "../AppContext";
import { Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay, ListItem, Text, Box, ListIcon, List, CircularProgress, CircularProgressLabel, Flex, Input, IconButton, Tooltip } from "@chakra-ui/react";
import useSocketEmits from "../hooks/useSocketEmits";
import { MdCheckCircle, MdDirectionsRun } from "react-icons/md";
import { branchString } from "../utils/CommonConfig";
import TableLogs from "./TableLogs";
import { RepeatIcon } from "@chakra-ui/icons";

export default function SectionBranchLog() {
	const { showSelectedBranchesLog, setShowSelectedBranchesLog, selectedBranches, socket } = useApp();
	const { emitLogSelected } = useSocketEmits();
	const [logData, setLogData] = React.useState([]);
	const rowDataLogs = logData.map((logData) => logData.logs).flat();

	const [quickFilterLogsText, setQuickFilterLogsText] = useState("");

	const onQuickFilterLogsInputChanged = useCallback(
		(e) => {
			setQuickFilterLogsText(e.target.value);
		},
		[setQuickFilterLogsText]
	);

	const refreshLogs = useCallback(() => {
		setLogData([]);
		emitLogSelected(selectedBranches);
	}, [selectedBranches]);

	useEffect(() => {
		setLogData([]);
	}, [showSelectedBranchesLog, selectedBranches]);

	useEffect(() => {
		if (!showSelectedBranchesLog) return;
		emitLogSelected(selectedBranches);
	}, [showSelectedBranchesLog]);

	useEffect(() => {
		const socketCallback = (data) => {
			setLogData((prevData) => [...prevData, data]);
		};

		socket?.on("svn-log-result", socketCallback);

		return () => socket?.off("svn-log-result", socketCallback);
	}, [socket]);

	return (
		<Drawer isOpen={showSelectedBranchesLog} onClose={() => setShowSelectedBranchesLog(false)} placement="left" size="full">
			<DrawerOverlay />
			<DrawerContent>
				<DrawerCloseButton size="lg" />
				<DrawerHeader>Selected Branches: SVN Log</DrawerHeader>
				<DrawerBody>
					<Box height={"100%"}>
						{logData.length != selectedBranches.length ? (
							<Box>
								<Box mb={4}>
									<Text fontWeight={600}>Showing SVN Log for the following branches:</Text>
									<List spacing={3}>
										{selectedBranches.map((branch) => {
											const isBranchLogged = logData.find((loggedBranch) => loggedBranch.id === branch.id);
											return (
												<ListItem key={branch.branchId} display={"flex"} alignItems={"center"}>
													<ListIcon w={30} h={30} as={!isBranchLogged ? MdDirectionsRun : MdCheckCircle} color={"yellow.500"} />
													{branchString(branch["Branch Folder"], branch["Branch Version"], branch["SVN Branch"])}
												</ListItem>
											);
										})}
									</List>
								</Box>
								<Flex justifyContent={"center"}>
									<CircularProgress value={(logData.length / selectedBranches.length) * 360} color="yellow.300" size="100px">
										<CircularProgressLabel>
											{logData.length} / {selectedBranches.length}
										</CircularProgressLabel>
									</CircularProgress>
								</Flex>
							</Box>
						) : (
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
								<TableLogs rowDataLogs={rowDataLogs} quickFilterLogsText={quickFilterLogsText} />
							</Box>
						)}
					</Box>
				</DrawerBody>
			</DrawerContent>
		</Drawer>
	);
}
