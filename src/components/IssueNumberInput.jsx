import { Input, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper } from "@chakra-ui/react";
import React from "react";
import { useApp } from "../AppContext";

export default function IssueNumberInput() {
	const { issueNumber, setIssueNumber } = useApp();

	const handleChange = (e) => {
		// Only accept digits
		const newValue = String(e.target.value);
		if (/^\d*$/.test(newValue)) {
			setIssueNumber(newValue.trim());
		}
	};

	return <Input value={issueNumber} onChange={handleChange} placeholder="Enter number" />;
}
