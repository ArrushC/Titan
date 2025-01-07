import { Flex, Spinner } from "@chakra-ui/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import useNotifications from "../hooks/useNotifications.jsx";
import { DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "./ui/dialog.jsx";
import { Button } from "./ui/button.jsx";

export default function DialogTitanUpdate() {
	const { toast, RaiseClientNotificaiton } = useNotifications();
	const [open, setOpen] = useState(false);
	const cancelRef = useRef(null);
	const [updateInProgress, setUpdateInProgress] = useState(false);

	useEffect(() => {
		if (!window.electron) {
			RaiseClientNotificaiton("Electron context is not available. Updates cannot be checked.", "warning", 5000);
			return;
		}

		window.electron.on("update-available", () => {
			toast.closeAll();
			setOpen(true);
		});

		window.electron.on("update-error", (error) => {
			RaiseClientNotificaiton(`An error occurred while checking for updates: ${error}`, "error", 5000);
			setUpdateInProgress(false);
		});

		return () => {
			window.electron.removeAllListeners("update-available");
			window.electron.removeAllListeners("update-error");
		};
	}, [toast, setOpen]);

	const handleCancel = useCallback(() => {
		setOpen(false);
		RaiseClientNotificaiton("You may update the application later by manually triggering an update check or wait until Titan does this", "info", 5000);
	}, [setOpen, RaiseClientNotificaiton]);

	const handleStartUpdate = useCallback(() => {
		if (updateInProgress) {
			RaiseClientNotificaiton("Update is already in progress. Please wait.", "info", 5000);
			return;
		}

		if (window.electron) {
			setUpdateInProgress(true);
			window.electron.downloadUpdate().catch((error) => {
				setUpdateInProgress(false);
				RaiseClientNotificaiton(`An error occurred while downloading the update: ${error}`, "error", 5000);
			});

			window.electron.on("update-downloaded", () => {
				RaiseClientNotificaiton("Update has been downloaded successfully. Titan will now restart to apply the update.", "info", 5000);
				window.electron.removeAllListeners("update-downloaded");
				setOpen(false);
			});

			window.electron.on("update-not-available", () => {
				RaiseClientNotificaiton("Titan is up to date", "info", 3000);
				window.electron.removeAllListeners("update-not-available");
				setUpdateInProgress(false);
				setOpen(false);
			});
		} else {
			RaiseClientNotificaiton("Cannot update Titan in a non-desktop application environment", "error", 5000);
		}
	}, [updateInProgress, RaiseClientNotificaiton, setUpdateInProgress, setOpen]);

	return (
		<DialogRoot role="alertdialog" open={open} leastDestructiveRef={cancelRef} onOpenChange={(e) => setOpen(e.open)} motionPreset="slide-in-bottom" closeOnOverlayClick={!updateInProgress}>
			<DialogContent>
				<DialogHeader fontSize="lg" fontWeight="bold">
					<DialogTitle>Update Available</DialogTitle>
					<DialogCloseTrigger disabled={updateInProgress} />
				</DialogHeader>
				<DialogBody>
					<p>{updateInProgress ? "Downloading the update. Please wait..." : "A new version of Titan is available. Would you like to download and install the update?"}</p>
					{updateInProgress ? (
						<Flex justify="center" mt={4}>
							<Spinner size="xl" thickness="4px" speed="0.65s" color="yellow.500" ml={4} />
						</Flex>
					) : (
						<></>
					)}
				</DialogBody>
				<DialogFooter>
					<Button colorPalette="red" ref={cancelRef} onClick={handleCancel} disabled={updateInProgress}>
						Cancel
					</Button>
					<Button colorPalette="yellow" onClick={handleStartUpdate} ml={3} disabled={updateInProgress}>
						Confirm
					</Button>
				</DialogFooter>
			</DialogContent>
		</DialogRoot>
	);
}
