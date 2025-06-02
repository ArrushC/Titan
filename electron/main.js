import { app, BrowserWindow, screen, ipcMain, dialog, session, shell } from "electron";
import electronUpdaterPkg from "electron-updater";
import fs from "fs";
import path from "path";
import os from "os";
import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import { exec, execSync } from "child_process";
import { setupLogger, setupUncaughtExceptionHandler } from "../server/logger.js";

const { autoUpdater } = electronUpdaterPkg;
const isDev = process.env.NODE_ENV === "development";
const connectionURL = "http://localhost:4000";

// Suppress security warnings in development mode
// These warnings don't apply to production builds which have proper CSP
if (isDev) {
	process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

// Window state management
const windowStateFile = path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
	try {
		if (fs.existsSync(windowStateFile)) {
			const state = JSON.parse(fs.readFileSync(windowStateFile, 'utf-8'));
			logger.info("Loaded window state:", state);
			return state;
		}
	} catch (error) {
		logger.error("Failed to load window state:", error);
	}
	return null;
}

function saveWindowState() {
	if (!mainWindow || mainWindow.isDestroyed()) return;

	const bounds = mainWindow.getBounds();
	const isMaximized = mainWindow.isMaximized();
	const isFullScreen = mainWindow.isFullScreen();

	const state = {
		x: bounds.x,
		y: bounds.y,
		width: bounds.width,
		height: bounds.height,
		isMaximized,
		isFullScreen
	};

	try {
		fs.writeFileSync(windowStateFile, JSON.stringify(state, null, 2));
		logger.info("Saved window state:", state);
	} catch (error) {
		logger.error("Failed to save window state:", error);
	}
}

// Create a logger instance
const logger = setupLogger("main.js");
setupUncaughtExceptionHandler();

if (process.defaultApp) {
	if (process.argv.length >= 2) {
		app.setAsDefaultProtocolClient("titan", process.execPath, [path.resolve(process.argv[1])]);
	}
} else {
	app.setAsDefaultProtocolClient("titan");
}

const gotTheLock = app.requestSingleInstanceLock();

// Enable V8 code caching and optimizations for faster startup
app.commandLine.appendSwitch("js-flags", "--max-old-space-size=4096 --optimize-for-size --use-cache");
app.commandLine.appendSwitch("enable-features", "V8CodeCache,VaapiVideoDecoder");
app.commandLine.appendSwitch("disable-features", "MediaRouter");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");

// Additional optimizations for faster localhost loading
app.commandLine.appendSwitch("disable-http-cache"); // Prevents caching issues with localhost
app.commandLine.appendSwitch("disable-gpu-sandbox"); // Speeds up GPU initialization
app.commandLine.appendSwitch("no-sandbox"); // Faster startup but use with caution
app.commandLine.appendSwitch("disable-software-rasterizer"); // Use hardware acceleration
app.commandLine.appendSwitch("disable-dev-shm-usage"); // Prevents shared memory issues
app.commandLine.appendSwitch("ignore-gpu-blocklist"); // Use GPU even if blocklisted
app.commandLine.appendSwitch("enable-unsafe-webgpu"); // Enable WebGPU for better performance
app.commandLine.appendSwitch("enable-zero-copy"); // Optimize memory copying
app.commandLine.appendSwitch("disable-site-isolation-trials"); // Reduce process overhead
app.commandLine.appendSwitch("disable-web-security"); // Allow localhost without CORS issues
app.commandLine.appendSwitch("allow-insecure-localhost"); // Trust localhost certificates
app.commandLine.appendSwitch("ignore-certificate-errors"); // Skip cert validation for localhost
app.commandLine.appendSwitch('auto-detect', 'false');
app.commandLine.appendSwitch('no-proxy-server');

let mainWindow;
let serverWorker = null;
let isQuitting = false;
let updateDownloaded = false;

