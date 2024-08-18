import { NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper } from "@chakra-ui/react";
import React from "react";

export default function IssueNumberInput({ issueNumber, setIssueNumber }) {

	return (
		<NumberInput onChange={(newIssueNum) => setIssueNumber(String(newIssueNum))} value={String(issueNumber)} min={0}>
			<NumberInputField />
			<NumberInputStepper>
				<NumberIncrementStepper />
				<NumberDecrementStepper />
			</NumberInputStepper>
		</NumberInput>
	);
}
