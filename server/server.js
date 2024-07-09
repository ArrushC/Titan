import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import async from "async";
import svnUltimate from "node-svn-ultimate";
import { setupLogger, setupUncaughtExceptionHandler } from "./logger.js";
import compression from "compression";

// Import package.json
import packageJson from "../package.json" assert { type: "json" };

// Create a logger instance
const logger = setupLogger("server.js");
setupUncaughtExceptionHandler(logger);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

const latestVersion = packageJson.version;
const configPath = "C:/ATHive/Titan.config.json";

// Use compression middleware
app.use(compression());

// Set correct MIME type for JavaScript modules
app.use((req, res, next) => {
	if (req.url.endsWith(".js")) {
		res.type("application/javascript");
	}
	next();
});

// Serve static files from the React app
app.use(
	express.static(path.join(__dirname, "../dist"), {
		setHeaders: (res, path) => {
			if (path.endsWith(".js")) {
				res.setHeader("Content-Type", "application/javascript");
			}
		},
	})
);

/************************************
 * Logger Utilities
 ************************************/
function debugTask(taskName, data, isEnd) {
	logger.debug(`${isEnd ? "END" : "START"} Function: ${taskName}${isEnd ? "" : ",Data: " + JSON.stringify(data, null, 2)}`);
}

function branchString(branchFolder, branchVersion, branch) {
	return `${branchFolder == "" ? "Uncategorised" : branchFolder} ${branchVersion == "" ? "Unversioned" : branchVersion} ${String(branch).split("\\").at(-1)}`;
}

function branchPathFolder(branch) {
	return String(branch).split("\\").at(-1);
}

/************************************
 * File System Utilities
 ************************************/
async function deleteFileOrDirectory(pathToDelete) {
	try {
		const stats = await fs.lstat(pathToDelete);

		if (stats.isFile()) {
			await fs.unlink(pathToDelete);
			logger.debug("File deleted successfully!");
		} else if (stats.isDirectory()) {
			await fs.rmdir(pathToDelete, { recursive: true });
			logger.debug("Directory deleted successfully!");
		} else {
			logger.error("Path is not a file or directory.");
		}
	} catch (err) {
		logger.error("Error deleting file/directory:", err);
	}
}

/************************************
 * Asynchronous SVN Logic
 ************************************/
function executeSvnCommand(commands) {
	if (!Array.isArray(commands)) {
		commands = [commands]; // Wrap the single command object in an array for uniform processing
	}

	return Promise.all(
		commands.map(
			(cmd) =>
				new Promise((resolve, reject) => {
					const args = Array.isArray(cmd.args) ? cmd.args : [cmd.args];
					const options = cmd.options || {};

					args.push(options);

					const callback = (err, result) => {
						if (err) {
							logger.error(`Error executing SVN operation ${cmd.command} with args ${args}:`, err);
							return reject(err);
						}
						resolve({ command: cmd.command, result });
					};

					// Check whether to execute a utility command or a regular SVN command
					if (cmd.isUtilityCmd) {
						// Handle utility commands
						if (typeof svnUltimate.util[cmd.command] !== "function") {
							return reject(new Error(`Invalid SVN utility command: ${cmd.command}`));
						}
						svnUltimate.util[cmd.command](...args, callback);
					} else {
						// Handle regular SVN commands
						if (typeof svnUltimate.commands[cmd.command] !== "function") {
							return reject(new Error(`Invalid SVN command: ${cmd.command}`));
						}
						svnUltimate.commands[cmd.command](...args, callback);
					}
				})
		)
	);
}

const svnQueueSerial = async.queue(async (task) => {
	debugTask("svnQueueSerial", task, false);
	const { command, args } = task;

	try {
		const result = await executeSvnCommand(task);
		logger.debug(`SVN command ${command} output:\n` + typeof result === "string" ? result : JSON.stringify(result, null, 4));
		task.callback(null, result);
	} catch (err) {
		logger.error(`Error executing SVN command ${command} with args ${args}:`, err);
		task.callback(err);
	}

	debugTask("svnQueueSerial", task, true);

	// 2 seconds delay between each task to prevent flooding the SVN server
	await new Promise((resolve) => setTimeout(resolve, 2000));
}, 1); // Concurrency of 1 ensures tasks are executed sequentially

