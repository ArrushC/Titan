import svnUltimate from "node-svn-ultimate";
import chokidar from "chokidar";
import path from "path";
import fs from "fs";
import { promises as fsPromises } from "fs";
import { uniqBy } from "lodash";
import { 
    debugTask, 
    branchString, 
    branchPathFolder, 
    getAllChildrenRecursively, 
    deletePathRecursively,
    isSVNConnectionError,
    emitMessage,
    emitBranchInfo,
    emitBranchStatus
} from "./utils.mjs";
import { fetchConfig, saveConfig, openConfigFile } from "./config-manager.mjs";
import { getTrelloCardNames, updateTrelloCard } from "./trello.mjs";
import { SVNMonitor } from "./svn-monitor.mjs";

/**
 * Setup Socket.IO handlers
 * @param {Object} io - Socket.IO instance
 * @param {Object} options - Configuration options
 */
export function setupSocketHandlers(io, options) {
    const {
        isDev,
        port,
        frontendPort,
        latestVersion,
        configFilePath,
        targetsFilePath,
        instanceData,
        svnOperations,
        writeTargetsFile,
        saveSvnLogsCache,
        saveCommitLiveResponses,
        logger,
        svnManager,
        socketManager,
        fileWatcher
    } = options;

    // Initialize SVN Monitor (will be updated with config after it's loaded)
    let svnMonitor = null;

    // Helper function to send performance updates
    function sendPerformanceUpdate(socket = null) {
        const metrics = {
            server: instanceData.performanceMonitor.getMetrics(),
            svn: svnManager.getPerformanceMetrics(),
            sockets: socketManager.getMetrics(),
            fileWatcher: fileWatcher.getStats(),
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            health: {
                status: "healthy",
                version: latestVersion
            }
        };

        if (socket) {
            socket.emit("performance-update", metrics);
        } else {
            io.emit("performance-update", metrics);
        }
    }

    // Send performance updates every 5 seconds to all connected monitoring clients
    const performanceInterval = setInterval(() => {
        sendPerformanceUpdate();
    }, 5000);

    // Socket.IO connection handler
    io.on("connection", async (socket) => {
        // Use socket manager
        socketManager.handleConnection(socket);

        const origin = socket.handshake.headers.origin || "";
        const referer = socket.handshake.headers.referer || "";
        const expectedOrigin = isDev ? `http://localhost:${frontendPort}` : `http://localhost:${port}`;

        const isForeignOrigin = !origin.startsWith(expectedOrigin) && !referer.startsWith(expectedOrigin);

        logger.info(`Connected to ${isForeignOrigin ? "foreign" : "titan"} client`);
        emitMessage(socket, "Connected To Server!", "success", 1500);

        const config = await fetchConfig(socket, configFilePath, latestVersion, logger);
        socket.emit("titan-config-get", { config });

        // Initialize SVN Monitor with real config data (only once)
        if (!svnMonitor) {
            svnMonitor = new SVNMonitor(io, logger, config);
        }

        if (!isForeignOrigin) {
            // Titan client handlers
            socket.on("titan-config-set", async (data) => {
                debugTask("titan-config-set", null, false, logger);
                await saveConfig(data, configFilePath, socket, logger);
                
                // Update SVN Monitor with new config
                if (svnMonitor) {
                    svnMonitor.updateConfig(data);
                }
                
                debugTask("titan-config-set", null, true, logger);
            });

            socket.on("titan-config-open", async () => {
                debugTask("titan-config-open", null, false, logger);
                await openConfigFile(configFilePath, socket, logger);
                debugTask("titan-config-open", null, true, logger);
            });

            socket.on("svn-update-single", async (data, callback) => {
                debugTask("svn-update-single", data, false, logger);
                const task = {
                    command: "update",
                    args: [data.branch],
                    postopCallback: function (err, result) {
                        if (err) {
                            logger.error("Failed to execute SVN command: " + task.command);
                            isSVNConnectionError(socket, err, io);
                            if (callback) callback({ success: false, error: err });
                        } else {
                            logger.info("Successfully executed SVN command: " + task.command);
                            
                            // Track update in SVN monitor
                            if (svnMonitor) {
                                svnMonitor.trackUpdate(data.branch, 'HEAD');
                            }
                            
                            if (callback) callback({ success: true });
                            else socket.emit("branch-update-success-single", { id: data.id, branch: data.branch, version: data.version, folder: data.folder });
                        }
                    },
                };
                svnOperations.svnQueueSerial.push(task);
                debugTask("svn-update-single", data, true, logger);
            });

            socket.on("svn-info-single", async (data) => {
                if (!data.branch || data.branch === "") {
                    emitMessage(socket, "Unable to check the status of one or more branches as it is undefined", "error");
                    return;
                } else if (data.folder === "" || data.version === "") {
                    emitMessage(socket, "One of your branches is missing a folder or version", "warning");
                }

                try {
                    // Use SVN manager with caching
                    const branchInfoData = await svnManager.getBranchInfo(data.branch);

                    // Process the cached results
                    const wcRevisionResult = branchInfoData.wcRevision;
                    const infoResult = branchInfoData.info;
                    const logResult = branchInfoData.logs;
                    const statusResult = branchInfoData.status;

                    // Check if there are any conflicts using the status result
                    let conflictsCount = 0;
                    if (statusResult && statusResult.target && statusResult.target.entry) {
                        const entries = Array.isArray(statusResult.target.entry) ? statusResult.target.entry : [statusResult.target.entry];
                        const conflicts = entries.filter((entry) => entry["wc-status"]?.$?.item === "conflicted");
                        if (conflicts.length > 0) {
                            conflictsCount = conflicts.length;
                        }
                    }

                    // Count the number of revisions since the working copy revision
                    let count = 0;
                    if (logResult && logResult.logentry) {
                        let entries = Array.isArray(logResult.logentry) ? logResult.logentry : [logResult.logentry];
                        count = entries.filter((entry) => parseInt(entry["$"].revision) > wcRevisionResult).length;
                    }

                    let branchInfoText = count == 0 ? `Latest${conflictsCount > 0 ? " 🤬" : ""}` : `-${count} Revision${count > 1 ? "s" : ""}${conflictsCount > 0 ? " 🤬" : ""}`;

                    emitBranchInfo(socket, data.id, branchInfoText, infoResult.entry.$.revision);
                } catch (err) {
                    if (isSVNConnectionError(socket, err, io)) {
                        emitBranchInfo(socket, data.id, "Connection Error");
                        return;
                    }
                    if (err.message.includes("svn: E155010")) {
                        emitBranchInfo(socket, data.id, "Not Found");
                        return;
                    }

                    logger.error(`Error executing SVN commands: ${err.message}` + err);
                    emitMessage(socket, `Failed to retrieve info for ${branchString(data.folder, data.version, data.branch)}`, "error");
                }
            });

            socket.on("svn-status-single", async (data) => {
                debugTask("svn-status-single", data, false, logger);

                if (!data.selectedBranch || !data.selectedBranch["SVN Branch"]) {
                    emitMessage(socket, "No branches selected", "error");
                    return;
                }

                const branchPath = data.selectedBranch["SVN Branch"];
                const task = {
                    command: "status",
                    args: [branchPath],
                    options: { quiet: false, params: ["--show-updates"] },
                };

                try {
                    const results = await svnOperations.executeSvnCommand(task);
                    const result = results[0]?.result;

                    let filesToTrack = [];
                    let filesToCommit = [];
                    let filesToUpdate = [];

                    const processBatch = async (batch) => {
                        return Promise.all(
                            batch.map(async (entry) => {
                                const path = String(entry.$.path);
                                try {
                                    const stats = await fsPromises.stat(path);
                                    const isDirectory = stats.isDirectory();
                                    return { entry, path, lastModified: stats?.mtime?.toLocaleString() || new Date().toLocaleString(), type: isDirectory ? "directory" : "file" };
                                } catch (error) {
                                    console.error(`Error retrieving stats for ${path}:`, error.message);
                                    return { entry, path, lastModified: null, type: "unknown" };
                                }
                            })
                        );
                    };

                    // If there are updates to the branch then these result values should not be null or undefined.
                    if (result && result.target && result.target.entry) {
                        const entries = Array.isArray(result.target.entry) ? result.target.entry : [result.target.entry];
                        const pathFilter = `${branchPath}/`.replaceAll("/", "\\");

                        const batchedResults = [];
                        for (let i = 0; i < entries.length; i += 20) {
                            const batch = entries.slice(i, i + 20);
                            const batchResults = await processBatch(batch);
                            batchedResults.push(...batchResults);
                        }

                        batchedResults.forEach(({ entry, path, lastModified, type }) => {
                            const wcStatus = entry["wc-status"]?.$?.item;
                            const reposStatus = entry["repos-status"]?.$?.item || null;
                            const pathDisplay = path.replace(pathFilter, "");

                            const emitData = {
                                path,
                                pathDisplay,
                                wcStatus,
                                reposStatus,
                                lastModified,
                                branchPath,
                                type,
                            };

                            if (wcStatus && !["normal", "none"].includes(wcStatus)) {
                                if (reposStatus && !["normal", "none"].includes(reposStatus)) {
                                    filesToUpdate.push(emitData);
                                } else if (wcStatus === "unversioned" || wcStatus === "missing") {
                                    filesToTrack.push(emitData);
                                } else if (wcStatus !== "external") {
                                    filesToCommit.push(emitData);
                                }
                            }
                        });
                    }

                    // Track file changes for SVN monitor
                    const allChanges = [...filesToTrack, ...filesToCommit, ...filesToUpdate];
                    if (allChanges.length > 0 && svnMonitor) {
                        svnMonitor.trackFileChanges(allChanges);
                    }

                    emitBranchStatus(socket, data.selectedBranch.id, {
                        branch: branchPath,
                        filesToTrack,
                        filesToCommit,
                        filesToUpdate,
                    });
                } catch (err) {
                    logger.error("Error checking SVN status:" + err);
                    if (!isSVNConnectionError(socket, err, io)) emitMessage(socket, `Error checking SVN status for branch ${branchPath}`, "error");
                }

                debugTask("svn-status-single", data, true, logger);
            });

            socket.on("svn-files-revert", async (data) => {
                debugTask("svn-files-revert", data, false, logger);

                if (!data.filesToProcess || Object.keys(data.filesToProcess).length === 0) {
                    emitMessage(socket, "No files to revert", "error");
                    return;
                }

                const { filesToProcess } = data;

                const unversionedDirs = [];
                let unversionedFiles = [];
                const versionedDirs = [];
                let versionedFiles = [];

                for (const fileObj of Object.values(filesToProcess)) {
                    const { wcStatus, path: fullPath, type } = fileObj;
                    if (wcStatus === "unversioned") {
                        if (type === "file") unversionedFiles.push(fileObj);
                        else unversionedDirs.push(fileObj);
                    } else {
                        // If it's not unversioned, we consider it "versioned" (could be modified, added, missing, etc.).
                        if (type === "file") versionedFiles.push(fileObj);
                        else versionedDirs.push(fileObj);
                    }
                }

                unversionedFiles = unversionedFiles.filter((file) => !unversionedDirs.some((dir) => file.path.startsWith(dir.path)));
                versionedFiles = versionedFiles.filter((file) => !versionedDirs.some((dir) => file.path.startsWith(dir.path)));

                // 1) Handle UNVERSIONED files
                if (unversionedFiles.length > 0) {
                    logger.info("Reverting unversioned files -> removing them from filesystem only.");
                    for (const fileObj of unversionedFiles) {
                        await deletePathRecursively(fileObj.path, logger);
                    }
                    emitMessage(socket, "Removed unversioned files from filesystem", "success");

                    // Emit updated statuses: they are effectively "gone," so we mark them as normal.
                    socket.emit("branch-paths-update", {
                        paths: unversionedFiles.map((fileObj) => ({
                            ...fileObj,
                            action: "normal",
                            wcStatus: "normal",
                        })),
                    });
                }

                // 2) Handle UNVERSIONED directories
                if (unversionedDirs.length > 0) {
                    logger.info("Reverting unversioned directories -> removing them (and children) from filesystem only.");

                    for (const dirObj of unversionedDirs) {
                        const children = await getAllChildrenRecursively(dirObj.path);
                        // Delete everything inside the directory
                        for (const childPath of children) {
                            await deletePathRecursively(childPath, logger);
                        }
                    }
                    emitMessage(socket, "Removed unversioned directories from filesystem", "success");

                    // Emit updates for each directory and all children
                    for (const dirObj of unversionedDirs) {
                        const children = await getAllChildrenRecursively(dirObj.path);
                        const updates = children.map((childPath) => ({
                            ...dirObj,
                            path: childPath,
                            pathDisplay: childPath.replace(dirObj.branchPath + path.sep, ""),
                            action: "normal",
                            wcStatus: "normal",
                        }));
                        updates.push({ ...dirObj, action: "normal", wcStatus: "normal" });
                        socket.emit("branch-paths-update", { paths: updates });
                    }
                }

                // 3) Handle VERSIONED files
                if (versionedFiles.length > 0) {
                    const task = {
                        command: "revert",
                        options: {
                            // No depth needed because we are only reverting files, not directories
                            params: [`--targets ${targetsFilePath}`],
                        },
                        preopCallback: async () => {
                            await writeTargetsFile(versionedFiles.map((f) => f.path));
                        },
                        postopCallback: async (err, result) => {
                            if (err) {
                                logger.error("Failed to revert versioned files:" + err);
                                if (!isSVNConnectionError(socket, err, io)) {
                                    emitMessage(socket, "Failed to revert versioned files", "error");
                                }
                            } else {
                                logger.info("Successfully reverted versioned files");
                                emitMessage(socket, "Successfully reverted versioned files", "success");

                                // Finally, emit an update for each file
                                socket.emit("branch-paths-update", {
                                    paths: versionedFiles.map((f) => {
                                        let newStatus = f.wcStatus;
                                        let action = "revert";

                                        if (f.wcStatus === "added") {
                                            // After revert, that file is unversioned if it's still physically there.
                                            newStatus = "unversioned";
                                            action = "untrack";
                                        } else if (f.wcStatus === "deleted") {
                                            // After revert, the file is back to normal if it physically exists.
                                            newStatus = "normal";
                                            action = "normal";
                                        } else if (f.wcStatus === "modified" || f.wcStatus === "conflicted") {
                                            newStatus = "normal";
                                            action = "normal";
                                        } else if (f.wcStatus === "missing") {
                                            // Revert should restore the file to disk => normal.
                                            newStatus = "normal";
                                            action = "normal";
                                        }

                                        return {
                                            ...f,
                                            wcStatus: newStatus,
                                            action,
                                        };
                                    }),
                                });
                            }
                        },
                    };
                    svnOperations.svnQueueSerial.push(task);
                }

                // 4) Handle VERSIONED directories
                if (versionedDirs.length > 0) {
                    const task = {
                        command: "revert",
                        options: {
                            depth: "infinity",
                            params: [`--targets ${targetsFilePath}`],
                        },
                        preopCallback: async () => {
                            await writeTargetsFile(versionedDirs.map((d) => d.path));
                        },
                        postopCallback: async (err, result) => {
                            if (err) {
                                logger.error("Failed to revert versioned directories:" + err);
                                if (!isSVNConnectionError(socket, err, io)) {
                                    emitMessage(socket, "Failed to revert versioned directories", "error");
                                }
                            } else {
                                logger.info("Successfully reverted versioned directories");
                                emitMessage(socket, "Successfully reverted versioned directories (depth=infinity)", "success");

                                // Now we do a BFS/DFS to see if any newly "unversioned" files remain
                                // for those that had been "added." If so, we remove them from disk.
                                // Then we emit final updates for each item we revert or remove.
                                for (const dirObj of versionedDirs) {
                                    try {
                                        const rootAction = dirObj.wcStatus === "added" ? "untrack" : "normal";
                                        const rootWcStatus = dirObj.wcStatus === "added" ? "unversioned" : "normal";

                                        const children = await getAllChildrenRecursively(dirObj.path);
                                        const updates = [];

                                        // Push the root directory update
                                        updates.push({
                                            ...dirObj,
                                            path: dirObj.path,
                                            pathDisplay: dirObj.path.replace(dirObj.branchPath + path.sep, ""),
                                            action: rootAction,
                                            wcStatus: rootWcStatus,
                                        });

                                        for (const childPath of children.filter((p) => p !== dirObj.path)) {
                                            updates.push({
                                                ...dirObj,
                                                path: childPath,
                                                pathDisplay: childPath.replace(dirObj.branchPath + path.sep, ""),
                                                action: "normal",
                                                wcStatus: "normal",
                                            });
                                        }

                                        socket.emit("branch-paths-update", { paths: updates });
                                    } catch (fsErr) {
                                        logger.error(`Error scanning children of versioned directory ${dirObj.path} after revert: ` + fsErr);
                                        emitMessage(socket, "Error scanning children for versioned directories after revert", "error");
                                    }
                                }
                            }
                        },
                    };
                    svnOperations.svnQueueSerial.push(task);
                }
                debugTask("svn-files-revert", data, true, logger);
            });

            socket.on("svn-files-add-delete", async (data) => {
                debugTask("svn-files-add-delete", data, false, logger);

                if (!data.filesToProcess || data.filesToProcess.length === 0) {
                    emitMessage(socket, "No files to add or delete", "error");
                    return;
                }

                const { filesToProcess } = data;
                const unversionedPaths = Object.values(filesToProcess).filter((file) => file.wcStatus == "unversioned");
                const missingPaths = Object.values(filesToProcess).filter((file) => file.wcStatus == "missing");

                // 1) Handle UNVERSIONED paths
                if (unversionedPaths.length > 0) {
                    const unversionedDirs = unversionedPaths.filter((p) => p.type === "directory");
                    const unversionedFiles = unversionedPaths.filter((p) => p.type === "file" && !unversionedDirs.some((d) => p.path.startsWith(d.path)));

                    // 1a) Add unversioned files
                    if (unversionedFiles.length > 0) {
                        let addFilesTask = {
                            command: "add",
                            options: {
                                params: [`--targets ${targetsFilePath}`],
                            },
                            preopCallback: async () => {
                                await writeTargetsFile(unversionedFiles.map((file) => file.path));
                            },
                            postopCallback: (err, result) => {
                                if (err) {
                                    logger.error("Failed to add unversioned files: " + err);
                                    if (!isSVNConnectionError(socket, err, io)) {
                                        emitMessage(socket, "Failed to add unversioned files", "error");
                                    }
                                } else {
                                    logger.info("Successfully added unversioned files");
                                    emitMessage(socket, "Successfully added unversioned files", "success");

                                    // After adding the files, apply the propset
                                    let propTask = {
                                        command: "propset",
                                        args: ["svn:keywords", '"Id Author Date Revision HeadURL"', `--targets ${targetsFilePath}`],
                                        preopCallback: async () => {
                                            // Reuse the same targets file for the set of unversioned files
                                            await writeTargetsFile(unversionedFiles.map((file) => file.path));
                                        },
                                        postopCallback: (err, result) => {
                                            if (err) {
                                                logger.error("Failed to set SVN properties for unversioned files: " + err);
                                                if (!isSVNConnectionError(socket, err, io)) {
                                                    emitMessage(socket, "Failed to set SVN properties for unversioned files", "error");
                                                }
                                            } else {
                                                logger.info("Successfully set SVN properties for unversioned files");
                                                emitMessage(socket, "SVN properties for unversioned files have been set. Please ensure your SVN comments are present so they update automatically.", "warning", 10000);
                                                // Emit paths update for each file
                                                socket.emit("branch-paths-update", {
                                                    paths: unversionedFiles.map((file) => ({
                                                        ...file,
                                                        action: "add",
                                                        wcStatus: "added",
                                                    })),
                                                });
                                            }
                                        },
                                    };
                                    svnOperations.svnQueueSerial.push(propTask);
                                }
                            },
                        };
                        svnOperations.svnQueueSerial.push(addFilesTask);
                    }

                    // 1b) Add unversioned directories
                    if (unversionedDirs.length > 0) {
                        let addDirsTask = {
                            command: "add",
                            options: {
                                depth: "infinity",
                                params: [`--targets ${targetsFilePath}`],
                            },
                            preopCallback: async () => {
                                await writeTargetsFile(unversionedDirs.map((dir) => dir.path));
                            },
                            postopCallback: async (err, result) => {
                                if (err) {
                                    logger.error("Failed to add unversioned directories: " + err);
                                    if (!isSVNConnectionError(socket, err, io)) {
                                        emitMessage(socket, "Failed to add unversioned directories", "error");
                                    }
                                } else {
                                    logger.info("Successfully added unversioned directories (depth=infinity)");
                                    emitMessage(socket, "Successfully added unversioned directories (depth=infinity)", "success");

                                    // Now we do a local filesystem walk to discover
                                    // all children (files + subdirectories).
                                    try {
                                        for (const dir of unversionedDirs) {
                                            const children = await getAllChildrenRecursively(dir.path);

                                            const updates = children.map((child) => ({
                                                ...dir,
                                                path: child,
                                                pathDisplay: child.replace(dir.branchPath + path.sep, ""),
                                                type: fs.lstatSync(child).isDirectory() ? "directory" : "file",
                                                action: "add",
                                                wcStatus: "added",
                                            }));

                                            socket.emit("branch-paths-update", { paths: updates });
                                        }
                                    } catch (fsErr) {
                                        logger.error("Error scanning children of unversioned directories: " + fsErr);
                                        emitMessage(socket, "Error scanning children of unversioned directories", "error");
                                    }
                                }
                            },
                        };
                        svnOperations.svnQueueSerial.push(addDirsTask);
                    }
                }

                // 2) Handle MISSING paths
                if (missingPaths.length > 0) {
                    const missingDirs = missingPaths.filter((p) => p.type === "directory");
                    const missingFiles = missingPaths.filter((p) => p.type === "file" && !missingDirs.some((d) => p.path.startsWith(d.path)));

                    // 2a) Missing files
                    if (missingFiles.length > 0) {
                        let delFilesTask = {
                            command: "del",
                            options: {
                                params: [`--targets ${targetsFilePath}`],
                            },
                            preopCallback: async () => {
                                await writeTargetsFile(missingFiles.map((file) => file.path));
                            },
                            postopCallback: (err, result) => {
                                if (err) {
                                    logger.error("Failed to delete missing files: " + err);
                                    if (!isSVNConnectionError(socket, err, io)) {
                                        emitMessage(socket, "Failed to delete missing files", "error");
                                    }
                                } else {
                                    logger.info("Successfully deleted missing files");
                                    emitMessage(socket, "Successfully deleted missing files", "success");

                                    socket.emit("branch-paths-update", {
                                        paths: missingFiles.map((file) => ({
                                            ...file,
                                            action: "delete",
                                            wcStatus: "deleted",
                                        })),
                                    });
                                }
                            },
                        };
                        svnOperations.svnQueueSerial.push(delFilesTask);
                    }

                    // 2b) Missing directories (depth=infinity)
                    if (missingDirs.length > 0) {
                        let delDirsTask = {
                            command: "del",
                            options: {
                                depth: "infinity",
                                params: [`--targets ${targetsFilePath}`],
                            },
                            preopCallback: async () => {
                                await writeTargetsFile(missingDirs.map((dir) => dir.path));
                            },
                            postopCallback: (err, result) => {
                                if (err) {
                                    logger.error("Failed to delete missing directories: " + err);
                                    if (!isSVNConnectionError(socket, err, io)) {
                                        emitMessage(socket, "Failed to delete missing directories", "error");
                                    }
                                } else {
                                    logger.info("Successfully deleted missing directories (depth=infinity)");
                                    emitMessage(socket, "Successfully deleted missing directories (depth=infinity)", "success");

                                    // Since the directories are missing on disk, there's nothing local to walk.
                                    // Just emit the directories themselves.
                                    socket.emit("branch-paths-update", {
                                        paths: missingDirs.map((dir) => ({
                                            ...dir,
                                            action: "delete",
                                            wcStatus: "deleted",
                                        })),
                                    });
                                }
                            },
                        };
                        svnOperations.svnQueueSerial.push(delDirsTask);
                    }
                }

                debugTask("svn-files-add-delete", data, true, logger);
            });

            socket.on("watcher-branches-update", async (data) => {
                debugTask("watcher-branches-update", data, false, logger);

                const selectedBranchPaths = data?.selectedBranchPaths || [];
                const ignoredUnknownPaths = Array.isArray(data?.ignoredUnknownPaths) ? data.ignoredUnknownPaths : [];
                const ignoredModifiedPaths = Array.isArray(data?.ignoredModifiedPaths) ? data.ignoredModifiedPaths : [];

                try {
                    // Use file watcher if available
                    if (fileWatcher && typeof fileWatcher.updateWatchers === 'function') {
                        await fileWatcher.updateWatchers(selectedBranchPaths, {
                            ignoredPaths: [...ignoredUnknownPaths, ...ignoredModifiedPaths],
                            onFileChange: (changes, branchPath) => {
                                // Process and emit batched changes
                                const paths = changes.map(change => ({
                                    path: change.path,
                                    pathDisplay: change.path.replace(`${branchPath}\\`, ""),
                                    wcStatus: change.svnStatus?.wcStatus,
                                    reposStatus: change.svnStatus?.reposStatus,
                                    lastModified: change.stats?.mtime?.toLocaleString() || new Date().toLocaleString(),
                                    branchPath,
                                    type: change.type === 'addDir' || change.type === 'unlinkDir' ? 'directory' : 'file',
                                    action: change.type
                                }));

                                if (socketManager && typeof socketManager.batchEmit === 'function') {
                                    socketManager.batchEmit("branch-paths-update", { paths }, socket.id);
                                } else {
                                    // Fallback to regular socket emit
                                    socket.emit("branch-paths-update", { paths });
                                }
                            }
                        });
                    }
                } catch (optimizedError) {
                    logger.warn("File watcher failed, falling back to original implementation:", optimizedError);
                }

                // Fallback to original implementation if file watcher unavailable
                const currentBranches = Object.keys(instanceData.branchWatchers);
                const newSelections = selectedBranchPaths || [];

                // 1. Unwatch branches no longer selected
                for (const oldBranchPath of currentBranches) {
                    if (!newSelections.includes(oldBranchPath)) {
                        logger.info(`Stopping watcher for branch: ${oldBranchPath}`);
                        await instanceData.branchWatchers[oldBranchPath].close();
                        delete instanceData.branchWatchers[oldBranchPath];
                    }
                }

                const handleFsEvent = (branchPath, type, filePath, stats) => {
                    const task = {
                        command: "status",
                        args: [filePath],
                        options: { quiet: false, params: ["--show-updates"] },
                    };

                    logger.debug(`Checking SVN status for ${filePath}`);

                    svnOperations.executeSvnCommand(task)
                        .then((results) => {
                            const result = results[0]?.result;

                            logger.info("Result:" + JSON.stringify(result, null, 4));

                            const entry = result?.target?.entry;
                            const wcStatus = entry?.["wc-status"]?.$?.item || null;
                            const reposStatus = entry?.["repos-status"]?.$?.item || null;
                            const pathDisplay = filePath.replace(`${branchPath}/`.replaceAll("/", "\\"), "");
                            const lastModified = stats?.mtime ? stats.mtime.toLocaleString() : new Date().toLocaleString();

                            const emitData = {
                                path: filePath,
                                pathDisplay,
                                wcStatus,
                                reposStatus,
                                lastModified,
                                branchPath,
                                type,
                            };

                            let action = "normal";

                            if (emitData.wcStatus && emitData.reposStatus && !["normal", "none"].includes(emitData.wcStatus) && !["normal", "none"].includes(emitData.reposStatus)) {
                                action = "conflict";
                            } else if (emitData.wcStatus === "unversioned" || emitData.wcStatus === "missing") {
                                action = "untrack";
                            } else if (emitData.wcStatus === "added") {
                                action = "add";
                            } else if (emitData.wcStatus === "deleted") {
                                action = "delete";
                            } else if (emitData.wcStatus === "modified") {
                                action = "modify";
                            }

                            logger.info(`Emitting branch-paths-update for ${filePath} with action ${action}`);

                            socket.emit("branch-paths-update", {
                                paths: [
                                    {
                                        ...emitData,
                                        action,
                                    },
                                ],
                            });
                        })
                        .catch((err) => {
                            logger.error("Error checking SVN status:" + err);
                            if (!isSVNConnectionError(socket, err, io)) emitMessage(socket, `Error checking SVN status for branch ${branchPath}`, "error");
                        });
                };

                // 2. Create watchers for newly selected branches
                for (const branchPath of newSelections) {
                    if (instanceData.branchWatchers[branchPath]) continue;

                    logger.info(`Creating watcher for branch: ${branchPath}`);
                    const watcher = chokidar.watch(branchPath, {
                        ignored: [/(^|[\/\\])\../, ...ignoredUnknownPaths.map((path) => new RegExp(path)), ...ignoredModifiedPaths.map((path) => new RegExp(path))],
                        persistent: true,
                        ignoreInitial: true,
                        usePolling: false,
                    });

                    watcher
                        .on("add", (filePath, stats) => {
                            logger.info(`File added: ${filePath}`);
                            handleFsEvent(branchPath, "file", filePath, stats);
                        })
                        .on("change", (filePath, stats) => {
                            logger.info(`File changed: ${filePath}`);
                            handleFsEvent(branchPath, "file", filePath, stats);
                        })
                        .on("unlink", (filePath, stats) => {
                            logger.info(`File removed: ${filePath}`);
                            handleFsEvent(branchPath, "file", filePath, stats);
                        })
                        .on("addDir", (dirPath, stats) => {
                            logger.info(`Directory added: ${dirPath}`);
                            watcher.add(dirPath);
                            handleFsEvent(branchPath, "directory", dirPath, stats);
                        })
                        .on("unlinkDir", (dirPath, stats) => {
                            logger.info(`Directory removed: ${dirPath}`);
                            watcher.unwatch(dirPath);
                            handleFsEvent(branchPath, "directory", dirPath, stats);
                        })
                        .on("error", (error) => {
                            logger.error(`Watcher error on branch ${branchPath}: ${error}`);
                        })
                        .on("ready", () => {
                            logger.info(`Watcher ready: now monitoring ${branchPath}`);
                        });

                    instanceData.branchWatchers[branchPath] = watcher;
                }

                debugTask("watcher-branches-update", data, true, logger);
            });

            socket.on("svn-commit", async (data) => {
                debugTask("svn-commit", data, false, logger);

                instanceData.commitLiveResponses = [];
                const { issueNumber, sourceBranch, sourceIssueNumber, commitMessage, selectedModifiedChanges, selectedBranchProps } = data;

                const filesByBranch = {};
                for (const [filePath, fileData] of Object.entries(selectedModifiedChanges)) {
                    const branchPath = fileData.branchPath;
                    if (!filesByBranch[branchPath]) {
                        filesByBranch[branchPath] = {
                            branchFolder: selectedBranchProps[branchPath].folder,
                            branchVersion: selectedBranchProps[branchPath].version,
                            files: [],
                        };
                    }
                    filesByBranch[branchPath].files.push(filePath);
                }

                for (const [svnBranch, branchStatus] of Object.entries(filesByBranch)) {
                    const { branchFolder, branchVersion, files } = branchStatus;
                    let originalMessage = "";
                    if (sourceBranch.trim() !== "") {
                        originalMessage = `(${sourceBranch.trim()}${sourceIssueNumber !== "" && branchFolder !== sourceBranch ? ` #${sourceIssueNumber}` : ""})`;
                    }

                    let branchIssueNumber = issueNumber[branchFolder] || sourceIssueNumber;
                    const finalCommitMessage = `Issue ${branchIssueNumber} ${originalMessage}: ${commitMessage
                        .trim()
                        .replace(/\s*\n+\s*/g, "; ")
                        .replace(/[;\s]+$/, "")
                        .trim()}`;

                    const task = {
                        command: "commit",
                        options: {
                            msg: finalCommitMessage,
                            params: [`--targets ${targetsFilePath}`],
                        },
                        preopCallback: async () => {
                            await writeTargetsFile(files);
                        },
                        postopCallback: async (err, result) => {
                            if (err) {
                                if (!isSVNConnectionError(socket, err, io)) {
                                    logger.debug(`Files by Branch: ${JSON.stringify(filesByBranch, null, 2)}`);
                                    logger.debug(`SVN Branch: ${svnBranch}`);
                                    logger.debug(`Issue Number: ${issueNumber}`);
                                    logger.debug(`Commit Message: ${commitMessage}`);
                                    logger.debug(`Final Commit Message: ${finalCommitMessage}`);
                                    logger.debug(`Files to Commit: ${JSON.stringify(files, null, 2)}`);
                                    logger.error(`Failed to commit files in ${svnBranch}:` + err);
                                    emitMessage(socket, `Failed to commit files in ${branchString(branchFolder, branchVersion, svnBranch)}`, "error");

                                    const liveResponse = {
                                        branchIssueNumber,
                                        branchFolder,
                                        branchVersion,
                                        svnBranch,
                                        branchPathFolder: branchPathFolder(svnBranch),
                                        branchString: branchString(branchFolder, branchVersion, svnBranch),
                                        commitMessage: finalCommitMessage,
                                        revision: null,
                                        errorMessage: err.message,
                                        bulkCommitLength: Object.entries(filesByBranch).length,
                                    };

                                    io.emit("svn-commit-live", liveResponse);
                                    instanceData.commitLiveResponses.push(liveResponse);
                                }
                            } else {
                                logger.info(`Successfully committed files in ${svnBranch}`);
                                emitMessage(socket, `Successfully committed files in ${branchString(branchFolder, branchVersion, svnBranch)}`, "success");

                                const revision = svnOperations.extractRevisionNumber(result[0].result);
                                const liveResponse = {
                                    branchIssueNumber,
                                    branchFolder,
                                    branchVersion,
                                    svnBranch,
                                    branchPathFolder: branchPathFolder(svnBranch),
                                    branchString: branchString(branchFolder, branchVersion, svnBranch),
                                    commitMessage: finalCommitMessage,
                                    revision,
                                    bulkCommitLength: Object.entries(filesByBranch).length,
                                };

                                // Track commit in SVN monitor
                                if (svnMonitor) {
                                    svnMonitor.trackCommit(revision, finalCommitMessage, files, svnBranch);
                                }

                                io.emit("svn-commit-live", liveResponse);
                                instanceData.commitLiveResponses.push(liveResponse);

                                socket.emit("branch-paths-update", {
                                    paths: files.map((f) => ({
                                        path: f,
                                        branchPath: svnBranch,
                                        action: "normal",
                                        wcStatus: "normal",
                                    })),
                                });
                            }

                            if (instanceData.commitLiveResponses.length === Object.entries(filesByBranch).length) {
                                saveCommitLiveResponses();
                            }
                        },
                    };

                    svnOperations.svnQueueSerial.push(task);
                }

                debugTask("svn-commit", data, true, logger);
            });

            socket.on("svn-logs-selected", async (data) => {
                debugTask("svn-logs-selected", data, false, logger);

                if (!data.selectedBranches || data.selectedBranches.length === 0) {
                    emitMessage(socket, "No branches selected", "error");
                    return;
                }

                // We will run `info` first to get repository root, then `log`.
                const infoTasks = data.selectedBranches.map((branch) => {
                    return new Promise((resolve, reject) => {
                        const svnBranchPath = branch["SVN Branch"];
                        svnUltimate.commands.info(svnBranchPath, (err, infoResult) => {
                            if (err) {
                                logger.error(`Failed to fetch info for branch ${svnBranchPath}:` + err);
                                if (!isSVNConnectionError(socket, err, io)) emitMessage(socket, `Failed to fetch info for branch ${svnBranchPath}`, "error");
                                return reject(err);
                            }

                            const repositoryUrl = infoResult?.entry?.url;
                            const repositoryRoot = infoResult?.entry?.repository?.root;
                            resolve({ branch, repositoryUrl, repositoryRoot });
                        });
                    });
                });

                try {
                    const branchesWithRoot = await Promise.all(infoTasks);

                    // Now run `log` for each branch, using the repositoryRoot data we just collected.
                    const logTasks = branchesWithRoot.map((branchData) => {
                        const { branch, repositoryUrl, repositoryRoot } = branchData;
                        const svnBranchPath = branch["SVN Branch"];

                        // Check cache and define startRevision as before
                        const cachedLogs = instanceData.subversionLogsCache[svnBranchPath] || [];
                        let startRevision = 1;
                        if (cachedLogs && cachedLogs.length > 0) {
                            const isDifferentRemote = !cachedLogs[0].repositoryUrl || cachedLogs[0].repositoryUrl !== repositoryUrl;
                            const lastKnownRevision = parseInt(cachedLogs[0].revision, 10);
                            startRevision = Number.isNaN(lastKnownRevision) || isDifferentRemote ? 1 : lastKnownRevision + 1;
                            if (isDifferentRemote) instanceData.subversionLogsCache[svnBranchPath] = [];
                        }

                        return new Promise((resolve, reject) => {
                            svnUltimate.commands.log(svnBranchPath, { revision: `${startRevision}:HEAD`, params: ["--stop-on-copy", "--verbose"] }, (err, logResult) => {
                                if (err) {
                                    if (err.message.includes("E160006")) {
                                        logger.info(`No new logs for branch ${svnBranchPath}`);
                                        return resolve();
                                    }
                                    logger.error(`Failed to fetch logs for branch ${svnBranchPath}:` + err);
                                    if (!isSVNConnectionError(socket, err, io)) emitMessage(socket, `Failed to fetch logs for branch ${svnBranchPath}`, "error");
                                    return reject(err);
                                }

                                const logs = logResult.logentry || [];
                                const logsArray = Array.isArray(logs) ? logs : [logs];
                                const fetchedLogs = logsArray.map((entry) => {
                                    let filesChanged = [];
                                    if (entry.paths && entry.paths.path) {
                                        let pathEntries = Array.isArray(entry.paths.path) ? entry.paths.path : [entry.paths.path];
                                        filesChanged = pathEntries.map((p) => ({
                                            path: p._,
                                            kind: p.$.kind,
                                            action: p.$.action,
                                        }));
                                    }

                                    return {
                                        revision: entry["$"].revision,
                                        branchId: branch.id,
                                        branchFolder: branch["Branch Folder"],
                                        branchVersion: branch["Branch Version"],
                                        author: entry.author,
                                        message: entry.msg,
                                        date: new Date(entry.date).toLocaleString("en-GB"),
                                        filesChanged,
                                        repositoryRoot: repositoryRoot,
                                        repositoryUrl: repositoryUrl,
                                    };
                                });

                                fetchedLogs.sort((a, b) => parseInt(b.revision, 10) - parseInt(a.revision, 10));

                                if (fetchedLogs.length > 0) {
                                    const combinedLogs = [...fetchedLogs, ...cachedLogs];
                                    const uniqueLogs = uniqBy(combinedLogs, "revision");
                                    uniqueLogs.sort((a, b) => parseInt(b.revision, 10) - parseInt(a.revision, 10));
                                    instanceData.subversionLogsCache[svnBranchPath] = uniqueLogs;
                                }

                                socket.emit("svn-log-result", { ...branch, logs: instanceData.subversionLogsCache[svnBranchPath] });
                                resolve();
                            });
                        });
                    });

                    // Execute all log tasks in parallel
                    await Promise.all(logTasks);
                    await saveSvnLogsCache();
                } catch (err) {
                    logger.error("Error fetching SVN logs with repository root:" + err);
                    if (!isSVNConnectionError(socket, err, io)) emitMessage(socket, "Error fetching SVN logs with repository root", "error");
                }

                debugTask("svn-logs-selected", data, true, logger);
            });

            socket.on("svn-logs-flush", async (data) => {
                debugTask("svn-logs-flush", data, false, logger);

                instanceData.subversionLogsCache = {};
                await saveSvnLogsCache();

                emitMessage(socket, "Successfully cleared SVN logs cache", "success");

                debugTask("svn-logs-flush", data, true, logger);
            });

            socket.on("trello-search-names-card", async (data, callback) => {
                debugTask("trello-search-names-card", data, false, logger);

                if (!data.query || data.query === "") {
                    emitMessage(socket, "No search query provided", "error");
                    return;
                }

                if (!data.key || data.key === "" || data.key === "TRELLO_API_KEY" || !data.token || data.token === "" || data.token === "TRELLO_TOKEN") {
                    emitMessage(socket, "Trello API key and token are required for this function", "error");
                    return;
                }

                const limit = data.limit || 50;

                try {
                    const cards = await getTrelloCardNames(data.key, data.token, data.query, limit, logger);
                    if (callback) callback({ cards });
                    else socket.emit("trello-result-search-names-card", cards);
                } catch (err) {
                    logger.error("Error fetching Trello card names:" + JSON.stringify(err, null, 2));
                    emitMessage(socket, "Error fetching Trello card names", "error");
                }

                debugTask("trello-search-names-card", data, true, logger);
            });

            socket.on("trello-update-card", async (data) => {
                debugTask("trello-update-card", data, false, logger);

                const { trelloData, commitResponses, commitMessage = "" } = data;

                if (!trelloData || !trelloData.id || !trelloData.name || !trelloData.lastActivityDate || !trelloData.url || !trelloData.boardId || !trelloData.checklistIds || !trelloData.checklists || !trelloData.key || !trelloData.token) {
                    emitMessage(socket, "Trello data is missing required fields", "error");
                    return;
                }

                const { key, token } = trelloData;

                if (key === "" || key === "TRELLO_API_KEY" || token === "" || token === "TRELLO_TOKEN") {
                    emitMessage(socket, "Trello API key and token are required for this function", "error");
                    return;
                }

                if (!commitResponses || commitResponses.length === 0) {
                    emitMessage(socket, "No commit responses provided", "error");
                    return;
                }

                const result = await updateTrelloCard(key, token, trelloData, commitResponses, commitMessage, logger);
                if (result) {
                    emitMessage(socket, "Successfully updated Trello card", "success");
                } else {
                    logger.error(`Failed to update Trello card: ${result}`);
                    emitMessage(socket, "Failed to update Trello card", "error");
                }

                debugTask("trello-update-card", data, true, logger);
            });
        }

        // External socket handlers (both foreign and titan clients)
        socket.on("external-svn-commits-get", async () => {
            debugTask("external-svn-commits-get", null, false, logger);
            logger.debug("External commits to be sent: " + JSON.stringify(instanceData.commitLiveResponses, null, 4));
            socket.emit("external-svn-commits-get", instanceData.commitLiveResponses);
            debugTask("external-svn-commits-get", null, true, logger);
        });

        socket.on("external-autofill-issue-numbers", async (data) => {
            debugTask("external-autofill-issue-numbers", data, false, logger);
            io.emit("external-autofill-issue-numbers", data);
            debugTask("external-autofill-issue-numbers", data, true, logger);
        });

        socket.on("client-log", (data) => {
            let { logType, logMessage } = data;
            logger.log(logType, `Client Message - ${logMessage}}`);
        });

        socket.on("disconnect", () => {
            logger.info("Client disconnected");
        });

        // On reconnect
        socket.on("reconnect", async () => {
            logger.info("Client reconnected");
        });

        // Performance monitoring socket events
        socket.on("request-performance-data", () => {
            sendPerformanceUpdate(socket);
        });

        // SVN Dashboard socket events
        if (svnMonitor) {
            svnMonitor.setupSocketHandlers(socket);
        }
    });

    // Cleanup function
    function cleanup() {
        clearInterval(performanceInterval);
        if (svnMonitor) {
            svnMonitor.cleanup();
        }
    }

    return {
        cleanup
    };
}