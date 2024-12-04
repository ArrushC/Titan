import { FormControl, FormLabel, Input, Tooltip } from "@chakra-ui/react";
import React, { useCallback, useEffect } from "react";
import { useApp } from "../ContextApp.jsx";
import _ from "lodash";
import useCommitOptions from "../hooks/useCommitOptions";

export default function IssueNumberInput({ branchFolder }) {
	const { issueNumber, setIssueNumber, selectedBranches } = useApp();
	const commitOptions = useCommitOptions();

	const handleChange = useCallback(
		(e) => {
			// Only accept digits
			const newValue = String(e.target.value || "").trim();

			if (/^\d*$/.test(newValue)) {
				setIssueNumber((currIssueNumber) => ({
					...currIssueNumber,
					[branchFolder]: newValue,
				}));
			}
		},
		[branchFolder, setIssueNumber]
	);

	const isFieldDisabled = !branchFolder;
	const isFieldRequired = !branchFolder || !commitOptions?.useIssuePerFolder ? true : selectedBranches?.map((branch) => branch["Branch Folder"]).includes(branchFolder);

	useEffect(() => {
		if (branchFolder) {
			setIssueNumber((currIssueNumber) => ({
				...currIssueNumber,
				[branchFolder]: "",
			}));
		}

		return () => {
			if (branchFolder && Object.keys(issueNumber).includes(branchFolder)) {
				setIssueNumber((currIssueNumber) => {
					return _.omit(currIssueNumber, [branchFolder]);
				});
			}
		}
	}, [branchFolder, setIssueNumber]);

	return (
		<Tooltip label={"Please select source branch first!"} disabled={!isFieldDisabled} showArrow>
			<FormControl key={branchFolder} disabled={isFieldDisabled} required={isFieldRequired}>
				<FormLabel>{branchFolder ? `Issue Number For ${branchFolder}` : "Issue Number"}</FormLabel>
				<Input value={issueNumber[branchFolder] || ""} onInput={handleChange} placeholder="Enter number" />
			</FormControl>
		</Tooltip>
	);
}
