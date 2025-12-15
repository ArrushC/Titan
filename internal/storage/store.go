package storage

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"sync"
)

type StateStore struct {
	mu       sync.RWMutex
	path     string
	lastJSON []byte // last snapshot received from frontend
}

type Option func(*StateStore)

func WithPathOverride(p string) Option { return func(s *StateStore) { s.path = p } }

func New(appName string, opts ...Option) (*StateStore, error) {
	cfgDir, err := os.UserConfigDir()
	if err != nil {
		return nil, err
	}
	dir := filepath.Join(cfgDir, appName)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}
	s := &StateStore{path: filepath.Join(dir, "state.json")}
	for _, opt := range opts {
		opt(s)
	}
	return s, nil
}

func (s *StateStore) DataPath() string { return s.path }

// LoadState returns "{}" if file not found.
func (s *StateStore) LoadState() (string, error) {
	s.mu.RLock()
	path := s.path
	s.mu.RUnlock()

	b, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return "{}", nil
	}
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// SaveState caches and writes immediately (frontend already debounces).
func (s *StateStore) SaveState(jsonStr string) error {
	s.mu.Lock()
	s.lastJSON = []byte(jsonStr)
	data := append([]byte(nil), s.lastJSON...) // copy
	path := s.path
	s.mu.Unlock()
	return atomicWrite(path, data)
}

// Flush writes the last cached snapshot if any.
func (s *StateStore) Flush() error {
	s.mu.RLock()
	data := append([]byte(nil), s.lastJSON...)
	path := s.path
	s.mu.RUnlock()
	if len(data) == 0 {
		return nil
	}
	return atomicWrite(path, data)
}

func atomicWrite(path string, data []byte) error {
	tmp := path + ".tmp"
	// validate JSON upfront to avoid corrupting on disk
	var v map[string]any
	if err := json.Unmarshal(data, &v); err != nil {
		return err
	}

	if err := os.WriteFile(tmp, data, 0o600); err != nil {
		return err
	}
	// Windows can't rename over existing; remove first.
	if runtime.GOOS == "windows" {
		_ = os.Remove(path)
	}
	return os.Rename(tmp, path)
}