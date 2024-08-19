import { Flex, Heading, Icon, IconButton, Image, Tooltip } from "@chakra-ui/react";
import React, { useCallback } from "react";
import Logo from "../assets/Titan.png";
import { useApp } from "../AppContext";
import { MdBrowserUpdated, MdCode, MdCodeOff } from "react-icons/md";
import useSocketEmits from "../hooks/useSocketEmits";
import { LuFileCog } from "react-icons/lu";
import { FaInfo } from "react-icons/fa6";
import useNotifications from "../hooks/useNotifications";

export default function Header() {
	const { isDebug, setIsDebug } = useApp();
	const { emitOpenConfig } = useSocketEmits();
	const {RaiseClientNotificaiton} = useNotifications();

	const handleCheckForUpdates = useCallback(() => {
		RaiseClientNotificaiton("Checking for updates...", "info", 3000);
		window.electron.checkForUpdates().then((result) => {
			console.debug("Check for updates result: ", result);
		});
	}, [RaiseClientNotificaiton]);

	const handleGetAppVersion = useCallback(() => {
		window.electron.getAppVersion().then((version) => {
			RaiseClientNotificaiton(`Application Version: v${version}`, "info", 3000);
		});
	}, [RaiseClientNotificaiton]);

	return (
		<Flex justifyContent={"space-between"} mb={5}>
			<Flex alignItems="center">
				<Image src={Logo} alt="Titan Logo" boxSize="100px" mr={10} borderRadius={"full"} />
				<Heading as={"h1"} size={"3xl"} noOfLines={1}>
					Titan
				</Heading>
			</Flex>
			<Flex alignItems={"center"} columnGap={2}>
				<Tooltip label={`Current Debug Mode: ${isDebug ? "on" : "off"}`} hasArrow placement="left">
					<IconButton aria-label="Toggle Debug Mode" colorScheme={"yellow"} icon={!isDebug ? <Icon as={MdCodeOff} /> : <Icon as={MdCode} />} onClick={() => setIsDebug((prev) => !prev)} />
				</Tooltip>
				<Tooltip label={"Open configuration file"} hasArrow placement="bottom-start">
					<IconButton aria-label="Open configuration file" colorScheme={"yellow"} icon={<Icon as={LuFileCog} />} onClick={() => emitOpenConfig()} />
				</Tooltip>
				<Tooltip label={"Check for updates"} hasArrow placement="bottom-start" isDisabled={!window.electron}>
					<IconButton aria-label="Check for updates" colorScheme={"yellow"} icon={<Icon as={MdBrowserUpdated} />} onClick={handleCheckForUpdates} isDisabled={!window.electron} />
				</Tooltip>
				<Tooltip label={"Get App Version"} hasArrow placement="bottom-start" isDisabled={!window.electron}>
					<IconButton aria-label="Get App Version" colorScheme={"yellow"} icon={<Icon as={FaInfo} />} onClick={handleGetAppVersion} isDisabled={!window.electron} />
				</Tooltip>
			</Flex>
		</Flex>
	);
}
