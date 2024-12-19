import React, { useState } from "react";
import { Field } from "./ui/field.jsx";
import { chakra, Textarea } from "@chakra-ui/react";
import { useCommit } from "../ContextCommit.jsx";
import AutoResize from "react-textarea-autosize";

const ChakraAutoResize = chakra(AutoResize);

export default function FieldCommitMessage () {
	const commitMessage = useCommit((ctx) => ctx.commitMessage);
	const setCommitMessage = useCommit((ctx) => ctx.setCommitMessage);

	return (
		<Field orientation="vertical" label="Commit Message" required>
			<ChakraAutoResize
				placeholder="Main body of the commit message"
				variant="outline"
				size="sm"
				width={"100%"}
				rows={8}
				borderColor="colorPalette.fg"
				value={commitMessage}
				onChange={(e) => setCommitMessage(e.target.value)}
				resize={"none"}
				minH={"initial"}
				overflow={"hidden"}
				borderWidth={"1px"}
				px={2.5}
				py={2}
				lineHeight={"1.25rem"}
				focusRingColor={"colorPalette.focusRing"}
				_hover={{ borderColor: "colorPalette.focusRing", outlineColor: "colorPalette.focusRing" }}
				className="chakra-textarea"
				rounded={"sm"}
			/>
		</Field>
	);
};
