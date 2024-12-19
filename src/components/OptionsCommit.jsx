import React, { useCallback, useEffect, useState } from "react";
import { useApp } from "../ContextApp.jsx";
import { isEmpty, isEqual } from "lodash";
import { Checkbox } from "./ui/checkbox.jsx";
import { Box, Em, Flex, Heading } from "@chakra-ui/react";
import { useCommit } from "../ContextCommit.jsx";

export default function OptionsCommit() {
	const config = useApp(ctx => ctx.config);
	const updateConfig = useApp(ctx => ctx.updateConfig);
	const setSourceBranch = useCommit((ctx) => ctx.setSourceBranch);
	const setIssueNumber = useCommit((ctx) => ctx.setIssueNumber);
	const [commitOptions, setCommitOptions] = useState({});

	const handleOptionChange = useCallback(
		(optionName, checked) => {
			setCommitOptions((currentOptions) => ({
				...currentOptions,
				[optionName]: checked,
			}));
		},
		[setCommitOptions]
	);

	useEffect(() => {
		if (!config || isEmpty(config)) return;

		if (!config.commitOptions) {
			updateConfig((currentConfig) => ({
				...currentConfig,
				commitOptions: {
					useFolderOnlySource: false,
				},
			}));
		} else {
			setCommitOptions(config.commitOptions);
		}
	}, [config]);

	useEffect(() => {
		if (isEmpty(commitOptions)) return;

		updateConfig((currentConfig) => {
			if (!isEqual(currentConfig.commitOptions, commitOptions)) {
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
		<Box colorPalette={"yellow"} bgColor={"colorPalette.subtle"} rounded={"md"} p={4}>
			<Heading as={"h6"} size="sm" fontWeight={700} mb={3}>
				Commit Options
			</Heading>
			<Flex direction={"column"} gap={4} mt={2}>
				<Checkbox variant="subtle" checked={commitOptions.useFolderOnlySource} onCheckedChange={(e) => handleOptionChange("useFolderOnlySource", e.checked)}>
					Use Folder Only Source Branch? <Em color={"colorPalette.fg"}> - Removes extra branch details from source branch</Em>
				</Checkbox>
			</Flex>
		</Box>
	);
}
