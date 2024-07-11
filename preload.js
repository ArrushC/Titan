const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
	getAppVersion: () => ipcRenderer.invoke("app-version"),
	openTortoiseSVNDiff: (data) => ipcRenderer.invoke('open-tortoisesvn-diff', data),
	onAppClosing: (callback) => ipcRenderer.on("app-closing", callback),
	removeAppClosingListener: () => ipcRenderer.removeAllListeners("app-closing"),
	quitApp: () => ipcRenderer.send("app-quit"),
});
