import React, { useCallback, useState, useEffect } from "react";
import { DialogActionTrigger, DialogBackdrop, DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "./ui/dialog.jsx";
import { Box, Button, HStack, Input, Kbd, Link, Spinner, Table, Text } from "@chakra-ui/react";
import { useCommit } from "../ContextCommit.jsx";
import { FaTrello } from "react-icons/fa6";
import { InputGroup } from "./ui/input-group.jsx";
import { LuExternalLink, LuSearch } from "react-icons/lu";
import { MdKeyboardReturn } from "react-icons/md";
import useTrelloIntegration from "../hooks/useTrelloIntegration.jsx";

export default function DialogLookupTrello({ fireDialogAction }) {
	const { isLookupTrelloOn, setIsLookupTrelloOn } = useCommit();
	const { key, token, emitTrelloCardNamesSearch } = useTrelloIntegration();

	const [trelloQuery, setTrelloQuery] = useState("");
	const [fetchedCards, setFetchedCards] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchPerformed, setSearchPerformed] = useState(false);

	const processDialogAction = useCallback(
		(card) => {
			fireDialogAction(card);
			setIsLookupTrelloOn(false);
		},
		[fireDialogAction, setIsLookupTrelloOn]
	);

	const handleSearch = useCallback(() => {
		if (!trelloQuery.trim()) return;
		setSearchPerformed(true);
		setLoading(true);
		emitTrelloCardNamesSearch(key, token, trelloQuery, null, (response) => {
			setFetchedCards(response.cards || []);
			setLoading(false);
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
		// If the query is emptied out after a search, reset cards and loading states.
		if (trelloQuery.trim().length === 0) {
			setFetchedCards([]);
			// We do not reset searchPerformed because that indicates a previous search occurred.
		}
	}, [trelloQuery]);

	return (
		<DialogRoot role="dialog" size="cover" open={true} onOpenChange={() => setIsLookupTrelloOn(false)} closeOnEscape={true} initialFocusEl={null}>
			<DialogBackdrop />
			<DialogContent>
				<DialogHeader fontSize="lg" fontWeight="bold">
					<DialogTitle display="flex" alignItems="center" gap={4}>
						<FaTrello size="32px" />
						Lookup Trello Card
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

					{searchPerformed && !loading && fetchedCards.length === 0 && (
						<Text textAlign="center" fontSize="lg" color="whiteAlpha" py={4}>
							No results found. Try a different query.
						</Text>
					)}

					{!loading && fetchedCards.length > 0 && (
						<>
							<Text fontSize="sm" color="gray.600" mb={2}>
								Double-click a card to select it.
							</Text>
							<Table.ScrollArea borderWidth="1px" maxH="2xl">
								<Table.Root size="sm" variant="outline" stickyHeader={true} showColumnBorder={true} interactive={true}>
									<Table.ColumnGroup>
										<Table.Column width="" />
										<Table.Column width="30%" />
									</Table.ColumnGroup>
									<Table.Header>
										<Table.Row>
											<Table.ColumnHeader>Card Title</Table.ColumnHeader>
											<Table.ColumnHeader>Last Activity</Table.ColumnHeader>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{fetchedCards.map((card) => (
											<Table.Row key={card.id} onDoubleClick={() => processDialogAction(card)}>
												<Table.Cell>
													<Link href={card.url} isExternal>
														{card.name} <LuExternalLink color="yellow.500" />
													</Link>
												</Table.Cell>
												<Table.Cell>{card.lastActivityDate}</Table.Cell>
											</Table.Row>
										))}
									</Table.Body>
									<Table.Footer>
										<Table.Row>
											<Table.Cell colSpan={2}>
												{fetchedCards.length} {fetchedCards.length === 1 ? "card" : "cards"} found from Trello
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
