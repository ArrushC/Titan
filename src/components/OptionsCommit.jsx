import { Box, Checkbox, CheckboxGroup, Heading, Stack, Tooltip } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { useApp } from "../AppContext";
import _ from "lodash";

export default function OptionsCommit() {
	const { config, updateConfig } = useApp();

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

	return (
		<Box mb={4}>
			<Heading as={"h6"} size="sm">
				Commit Options
			</Heading>
			<CheckboxGroup colorScheme="yellow">
				<Stack direction={"row"} spacing={4} mt={2}>
					<Checkbox isChecked={commitOptions.useIssuePerFolder} onChange={(e) => handleOptionChange("useIssuePerFolder", e.target.checked)}>
						<Tooltip label={"This option is for users who would like to apply different issue numbers for different branch folders"} hasArrow>
							Use 1 Issue Per Folder?
						</Tooltip>
					</Checkbox>
					<Checkbox isChecked={commitOptions.reusePreviousCommitMessage} onChange={(e) => handleOptionChange("reusePreviousCommitMessage", e.target.checked)}>
						<Tooltip label={"Toggling this option will clear the commit message!"} hasArrow>
							Reuse Previous Commit Message?
						</Tooltip>
					</Checkbox>
				</Stack>
			</CheckboxGroup>
		</Box>
	);
}
