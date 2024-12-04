import { RepeatIcon } from "@chakra-ui/icons";
import { Box, Flex, IconButton, Input, Tooltip, Text, List, ListItem, ListIcon, CircularProgress, CircularProgressLabel } from "@chakra-ui/react";
import React from "react";
import useStoreSVNLogs from "../hooks/useStoreSVNLogs";
import TableLogs from "./TableLogs";
import { branchString } from "../utils/CommonConfig";
import { MdDirectionsRun, MdCheckCircle } from "react-icons/md";
import { useApp } from "../ContextApp.jsx";

export default function FilterableTableLogs({ setAutoFillSelection = false, isAutofill = false }) {
	const { selectedBranches, logData} = useApp();
	const { rowDataLogs, quickFilterLogsText, onQuickFilterLogsInputChanged, refreshLogs, areLogsFetched } = useStoreSVNLogs();

	return areLogsFetched ? (
		<Box h={"100%"}>
			<Flex mb={4} width={"100%"} alignItems={"center"} columnGap={4}>
				<Flex alignItems={"center"} width={"100%"}>
					<Text mr={2} fontWeight={"600"} whiteSpace={"nowrap"}>
						Quick Filter:
					</Text>
					<Input placeholder="Type to search..." onInput={onQuickFilterLogsInputChanged} width={"100%"} />
				</Flex>
				<Box>
					<Tooltip label={"Refresh"} showArrow>
						<IconButton onClick={refreshLogs} icon={<RepeatIcon />} colorPalette={"yellow"} aria-label="Refresh" />
					</Tooltip>
				</Box>
			</Flex>
			<TableLogs rowDataLogs={rowDataLogs} quickFilterLogsText={quickFilterLogsText} setAutoFillSelection={setAutoFillSelection} isAutofill={isAutofill} />
		</Box>
	) : (
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
	);
}
