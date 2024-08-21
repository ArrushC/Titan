import { AlertDialog, AlertDialogBody, AlertDialogCloseButton, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Button, useDisclosure } from "@chakra-ui/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import useNotifications from "../hooks/useNotifications";

export default function AlertUpdateTitan() {
	const { toast, RaiseClientNotificaiton } = useNotifications();
	const { isOpen: isAlertOpen, onOpen: onOpenAlert, onClose: onCloseAlert } = useDisclosure();
	const cancelRef = useRef();
	const [updateInProgress, setUpdateInProgress] = useState(false);

	useEffect(() => {
		if (!window.electron) {
			RaiseClientNotificaiton("Electron context is not available. Updates cannot be checked.", "warning", 5000);
			return;
		}

		window.electron.on("update-available", () => {
			toast.closeAll();
			onOpenAlert();
		});

		window.electron.on("update-error", (error) => {
			RaiseClientNotificaiton(`An error occurred while checking for updates: ${error}`, "error", 5000);
		});

		return () => {
			window.electron.removeAllListeners("update-available");
			window.electron.removeAllListeners("update-error");
		};
	}, [toast, onOpenAlert]);

	const handleCancel = useCallback(() => {
		onCloseAlert();
		RaiseClientNotificaiton("You may update the application later by manually triggering an update check or wait until Titan does this", "info", 5000);
	}, [onCloseAlert, RaiseClientNotificaiton]);

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
				onCloseAlert();
			});

			window.electron.on("update-not-available", () => {
				RaiseClientNotificaiton("Titan is up to date", "info", 3000);
				window.electron.removeAllListeners("update-not-available");
				onCloseAlert();
			});
		} else {
			RaiseClientNotificaiton("Cannot update Titan in a non-desktop application environment", "error", 5000);
		}
	}, [updateInProgress, RaiseClientNotificaiton, onCloseAlert]);

	return (
		<AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef} onClose={onCloseAlert} motionPreset="slideInBottom" closeOnOverlayClick={!updateInProgress}>
			<AlertDialogOverlay>
				<AlertDialogContent>
					<AlertDialogHeader fontSize="lg" fontWeight="bold">
						Update Available
					</AlertDialogHeader>
					{updateInProgress ? <></> : <AlertDialogCloseButton />}
					<AlertDialogBody>A new version of Titan is available. Would you like to download and install the update?</AlertDialogBody>
					<AlertDialogFooter>
						<Button colorScheme="red" ref={cancelRef} onClick={handleCancel}>
							Cancel
						</Button>
						<Button colorScheme="yellow" onClick={handleStartUpdate} ml={3} isDisabled={updateInProgress}>
							Confirm
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialogOverlay>
		</AlertDialog>
	);
}
