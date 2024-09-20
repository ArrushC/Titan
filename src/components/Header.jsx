import { Heading, Icon, Image, Link, useColorMode, Wrap, WrapItem } from "@chakra-ui/react";
import React, { useCallback } from "react";
import Logo from "../assets/Titan.png";
import { useApp } from "../AppContext";
import { MdBrowserUpdated, MdCode, MdCodeOff, MdDarkMode, MdSunny } from "react-icons/md";
import { IoReload } from "react-icons/io5";
import useSocketEmits from "../hooks/useSocketEmits";
import { LuFileCog } from "react-icons/lu";
import useNotifications from "../hooks/useNotifications";
import ButtonElectron from "./ButtonElectron";
import ButtonIconTooltip from "./ButtonIconTooltip";

export default function Header() {
	const { isDebug, setIsDebug } = useApp();
	const { emitOpenConfig } = useSocketEmits();
	const { RaiseClientNotificaiton } = useNotifications();
	const { colorMode, toggleColorMode } = useColorMode();

	const handleGetAppVersion = useCallback(() => {
		if (!window.electron) return;

		window.electron.getAppVersion().then((version) => {
			RaiseClientNotificaiton(`Application Version: v${version}`, "info", 2000);
		});
	}, [RaiseClientNotificaiton]);

	const handleReload = useCallback(() => {
		window.location.reload();
	}, []);

	const handleCheckForUpdates = useCallback(() => {
		window.electron.checkForUpdates().then((result) => {
			console.debug("Check for updates result: ", result);
		});
		window.electron.on("update-not-available", () => {
			RaiseClientNotificaiton("Titan is up to date", "info", 3000);
			window.electron.removeAllListeners("update-not-available");
		});
	}, [RaiseClientNotificaiton]);

	const handleOpenConfig = useCallback(() => {
		emitOpenConfig();
	}, [emitOpenConfig]);

	const handleToggleDebug = useCallback(() => {
		setIsDebug((prev) => !prev);
	}, [setIsDebug]);

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
				<ButtonIconTooltip icon={<Icon as={colorMode === "light" ? MdSunny : MdDarkMode} />} onClick={toggleColorMode} colorScheme={"yellow"} label="Toggle Light/Dark Mode" placement={"bottom-start"} size="md" />
				<ButtonIconTooltip icon={<Icon as={IoReload} />} onClick={handleReload} colorScheme={"yellow"} label="Reload" placement={"bottom-start"} size="md" />
				<ButtonElectron icon={<Icon as={MdBrowserUpdated} />} onClick={handleCheckForUpdates} colorScheme={"yellow"} label="Check For Updates" size="md" />
				<ButtonIconTooltip icon={<Icon as={LuFileCog} />} onClick={handleOpenConfig} colorScheme={"yellow"} label="Open Config File" placement={"bottom-start"} size="md" />
				<ButtonIconTooltip icon={!isDebug ? <Icon as={MdCodeOff} /> : <Icon as={MdCode} />} onClick={handleToggleDebug} colorScheme={"yellow"} label={`Current Debug Mode: ${isDebug ? "on" : "off"}`} placement={"bottom-start"} size="md" />
			</WrapItem>
		</Wrap>
	);
}
