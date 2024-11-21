const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
	fetchUsername: () => ipcRenderer.invoke("fetch-username"),
	getAppVersion: () => ipcRenderer.invoke("app-version"),
	openTortoiseSVNDiff: (data) => ipcRenderer.invoke("open-tortoisesvn-diff", data),
	fetchCustomScripts: () => ipcRenderer.invoke("fetch-custom-scripts"),
	openSvnResolve: (data) => ipcRenderer.invoke("open-svn-resolve", data),
	runCustomScript: (data) => ipcRenderer.invoke("run-custom-script", data),
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
