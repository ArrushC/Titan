const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
	getAppVersion: () => ipcRenderer.invoke("app-version"),
	openTortoiseSVNDiff: (data) => ipcRenderer.invoke('open-tortoisesvn-diff', data),
	onAppClosing: (callback) => ipcRenderer.on("app-closing", callback),
	removeAppClosingListener: () => ipcRenderer.removeAllListeners("app-closing"),
	startUpdate: () => ipcRenderer.invoke("app-update"),
	checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
	quitApp: () => ipcRenderer.invoke("app-quit"),
});
