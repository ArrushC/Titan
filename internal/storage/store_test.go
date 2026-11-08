package storage

import (
	"os"
	"path/filepath"
	"testing"
)

func TestStateRoundTripAndReplacement(t *testing.T) {
	s := &StateStore{path: filepath.Join(t.TempDir(), "state.json")}
	initial, err := s.LoadState()
	if err != nil || initial != "{}" {
		t.Fatalf("initial state = %q, %v", initial, err)
	}
	for _, snapshot := range []string{`{"tab":"branches"}`, `{"tab":"commit","selected":["trunk"]}`} {
		if err := s.SaveState(snapshot); err != nil {
			t.Fatal(err)
		}
		got, err := s.LoadState()
		if err != nil || got != snapshot {
			t.Fatalf("state = %q, %v; want %q", got, err, snapshot)
		}
	}
	if err := s.Flush(); err != nil {
		t.Fatal(err)
	}
}

func TestInvalidSnapshotPreservesSavedState(t *testing.T) {
	s := &StateStore{path: filepath.Join(t.TempDir(), "state.json")}
	const saved = `{"tab":"branches"}`
	if err := s.SaveState(saved); err != nil {
		t.Fatal(err)
	}
	if err := s.SaveState(`{"tab":`); err == nil {
		t.Fatal("expected invalid JSON to fail")
	}
	got, err := s.LoadState()
	if err != nil || got != saved {
		t.Fatalf("saved state changed: %q, %v", got, err)
	}
	if _, err := os.Stat(s.path + ".tmp"); !os.IsNotExist(err) {
		t.Fatalf("unexpected temporary file: %v", err)
	}
}
