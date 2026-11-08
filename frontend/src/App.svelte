<script lang="ts">
	import { GetAppConfig, SaveAppConfig, GetBranchConfig, SaveBranchConfig, GetWebSocketPort, Nudge } from "../wailsjs/go/main/App.js";
	import { storage } from "./lib/persistence";
	import { WindowMinimise, WindowMaximise, WindowUnmaximise, WindowIsMaximised, WindowFullscreen, WindowUnfullscreen, WindowIsFullscreen, Quit } from "../wailsjs/runtime/runtime.js";
	import Commit from "./Commit.svelte";
	import Log from "./Log.svelte";
	import Settings from "./Settings.svelte";
	import Scripts from "./Scripts.svelte";
	import Branches from "./Branches.svelte";
	import Trello from "./Trello.svelte";
	import { onMount, onDestroy, untrack } from "svelte";
	import {
		setWsConnected,
		setWs,
		setAppConfig,
		setBranchConfig,
		setScrollY,
		getWs,
		getWsConnected,
		getAppVersion,
		getIsReconnecting,
		setIsReconnecting,
		getReconnectionAttempts,
		setLastConnectionError,
		resetReconnectionState,
		incrementReconnectionAttempts,
		shouldAttemptReconnection,
		getExponentialBackoffDelay,
		getIsCommitMode,
		setIsCommitMode,
		getIsLogMode,
		setIsLogMode,
		getIsCommitInProgress,
		getCommitPhase,
		getCurrentTheme,
		setCurrentTheme,
		getAppConfig,
	} from "./stores/app.svelte.ts";
	import { branchesStore } from "./stores/branches.svelte.ts";
	import { scriptsStore } from "./stores/scripts.svelte.ts";
	import { branchStatusStore } from "./stores/branchStatus.svelte.ts";
	import Icon, { type IconName } from "./components/Icon.svelte";
	import Button from "./components/Button.svelte";
	import { AppConfig } from "./utils/AppConfig.ts";
	import titanIcon from "./assets/icons/App/titan_app_icon.svg";
	import { BranchConfig } from "./utils/BranchConfig.ts";
	import ToastContainer from "./components/ToastContainer.svelte";
	import TooltipContainer from "./components/TooltipContainer.svelte";
	import ConfirmationDialog from "./components/ConfirmationDialog.svelte";
	import { tooltipStore } from "./stores/tooltip.svelte";

	let isSettingsMode = $state(false);
	let isScriptsMode = $state(false);
	let isTrelloMode = $state(false);
	let isCommitMode = $derived(getIsCommitMode());
	let isLogMode = $derived(getIsLogMode());
	let isCommitInProgress = $derived(getIsCommitInProgress());
	let commitPhase = $derived(getCommitPhase());
	let reconnectTimeoutId: number | null = null;

	// Real-time clock for updating relative times
	let currentTime = $state(new Date());
	let timeUpdateInterval: number | null = null;

	// Window controls state
	let isMaximised = $state(false);
	let isFullscreen = $state(false);

	// Main element reference for scroll tracking
	let mainElement: HTMLElement;

	// Window control functions
	async function minimizeWindow() {
		await WindowMinimise();
	}

	async function toggleMaximizeWindow() {
		if (isMaximised) {
			await WindowUnmaximise();
			isMaximised = false;
		} else {
			await WindowMaximise();
			isMaximised = true;
		}
	}

	async function closeWindow() {
		await Quit();
	}

	// Check if window is maximized on mount
	async function checkMaximized() {
		isMaximised = await WindowIsMaximised();
	}

	// Fullscreen control functions
	async function toggleFullscreen() {
		if (isFullscreen) {
			await WindowUnfullscreen();
			isFullscreen = false;
		} else {
			await WindowFullscreen();
			isFullscreen = true;
		}
	}

	// Check if window is in fullscreen on mount
	async function checkFullscreen() {
		isFullscreen = await WindowIsFullscreen();
	}


	async function connectWebSocket() {
		try {
			const port = await GetWebSocketPort();
			const websocket = new WebSocket(`ws://localhost:${port}/ws`);

			websocket.onopen = () => {
				setWsConnected(true);
				resetReconnectionState();
				console.log("WebSocket connected");
			};

			websocket.onclose = (event) => {
				setWsConnected(false);
				console.log("WebSocket disconnected", event.code, event.reason);

				// Only attempt reconnection if it wasn't a clean close (code 1000)
				if (event.code !== 1000) {
					attemptReconnection();
				}
			};

			websocket.onerror = (error) => {
				console.error("WebSocket error:", error);
				setLastConnectionError("Connection failed");
			};

			websocket.onmessage = (event) => {
				try {
					const message = JSON.parse(event.data);
					handleWebSocketMessage(message);
				} catch (error) {
					console.error("Failed to parse WebSocket message:", error);
				}
			};

			setWs(websocket);
		} catch (error) {
			console.error("Failed to connect WebSocket:", error);
			setLastConnectionError(error instanceof Error ? error.message : "Connection failed");

			// Only attempt reconnection if we're not already in a reconnection cycle
			// This prevents the infinite loop when connectWebSocket fails immediately
			if (!getIsReconnecting()) {
				attemptReconnection();
			}
		}
	}

	function attemptReconnection() {
		// Don't attempt reconnection if already reconnecting or max attempts reached
		if (getIsReconnecting() || !shouldAttemptReconnection()) {
			if (!shouldAttemptReconnection()) {
				console.log("Max reconnection attempts reached");
				setLastConnectionError("Max reconnection attempts reached");
			}
			return;
		}

		setIsReconnecting(true);
		const attempts = incrementReconnectionAttempts();
		const delay = getExponentialBackoffDelay();

		console.log(`Attempting to reconnect (${attempts}/${10}) in ${delay}ms...`);

		reconnectTimeoutId = setTimeout(() => {
			setIsReconnecting(false);
			connectWebSocket();
		}, delay);
	}

	function manualReconnect() {
		// Clear any existing timeout
		if (reconnectTimeoutId) {
			clearTimeout(reconnectTimeoutId);
			reconnectTimeoutId = null;
		}

		// Reset reconnection state and attempt connection
		resetReconnectionState();
		setIsReconnecting(false);
		connectWebSocket();
	}

	function handleWebSocketMessage(message: any) {
		switch (message.type) {
			case "error":
				console.error("WebSocket error:", message.message);
				break;

			default:
				console.log("Unhandled WebSocket message:", message);
		}
	}

	async function loadConfigs() {
		try {
			// Load both configs in parallel
			const [appConfigJson, branchConfigJson] = await Promise.all([GetAppConfig(), GetBranchConfig()]);

			// Initialize both config objects
			setAppConfig(new AppConfig(appConfigJson, (jsonString) => SaveAppConfig(jsonString), 1000, true));
			setBranchConfig(new BranchConfig(branchConfigJson, (jsonString) => SaveBranchConfig(jsonString), 1000, true));

			console.log("Configs loaded successfully");

			// Apply theme after configs are loaded
			applyTheme();
		} catch (error) {
			console.error("Failed to load configs:", error);
			// Optionally set default/empty configs or show user notification
			throw error; // Re-throw if caller needs to handle it
		}
	}

	// Create a reactive function that updates with currentTime
	const formatRelativeTime = $derived.by(() => {
		const now = currentTime; // This ensures the function is reactive to currentTime

		return function (timestamp: number | null): string {
			if (!timestamp) return "Never";

			const date = new Date(timestamp);
			const diffMs = now.getTime() - date.getTime();
			const diffMins = Math.floor(diffMs / 60000);
			const diffHours = Math.floor(diffMins / 60);
			const diffDays = Math.floor(diffHours / 24);

			if (diffMins < 1) return "Just now";
			if (diffMins < 60) return `${diffMins}m ago`;
			if (diffHours < 24) return `${diffHours}h ago`;
			if (diffDays < 7) return `${diffDays}d ago`;

			// For older dates, show formatted date
			return date.toLocaleDateString();
		};
	});

	// Theme management
	const THEME_STORAGE_KEY = "theme"; // prefix will be added automatically

	// Get theme from localStorage
	function getStoredTheme(): "light" | "dark" {
		const stored = storage.getItem<string>(THEME_STORAGE_KEY);
		if (stored === "dark" || stored === "light") {
			return stored;
		}
		return "light"; // Default to light theme
	}

	// Save theme to localStorage
	function saveStoredTheme(theme: "light" | "dark"): void {
		storage.setItem(THEME_STORAGE_KEY, theme);
	}

	// Apply theme to DOM
	function applyThemeToDOM(theme: "light" | "dark"): void {
		if (theme === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}

	async function toggleTheme() {
		const currentTheme = getCurrentTheme();
		const newTheme = currentTheme === "light" ? "dark" : "light";
		console.log("Toggling theme from", currentTheme, "to", newTheme);
		setCurrentTheme(newTheme);

		// Apply theme to document immediately
		applyThemeToDOM(newTheme);
		console.log("Document classes:", document.documentElement.className);

		// Save to localStorage immediately for next load
		saveStoredTheme(newTheme);

		// Save theme preference to backend config (async)
		const appConfig = getAppConfig();
		if (appConfig) {
			await appConfig.setTheme(newTheme);
			console.log("Theme saved to config:", newTheme);
		}
	}

	// Apply theme on config load (syncs localStorage with backend)
	function applyTheme() {
		const appConfig = getAppConfig();
		if (appConfig) {
			const backendTheme = appConfig.theme as "light" | "dark";
			const storedTheme = getStoredTheme();

			// If backend theme differs from localStorage, backend takes precedence
			if (backendTheme !== storedTheme) {
				console.log(`Theme mismatch - backend: ${backendTheme}, localStorage: ${storedTheme}. Using backend theme.`);
				saveStoredTheme(backendTheme);
				setCurrentTheme(backendTheme);
				applyThemeToDOM(backendTheme);
			} else {
				console.log("Theme already synchronized:", backendTheme);
			}
		} else {
			console.log("No app config available for theme synchronization");
		}
	}

	onMount(() => {
		// Apply theme from localStorage immediately to prevent flash
		const storedTheme = getStoredTheme();
		setCurrentTheme(storedTheme);
		applyThemeToDOM(storedTheme);
		console.log("Applied theme from localStorage on mount:", storedTheme);

		connectWebSocket();
		loadConfigs();
		checkMaximized();
		checkFullscreen();

		// F11 key listener for fullscreen toggle
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'F11') {
				event.preventDefault();
				toggleFullscreen();
			}
		};

		const handleScroll = () => {
			if (mainElement) {
				setScrollY(mainElement.scrollTop);
			}
		};

		// Add F11 key listener
		document.addEventListener('keydown', handleKeydown);

		// Wait for mainElement to be available then add listener
		// Use a small timeout to ensure DOM is ready
		const scrollSetupTimeout = setTimeout(() => {
			if (mainElement) {
				mainElement.addEventListener("scroll", handleScroll);
				// Trigger initial scroll check
				handleScroll();
			}
		}, 0);

		// Start time update interval (every minute)
		// Use untrack to prevent the time update from triggering reactive dependencies
		timeUpdateInterval = setInterval(() => {
			untrack(() => {
				currentTime = new Date();
			});
		}, 60000);

		// Add visibility change detection to fix DPI zoom issue on minimize/restore
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				// Window became visible after being hidden (minimize/restore)
				// Call the Nudge method to fix WebView2 zoom issues
				Nudge();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			clearTimeout(scrollSetupTimeout);
			if (mainElement) {
				mainElement.removeEventListener("scroll", handleScroll);
			}
			document.removeEventListener('keydown', handleKeydown);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	});

	onDestroy(() => {
		// Clear any pending reconnection timeout
		if (reconnectTimeoutId) {
			clearTimeout(reconnectTimeoutId);
			reconnectTimeoutId = null;
		}

		// Clean up time update interval
		if (timeUpdateInterval) {
			clearInterval(timeUpdateInterval);
			timeUpdateInterval = null;
		}

		const websocket = getWs();
		if (websocket) {
			websocket.close(1000, "Component destroyed"); // Clean close
		}
	});

	// Derived state for current page
	let currentPage = $derived.by(() => {
		if (isCommitMode) return 'commit';
		if (isLogMode) return 'log';
		if (isSettingsMode) return 'settings';
		if (isScriptsMode) return 'scripts';
		if (isTrelloMode) return 'trello';
		return 'home';
	});

	// Check if navigation should be disabled (during commit operations)
	let isNavigationDisabled = $derived(isCommitMode && (isCommitInProgress || commitPhase === "completed"));

	// Navigation item configuration
	const navigationItems = [
		{ id: 'home', title: 'Home', icon: 'home' as IconName },
		{ id: 'scripts', title: 'Scripts', icon: 'scripts' as IconName },
		{ id: 'trello', title: 'Trello', icon: 'trello' as IconName },
		{ id: 'settings', title: 'Settings', icon: 'settings' as IconName }
	];

	// Function to handle navigation clicks
	function handleNavigationClick(itemId: string) {
		if (isNavigationDisabled) return;

		tooltipStore.forceClose();

		// Reset all modes first
		if (isScriptsMode) {
			scriptsStore.selectNoneScripts();
		}
		// Clear branch selections when navigating away from home
		if (branchesStore.hasSelectedBranches) {
			branchesStore.clearSelection();
		}
		isScriptsMode = false;
		isTrelloMode = false;
		isSettingsMode = false;
		setIsCommitMode(false);
		setIsLogMode(false);

		// Set the appropriate mode
		switch (itemId) {
			case 'scripts':
				isScriptsMode = true;
				break;
			case 'trello':
				isTrelloMode = true;
				break;
			case 'settings':
				isSettingsMode = true;
				break;
			// 'home' just resets everything, which we already did
		}
	}

	// Check if a navigation item is disabled
	function isNavItemDisabled(itemId: string): boolean {
		if (isNavigationDisabled) return true;

		switch (itemId) {
			case 'scripts':
				return branchesStore.isEditMode || isSettingsMode || isTrelloMode || isCommitMode || isLogMode;
			case 'trello':
				return branchesStore.isEditMode || isCommitMode || isLogMode;
			case 'settings':
				return branchesStore.isEditMode || isCommitMode || isLogMode;
			default:
				return false;
		}
	}
