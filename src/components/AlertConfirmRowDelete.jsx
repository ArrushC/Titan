import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Button } from "@chakra-ui/react";
import React from "react";

export default function AlertConfirmRowDelete({ isAlertOpen, onCloseAlert, cancelRef, removeSelectedRows}) {
	return (
		<AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef} onClose={onCloseAlert}>
			<AlertDialogOverlay>
				<AlertDialogContent>
					<AlertDialogHeader fontSize="lg" fontWeight="bold">
						Delete Selected Rows
					</AlertDialogHeader>

					<AlertDialogBody>Are you sure you want to delete the selected rows? This action cannot be undone.</AlertDialogBody>

					<AlertDialogFooter>
						<Button ref={cancelRef} onClick={onCloseAlert}>
							Cancel
						</Button>
						<Button colorScheme="red" onClick={removeSelectedRows} ml={3}>
							Delete
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialogOverlay>
		</AlertDialog>
	);
}
