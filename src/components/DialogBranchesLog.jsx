import React, { useCallback, useEffect, useRef, useState } from "react";
import { DialogActionTrigger, DialogBackdrop, DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "./ui/dialog.jsx";
import { Button } from "./ui/button.jsx";
import { useApp } from "../ContextApp.jsx";
import { useBranches } from "../ContextBranches.jsx";
import { Table, IconButton, Box } from "@chakra-ui/react";
import { SiSubversion } from "react-icons/si";
import { FaChevronDown, FaChevronRight } from "react-icons/fa6";

// Configuration for virtualization
const ROW_HEIGHT = 37; // Adjust this as needed
const OVERSCAN = 5;

// A memoized component for a single log row
const LogRow = React.memo(function LogRow({ entry, isExpanded, onToggleExpand }) {
	return (
		<React.Fragment>
			<Table.Row height={`${ROW_HEIGHT}px`}>
				<Table.Cell>
					<IconButton aria-label="Expand/Collapse" size="2xs" onClick={() => onToggleExpand(entry.revision)} variant="ghost">
						{isExpanded ? <FaChevronDown /> : <FaChevronRight />}
					</IconButton>
				</Table.Cell>
				<Table.Cell>{entry.revision}</Table.Cell>
				<Table.Cell>{entry.date}</Table.Cell>
				<Table.Cell>{entry.author}</Table.Cell>
				<Table.Cell
					style={{
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
						maxWidth: "500px",
					}}>
					{entry.message} ({entry.branchFolder} {entry.branchVersion})
				</Table.Cell>
			</Table.Row>

			{isExpanded && entry.filesChanged && entry.filesChanged.length > 0 && (
				<Table.Row bgColor={"gray.subtle"} height={`${ROW_HEIGHT}px`}>
					<Table.Cell colSpan={5}>
						<Table.Root variant="simple" size="sm">
							<Table.ColumnGroup>
								<Table.Column width="10%" />
								<Table.Column width="" />
								<Table.Column width="10%" />
							</Table.ColumnGroup>
							<Table.Header>
								<Table.Row>
									<Table.ColumnHeader>Action</Table.ColumnHeader>
									<Table.ColumnHeader>Path</Table.ColumnHeader>
									<Table.ColumnHeader></Table.ColumnHeader>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{/* For simplicity, assume each changed file row also fits into ROW_HEIGHT */}
								{entry.filesChanged.map((file, idx) => (
									<Table.Row key={`${entry.revision}-file-${idx}`} height={`${ROW_HEIGHT}px`}>
										<Table.Cell>{file.action.toUpperCase()}</Table.Cell>
										<Table.Cell>
											{file.path} ({file.kind})
										</Table.Cell>
										<Table.Cell>
											<Button variant="subtle" size={"2xs"}>
												Dummy Action
											</Button>
										</Table.Cell>
									</Table.Row>
								))}
							</Table.Body>
						</Table.Root>
					</Table.Cell>
				</Table.Row>
			)}
		</React.Fragment>
	);
});

export default function DialogBranchesLog() {
	const { logsData } = useApp();
	const { isDialogSBLogOpen, setIsDialogSBLogOpen } = useBranches();

	const [expandedRows, setExpandedRows] = useState(() => new Set());

	const closeDialog = useCallback(() => {
		setIsDialogSBLogOpen(false);
	}, [setIsDialogSBLogOpen]);

	const toggleExpand = useCallback((revision) => {
		setExpandedRows((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(revision)) {
				newSet.delete(revision);
			} else {
				newSet.add(revision);
			}
			return newSet;
		});
	}, []);

	// Virtualization states
	const containerRef = useRef(null);
	const [containerHeight, setContainerHeight] = useState(0);
	const [scrollTop, setScrollTop] = useState(0);

	// Measure the container height on mount and window resize
	useEffect(() => {
		const measure = () => {
			if (containerRef.current) {
				setContainerHeight(containerRef.current.clientHeight);
			}
		};
		measure();
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	}, []);

	// Update scrollTop on scroll
	const onScroll = useCallback(() => {
		if (containerRef.current) {
			setScrollTop(containerRef.current.scrollTop);
		}
	}, []);

	// Calculate the number of rows that fit in the container
	const totalRows = logsData.length;
	const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + OVERSCAN * 2;

	// Determine start and end indices of the rendered slice
	const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
	const endIndex = Math.min(totalRows, startIndex + visibleCount);

	const offsetY = startIndex * ROW_HEIGHT;

	const visibleRows = logsData.slice(startIndex, endIndex);

	return (
		<DialogRoot role="dialog" size="cover" placement="center" open={isDialogSBLogOpen} onOpenChange={closeDialog} closeOnEscape={false} initialFocusEl={undefined}>
			<DialogBackdrop />
			<DialogContent>
				<DialogHeader fontSize="lg" fontWeight="bold">
					<DialogTitle display="flex" alignItems="center" gap={4}>
						<SiSubversion size="32px" />
						Selected Branches: SVN Logs (All Time)
					</DialogTitle>
				</DialogHeader>

				<DialogBody>
					<Box ref={containerRef} overflowY={"auto"} height={"60vh"} colorPalette={"yellow"} onScroll={onScroll} position="relative">
						{/* We set a large padding (or spacer) to represent the total scrollable area */}
						<Box position="relative" height={`${totalRows * ROW_HEIGHT}px`}>
							{/* Absolutely positioned container for visible rows */}
							<Box position="absolute" width="100%" top={`${offsetY}px`}>
								<Table.Root size="sm" variant="outline" stickyHeader={true} interactive={true}>
									<Table.ColumnGroup>
										<Table.Column width="5%" />
										<Table.Column width="10%" />
										<Table.Column width="15%" />
										<Table.Column width="10%" />
										<Table.Column width="60%" />
									</Table.ColumnGroup>
									<Table.Header>
										<Table.Row height={`${ROW_HEIGHT}px`}>
											<Table.ColumnHeader></Table.ColumnHeader>
											<Table.ColumnHeader>Revision</Table.ColumnHeader>
											<Table.ColumnHeader>Date</Table.ColumnHeader>
											<Table.ColumnHeader>Author</Table.ColumnHeader>
											<Table.ColumnHeader>Message</Table.ColumnHeader>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{visibleRows.map((entry) => (
											<LogRow key={entry.revision} entry={entry} isExpanded={expandedRows.has(entry.revision)} onToggleExpand={toggleExpand} />
										))}
									</Table.Body>
								</Table.Root>
							</Box>
						</Box>
					</Box>
				</DialogBody>

				<DialogFooter>
					<DialogActionTrigger asChild>
						<Button>Cancel</Button>
					</DialogActionTrigger>
					<DialogCloseTrigger />
				</DialogFooter>
			</DialogContent>
		</DialogRoot>
	);
}
