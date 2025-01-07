import { Input } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "../ContextApp.jsx";
import { debounce } from "lodash";

export default function EditableBranchesRow({ branchId, dataColumn, dataValue, handleDataChange, bgLightColorValue, bgDarkColorValue }) {
	const configurableRowData = useApp((ctx) => ctx.configurableRowData);
	const updateConfig = useApp((ctx) => ctx.updateConfig);
	const [cellData, setCellData] = useState(dataValue);

	const debouncedUpdate = useMemo(
		() =>
			debounce((value) => {
				handleDataChange(branchId, dataColumn, value);
			}, 500),
		[configurableRowData, branchId, dataColumn, updateConfig]
	);

	useEffect(() => {
		return () => {
			debouncedUpdate.cancel();
		};
	}, [debouncedUpdate]);

	const onEditableChange = useCallback(
		(e) => {
			setCellData(e.target.value);
			debouncedUpdate(e.target.value);
		},
		[debouncedUpdate]
	);

	return <Input variant={"subtle"} value={cellData} onChange={onEditableChange} h={7} _light={{ bgColor: bgLightColorValue }} _dark={{ bgColor: bgDarkColorValue }} />;
}