function createWindow() {
	const primaryDisplay = screen.getPrimaryDisplay();
	const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

	// Load saved window state or use defaults
	const savedState = loadWindowState();
	const defaultWidth = Math.round(screenWidth * 0.9);
	const defaultHeight = Math.round(screenHeight * 0.9);

	// Validate saved position is still on screen
	const windowConfig = {
		width: savedState?.width || defaultWidth,
		height: savedState?.height || defaultHeight,
		backgroundColor: "#0f172a",
		frame: false,
		show: false, // Start hidden, show after bounds are set
		resizable: true,
		autoHideMenuBar: true,
		transparent: false, // Ensure no transparency for sharp corners
		hasShadow: true,
		roundedCorners: false,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: fs.existsSync(path.join(__dirname, "preload.mjs")) ? path.join(__dirname, "preload.mjs") : path.join(__dirname, "preload.js"),
			sandbox: true,
		},
	};

	// Add saved position if valid
	if (savedState?.x !== undefined && savedState?.y !== undefined) {
		const displays = screen.getAllDisplays();
		const isOnScreen = displays.some(display => {
			return savedState.x >= display.bounds.x &&
				   savedState.y >= display.bounds.y &&
				   savedState.x < display.bounds.x + display.bounds.width &&
				   savedState.y < display.bounds.y + display.bounds.height;
		});

		if (isOnScreen) {
			windowConfig.x = savedState.x;
			windowConfig.y = savedState.y;
		}
	}

	mainWindow = new BrowserWindow(windowConfig);

	// Restore maximized/fullscreen state after window is created
	if (savedState?.isMaximized) {
		mainWindow.maximize();
	}
	if (savedState?.isFullScreen) {
		mainWindow.setFullScreen(true);
	}

	// Show window after state is restored
	mainWindow.show();

	// Track if we've loaded the main app yet
	let mainAppLoaded = false;

	// Save window state on resize/move
	let saveStateTimeout;
	const debouncedSaveState = () => {
		clearTimeout(saveStateTimeout);
		saveStateTimeout = setTimeout(saveWindowState, 1000);
	};

	mainWindow.on('resize', debouncedSaveState);
	mainWindow.on('move', debouncedSaveState);
	mainWindow.on('maximize', saveWindowState);
	mainWindow.on('unmaximize', saveWindowState);
	mainWindow.on('enter-full-screen', saveWindowState);
	mainWindow.on('leave-full-screen', saveWindowState);

	// Load splash screen first, then wait for server
	mainWindow.loadFile(path.join(__dirname, "../splash.html"));

	// Preconnect to localhost to reduce DNS lookup time
	if (isDev) {
		mainWindow.webContents.executeJavaScript(`
			const link = document.createElement('link');
			link.rel = 'preconnect';
			link.href = '${process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'}';
			document.head.appendChild(link);
		`).catch(() => {});
	}

	// Ensure splash screen is displayed for minimum time
	mainWindow.webContents.once("did-finish-load", () => {
		logger.info("Splash screen loaded successfully");
		// Set a flag that splash is ready
		mainWindow.splashReady = true;

		// Send initial status to splash
		mainWindow.webContents.send("splash-status", {
			message: "Initializing Titan...",
			detail: "Starting application services"
		});
	});

	// Set CSP headers
	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		const csp = isDev
			? [
					"default-src 'self' 'unsafe-inline' 'unsafe-eval'",
					"connect-src 'self' http://localhost:4000 http://localhost:5173 ws://localhost:4000 ws://localhost:5173",
					"img-src 'self' data:",
					"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
					"font-src 'self' data: https://fonts.gstatic.com",
			  ].join("; ")
			: ["default-src 'self'", "connect-src 'self' http://localhost:4000 ws://localhost:4000", "img-src 'self' data:", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", "font-src 'self' data: https://fonts.gstatic.com"].join("; ");

		callback({
			responseHeaders: {
				...details.responseHeaders,
				"Content-Security-Policy": [csp],
			},
		});
	});

	session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
		const url = webContents.getURL();
		if (url.startsWith("https://trello.com") || url.includes(".trello.com") || permission === "clipboard-sanitized-write") {
			callback(true);
		} else {
			callback(false);
		}
	});

	// Enable iframe loading
	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				"X-Frame-Options": ["ALLOWALL"],
			},
		});
	});

	// Add debugging for page loads
	mainWindow.webContents.on("did-start-loading", () => {
		logger.info("Window started loading content");
	});

	mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
		logger.error(`Window failed to load: ${errorCode} - ${errorDescription}`);
	});

	// Window is already shown, just focus it
	mainWindow.focus();

	// Open DevTools in development for debugging
	if (isDev) {
		mainWindow.webContents.openDevTools();
	}

	mainWindow.on("close", function (event) {
		if (!isQuitting) {
			event.preventDefault();
			mainWindow.webContents.send("app-closing");
		} else {
			// Save window state before closing
			saveWindowState();
		}
	});

	// Open external links in the default browser
	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: "deny" };
	});
}

