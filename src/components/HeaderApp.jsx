import { CloseIcon } from "@chakra-ui/icons";
import { chakra, Flex, Heading, IconButton, useColorMode } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { FaRegSquare, FaWindowMinimize } from "react-icons/fa6";

export default function HeaderApp() {
	if (!window.electron) return <></>;

	const { colorMode } = useColorMode();

	const handleMinimizeWindow = useCallback(() => {
		window.electron.minimizeWindow();
	}, []);

	const handleMaximizeWindow = useCallback(() => {
		window.electron.maximizeWindow();
	}, []);

	const handleCloseWindow = useCallback(() => {
		window.electron.closeWindow();
	}, []);

	return (
		<chakra.header w={"100%"} position={"fixed"} bgColor={colorMode === "light" ? "cornsilk" : "#121212"} className="titanHead" zIndex={9999999} top={0}>
			<Flex justifyContent={"space-between"} alignItems={"center"} p={2} position={"static"}>
				<Heading as={"h6"} size={"sm"} noOfLines={1} className={"animation-fadein-left-forward"}>
					Titan
				</Heading>
				<Flex alignItems={"center"} columnGap={2} flexWrap={"nowrap"} wrap={"nowrap"}>
					<IconButton aria-label="Minimize" size="xs" icon={<FaWindowMinimize />} onClick={handleMinimizeWindow} colorScheme="gray" _hover={{ bg: "#FAF089", color: "#1A202C" }} />
					<IconButton aria-label="Maximize" size="xs" icon={<FaRegSquare />} onClick={handleMaximizeWindow} colorScheme="gray" _hover={{ bg: "#FAF089", color: "#1A202C" }} />
					<IconButton aria-label="Close" size="xs" icon={<CloseIcon />} onClick={handleCloseWindow} colorScheme="gray" _hover={{ bg: "#FEB2B2", color: "#1A202C" }} />
				</Flex>
			</Flex>
		</chakra.header>
	);
}
