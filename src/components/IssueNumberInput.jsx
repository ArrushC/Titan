import { FormControl, FormLabel, Input } from "@chakra-ui/react";
import React from "react";
import { useApp } from "../AppContext";

export default function IssueNumberInput({ branchFolder }) {
	const { issueNumber, setIssueNumber, selectedBranches } = useApp();

	const handleChange = (e) => {
		// Only accept digits
		const newValue = String(e.target.value).trim();
		if (/^\d*$/.test(newValue)) {
			setIssueNumber((currIssueNumber) => ({
				...currIssueNumber,
				[branchFolder]: newValue,
			}));
		}
	};

	return (
		<FormControl key={branchFolder} isRequired={!branchFolder ? true : selectedBranches?.map((branch) => branch["Branch Folder"]).includes(branchFolder) }>
			<FormLabel>{branchFolder ? `Issue Number For ${branchFolder}` : "Issue Number"}</FormLabel>
			<Input value={issueNumber[branchFolder]} onChange={handleChange} placeholder="Enter number" />
		</FormControl>
	);
}
