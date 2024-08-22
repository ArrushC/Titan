import { ExternalLinkIcon, RepeatIcon } from "@chakra-ui/icons";
import { Box, Flex, IconButton, Input, Tooltip, Text, Link } from "@chakra-ui/react";
import _ from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import useTrelloIntegration from "../hooks/useTrelloIntegration";
import { useApp } from "../AppContext";
import TableTrello from "./TableTrello";

export default function FilterableTableTrello({ setAutoFillSelection }) {
	const { socket } = useApp();
	const { key, token, isTrelloIntegrationEnabled, emitTrelloCardNamesSearch } = useTrelloIntegration();

	const [trelloQuery, setTrelloQuery] = useState("");
	const [quickFilterTrelloText, setQuickFilterTrelloText] = useState("");
	const [rowDataTrello, setRowDataTrello] = useState([]);

	const debouncedSearch = useCallback(
		_.debounce((query) => {
			if (query.trim() !== "") emitTrelloCardNamesSearch(key, token, query);
		}, 250),
		[key, token, emitTrelloCardNamesSearch]
	);

	const onTrelloQueryInputChanged = useCallback((e) => {
		setTrelloQuery(String(e.target.value).trim());
	}, [setTrelloQuery]);

	const resubmitTrelloQuery = useCallback(() => {
		if (trelloQuery.trim() !== "") emitTrelloCardNamesSearch(key, token, trelloQuery);
	}, [trelloQuery, key, token, emitTrelloCardNamesSearch]);

	const onQuickFilterTrelloInputChanged = useCallback((e) => {
		setQuickFilterTrelloText(e.target.value);
	}, []);

	useEffect(() => {
		debouncedSearch(trelloQuery);
		return () => debouncedSearch.cancel();
	}, [trelloQuery, debouncedSearch]);

	useEffect(() => {
		const socketCallback = (data) => {
			setRowDataTrello(data && data.length > 0 ? data : []);
		};

		socket?.on("trello-result-search-names-card", socketCallback);
		return () => socket?.off("trello-result-search-names-card", socketCallback);
	}, [socket]);

	if (!isTrelloIntegrationEnabled) {
		return (
			<Box h={"100%"} p={4}>
				<Text fontSize={"lg"} fontWeight={"600"} color={"red.500"}>
					You need to{" "}
					<Link href="https://help.merge.dev/en/articles/8757597-trello-how-do-i-link-my-account" isExternal={true} color={"yellow.500"}>
						set up Trello Integration <ExternalLinkIcon mx="2px" />
					</Link>{" "}
					in the configuration file to use this feature.
				</Text>
			</Box>
		);
	}

	return (
		<Box h={"100%"}>
			<Flex mb={4} width={"100%"} alignItems={"center"} columnGap={4}>
				<Flex alignItems={"center"} width={"100%"}>
					<Text mr={2} fontWeight={"600"} whiteSpace={"nowrap"}>
						Trello Query:
					</Text>
					<Input placeholder="Type to search..." onInput={onTrelloQueryInputChanged} width={"100%"} />
				</Flex>
				<Box>
					<Tooltip label={"Resubmit Query"} hasArrow>
						<IconButton onClick={resubmitTrelloQuery} icon={<RepeatIcon />} colorScheme={"yellow"} aria-label="Resubmit" />
					</Tooltip>
				</Box>
			</Flex>
			<Flex mb={4} width={"100%"} alignItems={"center"} columnGap={4}>
				<Flex alignItems={"center"} width={"100%"}>
					<Text mr={2} fontWeight={"600"} whiteSpace={"nowrap"}>
						Quick Filter:
					</Text>
					<Input placeholder="Type to search..." onInput={onQuickFilterTrelloInputChanged} width={"100%"} />
				</Flex>
			</Flex>
			<TableTrello rowDataTrello={rowDataTrello} quickFilterTrelloText={quickFilterTrelloText} setAutoFillSelection={setAutoFillSelection} />
		</Box>
	);
}
