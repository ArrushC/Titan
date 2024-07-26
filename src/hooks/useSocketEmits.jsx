import { useCallback } from "react";
import { useApp } from "../AppContext";

export default function useSocketEmits() {
	const { socket } = useApp();

	const emitUpdateSingle = useCallback(
		(branchId, svnBranch, branchVersion, branchFolder) => {
			socket?.emit("svn-update-single", { id: branchId, branch: svnBranch, version: branchVersion, folder: branchFolder });
		},
		[socket]
	);

	const emitInfoSingle = useCallback(
		(branchId, svnBranch, branchVersion, branchFolder) => {
			socket?.emit("svn-info-single", { id: branchId, branch: svnBranch, version: branchVersion, folder: branchFolder });
		},
		[socket]
	);

	const emitCommitPayload = useCallback(
		(commitPayload) => {
			socket?.emit("svn-commit", commitPayload);
		},
		[socket]
	);

	const emitFilesRevert = useCallback(
		(filesToProcess) => {
			socket?.emit("svn-files-revert", { filesToProcess: filesToProcess });
		},
		[socket]
	);

	const emitFilesAddRemove = useCallback(
		(filesToProcess) => {
			socket?.emit("svn-files-add-remove", { filesToProcess: filesToProcess });
		},
		[socket]
	);

	const emitStatusSingle = useCallback(
		(selectedBranch) => {
			socket?.emit("svn-status-single", { selectedBranch: selectedBranch });
		},
		[socket]
	);

	const emitLogSelected = useCallback(
		(selectedBranches) => {
			socket?.emit("svn-log-selected", { selectedBranches: selectedBranches });
		},
		[socket]
	);

	return {
		emitUpdateSingle,
		emitInfoSingle,
		emitCommitPayload,
		emitFilesRevert,
		emitFilesAddRemove,
		emitStatusSingle,
		emitLogSelected
	};
}