</script>

<div class="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden border border-gray-200 dark:border-gray-700">
	<!-- Window Controls (hidden in fullscreen) -->
	{#if !isFullscreen}
	<div
		class="flex justify-between items-center h-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 select-none relative z-[9999]"
		style="--wails-draggable:drag"
	>
		<!-- App title and logo -->
		<div class="flex items-center space-x-2 px-2">
			<img src={titanIcon} alt="Titan Logo" class="w-5 h-5" />
			<span class="text-sm font-semibold text-gray-900 dark:text-gray-100">Titan</span>
			<span class="text-xs text-gray-500 dark:text-gray-400">v{getAppVersion()}</span>
		</div>

		<!-- Window control buttons -->
		<div class="flex items-center" style="--wails-draggable:no-drag">
			<button
				class="flex items-center justify-center w-12 h-8 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 group"
				onclick={minimizeWindow}
				aria-label="Minimize"
			>
				<div class="w-3 h-0.5 bg-gray-600 dark:bg-gray-400 group-hover:bg-gray-800 dark:group-hover:bg-gray-200"></div>
			</button>
			<button
				class="flex items-center justify-center w-12 h-8 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 group"
				onclick={toggleMaximizeWindow}
				aria-label={isMaximised ? "Restore" : "Maximize"}
			>
				{#if isMaximised}
					<div class="relative w-3 h-3">
						<div class="absolute top-0.5 left-0.5 w-2 h-2 border border-gray-600 dark:border-gray-400 group-hover:border-gray-800 dark:group-hover:border-gray-200"></div>
						<div class="absolute top-0 left-0 w-2 h-2 border border-gray-600 dark:border-gray-400 group-hover:border-gray-800 dark:group-hover:border-gray-200 bg-white dark:bg-gray-800"></div>
					</div>
				{:else}
					<div class="w-3 h-3 border border-gray-600 dark:border-gray-400 group-hover:border-gray-800 dark:group-hover:border-gray-200"></div>
				{/if}
			</button>
			<button
				class="flex items-center justify-center w-12 h-8 hover:bg-red-500 hover:text-white transition-colors duration-200 group"
				onclick={closeWindow}
				aria-label="Close"
			>
				<div class="relative w-3 h-3">
					<div class="absolute top-1/2 left-0 w-3 h-0.5 bg-gray-600 dark:bg-gray-400 group-hover:bg-white transform -translate-y-1/2 rotate-45"></div>
					<div class="absolute top-1/2 left-0 w-3 h-0.5 bg-gray-600 dark:bg-gray-400 group-hover:bg-white transform -translate-y-1/2 -rotate-45"></div>
				</div>
			</button>
		</div>
	</div>
	{/if}

	<!-- Header -->
	<header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
		<div>
			<div class="flex items-center justify-between">
				<!-- Navigation tabs -->
				<nav class="flex items-center -mb-[1px]">
					{#each navigationItems as item}
						{@const isActive = currentPage === item.id || (currentPage === 'commit' && item.id === 'home') || (currentPage === 'log' && item.id === 'home')}
						{@const isDisabled = isNavItemDisabled(item.id)}
						<button
							class="relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all duration-200
								{isActive
									? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-400'
									: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b-2 border-transparent'}
								{isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
								focus:outline-none"
							onclick={() => handleNavigationClick(item.id)}
							disabled={isDisabled}
							aria-current={isActive ? 'page' : undefined}
						>
							<Icon name={item.icon} size={14} class="flex-shrink-0" />
							<span>{item.title}</span>
							{#if currentPage === 'commit' && item.id === 'home'}
								<Icon name="chevronRight" size={12} class="text-gray-400 dark:text-gray-500" />
								<span class="text-gray-500 dark:text-gray-400">Commit</span>
							{:else if currentPage === 'log' && item.id === 'home'}
								<Icon name="chevronRight" size={12} class="text-gray-400 dark:text-gray-500" />
								<span class="text-gray-500 dark:text-gray-400">Log</span>
							{/if}
						</button>
					{/each}
				</nav>

				<!-- Status indicators and controls -->
				<div class="flex items-center gap-3 me-3">
					<!-- Connection status -->
					<div class="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700">
						{#if getWsConnected()}
							<Icon name="server" size={12} class="text-green-600 dark:text-green-400" />
							<span class="text-gray-600 dark:text-gray-300">Connected</span>
						{:else if getIsReconnecting()}
							<Icon name="server" size={12} class="text-yellow-600 dark:text-yellow-400 animate-pulse" />
							<span class="text-gray-600 dark:text-gray-300">Reconnecting ({getReconnectionAttempts()}/10)</span>
						{:else}
							<Icon name="server" size={12} class="text-red-600 dark:text-red-400" />
							<span class="text-gray-600 dark:text-gray-300">Offline</span>
							{#if !shouldAttemptReconnection()}
								<button
									class="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
									onclick={manualReconnect}
								>
									Retry
								</button>
							{/if}
						{/if}
					</div>

					<!-- Last status (hidden on small screens) -->
					<div class="hidden md:flex items-center">
						<div class="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md">
							<Icon name="reload" size={12} />
							<span>{formatRelativeTime(branchStatusStore.lastGlobalCheck)}</span>
						</div>
					</div>

					<!-- Theme toggle -->
					<Button variant="ghost" square={true} iconOnly={getCurrentTheme() === "dark" ? "sun" : "moon"} iconSize={10} class="bg-gray-50 dark:bg-gray-700 border-0" onclick={() => toggleTheme()} aria-label="Toggle theme" />
				</div>
			</div>
		</div>
	</header>

	<!-- Main content area with scrollbar -->
	<main class="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 relative" bind:this={mainElement}>
		<!-- Content -->
		<div class="p-6">
		{#if isSettingsMode}
			<Settings />
		{:else if isScriptsMode}
			<Scripts />
		{:else if isTrelloMode}
			<Trello />
		{:else if isCommitMode}
			<Commit />
		{:else if isLogMode}
			<Log />
		{:else}
			<Branches />
		{/if}
		</div>
	</main>
</div>

<!-- Toast notifications container -->
<ToastContainer />

<!-- Global tooltip container -->
<TooltipContainer />

<!-- Global confirmation dialog -->
<ConfirmationDialog />

