import { Heading, Icon, IconButton, Image, Link, Tooltip, useColorMode, Wrap, WrapItem } from "@chakra-ui/react";
import React, { useCallback } from "react";
import Logo from "../assets/Titan.png";
import { useApp } from "../AppContext";
import { MdBrowserUpdated, MdCode, MdCodeOff, MdDarkMode, MdSunny } from "react-icons/md";
import useSocketEmits from "../hooks/useSocketEmits";
import { LuFileCog } from "react-icons/lu";
import useNotifications from "../hooks/useNotifications";
import ButtonElectron from "./ButtonElectron";

export default function Header() {
	const { config, isDebug, setIsDebug } = useApp();
	const { emitOpenConfig } = useSocketEmits();
	const { RaiseClientNotificaiton } = useNotifications();
	const { colorMode, toggleColorMode } = useColorMode()

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
		if (!window.electron) return;

		window.electron.getAppVersion().then((version) => {
			RaiseClientNotificaiton(`Application Version: v${version}`, "info", 2000);
		});
	}, [RaiseClientNotificaiton]);

	return (
		<Wrap my={5} spacingY={5} justify={"space-between"}>
			<WrapItem alignItems="center">
				<Link onClick={handleGetAppVersion}>
					<Image src={Logo} alt="Titan Logo" boxSize="100px" mr={5} borderRadius={"full"} />
				</Link>
				<Heading as={"h2"} size={"2xl"} noOfLines={1} className={"animation-fadein-forward"}>
					Welcome back
				</Heading>
				<Heading as={"h2"} size={"2xl"} noOfLines={1} p={2} className={"animation-handwave"}>
					👋
				</Heading>
			</WrapItem>
			<WrapItem alignItems={"center"} columnGap={2}>
				<Tooltip label={"Toggle Light/Dark Mode"} hasArrow placement="left">
					<IconButton aria-label="Toggle light/dark mode" colorScheme={"yellow"} icon={<Icon as={colorMode === "light" ? MdSunny : MdDarkMode} />} onClick={toggleColorMode} />
				</Tooltip>
				<ButtonElectron icon={<Icon as={MdBrowserUpdated} />} onClick={handleCheckForUpdates} colorScheme={"yellow"} label="Check For Updates" size="md" />
				<Tooltip label={"Open Config File"} hasArrow placement="bottom-start">
					<IconButton aria-label="Open configuration file" colorScheme={"yellow"} icon={<Icon as={LuFileCog} />} onClick={() => emitOpenConfig()} />
				</Tooltip>
				<Tooltip label={`Current Debug Mode: ${isDebug ? "on" : "off"}`} hasArrow placement="right">
					<IconButton aria-label="Toggle Debug Mode" colorScheme={"yellow"} icon={!isDebug ? <Icon as={MdCodeOff} /> : <Icon as={MdCode} />} onClick={() => setIsDebug((prev) => !prev)} />
				</Tooltip>
			</WrapItem>
		</Wrap>
	);
}
