import React from "react";
import { DialogActionTrigger, DialogBackdrop, DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "./ui/dialog.jsx";
import { Button } from "@chakra-ui/react";
import { useCommit } from "../ContextCommit.jsx";
import { FaSearch } from "react-icons/fa";

export default function DialogLookupTrello({  }) {
	const { isLookupTrelloOn, setIsLookupTrelloOn } = useCommit();

	return (
		<DialogRoot role="dialog" size={"cover"} open={isLookupTrelloOn} onOpenChange={() => setIsLookupTrelloOn(false)} closeOnEscape={true} initialFocusEl={null}>
			<DialogBackdrop />
			<DialogContent>
				<DialogHeader ader fontSize="lg" fontWeight="bold">
					<DialogTitle display={"flex"} alignItems={"center"} gapX={4}>Lookup Trello Card <FaSearch /></DialogTitle>
				</DialogHeader>

				<DialogBody>
					Hello
				</DialogBody>

				<DialogFooter>
					<DialogActionTrigger asChild>
						<Button>
							Cancel
						</Button>
					</DialogActionTrigger>
					<DialogCloseTrigger />
					{/* <Button colorPalette="yellow" onClick={() => console.log("Hello!")} ml={3}>
						Confirm
					</Button> */}
				</DialogFooter>
			</DialogContent>
		</DialogRoot>
	);
}
