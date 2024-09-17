import { FormControl, FormLabel, Input, Tooltip } from "@chakra-ui/react";
import React, { useCallback, useEffect } from "react";
import { useApp } from "../AppContext";
import _ from "lodash";
import useCommitOptions from "../hooks/useCommitOptions";

export default function IssueNumberInput({ branchFolder }) {
	const { issueNumber, setIssueNumber, selectedBranches } = useApp();
	const commitOptions = useCommitOptions();

	const handleChange = useCallback(
		(e) => {
			// Only accept digits
			const newValue = String(e.target.value || "").trim();

			if (newValue == "") {
				setIssueNumber((currIssueNumber) => {
					return _.omit(currIssueNumber, [branchFolder]);
				});
			}

			if (/^\d*$/.test(newValue)) {
				setIssueNumber((currIssueNumber) => ({
					...currIssueNumber,
					[branchFolder]: newValue,
				}));
			}
		},
		[branchFolder, setIssueNumber]
	);

	// We're clearing the issue number if the user decides to use toggle the "Use 1 Issue Per Folder" option
	useEffect(() => {
		setIssueNumber({});
	}, [commitOptions?.useIssuePerFolder, setIssueNumber]);

	const isFieldDisabled = !branchFolder;
	const isFieldRequired = !branchFolder || !commitOptions?.useIssuePerFolder ? true : selectedBranches?.map((branch) => branch["Branch Folder"]).includes(branchFolder);

	return (
		<Tooltip label={"Please select source branch first!"} isDisabled={!isFieldDisabled} hasArrow>
			<FormControl key={branchFolder} isDisabled={isFieldDisabled} isRequired={isFieldRequired}>
				<FormLabel>{branchFolder ? `Issue Number For ${branchFolder}` : "Issue Number"}</FormLabel>
				<Input value={issueNumber[branchFolder] || ""} onInput={handleChange} placeholder="Enter number" />
			</FormControl>
		</Tooltip>
	);
}
