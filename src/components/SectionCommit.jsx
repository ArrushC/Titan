import { Box, Collapsible, Heading } from "@chakra-ui/react";
import React from "react";
import { AccordionRoot } from "./ui/accordion.jsx";
import { useCommit } from "../ContextCommit.jsx";
import { MdCloudUpload } from "react-icons/md";
import { Button } from "./ui/button.jsx";
// import OptionsCommit from "./OptionsCommit.jsx";

export default function SectionCommit() {
	const isCommitMode = useCommit((ctx) => ctx.isCommitMode);
	const selectedBranchesCount = useCommit((ctx) => ctx.selectedBranchesCount);
	const commitStage = useCommit((ctx) => ctx.commitStage);
	const accordionSection = useCommit((ctx) => ctx.accordionSection);
	const setCommitStage = useCommit((ctx) => ctx.setCommitStage);
	const selectedModifiedChanges = useCommit((ctx) => ctx.selectedModifiedChanges);

	return (
		<Collapsible.Root open={isCommitMode && selectedBranchesCount > 0}>
			<Collapsible.Content>
				<Box id="sectionCommit" mb={40}>
					<Heading as={"h2"} size={"2xl"} lineClamp={1} mb={4} className="animation-pulse" lineHeight={"1.4"}>
						Committing to {selectedBranchesCount} branch{selectedBranchesCount > 1 ? "es" : ""}:
					</Heading>
					{/* <OptionsCommit /> */}

					<Box my={6} fontSize={"sm"}>
						<AccordionRoot size={"sm"} variant={"enclosed"} colorPalette={"yellow"} value={commitStage} collapsible multiple={true} onValueChange={(e) => setCommitStage(e.value)} lazyMount={false}>
							{accordionSection}
						</AccordionRoot>
					</Box>

					<Box my={6}>
						<Button colorPalette={"yellow"} disabled={Object.keys(selectedModifiedChanges).length < 1}>
							<MdCloudUpload />
							Commit
						</Button>
					</Box>
				</Box>
			</Collapsible.Content>
		</Collapsible.Root>
	);
}
