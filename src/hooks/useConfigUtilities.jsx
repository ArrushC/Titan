import { useCallback, useMemo } from "react";
import { useApp } from "../ContextApp.jsx";
import _ from "lodash";

export default function useConfigUtilities() {
	const configurableRowData = useApp((ctx) => ctx.configurableRowData);
	const sourceBranch = useApp((ctx) => ctx.sourceBranch);
	const selectedBranches = useApp((ctx) => ctx.selectedBranches);

	const getBranchFolderById = useCallback(
		(branchId) => {
			return configurableRowData && configurableRowData.length > 0 ? configurableRowData.find((row) => row.id == branchId)["Branch Folder"] : "";
		},
		[configurableRowData]
	);

	const selectedBranchFolders = useMemo(() => {
		if (!sourceBranch?.value) return [];
		const sourceBranchFolder = getBranchFolderById(sourceBranch.value);
		return [...new Set(selectedBranches.filter((branch) => branch["Branch Folder"] !== sourceBranchFolder).map((branch) => branch["Branch Folder"]))];
	}, [sourceBranch, selectedBranches, getBranchFolderById]);

	const getBranchVersionById = useCallback(
		(branchId) => {
			return configurableRowData && configurableRowData.length > 0 ? configurableRowData.find((row) => row.id == branchId)["Branch Version"] : "";
		},
		[configurableRowData]
	);

	const getSvnBranchById = useCallback(
		(branchId) => {
			return configurableRowData && configurableRowData.length > 0 ? configurableRowData.find((row) => row.id == branchId)["SVN Branch"] : "";
		},
		[configurableRowData]
	);

	return {
		getBranchFolderById,
		selectedBranchFolders,
		getBranchVersionById,
		getSvnBranchById,
	};
}
