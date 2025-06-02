import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { setupLogger, setupUncaughtExceptionHandler } from "./logger.js";
import { parentPort } from "worker_threads";

// Import performance optimization modules
import { SVNManager } from "./svnManager.js";
import { SocketManager } from "./socketManager.js";
import { FileWatcher } from "./fileWatcher.js";
import { PerformanceMonitor } from "./performance.js";

// Import modularized components
import { setupRoutes } from "./routes.mjs";
import { createSvnOperations } from "./svn-operations.mjs";
import { setupSocketHandlers } from "./socket-handlers.mjs";
import { loadInitialState } from "./config-manager.mjs";
import { 
    createTargetsFileWriter, 
    createSvnLogsCacheSaver, 
    createCommitLiveResponsesSaver 
} from "./utils.mjs";

export function initialiseServer() {
	//-------------------------------------------------------------------
	// 1) Basic environment setup
	//-------------------------------------------------------------------

	// Helper function to send messages to parent (works with fork, worker threads, or direct import)
	function sendToParent(message) {
		if (parentPort) {
			// Worker thread
			parentPort.postMessage(message);
		} else if (process.send) {
			// Fork
			process.send(message);
		}
		// If neither, we're running directly in the main process - no need to send messages
	}

	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	const packageJsonPath = path.join(__dirname, "../package.json");
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

	const { version: latestVersion, configFilePath, targetsFilePath, svnLogsCacheFilePath, commitLiveResponsesFilePath } = packageJson;

	const isDev = process.env.NODE_ENV === "development";
	const port = process.env.PORT || 4000;
	const frontendPort = isDev ? 5173 : port;

	// Create a logger instance
	const logger = setupLogger("server.mjs");
	setupUncaughtExceptionHandler(logger);

	logger.info("1) Basic environment setup ✅");
	sendToParent({ 
		type: "server-initializing", 
		status: "Starting server...",
		detail: "Setting up core environment"
	});
	//-------------------------------------------------------------------
	// 2) Initialize Express, HTTP, Socket.IO
	//-------------------------------------------------------------------
	const app = express();
	const server = createServer(app);
	const io = new Server(server, {
		cors: {
			origin: "*",
			credentials: true,
		},
		// Socket.IO optimizations
		pingTimeout: 60000,
		pingInterval: 25000,
		upgradeTimeout: 30000,
		maxHttpBufferSize: 1e6, // 1MB
		transports: ['websocket', 'polling'], // Prefer websocket
		allowEIO3: true,
		perMessageDeflate: {
			threshold: 1024 // Only compress messages larger than 1KB
		}
	});

	// Initialize performance optimization modules
	const performanceMonitor = new PerformanceMonitor();
	const svnManager = new SVNManager(logger);
	const socketManager = new SocketManager(io, logger);
	const fileWatcher = new FileWatcher(logger, svnManager);

	const instanceData = {
		commitLiveResponses: [],
		subversionLogsCache: {},
		branchWatchers: {},
		performanceMonitor,
		svnManager,
		socketManager,
		fileWatcher
	};

	logger.info("2) Initialise Express, HTTP, Socket.IO ✅");
	sendToParent({ 
		type: "server-initializing", 
		status: "Starting server...",
		detail: "Initializing web server and real-time connections"
	});
	//-------------------------------------------------------------------
	// 3) Load any disk-based state on startup (if present)
	//-------------------------------------------------------------------
	loadInitialState(svnLogsCacheFilePath, commitLiveResponsesFilePath, instanceData, logger).then(() => {
		logger.info("3) Load disk-based state completed ✅");
	});
	//-------------------------------------------------------------------
	// 4) Setup Express Routes and Middleware
	//-------------------------------------------------------------------
	setupRoutes(app, {
		isDev,
		latestVersion,
		performanceMonitor,
		svnManager,
		socketManager,
		fileWatcher,
		logger
	});

	logger.info("4) Express routes and middleware setup ✅");
	sendToParent({ 
		type: "server-initializing", 
		status: "Starting server...",
		detail: "Configuring API endpoints and middleware"
	});
	//-------------------------------------------------------------------
	// 5) Create utility functions
	//-------------------------------------------------------------------
	const writeTargetsFile = createTargetsFileWriter(targetsFilePath, logger);
	const saveSvnLogsCache = createSvnLogsCacheSaver(svnLogsCacheFilePath, instanceData, logger);
	const saveCommitLiveResponses = createCommitLiveResponsesSaver(commitLiveResponsesFilePath, instanceData, logger);

	logger.info("5) Utility functions created ✅");
	//-------------------------------------------------------------------
	// 6) Create SVN operations module
	//-------------------------------------------------------------------
	const svnOperations = createSvnOperations(logger);

	logger.info("6) SVN operations module created ✅");
	//-------------------------------------------------------------------
	// 7) Setup Socket.IO handlers
	//-------------------------------------------------------------------
	const socketHandlers = setupSocketHandlers(io, {
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
	});

	logger.info("7) Socket.IO handlers setup ✅");
	sendToParent({ 
		type: "server-initializing", 
		status: "Server ready!",
		detail: "Finalizing server configuration"
	});
	//-------------------------------------------------------------------
	// 8) Graceful shutdown for signals
	//-------------------------------------------------------------------
	async function gracefulShutdown(signal) {
		logger.info(`Received ${signal}. Starting graceful shutdown...`);

		// Save state with debounced functions
		await Promise.all([
			saveSvnLogsCache.flush(),
			saveCommitLiveResponses.flush()
		]);

		// Close file watchers
		await fileWatcher.close();

		// Cleanup modules
		if (svnOperations.cleanup) svnOperations.cleanup();
		if (socketHandlers.cleanup) socketHandlers.cleanup();

		// Close the HTTP server
		server.close(() => {
			logger.info("HTTP server closed.");

			// Close socket.io connections
			io.close(() => {
				logger.info("Socket.IO connections closed.");

				sendToParent({ type: "shutdown-complete" });

				logger.info("Graceful shutdown completed.");
				process.exit(0);
			});
		});

		// If the server hasn't finished in 10 seconds, force a shutdown
		setTimeout(() => {
			logger.error("Could not close connections in time, forcefully shutting down");
			process.exit(1);
		}, 10000);
	}

	process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
	process.on("SIGINT", () => gracefulShutdown("SIGINT"));

	// Listen for unhandled rejections
	process.on("unhandledRejection", (reason, promise) => {
		logger.error("Unhandled Rejection at:" + JSON.stringify(promise, null, 4) + "reason:" + reason);
	});

	logger.info("8) Graceful shutdown handlers setup ✅");
	//-------------------------------------------------------------------
	// 9) Finally, start listening
	//-------------------------------------------------------------------
	server.listen(port, async () => {
		logger.info(`Listening on port ${port}`);
		logger.info(`Current version: ${latestVersion}`);
		logger.info(`You can access the application at http://localhost:${port}`);

		// Log initial performance metrics after 5 seconds
		setTimeout(() => {
			const metrics = svnManager.getPerformanceMetrics();
			logger.info("Initial performance metrics:", metrics);
		}, 5000);

		// Add a small delay to make the progression visible
		setTimeout(() => {
			sendToParent({ type: "server-ready" });
		}, 500);
	});

	logger.info("9) Server listening ✅");
	return { server, io };
}

// Only initialize if this file is run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
	initialiseServer();
}