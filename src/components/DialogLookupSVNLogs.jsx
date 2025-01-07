import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { DialogActionTrigger, DialogBackdrop, DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "./ui/dialog.jsx";
import { Button } from "./ui/button.jsx";
import { useApp } from "../ContextApp.jsx";
import { Table, IconButton, Box, Input, Text, Flex, HStack } from "@chakra-ui/react";
import { SiSubversion } from "react-icons/si";
import { FaChevronDown, FaChevronRight } from "react-icons/fa6";
import { InputGroup } from "./ui/input-group.jsx";
import { LuSearch } from "react-icons/lu";
import { VscDiffSingle } from "react-icons/vsc";
import { useCommit } from "../ContextCommit.jsx";
import { useColorModeValue } from "./ui/color-mode.jsx";
import { keyframes } from "@emotion/react";

const shineAnimation = keyframes`
	from { background-position: 200% center; }
	to { background-position: -200% center; }
`;

const ROW_HEIGHT = 40;
const OVERSCAN = 10;

const getPathActionolour = (action) => {
	switch (action) {
		case "A":
			return "green.500";
		case "M":
			return "cyan.500";
		case "D":
			return "red.500";
		default:
			return "gray";
	}
};

const LogRow = React.memo(function LogRow({ entry, isExpanded, onToggleExpand, processDialogAction }) {
	return (
		<React.Fragment>
			<Table.Row height={`${ROW_HEIGHT}px`} _light={{ bgColor: "yellow.fg", color: "white" }} _dark={{ bgColor: "yellow.800" }} onDoubleClick={() => processDialogAction(entry)}>
				<Table.Cell>
					<IconButton aria-label="Expand/Collapse" size="2xs" onClick={() => onToggleExpand(entry.revision)} variant="subtle">
						{isExpanded ? <FaChevronDown /> : <FaChevronRight />}
					</IconButton>
				</Table.Cell>
				<Table.Cell fontWeight={900}>{entry.revision}</Table.Cell>
				<Table.Cell>{entry.date}</Table.Cell>
				<Table.Cell>{entry.author}</Table.Cell>
				<Table.Cell
					style={{
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
						maxWidth: "500px",
					}}>
					{entry.message}
				</Table.Cell>
			</Table.Row>

			{isExpanded && entry.filesChanged && entry.filesChanged.length > 0 && (
				<Table.Row bgColor={"gray.subtle"} height={`${ROW_HEIGHT}px`} onDoubleClick={() => processDialogAction(entry)}>
					<Table.Cell colSpan={5}>
						<Box p={3}>
							<Flex alignItems={"center"} mb={1} gap={3} p={2}>
								Commit Message: <Text color={"yellow.fg"}>{entry.message}</Text>
							</Flex>

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
									{entry.filesChanged.map((file, idx) => (
										<Table.Row key={`${entry.revision}-file-${idx}`} height={`${ROW_HEIGHT}px`} color={getPathActionolour(file.action.toUpperCase())}>
											<Table.Cell>{file.action.toUpperCase()}</Table.Cell>
											<Table.Cell>
												{file.path} ({file.kind === "dir" ? "Directory" : "File"})
											</Table.Cell>
											<Table.Cell>
												<IconButton variant="subtle" size={"xs"} disabled={!window.electron} aria-label="Diff" onClick={() => window.electron.openSvnDiff({ fullPath: `${entry.repositoryRoot}${file.path}`, revision: entry.revision, action: file.action.toUpperCase() })}>
													<VscDiffSingle />
												</IconButton>
											</Table.Cell>
										</Table.Row>
									))}
								</Table.Body>
							</Table.Root>
						</Box>
					</Table.Cell>
				</Table.Row>
			)}
		</React.Fragment>
	);
});

export default function DialogLookupSVNLogs({ fireDialogAction }) {
	const logsData = useApp((ctx) => ctx.logsData);
	const isLookupSLogsOn = useCommit((ctx) => ctx.isLookupSLogsOn);
	const setIsLookupSLogsOn = useCommit((ctx) => ctx.setIsLookupSLogsOn);
	const textColor = useColorModeValue("black", "white");

	const [expandedRows, setExpandedRows] = useState(() => new Set());
	const [searchTerm, setSearchTerm] = useState("");

	const closeDialog = useCallback(() => {
		setIsLookupSLogsOn(false);
	}, [setIsLookupSLogsOn]);

	const processDialogAction = useCallback(
		(entry) => {
			fireDialogAction(entry);
			setIsLookupSLogsOn(false);
		},
		[fireDialogAction, setIsLookupSLogsOn]
	);

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

	const filteredData = useMemo(() => {
		if (!searchTerm) return logsData;
		const lowerSearch = searchTerm.toLowerCase();
		return logsData.filter((entry) => {
			const mainFields = [entry.revision, entry.date, entry.author, entry.message, entry.branchFolder, entry.branchVersion];
			const mainMatch = mainFields.some((field) => field?.toString().toLowerCase().includes(lowerSearch));
			const filesMatch = entry.filesChanged && entry.filesChanged.some((file) => [file.action, file.path, file.kind].some((field) => field?.toString().toLowerCase().includes(lowerSearch)));
			return mainMatch || filesMatch;
		});
	}, [logsData, searchTerm]);

	const containerRef = useRef(null);
	const [containerHeight, setContainerHeight] = useState(0);
	const [scrollTop, setScrollTop] = useState(0);

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

	const onScroll = useCallback(() => {
		if (containerRef.current) {
			setScrollTop(containerRef.current.scrollTop);
		}
	}, []);

	const totalRows = filteredData.length;
	const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + OVERSCAN * 2;
	const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
	const endIndex = Math.min(totalRows, startIndex + visibleCount);
	const offsetY = startIndex * ROW_HEIGHT;
	const visibleRows = filteredData.slice(startIndex, endIndex);

	return (
		<DialogRoot role="dialog" size="cover" placement="center" open={isLookupSLogsOn} onOpenChange={closeDialog} closeOnEscape={false} initialFocusEl={undefined}>
			<DialogBackdrop />
			<DialogContent>
				<DialogHeader fontSize="lg" fontWeight="bold">
					<DialogTitle display="flex" alignItems="center" gap={4}>
						<SiSubversion size="32px" />
						Lookup SVN Logs
					</DialogTitle>
				</DialogHeader>

				<DialogBody display={"flex"} flexDirection={"column"}>
					<HStack gap="6" mb={4} width="full" colorPalette="yellow">
						<InputGroup flex="1" startElement={<LuSearch />} startElementProps={{ color: "colorPalette.fg" }}>
							<Input placeholder="Quick search..." variant="flushed" borderColor="colorPalette.fg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
						</InputGroup>
					</HStack>

					<Text fontSize={"sm"} mb={2} fontWeight={900} bgGradient="to-r" gradientFrom={textColor} gradientVia="yellow.500" gradientTo={textColor} backgroundSize="200% auto" bgClip="text" animation={`${shineAnimation} 7s ease-in infinite`}>
						Double-click a SVN revision row to select it.
					</Text>
					<Table.Root size="sm" variant="outline" colorPalette={"yellow"}>
						<Table.ColumnGroup>
							<Table.Column width="5%" />
							<Table.Column width="10%" />
							<Table.Column width="15%" />
							<Table.Column width="10%" />
							<Table.Column width="60%" />
						</Table.ColumnGroup>
						<Table.Header>
							<Table.Row height={`${ROW_HEIGHT}px`} bgColor={"colorPalette.400"}>
								<Table.ColumnHeader color={"black"} fontWeight={900}></Table.ColumnHeader>
								<Table.ColumnHeader color={"black"} fontWeight={900}>
									Revision
								</Table.ColumnHeader>
								<Table.ColumnHeader color={"black"} fontWeight={900}>
									Date
								</Table.ColumnHeader>
								<Table.ColumnHeader color={"black"} fontWeight={900}>
									Author
								</Table.ColumnHeader>
								<Table.ColumnHeader color={"black"} fontWeight={900} ms={0}>
									Message
								</Table.ColumnHeader>
							</Table.Row>
						</Table.Header>
					</Table.Root>

					<Box ref={containerRef} overflowY="auto" flex={"1"} colorPalette={"yellow"} onScroll={onScroll} position="relative">
						<Box position="relative" height={`${totalRows * ROW_HEIGHT}px`}>
							<Box position="absolute" width="100%" top={`${offsetY}px`}>
								<Table.Root size="sm" variant="outline">
									<Table.ColumnGroup>
										<Table.Column width="5%" />
										<Table.Column width="10%" />
										<Table.Column width="15%" />
										<Table.Column width="10%" />
										<Table.Column width="60%" />
									</Table.ColumnGroup>
									<Table.Body>
										{visibleRows.map((entry) => (
											<LogRow key={`${entry.branchFolder}-${entry.branchVersion}-${entry.revision}`} entry={entry} isExpanded={expandedRows.has(entry.revision)} onToggleExpand={toggleExpand} processDialogAction={processDialogAction} />
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