function startServer() {
	logger.info("Starting server in worker thread...");

	// Send server starting status to splash
	if (mainWindow && !mainWindow.isDestroyed()) {
		mainWindow.webContents.send("splash-status", {
			message: "Starting server...",
			detail: "Initializing Node.js backend services"
		});
	}

	try {
		// In development, use the actual file path
		// In production, the worker code will be bundled
		if (isDev) {
			const workerPath = path.join(__dirname, "serverWorker.js");
			serverWorker = new Worker(workerPath);
		} else {
			// In production, we need to use a different approach
			// Create a worker from bundled code
			const workerCode = `
				const { parentPort } = require('worker_threads');
				const path = require('path');

				// This is a placeholder - in production build, this would include the bundled server code
				// For now, we'll use dynamic import
				(async () => {
					try {
						const serverPath = path.join(__dirname, '../server/server.mjs');
						const { initialiseServer } = await import(serverPath);

						let serverInstance = null;
						let ioInstance = null;

						parentPort.on("message", (message) => {
							if (message.type === "shutdown") {
								if (serverInstance) {
									serverInstance.close(() => {
										if (ioInstance) {
											ioInstance.close(() => {
												parentPort.postMessage({ type: "shutdown-complete" });
												process.exit(0);
											});
										} else {
											parentPort.postMessage({ type: "shutdown-complete" });
											process.exit(0);
										}
									});
									setTimeout(() => process.exit(1), 5000);
								} else {
									process.exit(0);
								}
							}
						});

						const { server, io } = await initialiseServer();
						serverInstance = server;
						ioInstance = io;
					} catch (error) {
						parentPort.postMessage({ type: "error", error: error.message });
						process.exit(1);
					}
				})();
			`;

			serverWorker = new Worker(workerCode, { eval: true });
		}

		serverWorker.on("message", (message) => {
			if (message.type === "server-ready") {
				logger.info("Server is ready in worker thread");

				// Send server ready status to splash
				if (mainWindow && !mainWindow.isDestroyed()) {
					mainWindow.webContents.send("splash-status", {
						message: "Server ready!",
						detail: "Loading user interface..."
					});
				}

				// Ensure splash has been shown for minimum time
				const loadMainApp = () => {
					if (!mainWindow.splashReady) {
						// Wait for splash to be ready
						setTimeout(loadMainApp, 100);
						return;
					}

					// Load the main app
					logger.info("Transitioning from splash to main app");
					if (isDev) {
						mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
					} else {
						mainWindow.loadURL(connectionURL);
					}
				};

				// Wait minimum 1 second to show splash properly
				setTimeout(loadMainApp, 1000);
			} else if (message.type === "server-initializing") {
				// Forward server initialization messages to splash
				if (mainWindow && !mainWindow.isDestroyed()) {
					mainWindow.webContents.send("splash-status", {
						message: message.status || "Initializing server...",
						detail: message.detail || ""
					});
				}
			} else if (message.type === "error") {
				logger.error(`Worker thread error: ${message.error}`);
			} else if (message.type === "shutdown-complete") {
				logger.info("Server shutdown complete in worker thread");
			}
		});

		serverWorker.on("error", (error) => {
			logger.error("Server worker error:");
			logger.error(error);
		});

		serverWorker.on("exit", (code) => {
			logger.info(`Server worker exited with code ${code}`);
			if (!isQuitting) app.quit();
		});

	} catch (error) {
		logger.error("Failed to start server worker:");
		logger.error(error);
		if (!isQuitting) app.quit();
	}
}

