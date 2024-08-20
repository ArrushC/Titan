import { Heading, Icon, IconButton, Image, Tooltip, Wrap, WrapItem } from "@chakra-ui/react";
import React, { useCallback, useEffect } from "react";
import Logo from "../assets/Titan.png";
import { useApp } from "../AppContext";
import { MdBrowserUpdated, MdCode, MdCodeOff } from "react-icons/md";
import useSocketEmits from "../hooks/useSocketEmits";
import { LuFileCog } from "react-icons/lu";
import { FaInfo } from "react-icons/fa6";
import useNotifications from "../hooks/useNotifications";

export default function Header() {
	const { config, isDebug, setIsDebug } = useApp();
	const { emitOpenConfig } = useSocketEmits();
	const { RaiseClientNotificaiton } = useNotifications();

	const handleCheckForUpdates = useCallback(() => {
		window.electron.checkForUpdates().then((result) => {
			console.debug("Check for updates result: ", result);
		});
		window.electron.on("update-not-available", () => {
			RaiseClientNotificaiton("Titan is up to date", "info", 3000);
			window.electron.removeAllListeners("update-not-available");
		});
	}, [RaiseClientNotificaiton]);

	const handleGetAppVersion = useCallback(() => {
		window.electron.getAppVersion().then((version) => {
			RaiseClientNotificaiton(`Application Version: v${version}`, "info", 2000);
		});
	}, [RaiseClientNotificaiton]);

	return (
		<Wrap my={5} spacingY={5} justify={"space-between"}>
			<WrapItem alignItems="center">
				<Image src={Logo} alt="Titan Logo" boxSize="100px" mr={5} borderRadius={"full"} />
				<Heading as={"h2"} size={"2xl"} noOfLines={1} className={"animation-fadein-forward"}>
					Welcome back
				</Heading>
				<Heading as={"h2"} size={"2xl"} noOfLines={1} p={2} className={"animation-handwave"}>
					👋
				</Heading>
			</WrapItem>
			<WrapItem alignItems={"center"} columnGap={2}>
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
			</WrapItem>
		</Wrap>
	);
}
