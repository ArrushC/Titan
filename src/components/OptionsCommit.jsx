import { Box, Checkbox, CheckboxGroup, Heading, Stack, Tooltip } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { useApp } from "../AppContext";
import _ from "lodash";

export default function OptionsCommit() {
	const { config, updateConfig, setSourceBranch, setIssueNumber } = useApp();
	const [commitOptions, setCommitOptions] = useState({});

	const handleOptionChange = useCallback(
		(optionName, isChecked) => {
			setCommitOptions((currentOptions) => ({
				...currentOptions,
				[optionName]: isChecked,
			}));
		},
		[setCommitOptions]
	);

	useEffect(() => {
		if (!config || _.isEmpty(config)) return;

		if (!config.commitOptions) {
			updateConfig((currentConfig) => ({
				...currentConfig,
				commitOptions: {
					useFolderOnlySource: false,
					useIssuePerFolder: false,
					reusePreviousCommitMessage: false,
				},
			}));
		} else {
			setCommitOptions(config.commitOptions);
		}
	}, [config]);

	useEffect(() => {
		if (_.isEmpty(commitOptions)) return;

		updateConfig((currentConfig) => {
			if (!_.isEqual(currentConfig.commitOptions, commitOptions)) {
				return {
					...currentConfig,
					commitOptions: commitOptions,
				};
			}
			return currentConfig;
		});
	}, [commitOptions]);

	// Clear source branch option if folder only source is toggled
	useEffect(() => {
		setSourceBranch(null);
	}, [commitOptions?.useFolderOnlySource, setSourceBranch]);

	// We're clearing the issue number if the user decides to use toggle the "Use 1 Issue Per Folder" option
	useEffect(() => {
		setIssueNumber({});
	}, [commitOptions?.useIssuePerFolder, setIssueNumber]);

	return (
		<Box mb={4}>
			<Heading as={"h6"} size="sm">
				Commit Options
			</Heading>
			<CheckboxGroup colorScheme="yellow">
				<Stack direction={"row"} spacing={4} mt={2}>
					<Checkbox isChecked={commitOptions.useFolderOnlySource} onChange={(e) => handleOptionChange("useFolderOnlySource", e.target.checked)}>
						<Tooltip label={"Removes extra branch details from source branch."} hasArrow placement="bottom-start">
							Use Folder Only Source Branch?
						</Tooltip>
					</Checkbox>
					<Checkbox isChecked={commitOptions.useIssuePerFolder} onChange={(e) => handleOptionChange("useIssuePerFolder", e.target.checked)}>
						<Tooltip label={"Allows users to input issue number for each branch folder."} hasArrow placement="bottom-start">
							Use 1 Issue Per Folder?
						</Tooltip>
					</Checkbox>
					<Checkbox isChecked={commitOptions.reusePreviousCommitMessage} onChange={(e) => handleOptionChange("reusePreviousCommitMessage", e.target.checked)}>
						<Tooltip label={"Reuses the commit message from the previous commit made in Titan."} hasArrow>
							Reuse Previous Commit Message?
						</Tooltip>
					</Checkbox>
				</Stack>
			</CheckboxGroup>
		</Box>
	);
}
