import { Flex, Heading, HStack, Icon, Image, Link } from "@chakra-ui/react";
import React, { useCallback, useState } from "react";
import Logo from "../assets/Titan.png";
import { useApp } from "../AppContext";
import { MdBrowserUpdated, MdCode, MdCodeOff } from "react-icons/md";
import { IoReload } from "react-icons/io5";
import useSocketEmits from "../hooks/useSocketEmits";
import { LuFileCog } from "react-icons/lu";
import useNotifications from "../hooks/useNotifications";
import ButtonElectron from "./ButtonElectron";
import ButtonIconTooltip from "./ButtonIconTooltip";
import { ColorModeButton } from "./ui/color-mode";

export default function Header() {
	const { isDebug, setIsDebug } = useApp();
	const { emitOpenConfig } = useSocketEmits();
	const { RaiseClientNotificaiton } = useNotifications();

	const [username, setUsername] = useState("User");

	if (window.electron) {
		window.electron.fetchUsername().then((username) => {
			setUsername(username.firstName);
		});
	}

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
		<HStack wrap="wrap" my={5} gapY={5} justify={"space-between"}>
			<Flex align={"flex-start"} alignItems="center">
				<Link onClick={handleGetAppVersion}>
					<Image src={Logo} alt="Titan Logo" boxSize="100px" mr={5} borderRadius={"full"} userSelect={"none"}/>
				</Link>
				<Heading as={"h1"} size={"5xl"} fontWeight={700} lineClamp={1} className={"animation-fadein-forward"} userSelect={"none"}>
					Welcome back, {username}!
				</Heading>
				<Heading as={"h1"} size={"5xl"} lineClamp={1} ms={3} p={2} className={"animation-handwave"} userSelect={"none"}>
					👋
				</Heading>
			</Flex>
			<Flex align={"flex-start"} alignItems={"center"} columnGap={2}>
				<ColorModeButton />
				<ButtonIconTooltip icon={<IoReload />} onClick={handleReload} colorPalette={"yellow"} label="Reload" placement={"bottom-start"} size="md" />
				<ButtonElectron icon={<MdBrowserUpdated />} onClick={handleCheckForUpdates} colorPalette={"yellow"} label="Check For Updates" size="md" />
				<ButtonIconTooltip icon={<LuFileCog />} onClick={handleOpenConfig} colorPalette={"yellow"} label="Open Config File" placement={"bottom-start"} size="md" />
				<ButtonIconTooltip icon={!isDebug ? <MdCodeOff /> : <MdCode />} onClick={handleToggleDebug} colorPalette={"yellow"} label={`Current Debug Mode: ${isDebug ? "on" : "off"}`} placement={"bottom-start"} size="md" />
			</Flex>
		</HStack>
	);
}