// Handle job completion
svnQueueSerial.drain(() => {
	logger.info("All SVN tasks have been processed sequentially.");
});

/**
 * Extracts the revision number from the commit result which is usually a string message.
 * @param {String} commitResult The result of the commit operation
 * @returns {String | null} The revision number extracted from the commit result
 */
function extractRevisionNumber(commitResult) {
	const revisionMatch = String(commitResult).match(/Committed revision (\d+)/);
	return revisionMatch ? String(revisionMatch[1]) : null;
}

/**
 * Sanitizes the commit message by removing any newline, carriage return, tab, backspace, and form feed characters.
 * @param {String} commitMessage The commit message to sanitize
 * @returns {String} The sanitized commit message
 */
function sanitizeCommitMessage(commitMessage) {
	return commitMessage.replaceAll(/[\n\r\t\b\f]/g, " ").trim();
}

/************************************
 * Socket IO Logic
 ************************************/
function emitMessage(socket, description, status = "info", duration = 3000) {
	socket.emit("notification", { description: description, status: status, duration: status == "error" ? 0 : duration });
}

function emitBranchInfo(socket, branchId, branchInfo) {
	socket.emit("branch-info-single", { id: branchId, info: branchInfo });
}

function emitBranchStatus(socket, branchId, branchStatus) {
	socket.emit("branch-status-single", { id: branchId, status: branchStatus });
}

function isSVNConnectionError(socket, err) {
	if (err?.message?.includes("svn: E170013: Unable to connect to a repository at URL") || err?.message?.includes("svn: E731001")) {
		emitMessage(socket, `You have either been disconnected from the site hosting the SVN repository or are unnable to connect to it. Disconnecting from Titan until this issue is resolved`, "error");
		io.emit("svn-connection-error", "SVN connection error detected. The server will shut down.");

		// Gracefully shut down the server
		gracefulShutdown("SVN Connection Error");
		return true;
	}
	return false;
}

/************************************
 * Socket IO Logic
 ************************************/
async function sendConfig(socket) {
	let config = null;

	try {
		await fs.mkdir(path.dirname(configPath), { recursive: true });
		await fs.access(configPath);
	} catch (err) {
		const defaultConfig = { currentVersion: latestVersion, branches: [], branchFolderColours: {} };
		await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 4));
		emitMessage(socket, "Config file created with default content", "success");
	}

	try {
		const data = await fs.readFile(configPath, "utf8");
		config = JSON.parse(data);
		if (!config.currentVersion || config.currentVersion !== latestVersion) {
			logger.info(`Updating config file with latest version - v${config.currentVersion || "-1"} -> v${latestVersion}`);
			config.currentVersion = latestVersion;
			await fs.writeFile(configPath, JSON.stringify(config, null, 4));
			emitMessage(socket, "Config file updated with latest version", "success");
		}
	} catch (err) {
		logger.error(err);
		emitMessage(socket, "Error reading config file", "error");
		return;
	}

	socket.emit("get-Config", config);
}

