import React, { useEffect } from "react";
import { Box, Flex } from "@chakra-ui/react";
import Header from "./components/Header.jsx";
import SectionBranches from "./components/SectionBranches.jsx";
// import SectionCommit from "./components/SectionCommit.jsx";
import { useApp } from "./AppContext.jsx";
import useNotifications from "./hooks/useNotifications.jsx";
import DialogBranchesLog from "./components/DialogBranchesLog.jsx";
import AlertUpdateTitan from "./components/AlertUpdateTitan.jsx";
import HeaderApp from "./components/HeaderApp.jsx";
import { Toaster } from "./components/ui/toaster.jsx";

function App() {
	const { isCommitMode, selectedBranches, configurableRowData } = useApp();
	const { RaiseClientNotificaiton } = useNotifications();

	useEffect(() => {
		if (window.electron) {
			window.electron.onAppClosing(() => {
				RaiseClientNotificaiton("App is closing, performing cleanup...", "info", 0);

				// Perform any necessary cleanup in the renderer process
				// ...

				window.electron.fireShutdownComplete();
			});

			return () => {
				window.electron.removeAppClosingListener();
			};
		} else {
			console.warn("Electron specific logic is not available in browser mode.");
		}
	}, []);

	return (
		<Box className={"titanContainer"} h={"calc(100vh)"}>
			<Toaster />
			<HeaderApp />
			<Box p={10} overflowY={"auto"} className="titanBody">
				<Header />
				<AlertUpdateTitan />
				<Flex rowGap={4} flexDirection={"column"}>
					<Box>
						<SectionBranches />
					</Box>
					{/* <Collapse in={isCommitMode} animateOpacity>
						<Box id="sectionCommit">
							<Heading as={"h2"} size={"lg"} lineClamp={1} mb={4} className="animation-pulse" lineHeight={"1.4"}>
								Committing {selectedBranches.length == configurableRowData.length ? "All" : `${selectedBranches.length}/${configurableRowData.length}`} Branch{selectedBranches.length == 1 ? "" : "es"}
							</Heading>
							<SectionCommit />
						</Box>
					</Collapse> */}
				</Flex>
				<DialogBranchesLog />
			</Box>
		</Box>
	);
}

export default App;
