import { Input } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "../AppContext";
import { debounce } from "lodash";

export default function EditableBranchesRow({ branchId, dataColumn, dataValue, handleDataChange }) {
	const { configurableRowData, updateConfig } = useApp();
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

	return (
		<Input
			colorPalette={"yellow"}
			variant={"subtle"}
			value={cellData}
			onChange={onEditableChange}
		/>
	);
}
