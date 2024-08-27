import { Box, Checkbox, CheckboxGroup, Heading, Stack } from "@chakra-ui/react";
import React, { useCallback } from "react";

export default function OptionsCommit() {


	const handleOptionChange = useCallback((optionName, isChecked) => {
		console.log(`Option Change for ${optionName}:`, isChecked);
	}, []);

	return (
		<Box mb={4}>
			<Heading as={"h6"} size="sm">
				Commit Options
			</Heading>
			<CheckboxGroup colorScheme="yellow">
				<Stack direction={"row"} spacing={4} mt={2}>
					<Checkbox defaultChecked={false} onChange={(e) => handleOptionChange("Use 1 Issue Per Folder", e.target.checked)}>Use 1 Issue Per Folder?</Checkbox>
					<Checkbox defaultChecked={false} onChange={(e) => handleOptionChange("Use 1 Issue Per File", e.target.checked)}>Use 1 Issue Per File?</Checkbox>
				</Stack>
			</CheckboxGroup>
		</Box>
	);
}
