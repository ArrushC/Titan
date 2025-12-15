package main

// DataProvider interface defines methods that the WebSocket server can use
// to access shared data and functionality from the main App
type DataProvider interface {
	// Data store operations (internal methods)
	getData(key string) interface{}
	setData(key string, value interface{})
	deleteData(key string)
	getAllData() map[string]interface{}

	// SVN operations that WebSocket might need
	SVNStatus(paths []string) (string, error)
	SVNLog(limit int, isVerbose bool, paths []string, includeAllAuthors bool) (string, error)
	SVNInfo(paths []string) (string, error)
	CheckSVNWorkingCopy() bool

	// Script operations removed - now using direct Go functions

	// Notification to frontend through Wails (internal method)
	notifyFrontend(eventName string, data interface{})
}