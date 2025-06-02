import svnUltimate from "node-svn-ultimate";
import async from "async";

// Track SVN operations to throttle repeated failures
const svnOperationCache = new Map();
const SVN_THROTTLE_TIME = 30000; // 30 seconds
const svnFailureSummary = new Map(); // Track failures for summary

/**
 * Create SVN operations module
 * @param {Object} logger - Logger instance
 * @returns {Object} SVN operations interface
 */
export function createSvnOperations(logger) {
    // Clean up old entries and log summary
    const cleanupInterval = setInterval(() => {
        const now = Date.now();

        // Log summary of failures if any
        if (svnFailureSummary.size > 0) {
            logger.info('=== SVN Operation Summary ===');
            for (const [path, data] of svnFailureSummary.entries()) {
                logger.info(`${path}: ${data.count} failures (${Array.from(data.operations).join(', ')})`);
            }
            logger.info('============================');
            svnFailureSummary.clear();
        }

        // Clean cache
        for (const [key, data] of svnOperationCache.entries()) {
            if (now - data.timestamp > SVN_THROTTLE_TIME * 2) {
                svnOperationCache.delete(key);
            }
        }
    }, 60000); // Clean every minute

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

                        // Create a unique key for this operation
                        const operationKey = `${cmd.command}_${args[0]}`;
                        const now = Date.now();

                        // Check if we should throttle this operation
                        if (svnOperationCache.has(operationKey)) {
                            const cachedData = svnOperationCache.get(operationKey);
                            if (cachedData.failed && now - cachedData.timestamp < SVN_THROTTLE_TIME) {
                                // Skip this operation as it recently failed
                                logger.debug(`Throttling SVN ${cmd.command} for ${args[0]} - Recent failure`);
                                return reject(new Error(`SVN operation throttled due to recent failure`));
                            }
                        }

                        args.push(options);

                        const opCallback = (err, result) => {
                            if (err) {
                                // Update cache with failure
                                svnOperationCache.set(operationKey, {
                                    failed: true,
                                    timestamp: now,
                                    errorCode: err.code
                                });

                                // Simplify error logging - extract key information
                                const path = args[0];
                                const errorCode = err.code;
                                const errorCmd = err.cmd;

                                // Check if it's a connection error to avoid duplicate logging
                                if (err.code === 1 && errorCmd && errorCmd.includes('svn')) {
                                    // For SVN errors, log a single concise line
                                    logger.error(`SVN ${cmd.command} failed for ${path} - Exit code: ${errorCode}`);
                                    logger.debug(`Command: ${errorCmd}`); // Full command in debug level

                                    // Add to failure summary
                                    if (!svnFailureSummary.has(path)) {
                                        svnFailureSummary.set(path, { count: 0, operations: new Set() });
                                    }
                                    const summary = svnFailureSummary.get(path);
                                    summary.count++;
                                    summary.operations.add(cmd.command);
                                } else {
                                    // For other errors, log normally
                                    logger.error(`Error executing SVN operation ${cmd.command} for ${path}:`, err.message || err);
                                }
                                return reject(err);
                            }

                            // Update cache with success
                            svnOperationCache.set(operationKey, {
                                failed: false,
                                timestamp: now
                            });

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
        logger.debug(`START Function: svnQueueSerial, Data: ${JSON.stringify(task, null, 2)}`);
        const { command, args, postopCallback, preopCallback } = task;

        try {
            if (preopCallback) await preopCallback();
            const result = await executeSvnCommand(task);
            logger.debug(`SVN command ${command} output:\n` + (typeof result === "string" ? result : JSON.stringify(result, null, 4)));
            if (postopCallback) await postopCallback(null, result);
        } catch (err) {
            logger.error(`Error executing SVN command ${command} with args ${args}:` + err);
            if (postopCallback) await postopCallback(err);
        }

        logger.debug(`END Function: svnQueueSerial`);

        // Adaptive delay based on command type and queue size
        const baseDelay = {
            status: 50,
            info: 50,
            log: 200,
            update: 500,
            commit: 1000,
            default: 200
        };

        const delay = baseDelay[command] || baseDelay.default;
        const queueSize = svnQueueSerial.length();
        const adaptiveDelay = delay * (1 + Math.min(queueSize / 10, 2)); // Scale up to 3x for large queues

        await new Promise((resolve) => setTimeout(resolve, adaptiveDelay));
    }, 3);

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

    // Cleanup function
    function cleanup() {
        clearInterval(cleanupInterval);
        svnOperationCache.clear();
        svnFailureSummary.clear();
    }

    return {
        executeSvnCommand,
        svnQueueSerial,
        extractRevisionNumber,
        sanitizeCommitMessage,
        cleanup
    };
}