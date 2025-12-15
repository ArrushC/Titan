package main

import (
	"context"
	"embed"
	"log"
	"os"
	"os/signal"
	"syscall"

	"Titan/internal/storage"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

// Windows-specific constants for hiding console windows
const (
	CREATE_NO_WINDOW = 0x08000000
)

const developmentMode = false
const AppID = "Titan"

func main() {
	// Initialize storage
	store, err := storage.New(AppID)
	if err != nil {
		log.Fatal(err)
	}

	// Create an instance of the app structure
	app := NewApp(store)

	// Setup signal handling
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("Interrupt signal received, shutting down gracefully...")
		// Trigger shutdown
		app.performShutdown()
		os.Exit(0)
	}()

	// Create application with options
	err = wails.Run(&options.App{
		Title:     "Titan",
		Width:     1024,
		Height:    768,
		Frameless: true,
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId:               "titan-svn-app",
			OnSecondInstanceLaunch: app.onSecondInstance,
		},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		Debug: options.Debug{
			OpenInspectorOnStartup: developmentMode,
		},
		LogLevel:      logger.INFO,
		OnStartup:     app.startup,
		OnDomReady:    app.domReady,
		OnBeforeClose: app.beforeClose,
		OnShutdown:    app.shutdown,
		Bind: []interface{}{
			app,
			store,
		},
		Windows: &windows.Options{
			WebviewIsTransparent:              false,
			WindowIsTranslucent:               true,
			DisableWindowIcon:                 true,
			DisableFramelessWindowDecorations: true,
			WebviewUserDataPath:               "",
			WebviewBrowserPath:                "",
			Theme:                             windows.SystemDefault,
			// Enable GPU acceleration for smooth scrolling
			WebviewGpuIsDisabled: false,
			// Disable swipe gestures to prevent zoom interference
			EnableSwipeGestures: false,
			// Disable pinch zoom which can interfere with smooth scrolling
			DisablePinchZoom: true,
			// Disable zoom control to prevent zooming
			IsZoomControlEnabled: false,
			ZoomFactor:           1.0,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

func (a *App) domReady(ctx context.Context) {
	log.Println("Frontend resources loaded")
}

func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	log.Println("Preparing for shutdown...")
	a.performShutdown()
	return false
}
