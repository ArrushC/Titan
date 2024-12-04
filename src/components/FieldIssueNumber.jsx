import React, { useDeferredValue, useEffect, useState } from "react";
import { Field } from "./ui/field.jsx";
import { NumberInputField, NumberInputRoot } from "./ui/number-input.jsx";
import useCommitOptions from "../hooks/useCommitOptions.jsx";
import { useCommit } from "../ContextCommit.jsx";

export default function FieldIssueNumber({ branchFolder }) {
	const { setIssueNumber } = useCommit();
	const commitOptions = useCommitOptions();

	const [fieldIssueNumber, setFieldIssueNumber] = useState("");
	const deferredFieldIssueNumber = useDeferredValue(fieldIssueNumber);

	const isFieldDisabled = !branchFolder;
	const isFieldRequired = !branchFolder || !commitOptions?.useIssuePerFolder;

	useEffect(() => {
		if (!branchFolder) return;

		setIssueNumber((currIssueNumber) => ({
			...currIssueNumber,
			[branchFolder]: deferredFieldIssueNumber,
		}));

		return () => {
			setIssueNumber((currIssueNumber) => {
				const { [branchFolder]: _, ...rest } = currIssueNumber;
				return rest;
			});
		};
	}, [branchFolder, deferredFieldIssueNumber]);

	console.log("FieldIssueNumber rendered");

	return (
		<Field orientation="horizontal" label={`Issue Number (${branchFolder})`} labelFlex="0.4" required={isFieldRequired} disabled={isFieldDisabled}>
			<NumberInputRoot variant="flushed" min="0" ms={4} flex="0.95" size={"sm"} value={fieldIssueNumber} onValueChange={(e) => setFieldIssueNumber(e.value)}>
				<NumberInputField placeholder="The issue that your changes are linked to" borderColor="colorPalette.fg" />
			</NumberInputRoot>
		</Field>
	);

	// TODO Use asterisk in branchFolder as a wildcard for all branches.
}
