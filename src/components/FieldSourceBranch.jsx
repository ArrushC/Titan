import { Input } from "@chakra-ui/react";
import { Field } from "./ui/field.jsx";
import React from "react";
import { useCommit } from "../ContextCommit.jsx";
import { NumberInputField, NumberInputRoot } from "./ui/number-input.jsx";

export default function FieldSourceBranch() {
	const sourceBranch = useCommit((ctx) => ctx.sourceBranch);
	const setSourceBranch = useCommit((ctx) => ctx.setSourceBranch);
	const sourceIssueNumber = useCommit((ctx) => ctx.sourceIssueNumber);
	const setSourceIssueNumber = useCommit((ctx) => ctx.setSourceIssueNumber);

	return (
		<>
			<Field orientation="horizontal" label="Source branch" labelFlex="0.3">
				<Input placeholder="The branch where your changes originated from" ms={4} flex="0.95" size="sm" variant="flushed" borderColor="colorPalette.fg" value={sourceBranch} onChange={(e) => setSourceBranch(e.target.value)} />
			</Field>
			{sourceBranch.trim() !== "" ? (
				<Field orientation="horizontal" label={`Source Issue Number`} labelFlex="0.3">
					<NumberInputRoot variant="flushed" min="0" ms={4} flex="0.95" size={"sm"} value={sourceIssueNumber} onValueChange={(e) => setSourceIssueNumber(e.value)}>
						<NumberInputField placeholder={`The issue that your source branch changes belongs to`} borderColor="colorPalette.fg" />
					</NumberInputRoot>
				</Field>
			) : null}
		</>
	);
}
