import React, { useCallback, useMemo, useState, forwardRef, createContext, useContext } from "react";
import { DialogActionTrigger, DialogBackdrop, DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "./ui/dialog.jsx";
import { Button, Box, Flex, IconButton, chakra } from "@chakra-ui/react";
import { useApp } from "../ContextApp.jsx";
import { useBranches } from "../ContextBranches.jsx";
import { SiSubversion } from "react-icons/si";
import { FaChevronDown, FaChevronRight } from "react-icons/fa6";
import { FixedSizeList as List } from "react-window";

const StickyListContext = createContext();
StickyListContext.displayName = "StickyListContext";

const StickyRow = ({ index, style }) => (
	<Flex position="absolute" top={`${index * 40}px`} left={0} width="100%" height="40px" fontWeight="bold" align="center" px={2} style={style}>
		{/* Header Layout: 5% | 10% | 15% | 10% | 60% */}
		<Flex w="5%" />
		<Flex w="10%">Revision</Flex>
		<Flex w="15%">Date</Flex>
		<Flex w="10%">Author</Flex>
		<Flex w="60%">Message</Flex>
	</Flex>
);

const ItemWrapper = ({ data, index, style }) => {
	const { ItemRenderer, stickyIndices } = data;
	if (stickyIndices && stickyIndices.includes(index)) {
		return null;
	}
	return <ItemRenderer index={index} style={style} />;
};

const innerElementType = forwardRef(({ children, ...rest }, ref) => (
	<StickyListContext.Consumer>
		{({ stickyIndices }) => (
			<Box ref={ref} {...rest}>
				{stickyIndices.map((index) => (
					<StickyRow index={index} key={index} />
				))}
				{children}
			</Box>
		)}
	</StickyListContext.Consumer>
));

const StickyList = ({ children, stickyIndices, ...rest }) => (
	<StickyListContext.Provider value={{ ItemRenderer: children, stickyIndices }}>
		<List itemData={{ ItemRenderer: children, stickyIndices }} {...rest}>
			{ItemWrapper}
		</List>
	</StickyListContext.Provider>
);

export default function DialogBranchesLog() {
	const { svnLogs } = useApp();
	const { isDialogSBLogOpen, setIsDialogSBLogOpen } = useBranches();
	const [expandedRows, setExpandedRows] = useState({});

	const closeDialog = useCallback(() => {
		setIsDialogSBLogOpen(false);
	}, [setIsDialogSBLogOpen]);

	const logsData = useMemo(() => {
		const allLogs = Object.values(svnLogs || {}).flat();
		return allLogs.filter((log) => !!log.revision).sort((a, b) => parseInt(b.revision, 10) - parseInt(a.revision, 10));
	}, [svnLogs]);

	const toggleExpand = useCallback(
		(revision) => {
			setExpandedRows((prev) => ({
				...prev,
				[revision]: !prev[revision],
			}));
		},
		[setExpandedRows]
	);

	// Insert a header row at index 0
	// Rows: header at index 0, then main/expanded for logs
	const displayRows = useMemo(() => {
		const rows = [{ type: "header" }];
		for (const entry of logsData) {
			rows.push({ type: "main", entry });
			if (expandedRows[entry.revision] && entry.filesChanged && entry.filesChanged.length > 0) {
				rows.push({ type: "expanded", entry });
			}
		}
		return rows;
	}, [logsData, expandedRows]);

	const Row = useCallback(
		({ index, style }) => {
			const rowData = displayRows[index];

			if (rowData.type === "header") {
				// Actual sticky header is handled by StickyRow above
				// We return an empty box for the header row here because
				// StickyRow draws it absolutely. This just reserves space.
				return <Box style={style} height="40px" fontWeight="bold" />;
			}

			if (rowData.type === "main") {
				const { entry } = rowData;
				const isExpanded = !!expandedRows[entry.revision];
				return (
					<Flex align="center" style={style} height="40px" fontSize="sm" borderBottom="1px solid #ccc"  px={2}>
						<Flex w="5%">
							<IconButton aria-label="Expand/Collapse" size="sm" onClick={() => toggleExpand(entry.revision)} variant="ghost" icon={isExpanded ? <FaChevronDown /> : <FaChevronRight />} />
						</Flex>
						<Flex w="10%">{entry.revision}</Flex>
						<Flex w="15%">{entry.date}</Flex>
						<Flex w="10%">{entry.author}</Flex>
						<Flex w="60%">
							{entry.message} ({entry.branchFolder} {entry.branchVersion})
						</Flex>
					</Flex>
				);
			}

			if (rowData.type === "expanded") {
				const { entry } = rowData;
				// Expanded row: display changed files
				return (
					<Box style={style} bgColor="yellow.100" color="black" px={2} py={2} borderBottom="1px solid #ccc" fontSize="sm">
						{entry.filesChanged.map((file, idx) => (
							<Flex key={`${entry.revision}-file-${idx}`} align="center" mb={2}>
								<Box w="10%" fontWeight="bold">
									{file.action.toUpperCase()}
								</Box>
								<Box flex="1">
									{file.path} ({file.kind})
								</Box>
								<Box w="10%">
									<Button variant="outline" size="xs" borderColor="black" color="black">
										Dummy Action
									</Button>
								</Box>
							</Flex>
						))}
					</Box>
				);
			}
			return null;
		},
		[displayRows, expandedRows, toggleExpand]
	);

	return (
		<DialogRoot role="dialog" size="cover" placement="center" open={isDialogSBLogOpen} onOpenChange={closeDialog} closeOnEscape={false} initialFocusEl={undefined}>
			<DialogBackdrop />
			<DialogContent>
				<DialogHeader>
					<DialogTitle display="flex" alignItems="center" gap={4}>
						<SiSubversion size="32px" />
						Selected Branches: SVN Logs (All Time)
					</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<Box maxHeight="80vh" overflow="hidden">
						<StickyList height={1000} width="100%" itemCount={displayRows.length} itemSize={40} stickyIndices={[0]} innerElementType={innerElementType}>
							{Row}
						</StickyList>
					</Box>
				</DialogBody>
				<DialogFooter>
					<DialogActionTrigger asChild>
						<Button colorPalette="yellow">
							Cancel
						</Button>
					</DialogActionTrigger>
					<DialogCloseTrigger />
				</DialogFooter>
			</DialogContent>
		</DialogRoot>
	);
}