async function getFormattedMemoryInfo() {
	const memoryInfo = await process.getProcessMemoryInfo();
	const systemMemory = process.getSystemMemoryInfo();

	const formatMemory = (bytes) => {
		const mb = bytes / 1024 / 1024;
		if (mb < 1024) {
			return `${mb.toFixed(2)} MB`;
		} else {
			return `${(mb / 1024).toFixed(2)} GB`;
		}
	};

	const appUsage = formatMemory(memoryInfo.private);
	const totalSystemMemory = formatMemory(systemMemory.total * 1024);
	const freeSystemMemory = formatMemory(systemMemory.free * 1024);

	return {
		appUsage: `This app is currently using ${appUsage} of memory`,
		systemMemory: `Your system has ${totalSystemMemory} total memory, with ${freeSystemMemory} currently available`,
	};
}

function setupMemoryMonitoring() {
	const intervalId = setInterval(async () => {
		const memoryInfo = await getFormattedMemoryInfo();
		logger.debug("App Memory Usage:", memoryInfo.appUsage);
		logger.debug("System Memory:", memoryInfo.systemMemory);
	}, 60_000 * 2); // Log every 2 minutes

	// Clear interval on app quit
	app.on("will-quit", () => clearInterval(intervalId));
}

function checkForUpdates() {
	autoUpdater.setFeedURL({
		provider: "github",
		owner: "ArrushC",
		repo: "Titan",
	});

	autoUpdater.autoDownload = false;
	autoUpdater.autoInstallOnAppQuit = true;
	autoUpdater.autoRunAppAfterInstall = true;

	logger.info("Running an initial check for any available updates.");
	autoUpdater.checkForUpdates();

	setInterval(() => {
		logger.info("Running a scheduled check for any available update.");
		// Check for updates every hour
		autoUpdater.checkForUpdates();
	}, 1000 * 60 * 60 * 2);

	autoUpdater.on("update-available", () => {
		logger.info("Update available, automatically firing the downloading process...");
		// mainWindow.webContents.send("update-available");
		autoUpdater.downloadUpdate();
	});

	autoUpdater.on("update-downloaded", () => {
		logger.info("Update downloaded");
		mainWindow.webContents.send("update-downloaded");
		updateDownloaded = true;
		autoUpdater.quitAndInstall();
	});

	autoUpdater.on("update-not-available", () => {
		logger.info("No updates available");
		mainWindow.webContents.send("update-not-available");
	});

	autoUpdater.on("error", (error) => {
		logger.error("AutoUpdater error:", error);
		mainWindow.webContents.send("update-error", error);
	});
}

if (!gotTheLock) {
	app.quit();
} else {
	app.on("second-instance", (event, commandLine, workingDirectory) => {
		if (mainWindow) {
			if (mainWindow.isMinimized()) mainWindow.restore();
			mainWindow.focus();
		}
		dialog.showMessageBox(mainWindow, {
			title: "Titan",
			message: "Titan is already running",
			detail: "Another instance of Titan is already running, please close it before starting a new one.",
			icon: path.join(__dirname, "../icons/Titan.ico"),
		});
	});

	app.on("ready", async () => {
		createWindow();
		startServer();
		setupMemoryMonitoring();
		checkForUpdates();
	});
}

app.on("window-all-closed", function () {
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
	if (mainWindow === null) createWindow();
});

// Graceful shutdown
app.on("before-quit", (event) => {
	if (!isQuitting) {
		event.preventDefault();
		gracefulShutdown();
	}
});

function gracefulShutdown() {
	if (isQuitting) return;
	isQuitting = true;

	logger.info("Starting graceful shutdown");

	if (!updateDownloaded) {
		const shutdownDialog = new BrowserWindow({
			width: 400,
			height: 400,
			frame: false,
			transparent: true,
			alwaysOnTop: true,
			skipTaskbar: true,
			resizable: false,
		});

		shutdownDialog.loadFile(path.join(__dirname, "../shutdown.html"));
	}


	// Notify the renderer process
	if (mainWindow && !mainWindow.isDestroyed()) {
		mainWindow.webContents.send("app-closing");
	}

	// Wait for renderer acknowledgment (optional)
	const rendererShutdownPromise = new Promise((resolve) => {
		ipcMain.once("renderer-shutdown-complete", () => {
			logger.info("Renderer process reported shutdown complete");
			resolve();
		});

		// Set a timeout to proceed anyway if renderer doesn't respond
		setTimeout(() => {
			logger.warn("Renderer shutdown timed out");
			resolve();
		}, 5000); // 5-second timeout
	});

	// Shutdown server process
	const serverShutdownPromise = shutdownServerWorker();

	// Wait for both renderer and server shutdowns
	Promise.all([rendererShutdownPromise, serverShutdownPromise])
		.then(() => {
			terminateApp();
		})
		.catch((error) => {
			logger.error("Error during shutdown:", error);
			terminateApp();
		});
}

