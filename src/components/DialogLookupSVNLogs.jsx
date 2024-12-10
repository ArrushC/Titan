import React, { useCallback, useState, useEffect, useMemo } from "react";
import { DialogActionTrigger, DialogBackdrop, DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "./ui/dialog.jsx";
import { Box, Button, HStack, Input, Kbd, Link, Spinner, Table, Text, chakra } from "@chakra-ui/react";
import { useCommit } from "../ContextCommit.jsx";
import { FaChevronDown, FaChevronUp, FaTrello } from "react-icons/fa6";
import { InputGroup } from "./ui/input-group.jsx";
import { LuExternalLink, LuSearch } from "react-icons/lu";
import { MdKeyboardReturn } from "react-icons/md";
import useTrelloIntegration from "../hooks/useTrelloIntegration.jsx";
import { SiSubversion } from "react-icons/si";

export default function DialogLookupSVNLogs({ fireDialogAction }) {
	const { isLookupSLogsOn, setIsLookupSLogsOn } = useCommit();
	const { key, token, emitTrelloCardNamesSearch } = useTrelloIntegration();

	const [trelloQuery, setTrelloQuery] = useState("");
	const [fetchedCards, setFetchedCards] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchPerformed, setSearchPerformed] = useState(false);

	// Sorting state: which column and direction
	// direction: 'asc', 'desc', or null (no sort)
	const [sortConfig, setSortConfig] = useState({ column: null, direction: null });

	const processDialogAction = useCallback(
		(card) => {
			fireDialogAction(card);
			setIsLookupSLogsOn(false);
		},
		[fireDialogAction, setIsLookupSLogsOn]
	);

	const handleSearch = useCallback(() => {
		if (!trelloQuery.trim()) return;
		setSearchPerformed(true);
		setLoading(true);
		emitTrelloCardNamesSearch(key, token, trelloQuery, null, (response) => {
			setFetchedCards(response.cards || []);
			setLoading(false);
			// Reset sort on new search
			setSortConfig({ column: null, direction: null });
		});
	}, [trelloQuery, key, token, emitTrelloCardNamesSearch]);

	const handleKeyPress = useCallback(
		(event) => {
			if (event.key === "Enter") {
				handleSearch();
			}
		},
		[handleSearch]
	);

	useEffect(() => {
		// If the query is emptied out after a search, reset cards
		if (trelloQuery.trim().length === 0) {
			setFetchedCards([]);
		}
	}, [trelloQuery]);

	const sortedCards = useMemo(() => {
		if (!sortConfig.column || !sortConfig.direction) {
			return fetchedCards;
		}

		let sorted = [...fetchedCards];
		if (sortConfig.column === "name") {
			sorted.sort((a, b) => a.name.localeCompare(b.name));
		} else if (sortConfig.column === "lastActivityDate") {
			sorted.sort((a, b) => new Date(a.lastActivityDate) - new Date(b.lastActivityDate));
		}

		if (sortConfig.direction === "desc") {
			sorted.reverse();
		}

		return sorted;
	}, [fetchedCards, sortConfig]);

	const toggleSort = (column) => {
		setSortConfig((prev) => {
			if (prev.column !== column) {
				return { column, direction: "asc" };
			} else {
				// Cycle through asc -> desc -> none
				if (prev.direction === "asc") return { column, direction: "desc" };
				if (prev.direction === "desc") return { column: null, direction: null };
				return { column, direction: "asc" };
			}
		});
	};

	const renderSortIcon = (column) => {
		if (sortConfig.column !== column) return null;
		return sortConfig.direction === "asc" ? <FaChevronUp /> : <FaChevronDown />;
	};

	return (
		<DialogRoot role="dialog" size="cover" open={isLookupSLogsOn} onOpenChange={() => setIsLookupSLogsOn(false)} closeOnEscape={true} initialFocusEl={null}>
			<DialogBackdrop />
			<DialogContent>
				<DialogHeader fontSize="lg" fontWeight="bold">
					<DialogTitle display="flex" alignItems="center" gap={4}>
						<SiSubversion size="32px" />
						Lookup SVN Logs
					</DialogTitle>
				</DialogHeader>

				<DialogBody>
					<Box mb={6}>
						<HStack gap="6" width="full" colorPalette="yellow" onKeyDown={handleKeyPress}>
							<InputGroup flex="1" startElement={<LuSearch />} startElementProps={{ color: "colorPalette.fg" }}>
								<Input placeholder="Type a card title and press Enter" variant="flushed" borderColor="colorPalette.fg" value={trelloQuery} onChange={(e) => setTrelloQuery(e.target.value)} />
							</InputGroup>
							<Button onClick={handleSearch} isDisabled={!trelloQuery.trim()}>
								Search
								<Kbd variant="subtle">
									<MdKeyboardReturn />
								</Kbd>
							</Button>
						</HStack>
					</Box>

					{loading && (
						<HStack justifyContent="center" alignItems="center" py={4}>
							<Spinner size="lg" color={"yellow.fg"} borderWidth={"4px"} />
							<Text ml={2}>Searching...</Text>
						</HStack>
					)}

					{!loading && !searchPerformed && fetchedCards.length === 0 && (
						<Text textAlign="center" fontSize="md" color="gray.500" py={4}>
							Enter a card title above and press Enter or click "Search".
						</Text>
					)}

					{searchPerformed && !loading && sortedCards.length === 0 && (
						<Text textAlign="center" fontSize="lg" color="whiteAlpha" py={4}>
							No results found. Try a different query.
						</Text>
					)}

					{!loading && sortedCards.length > 0 && (
						<>
							<Text fontSize="sm" color="gray.400" mb={2}>
								Double-click a card to select it.
							</Text>
							<Table.ScrollArea borderWidth="1px" maxH="60vh">
								<Table.Root size="sm" variant="outline" stickyHeader={true} showColumnBorder={true} interactive={true}>
									<Table.ColumnGroup>
										<Table.Column width="" />
										<Table.Column width="30%" />
									</Table.ColumnGroup>
									<Table.Header>
										<Table.Row>
											<Table.ColumnHeader onClick={() => toggleSort("name")}>
												<HStack>
													<chakra.span me={1}>Card Title</chakra.span>
													{renderSortIcon("name")}
												</HStack>
											</Table.ColumnHeader>
											<Table.ColumnHeader onClick={() => toggleSort("lastActivityDate")}>
												<HStack>
													<chakra.span me={1}>Last Activity</chakra.span>
													{renderSortIcon("lastActivityDate")}
												</HStack>
											</Table.ColumnHeader>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{sortedCards.map((card) => (
											<Table.Row key={card.id} onDoubleClick={() => processDialogAction(card)}>
												<Table.Cell>
													<Link onClick={() => window.open(card.url)} display={"flex"} alignItems={"center"} width={"fit-content"}>
														{card.name}
														<chakra.span color="yellow.fg" fontSize={"16px"}>
															<LuExternalLink />
														</chakra.span>
													</Link>
												</Table.Cell>
												<Table.Cell>{card.lastActivityDate}</Table.Cell>
											</Table.Row>
										))}
									</Table.Body>
									<Table.Footer>
										<Table.Row>
											<Table.Cell colSpan={2} fontWeight={900}>
												{sortedCards.length} {sortedCards.length === 1 ? "card" : "cards"} found from Trello
											</Table.Cell>
										</Table.Row>
									</Table.Footer>
								</Table.Root>
							</Table.ScrollArea>
						</>
					)}
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