io.on("connection", (socket) => {
	logger.info("Connected to client!");
	emitMessage(socket, "Connected To Server!", "success", 2000);

	socket.on("get-Config", async (data) => {
		debugTask("get-Config", data, false);
		if (data === "fetch") {
			await sendConfig(socket);
		}
		debugTask("get-Config", data, true);
	});

	socket.on("set-Config", async (data) => {
		debugTask("set-Config", data, false);
		try {
			await fs.writeFile(configPath, JSON.stringify(data, null, 4));
			emitMessage(socket, "Config file updated", "success");
		} catch (err) {
			logger.error(err);
			emitMessage(socket, "Error updating config file", "error");
		}
		debugTask("set-Config", data, true);
	});

	socket.on("svn-update-single", async (data) => {
		debugTask("svn-update-single", data, false);
		const task = {
			command: "update",
			args: [data.branch],
			callback: function (err, result) {
				if (err) {
					logger.error("Failed to execute SVN command: " + task.command);
					if (!isSVNConnectionError(socket, err)) {
						emitMessage(socket, `Failed to update ${branchString(data.folder, data.version, data.branch)}`, "error");
					}
				} else {
					logger.info("Successfully executed SVN command: " + task.command);
					emitMessage(socket, `Successfully updated ${branchString(data.folder, data.version, data.branch)}`, "success");
					socket.emit("branch-success-single", { id: data.id, branch: data.branch, version: data.version, folder: data.folder });
				}
			},
		};
		svnQueueSerial.push(task);
		debugTask("svn-update-single", data, true);
	});

	socket.on("svn-info-single", async (data) => {
		// debugTask("svn-info-single", data, false);
		if (!data.branch || data.branch === "") {
			emitMessage(socket, "Unable to check the status of one or more branches as it is undefined", "error");
			return;
		} else if (data.folder === "" || data.version === "") {
			emitMessage(socket, "One of your branches is missing a folder or version", "warning");
		}

		const tasks = [
			{ command: "getWorkingCopyRevision", args: [data.branch], isUtilityCmd: true },
			{ command: "log", args: [data.branch], options: { revision: "BASE:HEAD" } },
		];

		try {
			const results = await executeSvnCommand(tasks);
			const wcRevisionResult = results.find((r) => r.command === "getWorkingCopyRevision").result?.low;
			const logResult = results.find((r) => r.command === "log").result;

			let count = 0;
			if (logResult && logResult.logentry) {
				let entries = Array.isArray(logResult.logentry) ? logResult.logentry : [logResult.logentry];
				count = entries.filter((entry) => parseInt(entry["$"].revision) > wcRevisionResult).length;
			}

			// logger.debug(`Branch: ${branchString(data.folder, data.version, data.branch)} | Revisions Behind: ${count}`);

			let branchInfo = count == 0 ? "Up to date" : `Behind by ${count} revision${count > 1 ? "s" : ""}`;

			emitBranchInfo(socket, data.id, branchInfo);
		} catch (err) {
			logger.error(`Error executing SVN commands: ${err.message}`, err);
			if (!isSVNConnectionError(socket, err)) emitMessage(socket, `Failed to retrieve info for ${branchString(data.folder, data.version, data.branch)}`, "error");
		}
		// debugTask("svn-info-single", data, true);
	});

	socket.on("svn-status-single", async (data) => {
		debugTask("svn-status-single", data, false);

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
			const results = await executeSvnCommand(task);
			const result = results[0]?.result;

			let filesToCommit = [];
			let filesToUpdate = [];

			// If there are updates to the branch then these result values should not be null or undefined.
			if (result && result.target && result.target.entry) {
				const entries = Array.isArray(result.target.entry) ? result.target.entry : [result.target.entry];
				const pathFilter = `${branchPath}/`.replaceAll("/", "\\");

				entries.forEach((entry) => {
					const wcStatus = entry["wc-status"]?.$?.item;
					const reposStatus = entry["repos-status"]?.$?.item;
					const path = String(entry.$.path);
					const pathDisplay = path.replace(pathFilter, "");

					const emitData = {
						path: path,
						pathDisplay: pathDisplay,
						wcStatus: wcStatus,
						reposStatus: reposStatus || null,
					};

					if (wcStatus && !["normal", "none"].includes(wcStatus)) {
						if (reposStatus && !["normal", "none"].includes(reposStatus)) {
							filesToUpdate.push(emitData);
						} else {
							filesToCommit.push(emitData);
						}
					}
				});
			}

			// logger.debug(`For Branch: ${branchPath}`);
			// logger.debug(`Files to Commit: ${JSON.stringify(filesToCommit, null, 2)}`);
			// logger.debug(`Files to Update: ${JSON.stringify(filesToUpdate, null, 2)}`);

			emitBranchStatus(socket, data.selectedBranch.id, {
				branch: branchPath,
				filesToCommit,
				filesToUpdate,
			});
		} catch (err) {
			logger.error("Error checking SVN status:", err);
			if (!isSVNConnectionError(socket, err)) {
				emitMessage(socket, `Error checking SVN status for branch ${branchPath}`, "error");
			}
		}

		debugTask("svn-status-single", data, true);
	});

	socket.on("svn-files-revert", async (data) => {
		debugTask("svn-files-revert", data, false);

		if (!data.filesToProcess || data.filesToProcess.length === 0) {
			emitMessage(socket, "No files to undo", "error");
			return;
		}

		for (const file of data.filesToProcess) {
			const { "Branch Folder": branchFolder, "Branch Version": branchVersion, "Full Path": filePath, "Local Status": localStatus } = file;

			const task = {
				command: "revert",
				args: [filePath],
				callback: (err, result) => {
					if (err) {
						logger.error(`Failed to revert file ${filePath}:`, err);
						emitMessage(socket, `Failed to revert ${branchString(branchFolder, branchVersion, filePath)}`, "error");
					} else {
						logger.info(`Successfully reverted file ${filePath}`);
						emitMessage(socket, `Successfully reverted ${branchString(branchFolder, branchVersion, filePath)}`, "success");
						if (localStatus == "unversioned") {
							deleteFileOrDirectory(filePath);
						}
						socket.emit("branch-refresh-unseen");
					}
				},
			};

			svnQueueSerial.push(task);
		}

		debugTask("svn-files-revert", data, true);
	});

	socket.on("svn-files-add-remove", async (data) => {
		debugTask("svn-files-add-remove", data, false);

		if (!data.filesToProcess || data.filesToProcess.length === 0) {
			emitMessage(socket, "No files to undo", "error");
			return;
		}

		for (const file of data.filesToProcess) {
			const { "Branch Folder": branchFolder, "Branch Version": branchVersion, "Full Path": filePath, "Local Status": localStatus } = file;

			let task = {};
			if (localStatus == "unversioned") {
				task = {
					command: "add",
					args: [filePath],
					callback: (err, result) => {
						if (err) {
							logger.error(`Failed to add file ${filePath}:`, err);
							emitMessage(socket, `Failed to add ${branchString(branchFolder, branchVersion, filePath)}`, "error");
						} else {
							logger.info(`Successfully added file ${filePath}`);
							emitMessage(socket, `Successfully added ${branchString(branchFolder, branchVersion, filePath)}`, "success");
						}
					},
				};
			} else if (task == "missing") {
				task = {
					command: "del",
					args: [filePath],
					callback: (err, result) => {
						if (err) {
							logger.error(`Failed to add file ${filePath}:`, err);
							emitMessage(socket, `Failed to add ${branchString(branchFolder, branchVersion, filePath)}`, "error");
						} else {
							logger.info(`Successfully added file ${filePath}`);
							emitMessage(socket, `Successfully added ${branchString(branchFolder, branchVersion, filePath)}`, "success");
							socket.emit("branch-refresh-unseen");
						}
					},
				};
			} else {
				emitMessage(socket, `Invalid local status for file ${branchString(branchFolder, branchVersion, filePath)}. Please contact the developer!`, "error");
				logger.error(`Invalid local status for file ${filePath}: ${localStatus}`);
				return;
			}

			svnQueueSerial.push(task);

			if (localStatus == "unversioned") {
				let propTask = {
					command: "propset",
					args: ["svn:keywords", '"Id Author Date Revision HeadURL"', filePath],
					callback: (err, result) => {
						if (err) {
							logger.error(`Failed to set SVN properties for file ${filePath}:`, err);
							emitMessage(socket, `Failed to set SVN properties for ${branchString(branchFolder, branchVersion, filePath)}`, "error");
						} else {
							logger.info(`Successfully set SVN properties for file ${filePath}`);
							emitMessage(socket, `SVN properties for ${branchString(branchFolder, branchVersion, filePath)} has been set. Please check that you have added SVN comments to ensure that your SVN client can automatically update them`, "warning", 10_000);
							socket.emit("branch-refresh-unseen");
						}
					},
				};

				svnQueueSerial.push(propTask);
			}
		}

		debugTask("svn-files-add-remove", data, true);
	});

	socket.on("svn-commit", async (data) => {
		debugTask("svn-commit", data, false);

		if (!data.filesToProcess || data.filesToProcess.length === 0) {
			emitMessage(socket, "No files to commit", "error");
			return;
		}

		const { sourceBranch, issueNumber, commitMessage, filesToProcess } = data;

		// Group files by SVN Branch
		const filesByBranch = filesToProcess.reduce((acc, file) => {
			const key = file["SVN Branch"];
			if (!acc[key]) {
				acc[key] = {
					id: file.id,
					branchFolder: file["Branch Folder"],
					branchVersion: file["Branch Version"],
					files: [],
				};
			}
			acc[key].files.push(file["Full Path"]);
			return acc;
		}, {});

		for (const [svnBranch, branchInfo] of Object.entries(filesByBranch)) {
			const { id, branchFolder, branchVersion, files } = branchInfo;

			let prefixedCommitMessage;
			if (branchFolder === sourceBranch["Branch Folder"]) {
				prefixedCommitMessage = `Issue ${issueNumber} (${branchFolder} ${branchVersion}): ${commitMessage}`;
			} else {
				prefixedCommitMessage = `Issue ${issueNumber} (${sourceBranch["Branch Folder"]}): ${commitMessage}`;
			}
			prefixedCommitMessage = sanitizeCommitMessage(prefixedCommitMessage);

			const task = {
				command: "commit",
				args: [files],
				options: {
					msg: prefixedCommitMessage,
				},
				callback: (err, result) => {
					if (err) {
						logger.debug(`Files by Branch: ${JSON.stringify(filesByBranch, null, 2)}`);
						logger.debug(`SVN Branch: ${svnBranch}`);
						logger.debug(`Issue Number: ${issueNumber}`);
						logger.debug(`Commit Message: ${commitMessage}`);
						logger.debug(`Prefixed Commit Message: ${prefixedCommitMessage}`);
						logger.debug(`Files to Commit: ${JSON.stringify(files, null, 2)}`);
						logger.error(`Failed to commit files in ${svnBranch}:`, err);
						emitMessage(socket, `Failed to commit files in ${branchString(branchFolder, branchVersion, svnBranch)}`, "error");

						// Emit commit status for frontend
						socket.emit("svn-commit-status-live", {
							id: id,
							"Branch Folder": branchFolder,
							"Branch Version": branchVersion,
							"SVN Branch": svnBranch,
							branchPathFolder: branchPathFolder(svnBranch),
							branchString: branchString(branchFolder, branchVersion, svnBranch),
							revision: null,
							errorMessage: err.message,
							bulkCommitLength: Object.entries(filesByBranch).length,
						});
					} else {
						logger.info(`Successfully committed files in ${svnBranch}`);
						emitMessage(socket, `Successfully committed files in ${branchString(branchFolder, branchVersion, svnBranch)}`, "success");
						logger.debug(`Revision Number: ${extractRevisionNumber(result[0].result)}`);

						// Emit commit status for frontend
						socket.emit("svn-commit-status-live", {
							id: id,
							"Branch Folder": branchFolder,
							"Branch Version": branchVersion,
							"SVN Branch": svnBranch,
							branchPathFolder: branchPathFolder(svnBranch),
							branchString: branchString(branchFolder, branchVersion, svnBranch),
							revision: extractRevisionNumber(result[0].result),
							bulkCommitLength: Object.entries(filesByBranch).length,
						});
					}
				},
			};

			svnQueueSerial.push(task);
		}

		debugTask("svn-commit", data, true);
	});

	socket.on("client-log", (data) => {
		let { logType, logMessage } = data;
		logger.log(logType, `Client Message - ${logMessage}}`);
	});

	socket.on("disconnect", () => {
		logger.info("Client disconnected");
	});
});