function shutdownServerWorker() {
	return /** @type {Promise<void>} */ (
		new Promise((resolve) => {
			if (serverWorker) {
				logger.info("Sending shutdown signal to server worker");
				serverWorker.postMessage({ type: "shutdown" });

				const onShutdownComplete = () => {
					logger.info("Server worker reported shutdown complete");
					cleanup();
					resolve();
				};

				const onExit = (code) => {
					logger.info(`Server worker exited with code ${code}`);
					cleanup();
					resolve();
				};

				const onError = (error) => {
					logger.error("Server worker error during shutdown:", error);
					cleanup();
					resolve(); // Still resolve to continue shutdown
				};

				const cleanup = () => {
					clearTimeout(timeout);
					serverWorker.removeListener("message", onMessage);
					serverWorker.removeListener("exit", onExit);
					serverWorker.removeListener("error", onError);
				};

				const onMessage = (message) => {
					if (message.type === "shutdown-complete") {
						onShutdownComplete();
					}
				};

				serverWorker.once("message", onMessage);
				serverWorker.once("exit", onExit);
				serverWorker.once("error", onError);

				// Set a timeout to force terminate if necessary
				const timeout = setTimeout(() => {
					logger.warn("Server worker shutdown timed out, forcing termination");
					serverWorker.terminate();
					cleanup();
					resolve();
				}, 5000); // 5-second timeout
			} else {
				resolve();
			}
		})
	);
}

function terminateApp() {
	logger.info("Terminating application");
	app.quit();
}

function commandExists(command) {
	try {
		execSync(`${command} --version`);
		return true;
	} catch (error) {
		return false;
	}
}

process.on("uncaughtException", (error) => {
	logger.error("Uncaught Exception:", error);
	if (!isQuitting) {
		gracefulShutdown();
	}
});

// Hardware acceleration is enabled by default
// If you need to disable it for any reason, you can use:
// app.disableHardwareAcceleration();

// Performance optimisation
app.commandLine.appendSwitch("disable-renderer-backgrounding");

// IPC communication
ipcMain.handle("app-version", () => app.getVersion());

ipcMain.handle("open-tortoisesvn-diff", async (event, data) => {
	const { fullPath, branchFolder, branchVersion } = data;
	logger.info(`Opening TortoiseSVN diff for: ${fullPath} (${branchFolder} ${branchVersion})`);
	const command = `TortoiseProc.exe /command:diff /ignoreprops /path:"${fullPath}" /revision1:HEAD /revision2:BASE`;

	return new Promise((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error) {
				console.error(`Error: ${error.message}`);
				reject({ success: false, error: error.message });
			} else if (stderr) {
				console.error(`Stderr: ${stderr}`);
				reject({ success: false, error: stderr });
			} else {
				console.log(`Stdout: ${stdout}`);
				resolve({ success: true });
			}
		});
	});
});

ipcMain.handle("fetch-custom-scripts", async () => {
	const { configFolderPath } = packageJson;
	const scripts = [];

	try {
		const files = fs.readdirSync(configFolderPath);

		files.forEach((file) => {
			const ext = path.extname(file);
			if ([".bat", ".ps1"].includes(ext.toLowerCase())) {
				const fullPath = path.join(configFolderPath, file);
				scripts.push({
					fileName: path.parse(file).name,
					path: fullPath,
					type: ext.toLowerCase() === ".bat" ? "batch" : "powershell",
				});
			}
		});
	} catch (error) {
		logger.error(`Error reading the config folder: ${error.message}`);
		return { success: false, error: error.message };
	}

	// Return the list of scripts found
	return { success: true, scripts };
});

