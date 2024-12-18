import React, { memo, useCallback, useEffect } from "react";
import { Field } from "./ui/field.jsx";
import { NumberInputField, NumberInputRoot } from "./ui/number-input.jsx";
import { useCommit } from "../ContextCommit.jsx";

export function FieldIssueNumber({ branchFolder }) {
	const issueNumber = useCommit((ctx) => ctx.issueNumber);
	const setIssueNumber = useCommit((ctx) => ctx.setIssueNumber);

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

	return (
		<Field orientation="horizontal" label={`Issue Number (${branchFolder})`} labelFlex="0.3" required={true}>
			<NumberInputRoot variant="flushed" min="0" ms={4} flex="0.95" size={"sm"} value={issueNumber[branchFolder]} onValueChange={(e) => handleIssueNumberChange(e.value)}>
				<NumberInputField placeholder={`The issue that your ${branchFolder} changes belongs to`} borderColor="colorPalette.fg" />
			</NumberInputRoot>
		</Field>
	);
}

export default memo(FieldIssueNumber);