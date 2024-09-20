const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
	getAppVersion: () => ipcRenderer.invoke("app-version"),
	openTortoiseSVNDiff: (data) => ipcRenderer.invoke("open-tortoisesvn-diff", data),
	openVSCode: (data) => ipcRenderer.invoke("open-vscode", data),
	openTerminal: (data) => ipcRenderer.invoke("open-terminal", data),
	onAppClosing: (callback) => ipcRenderer.on("app-closing", callback),
	removeAppClosingListener: () => ipcRenderer.removeAllListeners("app-closing"),
	downloadUpdate: () => ipcRenderer.invoke("download-update"),
	checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
	minimizeWindow: () => ipcRenderer.invoke("app-minimize"),
	maximizeWindow: () => ipcRenderer.invoke("app-maximize"),
	closeWindow: () => ipcRenderer.invoke("app-close"),
	on: (channel, func) => {
		ipcRenderer.on(channel, (event, ...args) => func(...args));
	},
	removeAllListeners: (channel) => {
		ipcRenderer.removeAllListeners(channel);
	},
});
