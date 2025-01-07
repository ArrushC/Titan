import { chakra, Flex, Heading, IconButton, Image } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { FaRegSquare } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import { VscChromeMinimize } from "react-icons/vsc";
import Logo from "../assets/Titan.png";
import { useApp } from "../ContextApp";

export default function HeaderApp() {
	if (!window.electron) return <></>;

	const setAppClosing = useApp((ctx) => ctx.setAppClosing);
	const [appVersion, setAppVersion] = useState("");

	useEffect(() => {
		window.electron.getAppVersion().then((version) => {
			setAppVersion(`v${version}`);
		});
	});

	const handleMinimizeWindow = useCallback(() => {
		window.electron.minimizeWindow();
	}, []);

	const handleMaximizeWindow = useCallback(() => {
		window.electron.maximizeWindow();
	}, []);

	const handleCloseWindow = useCallback(() => {
		window.electron.closeWindow();
		setAppClosing(true);
	}, []);

	return (
		<chakra.header w="100%" position="fixed" bgColor={"yellow.400"} className="titanHead notMono" zIndex={9999999} top={0} overflow={"none"}>
			<Flex justifyContent="space-between" alignItems="center" p={0} position="static">
				<Flex alignItems={"center"} gapX={1} ms={1}>
					<Image src={Logo} alt="Titan Logo" boxSize="20px" borderRadius={"full"} userSelect={"none"} />
					<Heading as="h6" size="sm" fontWeight={700} lineClamp={1} p={1} className="animation-fadein-left-forward" userSelect="none" color="black">
						Titan {appVersion}
					</Heading>
				</Flex>
				<Flex alignItems="center" columnGap={2} flexWrap="nowrap" wrap="nowrap" h="28px" className="titanHeadButtons">
					<IconButton
						aria-label="Minimize"
						onClick={handleMinimizeWindow}
						variant="ghost"
						_hover={{ bg: "yellow.300", color: "black" }}
						color={"black"}
						h="28px"
						rounded="none"
						focusRing={"none"}
						focusVisibleRing={"none"}
						css={{
							_icon: {
								width: "5",
								height: "5",
							},
						}}>
						<VscChromeMinimize />
					</IconButton>
					<IconButton
						aria-label="Maximize"
						onClick={handleMaximizeWindow}
						variant="ghost"
						_hover={{ bg: "yellow.300", color: "black" }}
						color={"black"}
						h="28px"
						rounded="none"
						focusRing={"none"}
						focusVisibleRing={"none"}
						css={{
							_icon: {
								width: "3",
								height: "5",
							},
						}}>
						<FaRegSquare />
					</IconButton>
					<IconButton
						aria-label="Close"
						onClick={handleCloseWindow}
						variant="ghost"
						_hover={{ bg: "red.500", color: "white" }}
						color={"black"}
						h="28px"
						rounded="none"
						focusRing={"none"}
						focusVisibleRing={"none"}
						css={{
							_icon: {
								width: "5",
								height: "5",
							},
						}}>
						<IoMdClose />
					</IconButton>
				</Flex>
			</Flex>
		</chakra.header>
	);
}
