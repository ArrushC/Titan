import { useCallback } from "react";
import { useApp } from "../ContextApp.jsx";

export default function useSocketEmits() {
	const socket = useApp((ctx) => ctx.socket);

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
		(branchId, svnBranch, branchVersion, branchFolder) => {
			socket?.emit("svn-info-single", { id: branchId, branch: svnBranch, version: branchVersion, folder: branchFolder });
		},
		[socket]
	);

	const emitStatusSingle = useCallback(
		(selectedBranch) => {
			socket?.emit("svn-status-single", { selectedBranch });
		},
		[socket]
	);

	const emitCommitPayload = useCallback(
		(commitPayload) => {
			socket?.emit("svn-commit", commitPayload);
		},
		[socket]
	);

	const emitFlushSvnLogs = useCallback(() => {
		socket?.emit("svn-logs-flush", {});
	}, [socket]);

	const emitFilesRevert = useCallback(
		(filesToProcess) => {
			socket?.emit("svn-files-revert", { filesToProcess });
		},
		[socket]
	);

	const emitFilesAddRemove = useCallback(
		(filesToProcess) => {
			socket?.emit("svn-files-add-remove", { filesToProcess });
		},
		[socket]
	);

	const emitTrelloCardNamesSearch = useCallback(
		(key, token, query, limit = null, callback = null) => {
			socket?.emit("trello-search-names-card", { key, token, query, limit }, callback);
		},
		[socket]
	);

	const emitTrelloCardUpdate = useCallback(
		(key, token, trelloData, commitResponses) => {
			socket?.emit("trello-update-card", { key, token, trelloData, commitResponses });
		},
		[socket]
	);

	return {
		emitOpenConfig,
		emitUpdateSingle,
		emitInfoSingle,
		emitStatusSingle,
		emitCommitPayload,
		emitFlushSvnLogs,
		emitFilesRevert,
		emitFilesAddRemove,
		emitTrelloCardNamesSearch,
		emitTrelloCardUpdate,
	};
}
