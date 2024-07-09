import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Flex, Heading } from "@chakra-ui/react";
import Header from "./components/Header";
import BranchTable from "./components/BranchTable";
import { useBranchTableProps } from "./hooks/useBranchTableProps";
import CommitRegion from "./components/CommitRegion";
import { useCommitRegionProps } from "./hooks/useCommitRegionProps";
import { useApp } from "./AppContext";
import { RaiseClientNotificaiton } from "./utils/ChakraUI";

function App() {
	const { toast } = useApp();

	// For Branch Table
	const branchTableProps = useBranchTableProps();

	// For Options
	// To be added (including the component)

	// For making commits
	const commitRegionProps = useCommitRegionProps();

	useEffect(() => {
		window.electron.onAppClosing((event) => {
			RaiseClientNotificaiton(toast, "App is closing, performing cleanup...", "info", 0);

			// When done, tell the main process it's okay to quit
			window.electron.quitApp();
		});

		return () => {
			// Clean up the listener when the component unmounts
			window.electron.removeAppClosingListener();
		};
	}, []);

	return (
		<Box p={10}>
			<Header />
			<Flex rowGap={4} flexDirection={"column"}>
				<Box>
					<Heading as={"h2"} size={"lg"} noOfLines={1} mb={2}>
						Branch Table
					</Heading>
					<BranchTable {...branchTableProps} isCommitMode={commitRegionProps.isCommitMode} setIsCommitMode={commitRegionProps.setIsCommitMode} setBranchStatusRows={commitRegionProps.setBranchStatusRows} setShowFilesView={commitRegionProps.setShowFilesView} />
				</Box>
				{!commitRegionProps.isCommitMode ? (
					<></>
				) : (
					<Box id="commitRegion">
						<Heading as={"h2"} size={"lg"} noOfLines={1} mb={2}>
							Committing {branchTableProps.selectedRows.length == branchTableProps.configurableRowData.length ? "All" : `${branchTableProps.selectedRows.length}/${branchTableProps.configurableRowData.length}`} Branch{branchTableProps.selectedRows.length == 1 ? "" : "es"}
						</Heading>
						<CommitRegion {...commitRegionProps} selectedRows={branchTableProps.selectedRows} setSelectedRows={branchTableProps.setSelectedRows} />
					</Box>
				)}
			</Flex>
		</Box>
	);
}

export default App;
