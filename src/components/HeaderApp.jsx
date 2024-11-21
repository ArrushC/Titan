import { chakra, Flex, Heading, IconButton } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { FaRegSquare, FaWindowMinimize } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import { VscChromeMinimize } from "react-icons/vsc";

export default function HeaderApp() {
	if (!window.electron) return <></>;

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
		<chakra.header w={"100%"} position={"fixed"} bgColor={"blackAlpha"} className="titanHead" zIndex={9999999} top={0}>
			<Flex justifyContent={"space-between"} alignItems={"center"} p={0} position={"static"}>
				<Heading as={"h6"} size={"sm"} fontWeight={700} lineClamp={1} p={1} className={"animation-fadein-left-forward"} userSelect={"none"}>
					Titan
				</Heading>
				<Flex alignItems={"center"} columnGap={2} flexWrap={"nowrap"} wrap={"nowrap"} h={"28px"}>
					<IconButton
						aria-label="Minimize"
						onClick={handleMinimizeWindow}
						variant={"ghost"}
						colorPalette="gray"
						_hover={{ bg: "#FAF089", color: "#1A202C" }}
						h={"28px"}
						rounded={"none"}
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
						variant={"ghost"}
						colorPalette="gray"
						_hover={{ bg: "#FAF089", color: "#1A202C" }}
						h={"28px"}
						rounded={"none"}
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
						variant={"ghost"}
						colorPalette="gray"
						_hover={{ bg: "#FEB2B2", color: "#1A202C" }}
						h={"28px"}
						rounded={"none"}
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
