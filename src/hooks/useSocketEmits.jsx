import { useCallback } from "react";
import { useApp } from "../AppContext";

export default function useSocketEmits() {
	const { socket } = useApp();

	const emitOpenConfig = useCallback(() => {
		socket?.emit("titan-config-open", {});
	}, [socket]);

	const emitUpdateSingle = useCallback(
		(branchId, svnBranch, branchVersion, branchFolder, callback) => {
			socket?.emit("svn-update-single", { id: branchId, branch: svnBranch, version: branchVersion, folder: branchFolder }, callback);
		},
		[socket]
	);

	const emitInfoSingle = useCallback(
		(branchId, svnBranch, branchVersion, branchFolder, callback) => {
			socket?.emit("svn-info-single", { id: branchId, branch: svnBranch, version: branchVersion, folder: branchFolder }, callback);
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

	const emitTrelloCardNamesSearch = useCallback(
		(key, token, query, limit = null) => {
			socket?.emit("trello-search-names-card", { key, token, query, limit });
		},
		[socket]
	);

	const emitTrelloCardUpdate = useCallback(
		(key, token, trelloData, commitResponses ) => {
			socket?.emit("trello-update-card", { key, token, trelloData, commitResponses });
		},
		[socket]
	);

	return {
		emitOpenConfig,
		emitUpdateSingle,
		emitInfoSingle,
		emitCommitPayload,
		emitFilesRevert,
		emitFilesAddRemove,
		emitTrelloCardNamesSearch,
		emitTrelloCardUpdate,
	};
}
