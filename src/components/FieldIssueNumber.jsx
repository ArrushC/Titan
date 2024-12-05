import React, { useCallback, useEffect } from "react";
import { Field } from "./ui/field.jsx";
import { NumberInputField, NumberInputRoot } from "./ui/number-input.jsx";
import { useCommit } from "../ContextCommit.jsx";

export default function FieldIssueNumber({ branchFolder }) {
	const { issueNumber, setIssueNumber } = useCommit();

	const handleIssueNumberChange = useCallback((value) => {
		setIssueNumber((currIssueNumber) => ({
			...currIssueNumber,
			[branchFolder]: value,
		}));
	}, [branchFolder]);

	useEffect(() => {
		if (branchFolder) {
			setIssueNumber((currIssueNumber) => ({
				...currIssueNumber,
				[branchFolder]: "",
			}));
		}

		return () => {
			setIssueNumber((currIssueNumber) => {
				const { [branchFolder]: _, ...rest } = currIssueNumber;
				return rest;
			});
		};
	}, [branchFolder]);

	console.log("FieldIssueNumber rendered");

	return (
		<Field orientation="horizontal" label={`Issue Number (${branchFolder})`} labelFlex="0.3" required={true}>
			<NumberInputRoot variant="flushed" min="0" ms={4} flex="0.95" size={"sm"} value={issueNumber[branchFolder]} onValueChange={(e) => handleIssueNumberChange(e.value)}>
				<NumberInputField placeholder={`The issue that your changes are linked to for ${branchFolder}`} borderColor="colorPalette.fg" />
			</NumberInputRoot>
		</Field>
	);

	// TODO Use asterisk in branchFolder as a wildcard for all branches.
}
