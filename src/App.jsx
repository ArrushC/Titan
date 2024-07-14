import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Flex, Heading } from "@chakra-ui/react";
import Header from "./components/Header";
import SectionBranches from "./components/SectionBranches";
import SectionCommit from "./components/SectionCommit";
import { useApp } from "./AppContext";
import useNotifications from "./hooks/useNotifications";

function App() {
	const { isCommitMode, selectedBranches, configurableRowData, config } = useApp();
	const { RaiseClientNotificaiton } = useNotifications();

	useEffect(() => {
		window.electron.onAppClosing((event) => {
			RaiseClientNotificaiton("App is closing, performing cleanup...", "info", 0);
			window.electron.quitApp();
		});

		return () => {
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
					<SectionBranches />
				</Box>
				{!isCommitMode ? (
					<></>
				) : (
					<Box id="sectionCommit">
						<Heading as={"h2"} size={"lg"} noOfLines={1} mb={4} className="pulse-animation">
							Committing {selectedBranches.length == configurableRowData.length ? "All" : `${selectedBranches.length}/${configurableRowData.length}`} Branch{selectedBranches.length == 1 ? "" : "es"}
						</Heading>
						<SectionCommit />
					</Box>
				)}
			</Flex>
		</Box>
	);
}

export default App;
