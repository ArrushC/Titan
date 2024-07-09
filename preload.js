const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
	getAppVersion: () => ipcRenderer.invoke("app-version"),
	onAppClosing: (callback) => ipcRenderer.on("app-closing", callback),
	removeAppClosingListener: () => ipcRenderer.removeAllListeners("app-closing"),
	quitApp: () => ipcRenderer.send("app-quit"),
});
