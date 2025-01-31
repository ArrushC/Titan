import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import React, { useCallback, useState } from "react";
import { memo } from "react";
import { useColorModeValue } from "./ui/color-mode.jsx";
import { Button } from "./ui/button.jsx";
import { SiSubversion } from "react-icons/si";
import { FaTrello } from "react-icons/fa6";
import { useCommit } from "../ContextCommit.jsx";
import DialogLookupTrello from "./DialogLookupTrello.jsx";
import useTrelloIntegration from "../hooks/useTrelloIntegration.jsx";
import { PopoverArrow, PopoverBody, PopoverContent, PopoverRoot, PopoverTitle, PopoverTrigger } from "./ui/popover.jsx";
import DialogLookupSVNLogs from "./DialogLookupSVNLogs.jsx";

const shineAnimation = keyframes`
    from { background-position: 200% center; }
    to { background-position: -200% center; }
`;

export const FieldLookup = memo(() => {
	const setIssueNumber = useCommit((ctx) => ctx.setIssueNumber);
	const setCommitMessage = useCommit((ctx) => ctx.setCommitMessage);
	const setTrelloData = useCommit((ctx) => ctx.setTrelloData);
	const setIsLookupTrelloOn = useCommit((ctx) => ctx.setIsLookupTrelloOn);
	const setIsLookupSLogsOn = useCommit((ctx) => ctx.setIsLookupSLogsOn);
	const { isTrelloIntegrationSupported } = useTrelloIntegration();
	const textColor = useColorModeValue("black", "white");

	const [trelloPopover, setTrelloPopover] = useState(false);

	const handleSelectedSvnRevision = useCallback((entry) => {
		console.log("Selected SVN Revision", entry);
		const message = entry.message;
		const issueNumMatch = message.match(/\s*(Issue)*\s*(\d+)\s*/);
		const issueNumber = issueNumMatch ? issueNumMatch[2] : null;
		const formattedMessage = message.replace(/\s*(Issue)*\s*(\d+)?\s*(\([^\)]+\))*\s?:?\s*/, "");
		if (issueNumber) setIssueNumber((currIssueNumber) => Object.fromEntries(Object.keys(currIssueNumber).map((key) => [key, currIssueNumber[key] || issueNumber])));
		if (formattedMessage.trim() !== "") setCommitMessage((prevMessage) => prevMessage || formattedMessage);
	}, []);

	const handleSelectedTrelloCard = useCallback((card) => {
		console.log("Selected Trello Card", card);
		const cardName = card.name;
		const issueNumMatch = cardName.match(/\s*(Issue)*\s*\#*(\d+)\s*/);
		const issueNumber = issueNumMatch ? issueNumMatch[2] : null;
		const formattedMessage = cardName.replace(/\s*(Issue)*\s*\#*(\d+)/, "");

		if (issueNumber) setIssueNumber((currIssueNumber) => Object.fromEntries(Object.keys(currIssueNumber).map((key) => [key, currIssueNumber[key] || issueNumber])));
		if (formattedMessage.trim() !== "") setCommitMessage((prevMessage) => prevMessage || formattedMessage);

		setTrelloData(card);
	}, []);

	return (
		<Box colorPalette={"yellow"}>
			<Box>
				<Text fontWeight={900} bgGradient="to-r" gradientFrom={textColor} gradientVia="colorPalette.500" gradientTo={textColor} backgroundSize="200% auto" bgClip="text" animation={`${shineAnimation} 7s ease-in infinite`}>
					You can lookup and automatically fill in the following commit details using the options below:
				</Text>
			</Box>
			<Box my={4}></Box>
			<Flex gapX={2}>
				<Button variant="subtle" onClick={() => setIsLookupSLogsOn(true)}>
					<SiSubversion />
					Use SVN Logs
				</Button>
				<PopoverRoot open={!isTrelloIntegrationSupported && trelloPopover} onOpenChange={(e) => setTrelloPopover(e.open)}>
					<PopoverTrigger asChild>
						<Button variant="subtle" onClick={() => setIsLookupTrelloOn(isTrelloIntegrationSupported)}>
							<FaTrello />
							Use Trello
						</Button>
					</PopoverTrigger>
					<PopoverContent>
						<PopoverArrow />
						<PopoverBody>
							<PopoverTitle fontWeight={900} color={"yellow.500"} display={"flex"} alignItems={"center"} gapX={2}>
								<FaTrello /> Trello Integration Not Set Up
							</PopoverTitle>
							<Text my={4}>It seems you haven't set up the Trello integration yet. To use this feature, link your Trello account by following the guide below.</Text>
							<Button colorPalette={"yellow"} variant={"outline"} onClick={(e) => window.open("https://help.merge.dev/en/articles/8757597-trello-how-do-i-link-my-account")}>
								Setup Guide
							</Button>
						</PopoverBody>
					</PopoverContent>
				</PopoverRoot>
			</Flex>

			<DialogLookupSVNLogs fireDialogAction={handleSelectedSvnRevision} />
			<DialogLookupTrello fireDialogAction={handleSelectedTrelloCard} />
		</Box>
	);
});
