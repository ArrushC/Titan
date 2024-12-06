import { Box, Code, Collapsible, Heading, Text } from "@chakra-ui/react";
import React, {  } from "react";
import OptionsCommit from "./OptionsCommit.jsx";
import { AccordionRoot } from "./ui/accordion.jsx";
import { useCommit } from "../ContextCommit.jsx";

export default function SectionCommit() {
	const { isCommitMode, selectedBranchesCount, commitStage, accordionSection, setCommitStage } = useCommit();

	console.log("SectionCommit");

	return (
		<Collapsible.Root open={isCommitMode}>
			<Collapsible.Content>
				<Box id="sectionCommit" mb={40}>
					<Heading as={"h2"} size={"2xl"} lineClamp={1} mb={4} className="animation-pulse" lineHeight={"1.4"}>
						Committing to {selectedBranchesCount} branch{selectedBranchesCount > 1 ? "es" : ""}:
					</Heading>

					<OptionsCommit />

					<Box my={6} fontSize={"sm"}>
						<AccordionRoot size={"sm"} variant={"enclosed"} colorPalette={"yellow"} value={commitStage} collapsible multiple={true} onValueChange={(e) => setCommitStage(e.value)} lazyMount={false}>
							{accordionSection}
						</AccordionRoot>

						<Text mt={6}>
							Your final commit message: <Code>Issue XXXX (YYY): ZZZZ</Code>
						</Text>
					</Box>
				</Box>
			</Collapsible.Content>
		</Collapsible.Root>
	);
}