ipcMain.handle("open-svn-resolve", async (event, data) => {
	const { fullPath } = data;
	const formattedPath = fullPath.replace(/\\/g, "/");
	logger.info(`Opening TortoiseSVN resolve for: ${formattedPath}`);
	const command = `TortoiseProc.exe /command:resolve /path:"${formattedPath}"`;

	return new Promise((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error) {
				logger.error(`Error: ${error.message}`);
				logger.warn("This error might be just caused by the TortoiseSVN window being closed by the user.");
				// reject(JSON.stringify({ success: false, error: error.message }));
			} else if (stderr) {
				logger.error(`Stderr: ${stderr}`);
				// reject(JSON.stringify({ success: false, error: stderr }));
			} else {
				logger.debug(`Stdout: ${stdout}`);
			}
			resolve({ success: true });
		});
	});
});

ipcMain.handle("open-svn-diff", async (event, data) => {
	const { fullPath, revision, action } = data;
	const command = `TortoiseProc.exe /command:diff /path:"${fullPath}" /startrev:${action === "A" ? revision : Number(revision) - 1} /endrev:${revision}`;

	return new Promise((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error) {
				console.error(`Error: ${error.message}`);
				reject({ success: false, error: error.message });
			} else if (stderr) {
				console.error(`Stderr: ${stderr}`);
				reject({ success: false, error: stderr });
			} else {
				console.log(`Stdout: ${stdout}`);
				resolve({ success: true });
			}
		});
	});
});

ipcMain.handle("select-folder", async (event, data) => {
	const result = await dialog.showOpenDialog(mainWindow, {
		defaultPath: data?.defaultPath || os.homedir(),
		properties: ["openDirectory"],
	});

	// If the user cancels, return null
	return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("run-custom-script", async (event, data) => {
	const { scriptType, scriptPath, branchData } = data;
	logger.info(`Running custom script: ${scriptPath} (${scriptType}) with branch data: ${JSON.stringify(branchData)}`);

	return new Promise((resolve, reject) => {
		let command = "";
		const { id, "Branch Folder": branchFolder, "Branch Version": branchVersion, "SVN Branch": svnBranch } = branchData;

		const args = `"${id}" "${branchFolder}" "${branchVersion}" "${svnBranch}"`;

		if (!fs.existsSync(scriptPath)) {
			logger.warn(scriptPath.startsWith("C:\\Titan\\Titan_") ? `Titan script path not found: ${scriptPath}` : `Script path does not exist: ${scriptPath}`);
			resolve({ success: false });
			return;
		}

		if (scriptType === "batch") {
			command = `start cmd /k "${scriptPath}" ${args}`;
		} else if (scriptType === "powershell") {
			let shell = "powershell";
			if (commandExists("pwsh")) shell = "pwsh";
			command = `start ${shell} -ExecutionPolicy Bypass -Command "& {& '${scriptPath}' -id '${id}' -branchFolder '${branchFolder}' -branchVersion '${branchVersion}' -svnBranch '${svnBranch}'}"`;
		}

		exec(command, (error, stdout, stderr) => {
			if (error) {
				console.error(`Error: ${error.message}`);
				reject({ success: false, error: error.message });
				return;
			} else if (stderr) {
				console.error(`Stderr: ${stderr}`);
				reject({ success: false, error: stderr });
				return;
			}

			console.log(`Stdout: ${stdout}`);
			resolve({ success: true });
		});
	});
});

ipcMain.handle("download-update", () => {
	logger.info("Requested to download the update. Processing this request now.");
	return autoUpdater.downloadUpdate();
});

ipcMain.handle("check-for-updates", () => {
	logger.info("Requested to check for updates. Processing this request now.");
	return autoUpdater.checkForUpdates();
});

ipcMain.handle("app-minimize", () => {
	mainWindow.minimize();
});

ipcMain.handle("app-maximize", () => {
	if (mainWindow.isMaximized()) mainWindow.unmaximize();
	else mainWindow.maximize();
});

ipcMain.on("renderer-shutdown-complete", () => {
	logger.info("Received renderer shutdown acknowledgment");
});

ipcMain.handle("app-close", () => {
	if (!isQuitting) {
		gracefulShutdown();
	}
});

ipcMain.handle("app-restart", () => {
	app.relaunch();
	app.quit();
});

// Cleanup any remaining listeners
app.on("will-quit", () => {
	ipcMain.removeAllListeners();
	if (serverWorker) {
		serverWorker.removeAllListeners();
	}

	if (isDev) {
		session.defaultSession.getAllExtensions().forEach((extension) => {
			session.defaultSession.removeExtension(extension.id);
		});
	}
});
