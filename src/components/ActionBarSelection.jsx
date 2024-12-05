import React, { memo } from "react";
import { HStack, Button, IconButton, Kbd } from "@chakra-ui/react";
import { IoMdClose } from "react-icons/io";
import { ActionBarContent, ActionBarRoot, ActionBarSelectionTrigger, ActionBarSeparator } from "./ui/action-bar.jsx";

const ActionBarSelection = memo(({ selectedCount, onDelete, onRefresh, onUpdate, onCommit, onLogs, onClear }) => {
	if (selectedCount === 0) return null;

	return (
		<ActionBarRoot open={true} closeOnEscape={false}>
			<ActionBarContent>
				<ActionBarSelectionTrigger>{selectedCount} Selected</ActionBarSelectionTrigger>
				<ActionBarSeparator />
				<HStack wrap="wrap">
					<Button variant="outline" size="sm" onClick={onDelete}>
						Delete <Kbd wordSpacing={0}>Del</Kbd>
					</Button>
					<Button variant="outline" size="sm" onClick={onRefresh}>
						Refresh <Kbd wordSpacing={0}>R</Kbd>
					</Button>
					<Button variant="outline" size="sm" onClick={onUpdate}>
						Update <Kbd wordSpacing={0}>U</Kbd>
					</Button>
					<Button variant="outline" size="sm" onClick={onCommit}>
						Commit <Kbd wordSpacing={0}>C</Kbd>
					</Button>
					<Button variant="outline" size="sm" onClick={onLogs}>
						Logs <Kbd wordSpacing={0}>L</Kbd>
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
