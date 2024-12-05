import { Input } from "@chakra-ui/react";
import { Field } from "./ui/field.jsx";
import React, { memo } from "react";

export const FieldSourceBranch = memo(() => (
	<Field orientation="horizontal" label="Source branch" labelFlex="0.3">
		<Input placeholder="Where your changes came from" ms={4} flex="0.95" size="sm" variant="flushed" borderColor="colorPalette.fg" />
	</Field>
));