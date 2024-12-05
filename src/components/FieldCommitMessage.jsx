import { memo } from "react";
import { Field } from "./ui/field.jsx";
import React from "react";
import { Textarea } from "@chakra-ui/react";

export const FieldCommitMessage = memo(() => (
	<Field orientation="vertical" label="Commit Message" required>
		<Textarea placeholder="Main body of the commit message" variant="outline" size="sm" rows={8} borderColor="colorPalette.fg" />
	</Field>
));