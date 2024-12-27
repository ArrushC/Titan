const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
	getAppVersion: () => ipcRenderer.invoke("app-version"),
	openTortoiseSVNDiff: (data) => ipcRenderer.invoke("open-tortoisesvn-diff", data),
	selectFolder: (data) => ipcRenderer.invoke('select-folder', data),
	fetchCustomScripts: () => ipcRenderer.invoke("fetch-custom-scripts"),
	openSvnResolve: (data) => ipcRenderer.invoke("open-svn-resolve", data),
	openSvnDiff: (data) => ipcRenderer.invoke("open-svn-diff", data),
	runCustomScript: (data) => ipcRenderer.invoke("run-custom-script", data),
	fireShutdownComplete: () => ipcRenderer.send("renderer-shutdown-complete"),
	onAppClosing: (callback) => ipcRenderer.on("app-closing", callback),
	removeAppClosingListener: () => ipcRenderer.removeAllListeners("app-closing"),
	downloadUpdate: () => ipcRenderer.invoke("download-update"),
	checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
	minimizeWindow: () => ipcRenderer.invoke("app-minimize"),
	maximizeWindow: () => ipcRenderer.invoke("app-maximize"),
	closeWindow: () => ipcRenderer.invoke("app-close"),
	restartApp: () => ipcRenderer.invoke("app-restart"),
	on: (channel, func) => {
		ipcRenderer.on(channel, (event, ...args) => func(...args));
	},
	removeAllListeners: (channel) => {
		ipcRenderer.removeAllListeners(channel);
	},
});
