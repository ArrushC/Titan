import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Button, useDisclosure } from "@chakra-ui/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import useNotifications from "../hooks/useNotifications";

export default function AlertUpdateTitan() {
	const { toast, RaiseClientNotificaiton } = useNotifications();
	const { isOpen: isAlertOpen, onOpen: onOpenAlert, onClose: onCloseAlert } = useDisclosure();
	const cancelRef = useRef();
	const [updateDownloaded, setUpdateDownloaded] = useState(false);

	useEffect(() => {
		if (!window.electron) {
			RaiseClientNotificaiton("Electron context is not available. Updates cannot be checked.", "warning", 5000);
			return;
		}

		window.electron.on("update-available", () => {
			toast.closeAll();
			onOpenAlert();
		});

		window.electron.on("update-downloaded", () => {
			setUpdateDownloaded(true);
		});

		window.electron.on("update-error", (error) => {
			RaiseClientNotificaiton(`An error occurred while checking for updates: ${error}`, "error", 5000);
		});

		return () => {
			window.electron.removeAllListeners("update-available");
			window.electron.removeAllListeners("update-downloaded");
			window.electron.removeAllListeners("update-error");
		};
	}, [toast, onOpenAlert, setUpdateDownloaded]);

	const handleCancel = useCallback(() => {
		onCloseAlert();
		RaiseClientNotificaiton("You can update the application later by manually triggering an update check or wait until Titan performs this", "info", 5000);
	}, [onCloseAlert, RaiseClientNotificaiton]);

	const handleStartUpdate = useCallback(() => {
		if (!updateDownloaded) {
			RaiseClientNotificaiton("The update is being downloaded. Please wait.", "info", 5000);
			return;
		}

		if (window.electron) {
			window.electron.startUpdate();
		} else {
			RaiseClientNotificaiton("Cannot update Titan in a non-desktop application environment", "error", 5000);
		}
		onCloseAlert();
	}, [updateDownloaded, RaiseClientNotificaiton, onCloseAlert]);

	return (
		<AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef} onClose={onCloseAlert}>
			<AlertDialogOverlay>
				<AlertDialogContent>
					<AlertDialogHeader fontSize="lg" fontWeight="bold">
						Update Available
					</AlertDialogHeader>
					<AlertDialogBody>A new version of Titan is available. Would you like to download the update and restart?</AlertDialogBody>
					<AlertDialogFooter>
						<Button colorScheme="red" ref={cancelRef} onClick={handleCancel}>
							Cancel
						</Button>
						<Button colorScheme="yellow" onClick={handleStartUpdate} ml={3} isDisabled={updateDownloaded}>
							Confirm
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialogOverlay>
		</AlertDialog>
	);
}
