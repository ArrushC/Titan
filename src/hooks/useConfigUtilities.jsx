import { useCallback } from "react";
import { useApp } from "../AppContext";

export default function useConfigUtilities() {
	const { configurableRowData } = useApp();

	const getBranchFolderById = useCallback(
		(branchId) => {
			return configurableRowData && configurableRowData.length > 0 ? configurableRowData.find((row) => row.id == branchId)["Branch Folder"] : "";
		},
		[configurableRowData]
	);

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
		getBranchVersionById,
		getSvnBranchById,
	};
}
