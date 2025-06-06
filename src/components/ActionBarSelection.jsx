import React, { memo } from "react";
import { HStack, Button, IconButton, Kbd } from "@chakra-ui/react";
import { IoMdClose } from "react-icons/io";
import { ActionBarContent, ActionBarRoot, ActionBarSelectionTrigger, ActionBarSeparator } from "./ui/action-bar.jsx";

const ActionBarSelection = memo(({ selectedCount, onDelete, onUpdate, onCommit, onRefreshChanges, onLogs, onClear }) => {
	if (selectedCount === 0) return null;

	return (
		<ActionBarRoot open={true} closeOnEscape={false}>
			<ActionBarContent colorPalette={"yellow"}>
				<ActionBarSelectionTrigger >{selectedCount} Selected</ActionBarSelectionTrigger>
				<ActionBarSeparator />
				<HStack wrap="wrap">
					<Button variant="subtle" size="sm" onClick={onDelete}>
						Delete <Kbd variant={"subtle"} wordSpacing={0}>Alt+Del</Kbd>
					</Button>
					<Button variant="subtle" size="sm" onClick={onUpdate}>
						Update <Kbd variant={"subtle"} wordSpacing={0}>Alt+U</Kbd>
					</Button>
					<Button variant="subtle" size="sm" onClick={onCommit}>
						Commit <Kbd variant={"subtle"} wordSpacing={0}>Alt+C</Kbd>
					</Button>
					<Button variant="subtle" size="sm" onClick={onRefreshChanges}>
						Refresh <Kbd variant={"subtle"} wordSpacing={0}>Alt+R</Kbd>
					</Button>
					<Button variant="subtle" size="sm" onClick={onLogs}>
						Logs <Kbd variant={"subtle"} wordSpacing={0}>Alt+L</Kbd>
					</Button>
				</HStack>
				<ActionBarSeparator />
				<IconButton variant="ghost" size="sm" onClick={onClear} disabled={!window.electron}>
					<IoMdClose />
				</IconButton>
			</ActionBarContent>
		</ActionBarRoot>
	);
});

ActionBarSelection.displayName = "SelectionActionBar";
export default ActionBarSelection;
