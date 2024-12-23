import React, { useCallback, useRef } from "react";
import { DialogActionTrigger, DialogBackdrop, DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "./ui/dialog.jsx";
import { Button } from "@chakra-ui/react";

export default function DialogModifiedChangesRevert({ selectedCount, isDialogOpen, closeDialog, fireDialogAction }) {
	const deleteButtonRef = useRef(null);

	const processDialogAction = useCallback(() => {
		fireDialogAction();
		closeDialog();
	}, [fireDialogAction, closeDialog]);

	return (
		<DialogRoot role="alertdialog" open={isDialogOpen} onOpenChange={closeDialog} closeOnEscape={true} initialFocusEl={() => deleteButtonRef.current}>
			<DialogBackdrop />
			<DialogContent>
				<DialogHeader fontSize="lg" fontWeight="bold">
					<DialogTitle>Revert Selected Paths</DialogTitle>
				</DialogHeader>

				<DialogBody>Are you sure you want to revert {selectedCount} path{selectedCount == "1" ? "" : "s"}? This action cannot be undone.</DialogBody>

				<DialogFooter>
					<DialogActionTrigger asChild>
						<Button>
							Cancel
						</Button>
					</DialogActionTrigger>
					<DialogCloseTrigger />
					<Button ref={deleteButtonRef} colorPalette="red" onClick={processDialogAction} ml={3}>
						Revert
					</Button>
				</DialogFooter>
			</DialogContent>
		</DialogRoot>
	);
}
