import { Box, Checkbox, CheckboxGroup, Heading, Stack } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { useApp } from "../AppContext";
import _ from "lodash";

export default function OptionsCommit() {
	const { config, updateConfig } = useApp();

	const [commitOptions, setCommitOptions] = useState({});

	const handleOptionChange = useCallback((optionName, isChecked) => {
		setCommitOptions((currentOptions) => ({
			...currentOptions,
			[optionName]: isChecked,
		}));
	}, [setCommitOptions]);

	useEffect(() => {
		if (!config || _.isEmpty(config)) return;

		if (!config.commitOptions) {
			updateConfig((currentConfig) => ({
				...currentConfig,
				commitOptions: {
					useIssuePerFolder: false,
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
					commitOptions,
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
						Use 1 Issue Per Folder?
					</Checkbox>
				</Stack>
			</CheckboxGroup>
		</Box>
	);
}
