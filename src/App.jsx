import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Flex, Heading } from "@chakra-ui/react";
import Header from "./components/Header";
// import SectionBranches from "./components/SectionBranches";
// import SectionCommit from "./components/SectionCommit";
import { useApp } from "./AppContext";
import useNotifications from "./hooks/useNotifications";
// import SectionBranchLog from "./components/SectionBranchLog";
import AlertUpdateTitan from "./components/AlertUpdateTitan";
import HeaderApp from "./components/HeaderApp";
import { Toaster } from "./components/ui/toaster";

function App() {
	const { isCommitMode, selectedBranches, configurableRowData } = useApp();
	const { RaiseClientNotificaiton } = useNotifications();

	useEffect(() => {
		if (window.electron) {
			window.electron.onAppClosing(() => {
				RaiseClientNotificaiton("App is closing, performing cleanup...", "info", 0);
				window.electron.closeWindow();
			});

			return () => {
				window.electron.removeAppClosingListener();
			};
		} else {
			console.warn("Electron specific logic is not available in browser mode.");
		}
	}, []);

	return (
		<Box className={"titanBody"} h={"calc(100vh)"}>
			<Toaster />
			<HeaderApp />
			<Box p={10}>
				<Header />
				<AlertUpdateTitan />
				{/* <Flex rowGap={4} flexDirection={"column"}>
					<Box>
						<SectionBranches />
					</Box>
					<Collapse in={isCommitMode} animateOpacity>
						<Box id="sectionCommit">
							<Heading as={"h2"} size={"lg"} lineClamp={1} mb={4} className="animation-pulse" lineHeight={"1.4"}>
								Committing {selectedBranches.length == configurableRowData.length ? "All" : `${selectedBranches.length}/${configurableRowData.length}`} Branch{selectedBranches.length == 1 ? "" : "es"}
							</Heading>
							<SectionCommit />
						</Box>
					</Collapse>
				</Flex> */}
				{/* <SectionBranchLog /> */}
			</Box>
		</Box>
	);
}

export default App;
