import { Flex, Heading, HStack } from "@chakra-ui/react";
import React, { useCallback, useState } from "react";
import { MdBrowserUpdated, MdUpdate, MdHealthAndSafety, MdSpeed } from "react-icons/md";
import { TbGitBranch } from "react-icons/tb";
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
import { IoMdAdd } from "react-icons/io";

export default function Header() {
	const updateConfig = useApp((ctx) => ctx.updateConfig);
	const configurableRowData = useApp((ctx) => ctx.configurableRowData);
	const setAppClosing = useApp((ctx) => ctx.setAppClosing);
	const { emitOpenConfig, emitFlushSvnLogs, emitInfoSingle, emitUpdateSingle } = useSocketEmits();
	const { RaiseClientNotificaiton, RaisePromisedClientNotification } = useNotifications();
	const [reloadPopover, setReloadPopover] = useState(false);

	const updateAll = useCallback(() => {
		RaisePromisedClientNotification({
			title: "Updating Branches",
			totalItems: configurableRowData.length,
			onProgress: async (index, { onSuccess }) => {
				const branchRow = configurableRowData[index];

				await new Promise((resolveUpdate) => {
					emitUpdateSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"], (response) => {
						if (response.success) {
							onSuccess();
							emitInfoSingle(branchRow.id, branchRow["SVN Branch"], branchRow["Branch Version"], branchRow["Branch Folder"]);
							if (window.electron)
								window.electron
									.runCustomScript({
										scriptType: "powershell",
										scriptPath: "C:\\Titan\\Titan_PostUpdate_BranchSingle.ps1",
										branchData: branchRow,
									})
									.then((result) => {
										console.log("Custom Script Result: ", JSON.stringify(result, null, 4));
									})
									.catch((err) => {
										console.error("Custom Script error: " + JSON.stringify(err, null, 4));
									});
						}
						resolveUpdate();
					});
				});
			},
			successMessage: (count) => `${count} branches successfully updated`,
			errorMessage: (id) => `Failed to update branch ${id}`,
			loadingMessage: (current, total) => `Updating ${current} of ${total} branches`,
		}).catch(console.error);
	}, [RaisePromisedClientNotification, configurableRowData, emitUpdateSingle, emitInfoSingle]);

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

	const handleOpenHealthMonitor = useCallback(() => {
		window.open("http://localhost:4000/health");
	}, []);

	const handleOpenPerformanceMonitor = useCallback(() => {
		window.open("http://localhost:4000/performance");
	}, []);

	const handleOpenSVNDashboard = useCallback(() => {
		window.open("http://localhost:4000/svn-dashboard");
	}, []);

	const addRow = useCallback(() => {
			updateConfig((currentConfig) => {
				const newBranch = {
					id: `${Date.now()}`,
					"Branch Folder": "",
					"Branch Version": "",
					"SVN Branch": "",
					"Branch Info": "Please add branch path",
				};
				return { ...currentConfig, branches: [...configurableRowData, newBranch] };
			});
		}, [updateConfig, configurableRowData]);

	return (
		<HStack wrap="wrap" my={5} gapY={5} justify={"space-between"}>
			<Flex align={"flex-start"} alignItems="center" className="notMono">
				<Heading as={"h2"} size={"2xl"} lineClamp={1} lineHeight={"1.4"} className="animation-fadein-forward" userSelect={"none"}>
					You have {configurableRowData.length} branch{configurableRowData.length > 1 ? "es" : ""}:
				</Heading>
			</Flex>
			<Flex align={"flex-start"} alignItems={"center"} columnGap={2}>
				<ButtonIconTooltip icon={<MdHealthAndSafety />} onClick={handleOpenHealthMonitor} colorPalette={"yellow"} variant={"subtle"} label="Health Monitor" placement={"bottom-end"} size="md" />
				<ButtonIconTooltip icon={<MdSpeed />} onClick={handleOpenPerformanceMonitor} colorPalette={"yellow"} variant={"subtle"} label="Performance Dashboard" placement={"bottom-end"} size="md" />
				<ButtonIconTooltip icon={<TbGitBranch />} onClick={handleOpenSVNDashboard} colorPalette={"yellow"} variant={"subtle"} label="SVN Dashboard" placement={"bottom-end"} size="md" />
				<ButtonIconTooltip icon={<MdUpdate />} colorPalette={"yellow"} variant={"subtle"} label={"Update All"} placement={"bottom-end"} onClick={updateAll} disabled={configurableRowData.length < 1} />
				<PopoverRoot open={window.electron && reloadPopover} onOpenChange={(e) => setReloadPopover(e.open)}>
					<PopoverTrigger as={"div"}>
						<ButtonIconTooltip icon={<IoReload />} onClick={() => setReloadPopover((prev) => !prev)} colorPalette={"yellow"} label={"Reload"} variant={"subtle"} size="md" />
					</PopoverTrigger>
					<PopoverContent>
						<PopoverArrow />
						<PopoverBody>
							<HStack gap={8}>
								<Button colorPalette={"yellow"} variant={"subtle"} onClick={() => handleReload(false)}>
									Refresh
								</Button>
								<Button colorPalette={"yellow"} variant={"subtle"} onClick={() => handleReload(true)}>
									Restart
								</Button>
							</HStack>
						</PopoverBody>
					</PopoverContent>
				</PopoverRoot>
				<ButtonIconTooltip icon={<LuFileCog />} onClick={handleOpenConfig} colorPalette={"yellow"} variant={"subtle"} label="Open Config File" placement={"bottom-start"} size="md" />
				<ButtonElectron icon={<MdBrowserUpdated />} onClick={handleCheckForUpdates} colorPalette={"yellow"} variant={"subtle"} label="Check For Updates" size="md" />
				<ButtonIconTooltip icon={<LiaToiletSolid />} onClick={handleFlushSvnLogs} colorPalette={"yellow"} variant={"subtle"} label="Flush SVN Logs" placement={"bottom-start"} size="md" />
				<ButtonIconTooltip icon={<IoMdAdd />} colorPalette={"yellow"} variant={"subtle"} label={"Add Row"} placement={"bottom-end"} onClick={addRow} />
				<ColorModeButton />
			</Flex>
		</HStack>
	);
}
