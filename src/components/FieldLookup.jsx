import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import React, { useCallback } from "react";
import { memo } from "react";
import { useColorModeValue } from "./ui/color-mode.jsx";
import { Button } from "./ui/button.jsx";
import { SiSubversion } from "react-icons/si";
import { FaTrello } from "react-icons/fa6";
import { useCommit } from "../ContextCommit.jsx";
import DialogLookupTrello from "./DialogLookupTrello.jsx";

const shineAnimation = keyframes`
    from { background-position: 200% center; }
    to { background-position: -200% center; }
`;

export const FieldLookup = memo(() => {
	const { setIsLookupTrelloOn } = useCommit();
	const textColor = useColorModeValue("black", "white");

	return (
		<Box colorPalette={"yellow"}>
			<Box>
				<Text fontWeight={900} bgGradient="to-r" gradientFrom={textColor} gradientVia="colorPalette.500" gradientTo={textColor} backgroundSize="200% auto" bgClip="text" animation={`${shineAnimation} 7s ease-in infinite`}>
					You can lookup and automatically fill in the following commit details using the options below:
				</Text>
			</Box>
			<Box my={4}>

			</Box>
			<Flex gapX={2}>
				<Button variant="subtle">
					<SiSubversion  />
					Use SVN Logs
				</Button>
				<Button variant="subtle" onClick={() => setIsLookupTrelloOn(true)}>
					<FaTrello  />
					Use Trello
				</Button>
			</Flex>

			<DialogLookupTrello />
		</Box>
	);
});
