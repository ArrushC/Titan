import { IconButton } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { VscDiffSingle } from "react-icons/vsc";

export default function ButtonDiff(props) {
	const { data, onDiffResult } = props;

	const handleDiff = useCallback(async () => {
		try {
			const result = await window.electron.openTortoiseSVNDiff({
				fullPath: data["Full Path"],
				branchFolder: data["Branch Folder"],
				branchVersion: data["Branch Version"],
			});
			onDiffResult(result);
		} catch (error) {
			onDiffResult({ success: false, error: error.message });
		}
	}, [data, onDiffResult]);

	return <IconButton aria-label="Diff" size="sm" icon={<VscDiffSingle />} onClick={handleDiff} colorPalette="yellow" />;
}
