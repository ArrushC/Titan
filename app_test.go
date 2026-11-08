package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestBranchConfigFirstRunAndRoundTrip(t *testing.T) {
	app := &App{}
	path := filepath.Join(t.TempDir(), "config", "Titan.branches.json")
	var config BranchConfig
	if err := app.loadConfig(path, &config); err != nil {
		t.Fatal(err)
	}
	if config.Folders == nil || config.Branches == nil {
		t.Fatal("first run must initialize maps")
	}
	config.Folders["project"] = Folder{Color: "#123456", BranchIds: []string{"trunk"}}
	config.Branches["trunk"] = Branch{BranchVersion: "Trunk", BranchPath: `C:\SVN\project\trunk`}
	if err := app.saveConfig(path, &config); err != nil {
		t.Fatal(err)
	}
	var restored BranchConfig
	if err := app.loadConfig(path, &restored); err != nil {
		t.Fatal(err)
	}
	if restored.Branches["trunk"] != config.Branches["trunk"] {
		t.Fatal("branch changed during round trip")
	}
	if got := restored.Folders["project"].BranchIds; len(got) != 1 || got[0] != "trunk" {
		t.Fatalf("branch references changed: %v", got)
	}
}

func TestMalformedConfigIsNotOverwritten(t *testing.T) {
	app := &App{}
	path := filepath.Join(t.TempDir(), "Titan.app.json")
	const malformed = `{"integrations":`
	if err := os.WriteFile(path, []byte(malformed), 0600); err != nil {
		t.Fatal(err)
	}
	if err := app.loadConfig(path, &AppConfig{}); err == nil {
		t.Fatal("expected invalid JSON error")
	}
	got, err := os.ReadFile(path)
	if err != nil || string(got) != malformed {
		t.Fatalf("malformed config was overwritten: %q, %v", got, err)
	}
}
