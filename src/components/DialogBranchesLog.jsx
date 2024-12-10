import React, { useCallback, useMemo, useState } from "react";
import { DialogActionTrigger, DialogBackdrop, DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "./ui/dialog.jsx";
import { Button } from "./ui/button.jsx";
import { useApp } from "../ContextApp.jsx";
import { useBranches } from "../ContextBranches.jsx";
import { Table, IconButton, Box } from "@chakra-ui/react";
import { SiSubversion } from "react-icons/si";
import { FaChevronDown, FaChevronRight } from "react-icons/fa6";

export default function DialogBranchesLog() {
	const { logsData } = useApp();
	const { isDialogSBLogOpen, setIsDialogSBLogOpen } = useBranches();
	const [expandedRows, setExpandedRows] = useState({});

	const closeDialog = useCallback(() => {
		setIsDialogSBLogOpen(false);
	}, []);

	const toggleExpand = useCallback((revision) => {
		setExpandedRows((prev) => ({
			...prev,
			[revision]: !prev[revision],
		}));
	}, []);

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
					<Box overflowY={"auto"} maxHeight={"80vh"} colorPalette={"yellow"}>
						<Table.Root size="sm" variant="outline" stickyHeader={true} interactive={true}>
							<Table.ColumnGroup>
								<Table.Column width="5%" />
								<Table.Column width="10%" />
								<Table.Column width="15%" />
								<Table.Column width="10%" />
								<Table.Column width="60%" />
							</Table.ColumnGroup>
							<Table.Header>
								<Table.Row>
									<Table.ColumnHeader></Table.ColumnHeader>
									<Table.ColumnHeader>Revision</Table.ColumnHeader>
									<Table.ColumnHeader>Date</Table.ColumnHeader>
									<Table.ColumnHeader>Author</Table.ColumnHeader>
									<Table.ColumnHeader>Message</Table.ColumnHeader>
								</Table.Row>
							</Table.Header>

							<Table.Body>
								{logsData.map((entry) => {
									const isExpanded = expandedRows[entry.revision];
									return (
										<React.Fragment key={entry.revision}>
											<Table.Row>
												<Table.Cell>
													<IconButton aria-label="Expand/Collapse" size="sm" onClick={() => toggleExpand(entry.revision)} variant="ghost">
														{isExpanded ? <FaChevronDown /> : <FaChevronRight />}
													</IconButton>
												</Table.Cell>
												<Table.Cell>{entry.revision}</Table.Cell>
												<Table.Cell>{entry.date}</Table.Cell>
												<Table.Cell>{entry.author}</Table.Cell>
												<Table.Cell>
													{entry.message} ({entry["branchFolder"]} {entry["branchVersion"]})
												</Table.Cell>
											</Table.Row>

											{isExpanded && entry.filesChanged && entry.filesChanged.length > 0 && (
												<Table.Row bgColor={"gray.subtle"}>
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
																{entry.filesChanged.map((file, idx) => (
																	<Table.Row key={`${entry.revision}-file-${idx}`}>
																		<Table.Cell>{file.action.toUpperCase()}</Table.Cell>
																		<Table.Cell>
																			{file.path} ({file.kind})
																		</Table.Cell>
																		<Table.Cell>
																			<Button variant="subtle" size="xs">
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
								})}
							</Table.Body>
						</Table.Root>
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
