import { IconButton } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { VscDiffSingle } from "react-icons/vsc";

export default function ButtonDiff({ fullPath, branchFolder, branchVersion, onDiffResult }) {
	const handleDiff = useCallback(async () => {
		try {
			const result = await window.electron.openTortoiseSVNDiff({
				fullPath,
				branchFolder,
				branchVersion,
			});
			onDiffResult(result);
		} catch (error) {
			onDiffResult({ success: false, error: error.message });
		}
	}, [fullPath, branchFolder, branchVersion, onDiffResult]);

	return <IconButton aria-label="Diff" size="xs" onClick={handleDiff} colorPalette="yellow"><VscDiffSingle /></IconButton>;
}
