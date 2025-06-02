import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import _ from "lodash";

/**
 * Debug logging for tasks
 * @param {string} taskName - Name of the task
 * @param {*} data - Data to log
 * @param {boolean} isEnd - Whether this is the end of the task
 * @param {Object} logger - Logger instance
 */
export function debugTask(taskName, data, isEnd, logger) {
    logger.debug(`${isEnd ? "END" : "START"} Function: ${taskName}${isEnd ? "" : ",Data: " + JSON.stringify(data, null, 2)}`);
}

/**
 * Create a branch string representation
 * @param {string} branchFolder - Branch folder name
 * @param {string} branchVersion - Branch version
 * @param {string} branch - Branch path
 * @returns {string} Formatted branch string
 */
export function branchString(branchFolder, branchVersion, branch) {
    return `${branchFolder == "" ? "Uncategorised" : branchFolder} ${branchVersion == "" ? "Unversioned" : branchVersion} ${String(branch).split("\\").at(-1)}`;
}

/**
 * Get the folder name from branch path
 * @param {string} branch - Branch path
 * @returns {string} Branch folder name
 */
export function branchPathFolder(branch) {
    return String(branch).split("\\").at(-1);
}

/**
 * Recursively retrieve all descendant files and directories under a given directory.
 * Returns an array of absolute paths for all nested files and subfolders.
 * @param {string} rootPath - Root directory path
 * @returns {Promise<string[]>} Array of all file and directory paths
 */
export async function getAllChildrenRecursively(rootPath) {
    const results = [];
    const queue = [rootPath];

    while (queue.length > 0) {
        const currentPath = queue.shift(); // Dequeue (FIFO)

        try {
            // Check if currentPath is actually a directory
            const stats = await fsPromises.lstat(currentPath);

            // Push every encountered path (file or directory) to results
            results.push(currentPath);

            if (stats.isDirectory()) {
                // Read contents of the directory
                const entries = await fsPromises.readdir(currentPath, { withFileTypes: true });

                // Add each child to the queue for later processing
                for (const entry of entries) {
                    const childPath = path.join(currentPath, entry.name);
                    queue.push(childPath);
                }
            }
        } catch (err) {
            // For example, ENOENT (no such file), EPERM (no permission), etc.
            console.error(`Error accessing "${currentPath}": ${err.message}`);
        }
    }

    return results;
}

/**
 * Recursively deletes a folder (with all children) or a single file.
 * @param {string} targetPath - Path to delete
 * @param {Object} logger - Logger instance
 */
export async function deletePathRecursively(targetPath, logger) {
    try {
        const stats = await fsPromises.lstat(targetPath);
        if (stats.isDirectory()) {
            await fsPromises.rm(targetPath, { recursive: true, force: true });
        } else {
            await fsPromises.unlink(targetPath);
        }
        logger.debug(`Local path removed: ${targetPath}`);
    } catch (err) {
        logger.error(`Error removing local path ${targetPath}: ${err}`);
    }
}

/**
 * Create a debounced file writer for targets file
 * @param {string} targetsFilePath - Path to targets file
 * @param {Object} logger - Logger instance
 * @returns {Function} Debounced write function
 */
export function createTargetsFileWriter(targetsFilePath, logger) {
    return _.debounce(async (targets = []) => {
        try {
            await fsPromises.mkdir(path.dirname(targetsFilePath), { recursive: true });
            await fsPromises.writeFile(targetsFilePath, targets.join("\n"));
        } catch (err) {
            logger.error("Error writing targets file:", err);
        }
    }, 100);
}

/**
 * Create a debounced SVN logs cache writer
 * @param {string} svnLogsCacheFilePath - Path to SVN logs cache file
 * @param {Object} instanceData - Instance data containing subversionLogsCache
 * @param {Object} logger - Logger instance
 * @returns {Function} Debounced save function
 */
export function createSvnLogsCacheSaver(svnLogsCacheFilePath, instanceData, logger) {
    return _.debounce(async () => {
        try {
            await fsPromises.mkdir(path.dirname(svnLogsCacheFilePath), { recursive: true });
            await fsPromises.writeFile(svnLogsCacheFilePath, JSON.stringify(instanceData.subversionLogsCache, null, 4));
        } catch (err) {
            logger.error("Error writing SVN logs cache file:", err);
        }
    }, 5000);
}

/**
 * Create a debounced commit live responses writer
 * @param {string} commitLiveResponsesFilePath - Path to commit live responses file
 * @param {Object} instanceData - Instance data containing commitLiveResponses
 * @param {Object} logger - Logger instance
 * @returns {Function} Debounced save function
 */
export function createCommitLiveResponsesSaver(commitLiveResponsesFilePath, instanceData, logger) {
    return _.debounce(async () => {
        try {
            await fsPromises.mkdir(path.dirname(commitLiveResponsesFilePath), { recursive: true });
            await fsPromises.writeFile(commitLiveResponsesFilePath, JSON.stringify(instanceData.commitLiveResponses, null, 4));
        } catch (err) {
            logger.error("Error writing commit live responses file:", err);
        }
    }, 5000);
}

/**
 * Check if error is an SVN connection error
 * @param {Object} socket - Socket instance
 * @param {Error} err - Error object
 * @param {Object} io - Socket.IO instance
 * @returns {boolean} True if connection error
 */
export function isSVNConnectionError(socket, err, io) {
    if (err?.message?.includes("svn: E170013") || err?.message?.includes("svn: E731001")) {
        io.emit("svn-connection-error", "Unable to connect to the SVN repository!");
        return true;
    }
    return false;
}

/**
 * Emit a notification message to socket
 * @param {Object} socket - Socket instance
 * @param {string} description - Message description
 * @param {string} type - Message type (info, error, success, warning)
 * @param {number} duration - Display duration in ms
 */
export function emitMessage(socket, description, type = "info", duration = 3000) {
    socket.emit("notification", { description, type, duration: type == "error" ? 0 : duration });
}

/**
 * Emit branch info to socket
 * @param {Object} socket - Socket instance
 * @param {string} branchId - Branch ID
 * @param {Object} branchInfo - Branch info object
 * @param {string} baseRevision - Base revision
 */
export function emitBranchInfo(socket, branchId, branchInfo, baseRevision) {
    socket.emit("branch-info-single", { id: branchId, info: branchInfo, baseRevision });
}

/**
 * Emit branch status to socket
 * @param {Object} socket - Socket instance
 * @param {string} branchId - Branch ID
 * @param {Object} branchStatus - Branch status object
 */
export function emitBranchStatus(socket, branchId, branchStatus) {
    socket.emit("branch-status-single", { id: branchId, status: branchStatus });
}