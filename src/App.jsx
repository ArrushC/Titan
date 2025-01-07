import React, { useEffect } from "react";
import { Box, Flex, Heading, Image } from "@chakra-ui/react";
import Header from "./components/Header.jsx";
import SectionBranches from "./components/SectionBranches.jsx";
import SectionCommit from "./components/SectionCommit.jsx";
import useNotifications from "./hooks/useNotifications.jsx";
import DialogTitanUpdate from "./components/DialogTitanUpdate.jsx";
import HeaderApp from "./components/HeaderApp.jsx";
import { Toaster } from "./components/ui/toaster.jsx";
import { BranchesProvider } from "./ContextBranches.jsx";
import { CommitProvider } from "./ContextCommit.jsx";
import { useApp } from "./ContextApp.jsx";
import Logo from "./assets/Titan.png";

function App() {
	const appClosing = useApp((ctx) => ctx.appClosing);
	const { RaiseClientNotificaiton } = useNotifications();

	useEffect(() => {
		if (window.electron) {
			window.electron.onAppClosing(() => {
				RaiseClientNotificaiton("App is closing, performing cleanup...", "warning", 0);

				// TODO Perform any necessary cleanup in the renderer process...

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
			{!appClosing ? (
				<Box p={10} overflowY={"auto"} className="titanBody">
					<Header />
					<DialogTitanUpdate />
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
				</Box>
			) : (
				<Flex alignItems="center" justifyContent="center" className="titanBody" h="100%" flexDirection="column" gap={60}>
					<Image src={Logo} alt="Titan Logo" boxSize="256px" borderRadius="full" userSelect="none" boxShadowColor={"yellow.fg"} boxShadow="0px 0px 256px 24px var(--shadow-color)" filter="auto" brightness="110%" saturate="120%" />

					<Heading as="h1" size="4xl" className="animation-pulse" lineHeight="1.4" fontWeight={900} color="yellow.fg" textAlign={"center"}>
						App is closing...<br/>Please wait.
					</Heading>
				</Flex>
			)}
		</Box>
	);
}

export default App;
