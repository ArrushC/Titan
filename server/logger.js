import { createLogger, format, transports } from "winston";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const { combine, timestamp, printf, errors } = format;

// Track recent SVN errors to avoid duplicates
const recentSvnErrors = new Map();
const SVN_ERROR_CACHE_TIME = 5000; // 5 seconds

// Clean up old entries periodically
setInterval(() => {
	const now = Date.now();
	for (const [key, time] of recentSvnErrors.entries()) {
		if (now - time > SVN_ERROR_CACHE_TIME) {
			recentSvnErrors.delete(key);
		}
	}
}, 10000);

const myFormat = printf(({ level, message, timestamp, stack, label }) => {
	// Filter out duplicate SVN errors
	if (level === 'error' && message && typeof message === 'string') {
		// Check if it's an SVN error
		if (message.includes('SVN') && message.includes('failed for')) {
			// Extract the path and operation to create a unique key
			const match = message.match(/SVN (\w+) failed for (.+?) -/);
			if (match) {
				const key = `${match[1]}_${match[2]}`;
				const now = Date.now();
				
				// Check if we've seen this error recently
				if (recentSvnErrors.has(key)) {
					const lastTime = recentSvnErrors.get(key);
					if (now - lastTime < SVN_ERROR_CACHE_TIME) {
						return null; // Skip duplicate
					}
				}
				
				recentSvnErrors.set(key, now);
			}
		}
	}
	
	return `${timestamp} [${label}] [${level}]: ${stack || message}`;
});

export const logFilePath = packageJson.logFilePath;

// Ensure the log file exists
const logDir = path.dirname(logFilePath);
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir, { recursive: true });
}

fs.writeFileSync(logFilePath, "");

// Custom filter to remove null messages
const filterNullMessages = format((info) => {
	// If the formatted message is null, don't log it
	if (info[Symbol.for('message')] === null || info.message === null) {
		return false;
	}
	return info;
});

const baseLogger = createLogger({
	format: combine(
		timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), 
		errors({ stack: true }), 
		filterNullMessages(),
		myFormat
	),
	transports: [
		new transports.Console({
			level: "info",
			format: combine(format.colorize(), myFormat),
		}),
		new transports.File({
			filename: logFilePath,
			level: "silly",
			maxsize: 5242880, // 5MB
			maxFiles: 5,
		}),
	],
});

export function setupLogger(moduleName) {
	return {
		log: (level, message, meta = {}) => {
			baseLogger.log(level, message, { ...meta, label: moduleName });
		},
		error: (message, meta) => baseLogger.error(message, { ...meta, label: moduleName }),
		warn: (message, meta) => baseLogger.warn(message, { ...meta, label: moduleName }),
		info: (message, meta) => baseLogger.info(message, { ...meta, label: moduleName }),
		verbose: (message, meta) => baseLogger.verbose(message, { ...meta, label: moduleName }),
		debug: (message, meta) => baseLogger.debug(message, { ...meta, label: moduleName }),
		silly: (message, meta) => baseLogger.silly(message, { ...meta, label: moduleName }),
	};
}

export function setupUncaughtExceptionHandler(logger) {
	process.on("uncaughtException", (error) => {
		logger.error("Uncaught Exception:", error);
		process.exit(1);
	});

	process.on("unhandledRejection", (reason, promise) => {
		logger.error("Unhandled Rejection at:", promise, "reason:", reason);
	});
}

export default {
	logFilePath,
	setupLogger,
	setupUncaughtExceptionHandler,
};
