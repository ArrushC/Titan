import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import async from "async";
import svnUltimate from "node-svn-ultimate";
import { setupLogger, setupUncaughtExceptionHandler } from "./logger.js";
import compression from "compression";
import { exec } from "child_process";
import fetch from "node-fetch";
import _ from "lodash";
import chokidar from "chokidar";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

const { version: latestVersion, configFilePath, targetsFilePath, svnLogsCacheFilePath } = packageJson;

const isDev = process.env.NODE_ENV === "development";
const port = process.env.PORT || 4000;
const frontendPort = isDev ? 5173 : port;

// Create a logger instance
const logger = setupLogger("server.js");
setupUncaughtExceptionHandler(logger);

const app = express();
const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: isDev ? "http://localhost:5173" : "*",
		credentials: true,
	},
});

const instanceData = {
	commitLiveResponses: [],
	isConnectionError: false,
	lastConnectionErrorTime: 0,
	CONNECTION_ERROR_DEBOUNCE_MS: 5000,
	subversionLogsCache: {},
	branchWatchers: {},
};

try {
	fs.access(svnLogsCacheFilePath, fs.constants.F_OK, async (accessErr) => {
		if (!accessErr) {
			const data = await fsPromises.readFile(svnLogsCacheFilePath, "utf8");
			instanceData.subversionLogsCache = JSON.parse(data);
			logger.info("Loaded SVN logs cache file successfully.");
		}
	});
} catch (err) {
	logger.error("Error reading SVN logs cache file:" + err);
}

// Use compression middleware
app.use(compression());

app.use((req, res, next) => {
	if (req.url.endsWith(".js")) {
		res.type("application/javascript");
	} else if (req.url.endsWith(".css")) {
		res.type("text/css");
	}
	next();
});

app.get("*.js", (req, res, next) => {
	res.type("application/javascript");
	next();
});

app.get("*.css", (req, res, next) => {
	res.type("text/css");
	next();
});

