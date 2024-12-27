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
import { Button } from "./ui/button.jsx";
import { PopoverArrow, PopoverBody, PopoverContent, PopoverRoot, PopoverTrigger } from "./ui/popover.jsx";
import { useApp } from "../ContextApp.jsx";
import { LiaToiletSolid } from "react-icons/lia";

export default function Header() {
	const configurableRowData = useApp((ctx) => ctx.configurableRowData);
	const setAppClosing = useApp((ctx) => ctx.setAppClosing);
	const { emitOpenConfig, emitFlushSvnLogs } = useSocketEmits();
	const { RaiseClientNotificaiton } = useNotifications();
	const [reloadPopover, setReloadPopover] = useState(false);

	const handleReload = useCallback((isAppRestart = false) => {
		if (isAppRestart) {
			window.electron.restartApp();
			setAppClosing(true);
			return;
		}

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

	const handleFlushSvnLogs = useCallback(() => {
		emitFlushSvnLogs();
	}, [emitFlushSvnLogs]);

	return (
		<HStack wrap="wrap" my={5} gapY={5} justify={"space-between"}>
			<Flex align={"flex-start"} alignItems="center" className="notMono">
				<Heading as={"h2"} size={"2xl"} lineClamp={1} lineHeight={"1.4"} className="animation-fadein-forward" userSelect={"none"}>
					You have {configurableRowData.length} branch{configurableRowData.length > 1 ? "es" : ""}:
				</Heading>
			</Flex>
			<Flex align={"flex-start"} alignItems={"center"} columnGap={2}>
				<ColorModeButton />
				<ButtonIconTooltip icon={<LuFileCog />} onClick={handleOpenConfig} colorPalette={"yellow"} variant={"subtle"} label="Open Config File" placement={"bottom-start"} size="md" />
				<ButtonIconTooltip icon={<LiaToiletSolid  />} onClick={handleFlushSvnLogs} colorPalette={"yellow"} variant={"subtle"} label="Flush SVN Logs" placement={"bottom-start"} size="md" />
				<ButtonElectron icon={<MdBrowserUpdated />} onClick={handleCheckForUpdates} colorPalette={"yellow"} variant={"subtle"} label="Check For Updates" size="md" />
				<PopoverRoot open={window.electron && reloadPopover} onOpenChange={(e) => setReloadPopover(e.open)}>
					<PopoverTrigger as={"div"}>
						<ButtonIconTooltip icon={<IoReload />} onClick={() => setReloadPopover((prev) => !prev)} colorPalette={"yellow"} label={"Reload"} variant={"subtle"} size="md" />
					</PopoverTrigger>
					<PopoverContent>
						<PopoverArrow />
						<PopoverBody>
							<HStack gap={8}>
								<Button colorPalette={"yellow"} variant={"subtle"} onClick={(e) => handleReload(false)}>
									Refresh
								</Button>
								<Button colorPalette={"yellow"} variant={"subtle"} onClick={(e) => handleReload(true)}>
									Restart
								</Button>
							</HStack>
						</PopoverBody>
					</PopoverContent>
				</PopoverRoot>
			</Flex>
		</HStack>
	);
}
