import React, { useCallback, useEffect, useState } from "react";
import { DialogActionTrigger, DialogBackdrop, DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "./ui/dialog.jsx";
import { Button } from "./ui/button.jsx";
import { useApp } from "../AppContext.jsx";
import useSocketEmits from "../hooks/useSocketEmits.jsx";
import { HStack, Table } from "@chakra-ui/react";
import { PaginationItems, PaginationNextTrigger, PaginationPrevTrigger, PaginationRoot } from "./ui/pagination.jsx";

export default function DialogBranchesLog() {
	const { socket, configurableRowData, selectedBranches, isDialogSBLogOpen, setIsDialogSBLogOpen } = useApp();
	const { emitLogsSelected } = useSocketEmits();
	const [svnLogs, setSvnLogs] = useState([]);

	const closeDialog = useCallback(() => {
		setIsDialogSBLogOpen(false);
	}, [isDialogSBLogOpen]);

	useEffect(() => {
		if (configurableRowData?.length < 1 || selectedBranches?.length < 1) return;
		setSvnLogs([]);
		emitLogsSelected(configurableRowData.filter((branchRow) => selectedBranches[branchRow.id]));
	}, [selectedBranches, configurableRowData]);

	useEffect(() => {
		const socketCallback = (data) => {
			console.debug("Received svn-log-result from socket in DialogBranchesLog component in background");
			setSvnLogs((prevData) => [...prevData, ...data.logs]);
		};

		socket?.on("svn-log-result", socketCallback);

		return () => socket?.off("svn-log-result", socketCallback);
	}, [socket]);

	return (
		<DialogRoot role="dialog" size="full" placement="center" open={isDialogSBLogOpen} onOpenChange={closeDialog} closeOnEscape={true} initialFocusEl={undefined}>
			<DialogBackdrop />
			<DialogContent>
				<DialogHeader fontSize="lg" fontWeight="bold">
					<DialogTitle>Selected Branches: SVN Logs (All Time)</DialogTitle>
				</DialogHeader>

				<DialogBody>
					<Table.Root size={"sm"} variant={"outline"} transition={"backgrounds"}>
						<Table.ColumnGroup>
							<Table.Column width="1%" />
							<Table.Column width="15%" />
							<Table.Column width="15%" />
							<Table.Column width="15%" />
							<Table.Column width="15%" />
						</Table.ColumnGroup>
						<Table.Header>
							<Table.Row>
								<Table.ColumnHeader>Revision</Table.ColumnHeader>
								<Table.ColumnHeader>Date</Table.ColumnHeader>
								<Table.ColumnHeader>Branch</Table.ColumnHeader>
								<Table.ColumnHeader>Author</Table.ColumnHeader>
								<Table.ColumnHeader>Message</Table.ColumnHeader>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{svnLogs.length > 0
								? svnLogs.map((logRevision) => (
										<Table.Row key={logRevision.revision}>
											<Table.Cell>{logRevision.revision}</Table.Cell>
											<Table.Cell>{logRevision.date}</Table.Cell>
											<Table.Cell>{`${logRevision.branchFolder} ${logRevision.branchVersion}`}</Table.Cell>
											<Table.Cell>{logRevision.author}</Table.Cell>
											<Table.Cell>{logRevision.message}</Table.Cell>
										</Table.Row>
								  ))
								: null}
						</Table.Body>
					</Table.Root>

					<PaginationRoot count={svnLogs.length} pageSize={5} page={1}>
						<HStack wrap="wrap">
							<PaginationPrevTrigger />
							<PaginationItems />
							<PaginationNextTrigger />
						</HStack>
					</PaginationRoot>
				</DialogBody>

				<DialogFooter>
					<DialogActionTrigger asChild>
						<Button>Cancel</Button>
					</DialogActionTrigger>
					<DialogCloseTrigger />
					<Button colorPalette="yellow">Idk</Button>
				</DialogFooter>
			</DialogContent>
		</DialogRoot>
	);
}
