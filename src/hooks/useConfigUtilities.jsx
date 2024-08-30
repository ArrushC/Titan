import { useCallback } from "react";
import { useApp } from "../AppContext";
import _ from "lodash";

export default function useConfigUtilities() {
	const { configurableRowData, sourceBranch, issueNumber } = useApp();

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

	const getIssueNumbers = useCallback(
		(excludeSourceBranch = false) => {
			if (!issueNumber || _.isEmpty(issueNumber)) return [];
			if (!sourceBranch || sourceBranch.value == "" ||!excludeSourceBranch) return Object.values(issueNumber);

			const issueNumbers = [];

			_.forIn(issueNumber, (value, key) => {
				if (excludeSourceBranch && key === getBranchFolderById(sourceBranch.value)) return;
				issueNumbers.push(value);
			});

			return issueNumbers;
		},
		[issueNumber, sourceBranch, getBranchFolderById]
	);

	return {
		getBranchFolderById,
		getBranchVersionById,
		getSvnBranchById,
		getIssueNumbers,
	};
}
