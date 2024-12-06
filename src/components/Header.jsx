import { Flex, Heading, HStack } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { MdBrowserUpdated } from "react-icons/md";
import { IoReload } from "react-icons/io5";
import useSocketEmits from "../hooks/useSocketEmits.jsx";
import { LuFileCog } from "react-icons/lu";
import useNotifications from "../hooks/useNotifications.jsx";
import ButtonElectron from "./ButtonElectron.jsx";
import ButtonIconTooltip from "./ButtonIconTooltip.jsx";
import { ColorModeButton } from "./ui/color-mode.jsx";

export default function Header() {
	const { emitOpenConfig } = useSocketEmits();
	const { RaiseClientNotificaiton } = useNotifications();

	const [username, setUsername] = useState("User");

	useEffect(() => {
		if (window.electron) {
			window.electron.fetchUsername().then((username) => {
				setUsername(username.firstName);
			});
		}
	}, []);

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

	return (
		<HStack wrap="wrap" my={5} gapY={5} justify={"space-between"}>
			<Flex align={"flex-start"} alignItems="center" className="notMono">
				<Heading as={"h1"} size={"4xl"} fontWeight={700} lineClamp={1} className={"animation-fadein-forward"} userSelect={"none"}>
					Hello, {username}!
				</Heading>
				<Heading as={"h1"} size={"4xl"} lineClamp={1} ms={3} p={2} className={"animation-handwave"} userSelect={"none"}>
					👋
				</Heading>
			</Flex>
			<Flex align={"flex-start"} alignItems={"center"} columnGap={2}>
				<ColorModeButton />
				<ButtonIconTooltip icon={<LuFileCog />} onClick={handleOpenConfig} colorPalette={"yellow"} variant={"subtle"} label="Open Config File" placement={"bottom-start"} size="md" />
				<ButtonElectron icon={<MdBrowserUpdated />} onClick={handleCheckForUpdates} colorPalette={"yellow"} variant={"subtle"} label="Check For Updates" size="md" />
				<ButtonIconTooltip icon={<IoReload />} onClick={handleReload} colorPalette={"yellow"} variant={"subtle"} label="Reload" placement={"bottom-start"} size="md" />
			</Flex>
		</HStack>
	);
}
