import { createLogger, format, transports } from "winston";
import fs from "fs";
import path from "path";

const { combine, timestamp, printf, errors } = format;

const myFormat = printf(({ level, message, timestamp, stack, label }) => {
	return `${timestamp} [${label}] [${level}]: ${stack || message}`;
});

export const logFilePath = "C:/ATHive/Titan.app.log";

// Ensure the log file exists
const logDir = path.dirname(logFilePath);
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir, { recursive: true });
}

fs.writeFileSync(logFilePath, "");

const baseLogger = createLogger({
	format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), errors({ stack: true }), myFormat),
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