/************************************
 * Catch-all Route To Serve React App
 ************************************/
app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "../dist/index.html"));
});

/************************************
 * Graceful Shutdown
 ************************************/
function gracefulShutdown(signal) {
	logger.info(`Received ${signal}. Starting graceful shutdown...`);

	// Close the HTTP server
	server.close(() => {
		logger.info("HTTP server closed.");

		// Close socket.io connections
		io.close(() => {
			logger.info("Socket.IO connections closed.");

			// Close and destroy any resource allocations here

			// If you don't have any other resources to close, you can exit here
			logger.info("Graceful shutdown completed.");
			process.exit(0);
		});
	});

	// If server hasn't finished in 10 seconds, shut down forcefully
	setTimeout(() => {
		logger.error("Could not close connections in time, forcefully shutting down");
		process.exit(1);
	}, 10_000);
}


/************************************
 * Server Setup
 ************************************/
const port = process.env.PORT || 4000;
server.listen(port, async () => {
	logger.info(`Listening on port ${port}`);
	logger.info(`Current version: ${latestVersion}`);
	logger.info("You can access the application at http://localhost:4000");
	if (process.send) {
		process.send("server-ready");
	}
});

// Handle 'shutdown' message from parent process
process.on("message", (message) => {
	if (message === "shutdown") {
		gracefulShutdown("shutdown message");
	}
});

// Listen for shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));