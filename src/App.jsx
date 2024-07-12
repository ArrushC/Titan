import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Flex, Heading } from "@chakra-ui/react";
import Header from "./components/Header";
import BranchTable from "./components/BranchTable";
import CommitRegion from "./components/CommitRegion";
import { useApp } from "./AppContext";
import { RaiseClientNotificaiton } from "./utils/ChakraUI";

function App() {
	const { toast, isCommitMode, selectedBranches, configurableRowData, config } = useApp();

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
					{config?.branches && config?.branches.length < 1 ? (
						<Heading as={"h2"} size={"lg"} noOfLines={1} mb={4} className="pulse-animation">
							To Get Started, Add SVN Branches 👇
						</Heading>
					) : (
						<></>
					)}
					<BranchTable />
				</Box>
				{!isCommitMode ? (
					<></>
				) : (
					<Box id="commitRegion">
						<Heading as={"h2"} size={"lg"} noOfLines={1} mb={4} className="pulse-animation">
							Committing {selectedBranches.length == configurableRowData.length ? "All" : `${selectedBranches.length}/${configurableRowData.length}`} Branch{selectedBranches.length == 1 ? "" : "es"}
						</Heading>
						<CommitRegion />
					</Box>
				)}
			</Flex>
		</Box>
	);
}

export default App;