// Serve static files from the React app
app.use(
	express.static(path.join(__dirname, "../dist"), {
		setHeaders: (res, path) => {
			if (path.endsWith(".js")) {
				res.setHeader("Content-Type", "application/javascript");
			} else if (path.endsWith(".css")) {
				res.setHeader("Content-Type", "text/css");
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
		const stats = await fsPromises.lstat(pathToDelete);

		if (stats.isFile()) {
			await fsPromises.unlink(pathToDelete);
			logger.debug("File deleted successfully!");
		} else if (stats.isDirectory()) {
			await fsPromises.rmdir(pathToDelete, { recursive: true });
			logger.debug("Directory deleted successfully!");
		} else {
			logger.error("Path is not a file or directory.");
		}
	} catch (err) {
		logger.error("Error deleting file/directory:" + err);
	}
}

async function writeTargetsFile(targets = []) {
	try {
		await fsPromises.mkdir(path.dirname(targetsFilePath), { recursive: true });
		await fsPromises.writeFile(targetsFilePath, targets.join("\n"));
	} catch (err) {
		logger.error("Error writing targets file:" + err);
	}
}

async function saveSvnLogsCache() {
	try {
		await fsPromises.mkdir(path.dirname(svnLogsCacheFilePath), { recursive: true });
		await fsPromises.writeFile(svnLogsCacheFilePath, JSON.stringify(instanceData.subversionLogsCache, null, 4));
	} catch (err) {
		logger.error("Error writing SVN logs cache file:" + err);
	}
}

/************************************
 * Trello Utilities
 ************************************/
/**
 * Fetches the card names from Trello based on the search query.
 *
 * @param {String} key The Trello API key
 * @param {String} token The Trello token
 * @param {String} query The search query to find the card names
 * @param {Number} limit The maximum number of cards to fetch
 * @returns {Promise<Array>} An array of card objects containing the card name, last activity date, URL, board ID, checklist IDs, and checklist data.
 */
async function getTrelloCardNames(key, token, query, limit) {
	// Docs URL: https://developer.atlassian.com/cloud/trello/rest/api-group-search/#api-search-get

	try {
		// Create a new URL object
		let url = new URL("https://api.trello.com/1/search");

		// Use URLSearchParams to append query parameters
		const params = new URLSearchParams({
			query: `name:"${query}"`,
			key: key,
			token: token,
			cards_limit: String(limit),
			card_fields: "name,dateLastActivity,shortUrl,idBoard,idChecklists",
			partial: "true",
			modelTypes: "cards",
		});

		// Append the search parameters to the URL
		url.search = params.toString();

		// Fetch the data from Trello API
		const res = await fetch(url);

		if (!res.ok) {
			throw new Error(`HTTP error! status: ${res.status} - ${res.statusText} - ${await res.text()}`);
		}

		// Parse the JSON response
		const data = await res.json();

		// Sort and format the card data
		const cards = data.cards
			.sort((a, b) => new Date(b.dateLastActivity) - new Date(a.dateLastActivity))
			.map((card) => ({
				id: card.id,
				name: card.name,
				lastActivityDate: new Date(card.dateLastActivity).toLocaleString(),
				url: card.shortUrl,
				boardId: card.idBoard,
				checklistIds: card.idChecklists,
			}));

		let urls = cards.filter((card) => card.checklistIds && card.checklistIds.length > 0).map((card) => card.checklistIds.map((checklistId) => new URL(`https://api.trello.com/1/checklists/${checklistId}`)));

		// Add key and token to each of those URLs, fetch the data and parse the JSON response
		let checklistData = (await Promise.all(urls.flat().map((url) => fetch(new URL(url.toString() + `?key=${key}&token=${token}`)).then((res) => res.json())))).map((data) => ({
			id: data.id,
			name: data.name,
		}));

		// Add the checklist data to the cards
		cards.forEach((card) => {
			card.checklists = card.checklistIds.map((checklistId) => checklistData.find((checklist) => checklist.id === checklistId));
		});

		logger.debug(`Retrieved ${cards.length} cards`);
		return cards;
	} catch (error) {
		logger.error("Error fetching data from Trello:" + error);
		throw error;
	}
}

/**
 * Updates the "Commit History" checklist or creates a new one if it doesn't exist, and adds commit responses to it.
 *
 * @param {*} key The Trello API key
 * @param {*} token The Trello token
 * @param {*} trelloData  The Trello data object containing the card ID, board ID, checklist ID, and commit responses
 * @param {*} commitResponses The commit responses to add to the checklist
 */
async function updateTrelloCard(key, token, trelloData, commitResponses) {
	try {
		// Check if the "Commit History" checklist exists and if not, create a new one
		let checklistId = trelloData.checklists.find((checklist) => checklist.name === "Commit History")?.id;

		if (!checklistId) {
			const url = new URL(`https://api.trello.com/1/checklists`);
			const params = new URLSearchParams({
				key: key,
				token: token,
				idCard: trelloData.id,
				name: "Commit History",
				pos: "bottom",
			});

			url.search = params.toString();

			const res = await fetch(url, { method: "POST" });

			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status} - ${res.statusText} - ${await res.text()}`);
			}

			const data = await res.json();
			checklistId = data.id;
		}

		// Add the commit responses to the "Commit History" checklist
		for (let responseItem of commitResponses) {
			const url = new URL(`https://api.trello.com/1/checklists/${checklistId}/checkItems`);
			const params = new URLSearchParams({
				key: key,
				token: token,
				name: responseItem,
				pos: "bottom",
			});

			url.search = params.toString();

			const res = await fetch(url, { method: "POST" });

			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status} - ${res.statusText} - ${await res.text()}`);
			}

			const data = await res.json();
			logger.debug(`Added commit response to Trello card: ${data.name}`);
		}

		logger.debug(`Updated Trello card with commit responses`);
		return true;
	} catch (error) {
		logger.error(`Error updating Trello card with commit responses: ${error}`);
		throw error;
	}
}
/************************************
 * Asynchronous SVN Logic
 ************************************/
function executeSvnCommand(commands) {
	if (!Array.isArray(commands)) {
		commands = [commands];
	}

	return Promise.all(
		commands.map(
			(cmd) =>
				new Promise((resolve, reject) => {
					const args = Array.isArray(cmd.args) ? cmd.args : [cmd.args];
					const options = cmd.options || {};

					args.push(options);

					const opCallback = (err, result) => {
						if (err) {
							logger.error(`Error executing SVN operation ${cmd.command} with args ${JSON.stringify(args, null, 2)}:`);
							logger.error(JSON.stringify(err, null, 2));
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
						svnUltimate.util[cmd.command](...args, opCallback);
					} else {
						// Handle regular SVN commands
						if (typeof svnUltimate.commands[cmd.command] !== "function") {
							return reject(new Error(`Invalid SVN command: ${cmd.command}`));
						}
						svnUltimate.commands[cmd.command](...args, opCallback);
					}
				})
		)
	);
}

const svnQueueSerial = async.queue(async (task) => {
	debugTask("svnQueueSerial", task, false);
	const { command, args, postopCallback, preopCallback } = task;

	try {
		if (preopCallback) await preopCallback();
		const result = await executeSvnCommand(task);
		logger.debug(`SVN command ${command} output:\n` + typeof result === "string" ? result : JSON.stringify(result, null, 4));
		if (postopCallback) await postopCallback(null, result);
	} catch (err) {
		logger.error(`Error executing SVN command ${command} with args ${args}:` + err);
		if (postopCallback) await postopCallback(err);
	}

	debugTask("svnQueueSerial", task, true);

	// 2 seconds delay between each task to prevent flooding the SVN server
	await new Promise((resolve) => setTimeout(resolve, 1500));
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
	return commitMessage.replaceAll(/[\n\r\t\b\f]/g, "; ").trim();
}

/************************************
 * Socket IO Logic
 ************************************/
function emitMessage(socket, description, type = "info", duration = 3000) {
	socket.emit("notification", { description, type, duration: type == "error" ? 0 : duration });
}

function emitBranchInfo(socket, branchId, branchInfo, baseRevision) {
	socket.emit("branch-info-single", { id: branchId, info: branchInfo, baseRevision });
}

function emitBranchStatus(socket, branchId, branchStatus) {
	socket.emit("branch-status-single", { id: branchId, status: branchStatus });
}

function isSVNConnectionError(socket, err) {
	if (err?.message?.includes("svn: E170013") || err?.message?.includes("svn: E731001")) {
		io.emit("svn-connection-error", "Unable to connect to the SVN repository!");
		return true;
	}
	return false;
}

/************************************
 * Socket IO Logic
 ************************************/
async function fetchConfig(socket) {
	let config = null;

	try {
		await fsPromises.mkdir(path.dirname(configFilePath), { recursive: true });
		await fsPromises.access(configFilePath);
	} catch (err) {
		// Handle error: maybe log or notify
		logger.warn("Config file not found, creating a new one.");
		const defaultConfig = {
			currentVersion: latestVersion,
			branches: [],
			branchFolderColours: {},
			commitOptions: {
				useFolderOnlySource: false,
			},
			trelloIntegration: {
				key: "TRELLO_API_KEY",
				token: "TRELLO_TOKEN",
			},
			ignoredUnknownPaths: [],
			ignoredModifiedPaths: [],
		};
		try {
			await fsPromises.writeFile(configFilePath, JSON.stringify(defaultConfig, null, 4));
			emitMessage(socket, "Config file created with default content", "success");
			config = defaultConfig; // Assign the default config
		} catch (writeErr) {
			logger.error("Error writing default config file:" + writeErr);
			emitMessage(socket, "Error creating default config file", "error");
			throw writeErr; // Propagate error to be caught in the caller
		}
	}

	try {
		const data = await fsPromises.readFile(configFilePath, "utf8");
		config = JSON.parse(data);
		if (!config.currentVersion || config.currentVersion !== latestVersion) {
			logger.info(`Updating config file with latest version - v${config.currentVersion || "-1"} -> v${latestVersion}`);
			config.currentVersion = latestVersion;
			await fsPromises.writeFile(configFilePath, JSON.stringify(config, null, 4));
			emitMessage(socket, `Successfully updated Titan to v${latestVersion}!`, "success");
		}
	} catch (err) {
		logger.error("Error reading or parsing config file:" + err);
		emitMessage(socket, "Error reading config file", "error");
		throw err; // Propagate error to be caught in the caller
	}

	return config;
}

io.on("connection", (socket) => {
	const origin = socket.handshake.headers.origin || "";
	const referer = socket.handshake.headers.referer || "";
	const expectedOrigin = isDev ? `http://localhost:${frontendPort}` : `http://localhost:${port}`;

	const isForeignOrigin = !origin.startsWith(expectedOrigin) && !referer.startsWith(expectedOrigin);

	logger.info(`Connected to ${isForeignOrigin ? "foreign" : "titan"} client`);
	emitMessage(socket, "Connected To Server!", "success", 1500);

	socket.on("titan-config-get", async (data, callback) => {
		debugTask("titan-config-get", data, false);
		try {
			debugTask("titan-config-get", {}, false);
			const config = await fetchConfig(socket);
			callback({ config });
			debugTask("titan-config-get", {}, true);
		} catch (error) {
			logger.error("Error in titan-config-get: " + error);
			emitMessage(socket, "An error occurred while fetching the configuration.", "error");
			callback({ error: "Failed to fetch configuration." });
		}
		debugTask("titan-config-get", data, true);
	});

	if (!isForeignOrigin) {
		socket.on("titan-config-set", async (data) => {
			debugTask("titan-config-set", data, false);
			try {
				await fsPromises.writeFile(configFilePath, JSON.stringify(data, null, 4));
				emitMessage(socket, "Config file updated", "success");
			} catch (err) {
				logger.error(err);
				emitMessage(socket, "Error updating config file", "error");
			}
			debugTask("titan-config-set", data, true);
		});

		socket.on("titan-config-open", async () => {
			debugTask("titan-config-open", null, false);
			const notepadPlusPlusPath = `C:\\Program Files\\Notepad++\\notepad++.exe`;

			fs.access(path.normalize(notepadPlusPlusPath), fs.constants.F_OK, (accessErr) => {
				if (!accessErr) {
					// Notepad++ exists, open with it
					exec(`start "" "${notepadPlusPlusPath}" "${configFilePath}"`, (err) => {
						if (err) {
							logger.error("Failed to open config file with Notepad++:" + err);
							emitMessage(socket, "Failed to open config file with Notepad++", "error");
						} else {
							logger.info("Config file opened successfully with Notepad++");
							emitMessage(socket, "Config file opened successfully with Notepad++", "success");
						}
					});
				} else {
					// Fallback to the default application
					exec(`start "" "${configFilePath}"`, (err) => {
						if (err) {
							logger.error("Failed to open config file:" + err);
							emitMessage(socket, "Failed to open config file", "error");
						} else {
							logger.info("Config file opened successfully with the default app");
							emitMessage(socket, "Config file opened successfully with the default app", "success");
						}
					});
				}
			});

			debugTask("titan-config-open", null, true);
		});

		socket.on("svn-update-single", async (data, callback) => {
			debugTask("svn-update-single", data, false);
			const task = {
				command: "update",
				args: [data.branch],
				postopCallback: function (err, result) {
					if (err) {
						logger.error("Failed to execute SVN command: " + task.command);
						isSVNConnectionError(socket, err);
						if (callback) callback({ success: false, error: err });
					} else {
						logger.info("Successfully executed SVN command: " + task.command);
						if (callback) callback({ success: true });
						else socket.emit("branch-success-single", { id: data.id, branch: data.branch, version: data.version, folder: data.folder });
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
				{ command: "info", args: [data.branch] },
				{ command: "log", args: [data.branch], options: { revision: "BASE:HEAD" } },
				{ command: "status", args: [data.branch], options: { quiet: true, params: ["--show-updates"] } },
			];

			try {
				const results = await executeSvnCommand(tasks);
				const wcRevisionResult = results.find((r) => r.command === "getWorkingCopyRevision").result?.low;
				const infoResult = results.find((r) => r.command === "info").result;
				const logResult = results.find((r) => r.command === "log").result;
				const statusResult = results.find((r) => r.command === "status").result;

				// Check if there are any conflicts using the status result
				let conflictsCount = 0;
				if (statusResult && statusResult.target && statusResult.target.entry) {
					const entries = Array.isArray(statusResult.target.entry) ? statusResult.target.entry : [statusResult.target.entry];
					const conflicts = entries.filter((entry) => entry["wc-status"]?.$?.item === "conflicted");
					if (conflicts.length > 0) {
						// emitMessage(socket, `Branch ${branchString(data.folder, data.version, data.branch)} has conflicts`, "warning");
						conflictsCount = conflicts.length;
					}
				}

				// Count the number of revisions since the working copy revision
				let count = 0;
				if (logResult && logResult.logentry) {
					let entries = Array.isArray(logResult.logentry) ? logResult.logentry : [logResult.logentry];
					count = entries.filter((entry) => parseInt(entry["$"].revision) > wcRevisionResult).length;
				}

				let branchInfo = count == 0 ? `Latest${conflictsCount > 0 ? " 🤬" : ""}` : `-${count} Revision${count > 1 ? "s" : ""}${conflictsCount > 0 ? " 🤬" : ""}`;

				emitBranchInfo(socket, data.id, branchInfo, infoResult.entry.$.revision);
			} catch (err) {
				if (isSVNConnectionError(socket, err)) {
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
								return { entry, path, lastModified: stats.mtime.toLocaleString(), type: isDirectory ? "directory" : "file" };
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

				emitBranchStatus(socket, data.selectedBranch.id, {
					branch: branchPath,
					filesToTrack,
					filesToCommit,
					filesToUpdate,
				});
			} catch (err) {
				logger.error("Error checking SVN status:" + err);
				if (!isSVNConnectionError(socket, err)) emitMessage(socket, `Error checking SVN status for branch ${branchPath}`, "error");
			}

			debugTask("svn-status-single", data, true);
		});

		socket.on("svn-files-revert", async (data) => {
			debugTask("svn-files-revert", data, false);

			if (!data.filesToProcess || Object.keys(data.filesToProcess).length === 0) {
				emitMessage(socket, "No files to revert", "error");
				return;
			}

			const { filesToProcess } = data;

			let directoryPaths = [];
			let files = [];

			for (const path of Object.values(filesToProcess)) {
				const isPathDirectory = path.type === "directory";
				if (isPathDirectory) directoryPaths.push(path);
				else files.push(path);
				}

			if (files.length > 0) {
				const task = {
					command: "revert",
					options: {
						params: [`--targets ${targetsFilePath}`],
					},
					preopCallback: async () => {
						await writeTargetsFile(files.map((f) => f.path));
					},
					postopCallback: async (err, result) => {
						if (err) {
							logger.error(`Failed to revert files:` + err);
							if (!isSVNConnectionError(socket, err)) emitMessage(socket, `Failed to revert files`, "error");
						} else {
							logger.info(`Successfully reverted files`);
							emitMessage(socket, `Successfully reverted files`, "success");
							for (const file of files.filter((f) => f.wcStatus == "unversioned")) {
								await deleteFileOrDirectory(file.path);
							}
							socket.emit("branch-paths-update", {
								paths: files.map((f) => ({
									...f,
									wcStatus: f.wcStatus == "added" ? "unversioned" : f.wcStatus == "deleted" ? "missing" : f.wcStatus,
									action: ["unversioned", "missing"].includes(f.wcStatus) ? "normal" : "revert",
								})),
							});
						}
					},
				};
				svnQueueSerial.push(task);
			}

			if (directoryPaths.length > 0) {
				const task = {
					command: "revert",
					options: {
						depth: "infinity",
						params: [`--targets ${targetsFilePath}`],
					},
					preopCallback: async () => {
						await writeTargetsFile(directoryPaths.map((d) => d.path));
					},
					postopCallback: async (err, result) => {
						if (err) {
							logger.error(`Failed to revert directories:` + err);
							if (!isSVNConnectionError(socket, err)) emitMessage(socket, `Failed to revert directories`, "error");
						} else {
							logger.info(`Successfully reverted directories`);
							emitMessage(socket, `Successfully reverted directories`, "success");
							for (const dir of directoryPaths.filter((d) => d.wcStatus == "unversioned")) {
								await deleteFileOrDirectory(dir.path);
							}
							socket.emit("branch-paths-update", {
								paths: directoryPaths.map((d) => ({
										...d,
									wcStatus: d.wcStatus == "added" ? "unversioned" : d.wcStatus == "deleted" ? "missing" : d.wcStatus,
									action: ["unversioned", "missing"].includes(d.wcStatus) ? "normal" : "revert",
								})),
							});
						}
					},
				};
				svnQueueSerial.push(task);
			}

			debugTask("svn-files-revert", data, true);
		});

		socket.on("svn-files-add-delete", async (data) => {
			debugTask("svn-files-add-delete", data, false);

			if (!data.filesToProcess || data.filesToProcess.length === 0) {
				emitMessage(socket, "No files to add or delete", "error");
				return;
			}

			const { filesToProcess } = data;

			const unversionedPaths = Object.values(filesToProcess).filter((file) => file.wcStatus == "unversioned");
			const missingPaths = Object.values(filesToProcess).filter((file) => file.wcStatus == "missing");

			if (unversionedPaths.length > 0) {
				let files = unversionedPaths.filter((file) => file.type === "file");

				let task = {
						command: "add",
					options: {
						params: [`--targets ${targetsFilePath}`],
					},
					preopCallback: async () => {
						await writeTargetsFile(unversionedPaths.map((file) => file.path));
					},
					postopCallback: (err, result) => {
						if (err) {
							logger.error(`Failed to add all unversioned paths:` + err);
							if (!isSVNConnectionError(socket, err)) emitMessage(socket, `Failed to add all unversioned paths`, "error");
						} else {
							logger.info(`Successfully added all unversioned paths`);
							emitMessage(socket, `Successfully added all unversioned paths`, "success");
							const directoryPaths = unversionedPaths.filter((file) => file.type !== "file");
							if (directoryPaths.length > 0) socket.emit("branch-paths-update", { paths: directoryPaths.map((file) => ({ ...file, action: "add", wcStatus: "added" })) });
						}
					},
				};
				svnQueueSerial.push(task);

				if (files.length > 0) {
					let propTask = {
						command: "propset",
						args: ["svn:keywords", '"Id Author Date Revision HeadURL"', `--targets ${targetsFilePath}`],
						preopCallback: async () => {
							await writeTargetsFile(files.map((file) => file.path));
						},
						postopCallback: (err, result) => {
							if (err) {
								logger.error(`Failed to set SVN properties for all unversioned files:` + err);
								if (!isSVNConnectionError(socket, err)) emitMessage(socket, `Failed to set SVN properties for all unversioned files`, "error");
							} else {
								logger.info(`Successfully set SVN properties for all unversioned files`);
								emitMessage(socket, `SVN properties for all unversioned files have been set. Please check that you have added SVN comments to ensure that your SVN client can automatically update them`, "warning", 10_000);
								socket.emit("branch-paths-update", { paths: files.map((file) => ({ ...file, action: "add", wcStatus: "added" })) });
							}
						},
					};
					svnQueueSerial.push(propTask);
				}
			}

			if (missingPaths.length > 0) {
				let task = {
					command: "del",
					options: {
						params: [`--targets ${targetsFilePath}`],
					},
					preopCallback: async () => {
						await writeTargetsFile(missingPaths.map((file) => file.path));
					},
					postopCallback: (err, result) => {
						if (err) {
							logger.error(`Failed to delete all missing files:` + err);
							if (!isSVNConnectionError(socket, err)) emitMessage(socket, `Failed to delete all missing files`, "error");
						} else {
							logger.info(`Successfully deleted all missing files`);
							emitMessage(socket, `Successfully deleted all missing files`, "success");
							socket.emit("branch-paths-update", { paths: missingPaths.map((file) => ({ ...file, action: "delete", wcStatus: "deleted" })) });
						}
					},
				};
				svnQueueSerial.push(task);
			}

			debugTask("svn-files-add-delete", data, true);
		});

		socket.on("watcher-branches-update", async (data) => {
			debugTask("watcher-branches-update", data, false);

			const { selectedBranchPaths, ignoredUnknownPaths, ignoredChangedPaths } = data;
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

				executeSvnCommand(task)
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
						if (!isSVNConnectionError(socket, err)) emitMessage(socket, `Error checking SVN status for branch ${branchPath}`, "error");
					});
			};

			// 2. Create watchers for newly selected branches
			for (const branchPath of newSelections) {
				if (instanceData.branchWatchers[branchPath]) continue;

				logger.info(`Creating watcher for branch: ${branchPath}`);
				const watcher = chokidar.watch(branchPath, {
					ignored: [/(^|[\/\\])\../, ...ignoredUnknownPaths.map((path) => new RegExp(path)), ...ignoredChangedPaths.map((path) => new RegExp(path))],
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

			debugTask("watcher-branches-update", data, true);
		});

		socket.on("svn-commit", async (data) => {
			debugTask("svn-commit", data, false);

			if (!data.filesToProcess || data.filesToProcess.length === 0) {
				emitMessage(socket, "No files to commit", "error");
				return;
			}

			instanceData.commitLiveResponses = [];

			const { sourceBranch, issueNumber, commitMessage, filesToProcess, commitOptions } = data;

			// Group files by SVN Branch
			const filesByBranch = filesToProcess.reduce((acc, file) => {
				const key = file["SVN Branch"];
				if (!acc[key]) {
					acc[key] = {
						branchId: file.branchId,
						branchFolder: file["Branch Folder"],
						branchVersion: file["Branch Version"],
						files: [],
					};
				}
				acc[key].files.push(file["Full Path"]);
				return acc;
			}, {});

			let originalIssueNumber = issueNumber[sourceBranch["Branch Folder"]] || "";

			for (const [svnBranch, branchInfo] of Object.entries(filesByBranch)) {
				const { branchId, branchFolder, branchVersion, files } = branchInfo;

				let originalMessage = `(${sourceBranch["Branch Folder"]}${originalIssueNumber !== "" ? ` #${originalIssueNumber}` : ""})`;
				if (branchFolder === sourceBranch["Branch Folder"]) {
					originalMessage = `(${branchFolder}${commitOptions.useFolderOnlySource ? "" : ` ${sourceBranch["Branch Version"]}`})`;
				}

				let branchIssueNumber = issueNumber[branchFolder] || originalIssueNumber;
				let prefixedCommitMessage = sanitizeCommitMessage(`Issue ${branchIssueNumber} ${originalMessage}: ${commitMessage}`);

				console.log("Commit message:", prefixedCommitMessage);

				const task = {
					command: "commit",
					options: {
						msg: prefixedCommitMessage,
						params: [`--targets ${targetsFilePath}`],
					},
					preopCallback: async () => {
						await writeTargetsFile(files);
					},
					postopCallback: (err, result) => {
						if (err) {
							if (!isSVNConnectionError(socket, err)) {
								logger.debug(`Files by Branch: ${JSON.stringify(filesByBranch, null, 2)}`);
								logger.debug(`SVN Branch: ${svnBranch}`);
								logger.debug(`Issue Number: ${issueNumber}`);
								logger.debug(`Commit Message: ${commitMessage}`);
								logger.debug(`Prefixed Commit Message: ${prefixedCommitMessage}`);
								logger.debug(`Files to Commit: ${JSON.stringify(files, null, 2)}`);
								logger.error(`Failed to commit files in ${svnBranch}:` + err);
								emitMessage(socket, `Failed to commit files in ${branchString(branchFolder, branchVersion, svnBranch)}`, "error");

								const liveResponse = {
									branchId: branchId,
									branchIssueNumber: branchIssueNumber,
									"Branch Folder": branchFolder,
									"Branch Version": branchVersion,
									"SVN Branch": svnBranch,
									branchPathFolder: branchPathFolder(svnBranch),
									branchString: branchString(branchFolder, branchVersion, svnBranch),
									commitMessage: prefixedCommitMessage,
									revision: null,
									errorMessage: err.message,
									bulkCommitLength: Object.entries(filesByBranch).length,
								};

								io.emit("svn-commit-status-live", liveResponse);
								instanceData.commitLiveResponses.push(liveResponse);
							}
						} else {
							logger.info(`Successfully committed files in ${svnBranch}`);
							emitMessage(socket, `Successfully committed files in ${branchString(branchFolder, branchVersion, svnBranch)}`, "success");
							logger.debug(`Revision Number: ${extractRevisionNumber(result[0].result)}`);

							const liveResponse = {
								branchId: branchId,
								branchIssueNumber: branchIssueNumber,
								"Branch Folder": branchFolder,
								"Branch Version": branchVersion,
								"SVN Branch": svnBranch,
								branchPathFolder: branchPathFolder(svnBranch),
								branchString: branchString(branchFolder, branchVersion, svnBranch),
								commitMessage: prefixedCommitMessage,
								revision: extractRevisionNumber(result[0].result),
								bulkCommitLength: Object.entries(filesByBranch).length,
							};

							io.emit("svn-commit-status-live", liveResponse);
							instanceData.commitLiveResponses.push(liveResponse);
						}
					},
				};

				svnQueueSerial.push(task);
			}

			debugTask("svn-commit", data, true);
		});

		socket.on("svn-logs-selected", async (data) => {
			debugTask("svn-logs-selected", data, false);

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
							if (!isSVNConnectionError(socket, err)) emitMessage(socket, `Failed to fetch info for branch ${svnBranchPath}`, "error");
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
								if (!isSVNConnectionError(socket, err)) emitMessage(socket, `Failed to fetch logs for branch ${svnBranchPath}`, "error");
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
								const uniqueLogs = _.uniqBy(combinedLogs, "revision");
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
				if (!isSVNConnectionError(socket, err)) emitMessage(socket, "Error fetching SVN logs with repository root", "error");
			}

			debugTask("svn-logs-selected", data, true);
		});

		socket.on("svn-logs-flush", async (data) => {
			debugTask("svn-logs-flush", data, false);

			instanceData.subversionLogsCache = {};
			await saveSvnLogsCache();

			emitMessage(socket, "Successfully cleared SVN logs cache", "success");

			debugTask("svn-logs-flush", data, true);
		});

		socket.on("trello-search-names-card", async (data, callback) => {
			debugTask("trello-search-names-card", data, false);

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
				const cards = await getTrelloCardNames(data.key, data.token, data.query, limit);
				if (callback) callback({ cards });
				else socket.emit("trello-result-search-names-card", cards);
			} catch (err) {
				logger.error("Error fetching Trello card names:" + JSON.stringify(err, null, 2));
				emitMessage(socket, "Error fetching Trello card names", "error");
			}

			debugTask("trello-search-names-card", data, true);
		});

		socket.on("trello-update-card", async (data) => {
			debugTask("trello-update-card", data, false);

			if (!data.key || data.key === "" || data.key === "TRELLO_API_KEY" || !data.token || data.token === "" || data.token === "TRELLO_TOKEN") {
				emitMessage(socket, "Trello API key and token are required for this function", "error");
				return;
			}

			if (!data.trelloData || !data.trelloData.id || !data.trelloData.name || !data.trelloData.lastActivityDate || !data.trelloData.url || !data.trelloData.boardId || !data.trelloData.checklistIds || !data.trelloData.checklists) {
				emitMessage(socket, "Trello data is missing required fields", "error");
				return;
			}

			if (!data.commitResponses || data.commitResponses.length === 0) {
				emitMessage(socket, "No commit responses provided", "error");
				return;
			}

			const { key, token, trelloData, commitResponses } = data;

			const result = await updateTrelloCard(key, token, trelloData, commitResponses);
			if (result) {
				emitMessage(socket, "Successfully updated Trello card", "success");
			} else {
				logger.error(`Failed to update Trello card: ${result}`);
				emitMessage(socket, "Failed to update Trello card", "error");
			}

			debugTask("trello-update-card", data, true);
		});
	}

	socket.on("external-svn-commits-get", async () => {
		debugTask("external-svn-commits-get", null, false);
		socket.emit("external-svn-commits-get", instanceData.commitLiveResponses);
		debugTask("external-svn-commits-get", null, true);
	});

	socket.on("external-autofill-issue-numbers", async (data) => {
		debugTask("external-autofill-issue-numbers", data, false);
		debugTask("external-autofill-issue-numbers", data, true);
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
});

/************************************
 * Catch-all Route To Serve React App
 ************************************/
app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "../dist/index.html"));
});

/************************************
 * Application Shutdown
 ************************************/
function gracefulShutdown(signal) {
	logger.info(`Received ${signal}. Starting graceful shutdown...`);

	// Close the HTTP server
	server.close(() => {
		logger.info("HTTP server closed.");

		// Close socket.io connections
		io.close(() => {
			logger.info("Socket.IO connections closed.");

			// Send shutdown acknowledgment to the main process
			if (process.send) {
				process.send("shutdown-complete");
			}

			// Exit the process
			logger.info("Graceful shutdown completed.");
			process.exit(0);
		});
	});

	// If server hasn't finished in 10 seconds, shut down forcefully
	setTimeout(() => {
		logger.error("Could not close connections in time, forcefully shutting down");
		process.exit(1);
	}, 10000);
}

/************************************
 * Server Setup
 ************************************/
server.listen(port, async () => {
	logger.info(`Listening on port ${port}`);
	logger.info(`Current version: ${latestVersion}`);
	logger.info(`You can access the application at http://localhost:${port}`);
	if (process.send) {
		process.send("server-ready");
	}
});

// Handle 'shutdown' message from parent process
process.on("message", (message) => {
	if (message === "shutdown") {
		gracefulShutdown("Server Shutdown Signal");
	}
});

// Listen for shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Listen for unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled Rejection at:" + JSON.stringify(promise, null, 4) + "reason:" + reason);
});
