import { app, BrowserWindow, screen, ipcMain, dialog, session, shell, Menu } from "electron";
import electronUpdaterPkg from "electron-updater";
import fs from "fs";
import path from "path";
import { fork } from "child_process";
import { fileURLToPath } from "url";
import { setupLogger, setupUncaughtExceptionHandler } from "./server/logger.js";
import { exec, execSync } from "child_process";

const { autoUpdater } = electronUpdaterPkg;
const isDev = process.env.NODE_ENV === "development";
const connectionURL = isDev ? "http://localhost:5173" : "http://localhost:4000";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

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

// Enable V8 code caching for faster startup
app.commandLine.appendSwitch("js-flags", "--max-old-space-size=4096");
app.commandLine.appendSwitch("enable-features", "V8CodeCache");

let mainWindow;
let splashWindow;
let serverProcess;
let isQuitting = false;
let updateDownloaded = false;

function createWindow() {
	const primaryDisplay = screen.getPrimaryDisplay();
	const { width, height } = primaryDisplay.workAreaSize;

	mainWindow = new BrowserWindow({
		width: width,
		height: height,
		backgroundColor: "#1A202C",
		frame: false,
		show: false,
		resizable: true,
		autoHideMenuBar: true,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, "preload.js"),
			sandbox: true,
		},
	});

	// Set CSP headers
	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		const csp = isDev
			? ["default-src 'self' 'unsafe-inline' 'unsafe-eval'", "connect-src 'self' http://localhost:4000 http://localhost:5173 ws://localhost:4000 ws://localhost:5173", "img-src 'self' data:", "style-src 'self' 'unsafe-inline'", "font-src 'self' data:"].join("; ")
			: ["default-src 'self'", "connect-src 'self' http://localhost:4000 ws://localhost:4000", "img-src 'self' data:", "style-src 'self' 'unsafe-inline'", "font-src 'self' data:"].join("; ");

		callback({
			responseHeaders: {
				...details.responseHeaders,
				"Content-Security-Policy": [csp],
			},
		});
	});

	mainWindow.loadURL(connectionURL);

	// Show window when it's ready to avoid flickering
	mainWindow.once("ready-to-show", () => {
		splashWindow.destroy();
		mainWindow.show();
		mainWindow.focus();
	});

	mainWindow.on("close", function (event) {
		if (!isQuitting) {
			event.preventDefault();
			mainWindow.webContents.send("app-closing");
		}
	});

	// Open external links in the default browser
	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: "deny" };
	});
}

function createSplashWindow() {
	splashWindow = new BrowserWindow({
		width: 400,
		height: 400,
		frame: false,
		transparent: true,
		alwaysOnTop: true,
		skipTaskbar: true,
		resizable: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	splashWindow.loadFile(path.join(__dirname, "splash.html"));

	// Center the splash window on the primary display
	const primaryDisplay = screen.getPrimaryDisplay();
	const { width, height } = primaryDisplay.workAreaSize;
	splashWindow.setPosition(Math.round(width / 2 - 200), Math.round(height / 2 - 150));

	splashWindow.setSkipTaskbar(true);
	splashWindow.removeMenu();
}

function startServer() {
	serverProcess = fork(path.join(__dirname, "server", "server.js"), [], {
		env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
	});

	serverProcess.on("message", (message) => {
		if (message === "server-ready") {
			createWindow();
		}
	});

	serverProcess.on("error", (error) => {
		logger.error("Server process error:");
		logger.error(error);
	});

	serverProcess.on("exit", (code, signal) => {
		logger.info(`Server process exited with code ${code} and signal ${signal}`);
		if (!isQuitting) app.quit();
	});
}

// Create application menu
function createMenu() {
	const template = [
		{
			label: "File",
			submenu: [
				{
					label: "Exit",
					click: () => {
						gracefulShutdown();
					},
				},
			],
		},
		{
			label: "Edit",
			submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }],
		},
		{
			label: "View",
			submenu: [{ role: "reload" }, { role: "forceReload" }, { role: "toggleDevTools" }, { type: "separator" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { type: "separator" }, { role: "togglefullscreen" }],
		},
		{
			label: "Help",
			submenu: [
				{
					label: "About",
					click: () => {
						dialog.showMessageBox(mainWindow, {
							title: "About",
							message: `Titan v${app.getVersion()}`,
							detail: "Created by ArrushC",
						});
					},
				},
			],
		},
	];

	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);
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

	autoUpdater.checkForUpdates();

	setInterval(() => {
		// Check for updates every hour
		autoUpdater.checkForUpdates();
	}, 1000 * 60 * 60 * 2);

	autoUpdater.on("update-available", () => {
		logger.info("Update available");
		mainWindow.webContents.send("update-available");
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
			icon: path.join(__dirname, "icons/Titan.ico"),
		});
	});

	app.on("ready", () => {
		createSplashWindow();
		startServer();
		createMenu();
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

		shutdownDialog.loadFile(path.join(__dirname, "shutdown.html"));
	}

	// Notify the renderer process
	if (mainWindow && !mainWindow.isDestroyed()) {
		mainWindow.webContents.send("app-closing");
	}

	// Shutdown server process
	if (serverProcess && !serverProcess.killed && !serverProcess.exited && serverProcess.connected) {
		logger.info("Sending shutdown signal to server");
		serverProcess.send("shutdown");
		setTimeout(() => {
			if (serverProcess) {
				logger.warn("Server shutdown timed out, forcing termination");
				serverProcess.kill();
			}
			terminateApp();
		}, 2000);
	} else {
		terminateApp();
	}
}

function terminateApp() {
	logger.info("Terminating application");
	app.exit(0);
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

ipcMain.handle("run-custom-script", async (event, data) => {
	const { scriptType, scriptPath, branchData } = data;
	logger.info(`Running custom script: ${scriptPath} (${scriptType}) with branch data: ${JSON.stringify(branchData)}`);

	return new Promise((resolve, reject) => {
		let command = "";
		const { id, "Branch Folder": branchFolder, "Branch Version": branchVersion, "SVN Branch": svnBranch } = branchData;

		const args = `"${id}" "${branchFolder}" "${branchVersion}" "${svnBranch}"`;

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

ipcMain.handle("download-update", () => {
	return autoUpdater.downloadUpdate();
});

ipcMain.handle("check-for-updates", () => {
	return autoUpdater.checkForUpdates();
});

ipcMain.handle("app-minimize", () => {
	mainWindow.minimize();
});

ipcMain.handle("app-maximize", () => {
	if (mainWindow.isMaximized()) mainWindow.unmaximize();
	else mainWindow.maximize();
});

ipcMain.handle("app-close", () => {
	if (!isQuitting) {
		gracefulShutdown();
	}
});

// Cleanup any remaining listeners
app.on("will-quit", () => {
	ipcMain.removeAllListeners();
	if (serverProcess) {
		serverProcess.removeAllListeners();
	}
});
