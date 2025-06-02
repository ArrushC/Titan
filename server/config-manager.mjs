import { promises as fsPromises } from "fs";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { emitMessage } from "./utils.mjs";

/**
 * Fetch configuration from file or create default
 * @param {Object} socket - Socket instance
 * @param {string} configFilePath - Path to config file
 * @param {string} latestVersion - Latest version string
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Configuration object
 */
export async function fetchConfig(socket, configFilePath, latestVersion, logger) {
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

/**
 * Save configuration to file
 * @param {Object} data - Config data to save
 * @param {string} configFilePath - Path to config file
 * @param {Object} socket - Socket instance
 * @param {Object} logger - Logger instance
 */
export async function saveConfig(data, configFilePath, socket, logger) {
    try {
        await fsPromises.writeFile(configFilePath, JSON.stringify(data, null, 4));
        emitMessage(socket, "Config file updated", "success");
    } catch (err) {
        logger.error(err);
        emitMessage(socket, "Error updating config file", "error");
    }
}

/**
 * Open config file in external editor
 * @param {string} configFilePath - Path to config file
 * @param {Object} socket - Socket instance
 * @param {Object} logger - Logger instance
 */
export async function openConfigFile(configFilePath, socket, logger) {
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
}

/**
 * Load initial state from disk files
 * @param {string} svnLogsCacheFilePath - Path to SVN logs cache file
 * @param {string} commitLiveResponsesFilePath - Path to commit live responses file
 * @param {Object} instanceData - Instance data object to populate
 * @param {Object} logger - Logger instance
 */
export async function loadInitialState(svnLogsCacheFilePath, commitLiveResponsesFilePath, instanceData, logger) {
    const loadTasks = [
        // Load SVN logs cache
        fsPromises.access(svnLogsCacheFilePath)
            .then(() => fsPromises.readFile(svnLogsCacheFilePath, "utf8"))
            .then(data => {
                instanceData.subversionLogsCache = JSON.parse(data);
                logger.info("Loaded SVN logs cache file successfully.");
            })
            .catch(err => {
                if (err.code !== 'ENOENT') {
                    logger.error("Error reading SVN logs cache file:", err);
                }
            }),

        // Load commit responses
        fsPromises.access(commitLiveResponsesFilePath)
            .then(() => fsPromises.readFile(commitLiveResponsesFilePath, "utf8"))
            .then(data => {
                instanceData.commitLiveResponses = JSON.parse(data);
                logger.info("Loaded commit live responses file successfully.");
            })
            .catch(err => {
                if (err.code !== 'ENOENT') {
                    logger.error("Error reading commit live responses file:", err);
                }
            })
    ];

    await Promise.all(loadTasks);
}