import React, { useState } from "react";
import { Field } from "./ui/field.jsx";
import { Textarea } from "@chakra-ui/react";
import { useCommit } from "../ContextCommit.jsx";

export const FieldCommitMessage = () => {
	const { commitMessage, setCommitMessage } = useCommit();

	return (
		<Field orientation="vertical" label="Commit Message" required>
			<Textarea placeholder="Main body of the commit message" variant="outline" size="sm" rows={8} borderColor="colorPalette.fg" value={commitMessage} onChange={(e) => setCommitMessage(e.target.value)} />
		</Field>
	);
};
