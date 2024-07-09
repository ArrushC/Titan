import { Input } from "@chakra-ui/react";
import React from "react";

export default function IssueNumberInput({issueNumber, setIssueNumber}) {

	const handleChange = (e) => {
		// Only accept digits
		const newValue = e.target.value;
		if (/^\d*$/.test(newValue)) {
			setIssueNumber(newValue);
		}
	};

	return <Input value={issueNumber} onChange={handleChange} placeholder="Enter number" />;
}
