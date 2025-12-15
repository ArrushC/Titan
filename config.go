package main

/************ Titan.branches.json  ************/
type Folder struct {
	Order     int      `json:"order"`
	Color     string   `json:"color"`
	BranchIds []string `json:"branchIds"`
}

type Branch struct {
	BranchVersion string `json:"branchVersion"`
	BranchPath    string `json:"branchPath"`
}

type BranchConfig struct {
	Folders  map[string]Folder `json:"folders"`
	Branches map[string]Branch `json:"branches"`
}

/************ Titan.app.json  ************/
type Trello struct {
	Key   string `json:"key"`
	Token string `json:"token"`
}

type Subversion struct {
	Author string `json:"author"`
}

type Integrations struct {
	Trello Trello `json:"trello"`
}

type IgnoredPaths struct {
	Unknown  []string `json:"unknown"`
	Modified []string `json:"modified"`
}

type CommitVariable struct {
	Name         string `json:"name"`
	DefaultValue string `json:"defaultValue"`
	Description  string `json:"description"`
	Required     bool   `json:"required"`
}

type CommitSettings struct {
	Variables         []CommitVariable `json:"variables"`
	MessageTemplate   string           `json:"messageTemplate"`
	MaxCommitDelay    float64          `json:"maxCommitDelay"`
	ClipboardTemplate string           `json:"clipboardTemplate"`
}

type ScriptExecution struct {
	ScriptName   string   `json:"scriptName"`
	ExecutedAt   string   `json:"executedAt"`
	BranchPaths  []string `json:"branchPaths"`
	Success      bool     `json:"success"`
	OutputSample string   `json:"outputSample,omitempty"`
}

type AppConfig struct {
	Subversion   Subversion     `json:"subversion"`
	Integrations Integrations   `json:"integrations"`
	IgnoredPaths IgnoredPaths   `json:"ignoredPaths"`
	Commit       CommitSettings `json:"commit"`
	Theme        string         `json:"theme,omitempty"`
}

/************ Titan.scripts.json  ************/
type ScriptSettings struct {
	ScriptsPath         string `json:"scriptsPath"`
	MaxHistorySize      int    `json:"maxHistorySize"`
	EnableNotifications bool   `json:"enableNotifications"`
}

type ScriptConfig struct {
	ExecutionHistory []ScriptExecution `json:"executionHistory"`
	Settings         ScriptSettings    `json:"settings"`
}
