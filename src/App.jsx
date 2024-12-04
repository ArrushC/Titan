import React, { useEffect } from "react";
import { Box, Flex } from "@chakra-ui/react";
import Header from "./components/Header.jsx";
import SectionBranches from "./components/SectionBranches.jsx";
import SectionCommit from "./components/SectionCommit.jsx";
import useNotifications from "./hooks/useNotifications.jsx";
import DialogBranchesLog from "./components/DialogBranchesLog.jsx";
import AlertUpdateTitan from "./components/AlertUpdateTitan.jsx";
import HeaderApp from "./components/HeaderApp.jsx";
import { Toaster } from "./components/ui/toaster.jsx";
import { BranchesProvider } from "./ContextBranches.jsx";
import { CommitProvider } from "./ContextCommit.jsx";

function App() {
	const { RaiseClientNotificaiton } = useNotifications();

	useEffect(() => {
		if (window.electron) {
			window.electron.onAppClosing(() => {
				RaiseClientNotificaiton("App is closing, performing cleanup...", "warning", 0);

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
				<Flex rowGap={8} flexDirection={"column"}>
					<Box>
						<BranchesProvider>
							<SectionBranches />
						</BranchesProvider>
					</Box>
					<Box>
						<CommitProvider>
							<SectionCommit />
						</CommitProvider>
					</Box>
				</Flex>
				<DialogBranchesLog />
			</Box>
		</Box>
	);
}

export default App;
