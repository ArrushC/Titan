<script lang="ts">
	import { scriptsStore, type ScriptExecutionResult } from "./stores/scripts.svelte.ts";
	import { branchesStore } from "./stores/branches.svelte.ts";
	import { getBranchConfig, getWs } from "./stores/app.svelte.ts";
	import Icon from "./components/Icon.svelte";
	import Checkbox from "./components/Checkbox.svelte";
	import Button from "./components/Button.svelte";
	import FloatingHeader from "./components/FloatingHeader.svelte";
	import { showError, showSuccess } from "./stores/toast.svelte.ts";
	import { showDanger } from "./stores/confirmationDialog.svelte.ts";
	import { onMount, onDestroy } from "svelte";
	// Import Wails bindings for script operations
	import * as App from "../wailsjs/go/main/App";
	import { EventsOn, EventsOff } from "../wailsjs/runtime/runtime";

	// Reactive state from stores
	let branchConfig = $derived(getBranchConfig());
	let ws = $derived(getWs());

	// Script store derived state
	let scripts = $derived(scriptsStore.sortedScripts);
	let selectedScripts = $derived(scriptsStore.selectedScriptPaths);
	let hasSelectedScripts = $derived(scriptsStore.hasSelectedScripts);
	let isExecuting = $derived(scriptsStore.isExecuting);
	let isReloading = $derived(scriptsStore.isReloading);
	let currentlyExecuting = $derived(scriptsStore.currentlyExecuting);
	let executionResults = $derived(scriptsStore.executionResults);
	let currentExecutionOutput = $derived(scriptsStore.getCurrentExecutionOutput());

	// Branch selection state - direct store reference for proper reactivity
	let selectedBranches = $derived(branchesStore.selectedBranches);
	let hasSelectedBranches = $derived(branchesStore.hasSelectedBranches);

	// Execution results UI state
	let showExecutionResults = $state(false);
	let hasAnyResults = $derived(executionResults.length > 0 || scriptsStore.executionHistory.length > 0);

	// Collapsible state for execution history items
	let historyItemsCollapsed = $state(new Map<number, boolean>());

	// Real-time clock for updating relative times
	let currentTime = $state(new Date());
	let timeUpdateInterval: NodeJS.Timeout | null = null;

	// WebSocket event handler
	let wsMessageHandler: ((event: MessageEvent) => void) | null = null;

	// State tracking for auto-scroll to execution section
	let previousExecutionState = $state(false);

	// Auto-scroll the live output container when new content arrives
	$effect(() => {
		if (currentExecutionOutput.length > 0) {
			// Use setTimeout to ensure DOM has updated
			setTimeout(() => {
				const container = document.getElementById("live-output-container");
				if (container) {
					container.scrollTop = container.scrollHeight;
				}
			}, 0);
		}
	});

	// Auto-scroll to execution section when execution starts
	$effect(() => {
		const currentExecution = isExecuting && currentlyExecuting;

		// Only scroll when execution starts (transition from false to true)
		if (currentExecution && !previousExecutionState) {
			// Small delay to ensure DOM has rendered the section
			setTimeout(() => {
				requestAnimationFrame(() => {
					const container = document.getElementById("execution-status-container");
					if (container) {
						container.scrollIntoView({
							behavior: "smooth",
							block: "start",
							inline: "nearest",
						});
					}
				});
			}, 150);
		}

		// Update previous state
		previousExecutionState = currentExecution;
	});

	// Component lifecycle
	onMount(() => {
		loadScripts();
		loadExecutionHistory();
		setupRuntimeEventListeners();

		// Start time update interval (every minute)
		timeUpdateInterval = setInterval(() => {
			currentTime = new Date();
		}, 60000);

	});

	onDestroy(() => {
		cleanupRuntimeEventListeners();
		if (wsMessageHandler && ws) {
			ws.removeEventListener("message", wsMessageHandler);
		}

		// Clean up time update interval
		if (timeUpdateInterval) {
			clearInterval(timeUpdateInterval);
			timeUpdateInterval = null;
		}
	});

	// Setup runtime event listeners for script execution
	function setupRuntimeEventListeners() {
		// Listen for script execution events from Wails runtime
		EventsOn("script:executing", (data: { script: string; branch: string }) => {
			scriptsStore.setCurrentlyExecuting(data.script, data.branch);
			// Auto-expand results section when execution starts
			showExecutionResults = true;
		});

		EventsOn("script:output", (data: { script: string; branch: string; output: string; isError: boolean }) => {
			scriptsStore.appendOutput(data.script, data.branch, data.output);
		});

		EventsOn("script:result", (result: ScriptExecutionResult) => {
			scriptsStore.addExecutionResult(result);
		});

		EventsOn("script:execution:complete", (_results: ScriptExecutionResult[]) => {
			scriptsStore.setExecutionState(false);
			showSuccess("Script execution completed");
			// Reload both scripts and history to update last executed times
			loadScripts();
			loadExecutionHistory();
		});

		// Keep WebSocket listener setup for SVN-related events only
		setupWebSocketListeners();
	}

	// Clean up runtime event listeners
	function cleanupRuntimeEventListeners() {
		EventsOff("script:executing");
		EventsOff("script:output");
		EventsOff("script:result");
		EventsOff("script:execution:complete");
	}

	// Setup WebSocket message listeners (for SVN events only)
	function setupWebSocketListeners() {
		if (!ws) return;

		wsMessageHandler = (event: MessageEvent) => {
			try {
				const data = JSON.parse(event.data);
				handleWebSocketMessage(data);
			} catch (error) {
				console.error("Failed to parse WebSocket message:", error);
			}
		};

		ws.addEventListener("message", wsMessageHandler);
	}

	// Handle WebSocket messages (SVN-related events only now)
	function handleWebSocketMessage(data: any) {
		// This now only handles SVN-related WebSocket messages
		// Script-related events are handled via Wails runtime events
		switch (data.type) {
			// Add any SVN-related event handling here if needed
			default:
				// Log unknown messages for debugging
				console.log("Unhandled WebSocket message:", data);
		}
	}

	// Load scripts from backend via Wails bindings
	async function loadScripts() {
		try {
			scriptsStore.setReloading(true);
			const scriptsJSON = await App.GetScripts();
			const scriptData = JSON.parse(scriptsJSON);
			scriptsStore.setScripts(scriptData);
			scriptsStore.setReloading(false);
		} catch (error) {
			console.error("Failed to load scripts:", error);
			showError("Failed to load scripts");
			scriptsStore.setReloading(false);
		}
	}

	// Load execution history via Wails bindings
	async function loadExecutionHistory() {
		try {
			const historyJSON = await App.GetScriptExecutionHistory();
			const historyData = JSON.parse(historyJSON);
			scriptsStore.setExecutionHistory(historyData);
		} catch (error) {
			console.error("Failed to load execution history:", error);
		}
	}

	// Reload scripts
	function reloadScripts() {
		if (isReloading || isExecuting) return;

		// Load scripts via WebSocket
		loadScripts();
		showSuccess("Reloading scripts...");
	}

	// Script selection handlers
	function toggleScriptSelection(scriptPath: string) {
		if (isExecuting) return;
		scriptsStore.toggleScriptSelection(scriptPath);
	}

	function selectAllScripts() {
		if (isExecuting) return;
		scriptsStore.selectAllScripts();
	}

	function selectNoneScripts() {
		if (isExecuting) return;
		scriptsStore.selectNoneScripts();
	}

	// Execute selected scripts
	async function executeScripts() {
		if (!hasSelectedScripts || !hasSelectedBranches || isExecuting) {
			return;
		}

		const scriptPaths = selectedScripts;
		const branchPaths = Object.entries(selectedBranches)
			.filter(([_key, isSelected]) => isSelected)
			.map(([key]) => {
				const branchId = key.split("-")[1]; // Extract branchId from "folderId-branchId"
				const branch = branchId ? branchConfig?.getBranch(branchId) : undefined;
				return branch?.branchPath || "";
			})
			.filter((path) => path);

		if (branchPaths.length === 0) {
			showError("No valid branch paths found");
			return;
		}

		// Show confirmation dialog
		const scriptCount = scriptPaths.length;
		const branchCount = branchPaths.length;
		const totalOperations = scriptCount * branchCount;

		const isConfirmed = await showDanger("Execute Scripts", `This will execute ${scriptCount} script${scriptCount > 1 ? "s" : ""} on ${branchCount} branch${branchCount > 1 ? "es" : ""} (${totalOperations} total operations). This action cannot be undone.`, "Execute Scripts");

		if (!isConfirmed) return;

		try {
			// Clear previous session results
			scriptsStore.setExecutionState(true);
			scriptsStore.clearExecutionResults();

			// Execute via Wails bindings
			await App.ExecuteScriptsDirectly(scriptPaths, branchPaths);
			showSuccess(`Started execution of ${scriptCount} script${scriptCount > 1 ? "s" : ""} on ${branchCount} branch${branchCount > 1 ? "es" : ""}`);
		} catch (error) {
			scriptsStore.setExecutionState(false);
			showError("Script execution failed: " + (error instanceof Error ? error.message : "Unknown error"));
		}
	}

	// Utility functions
	function formatFileSize(bytes: number): string {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
	}

	// Create a reactive function that updates with currentTime
	const formatRelativeTime = $derived.by(() => {
		const now = currentTime; // This ensures the function is reactive to currentTime

		return function (dateString: string): string {
			if (!dateString) return "Never";

			const date = new Date(dateString);
			const diffMs = now.getTime() - date.getTime();
			const diffMins = Math.floor(diffMs / 60000);
			const diffHours = Math.floor(diffMins / 60);
			const diffDays = Math.floor(diffHours / 24);

			if (diffMins < 1) return "Just now";
			if (diffMins < 60) return `${diffMins}m ago`;
			if (diffHours < 24) return `${diffHours}h ago`;
			if (diffDays < 7) return `${diffDays}d ago`;
			return date.toLocaleDateString();
		};
	});

	function getScriptIcon(extension: string): "file" | "scripts" {
		switch (extension.toLowerCase()) {
			case ".bat":
			case ".cmd":
				return "file";
			case ".ps1":
				return "scripts";
			case ".sh":
				return "file";
			default:
				return "file";
		}
	}

	function getExtensionColor(extension: string): string {
		switch (extension.toLowerCase()) {
			case ".bat":
			case ".cmd":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case ".ps1":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
			case ".sh":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
		}
	}

	// Helper function to safely convert newlines to HTML
	function formatOutput(text: string): string {
		if (!text) return "";
		// Escape HTML characters for security, then convert newlines to <br>
		return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/\n/g, "<br>");
	}

	// Helper function to format branch display for execution results
	function formatBranchDisplay(branchPath: string): string {
		if (!branchConfig || !branchPath) return branchPath;

		// Find the branch by path
		for (const [branchId, branch] of Object.entries(branchConfig.branches)) {
			if (branch.branchPath === branchPath) {
				let branchFolder = "";

				// Find the folder containing this branch
				for (const [folderName, folder] of Object.entries(branchConfig.folders)) {
					if (folder.branchIds.includes(branchId)) {
						branchFolder = folderName;
						break;
					}
				}

				// Extract the last part of the path (after last separator)
				const pathParts = branchPath.split(/[/\\]/);
				const lastPart = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || "";

				// Format as "branchFolder branchVersion lastPart"
				const parts = [branchFolder, branch.branchVersion, lastPart].filter((p) => p);
				return parts.join(" ") || branchPath;
			}
		}

		// Fallback to just the last part of the path if branch not found
		const pathParts = branchPath.split(/[/\\]/);
		return pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || branchPath;
	}

	// Branch selection helpers
	function toggleBranchSelection(branchId: string, folderId: string) {
		branchesStore.toggleBranch(branchId, folderId);
	}

	function selectAllBranches() {
		branchesStore.selectAll(branchConfig);
	}

	function selectNoneBranches() {
		branchesStore.clearSelection();
	}

	// Toggle execution results visibility
	function toggleExecutionResults() {
		showExecutionResults = !showExecutionResults;
	}

	// Toggle history item collapsible state
	function toggleHistoryItem(index: number) {
		const currentState = historyItemsCollapsed.get(index) || false;
		historyItemsCollapsed.set(index, !currentState);
		// Trigger reactivity
		historyItemsCollapsed = new Map(historyItemsCollapsed);
	}
</script>

{#if branchConfig}
	<div class="container mx-auto p-4">
		<FloatingHeader>
			{#snippet children()}
				<!-- Reload Button -->
				<Button variant="secondary" loading={isReloading} disabled={isReloading || isExecuting} onclick={reloadScripts} tooltip="Reload scripts from directory" class="text-sm transition-all duration-300">
					{isReloading ? "Reloading..." : "Reload"}
				</Button>

				<!-- Execute Button -->
				<div class="flex gap-x-4">
					<Button
						variant="primary"
						disabled={!hasSelectedScripts || !hasSelectedBranches || isExecuting}
						loading={isExecuting}
						onclick={executeScripts}
						tooltip={!hasSelectedScripts ? "Select scripts to execute" : !hasSelectedBranches ? "Select branches to execute on" : "Execute selected scripts"}
						class="text-sm transition-all duration-300"
					>
						{isExecuting ? "Executing..." : "Execute Scripts"}
					</Button>
				</div>
			{/snippet}
		</FloatingHeader>

		<!-- Main Content -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
			<!-- Scripts Panel -->
			<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col min-h-0">
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
						<Icon name="scripts" size={20} class="text-gray-600 dark:text-gray-400" />
						Scripts ({scripts.length})
					</h3>

					<!-- Script Selection Controls -->
					<div class="flex items-center gap-2 text-sm">
						<Button variant="tertiary" disabled={isExecuting || scripts.length === 0} onclick={selectAllScripts}>Select All</Button>
						<span class="text-gray-300 dark:text-gray-600">|</span>
						<Button variant="tertiary" class="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" disabled={isExecuting || !hasSelectedScripts} onclick={selectNoneScripts}>None</Button>
					</div>
				</div>

				<!-- Scripts List -->
				{#if scripts.length > 0}
					<div class="space-y-2 overflow-y-auto" style="max-height: calc(100vh - 24rem);">
						{#each scripts as script (script.path)}
							{@const isSelected = scriptsStore.isScriptSelected(script.path)}
							{@const selectionOrder = scriptsStore.getSelectionOrder(script.path)}

							<button
								type="button"
								class="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-left {isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-500' : ''}"
								class:opacity-50={isExecuting}
								disabled={isExecuting}
								onclick={() => toggleScriptSelection(script.path)}
								aria-label="Toggle script selection: {script.name}"
							>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3 flex-1 min-w-0">
										<!-- Selection indicator -->
										<div class="flex items-center gap-2">
											<div class="w-5 h-5 border-2 rounded flex items-center justify-center text-xs font-bold {isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 dark:border-gray-500'}">
												{#if isSelected && selectionOrder}
													{selectionOrder}
												{/if}
											</div>
										</div>

										<!-- Script info -->
										<div class="flex items-center gap-2 flex-1 min-w-0">
											<Icon name={getScriptIcon(script.extension)} size={16} class="text-gray-500 dark:text-gray-400 flex-shrink-0" />
											<div class="min-w-0 flex-1">
												<div class="font-medium text-gray-900 dark:text-gray-100 truncate">{script.name}</div>
												<div class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
													<span class="px-2 py-1 rounded-full text-xs font-medium {getExtensionColor(script.extension)}">
														{script.extension}
													</span>
													<span>{formatFileSize(script.size)}</span>
													{#if script.lastExecuted}
														<span>• Last: {formatRelativeTime(script.lastExecuted)}</span>
													{/if}
												</div>
											</div>
										</div>
									</div>
								</div>
							</button>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8">
						<div class="text-gray-400 dark:text-gray-500 mb-2">
							<Icon name="scripts" size={32} class="mx-auto" />
						</div>
						<p class="text-gray-500 dark:text-gray-400 text-sm">No scripts found</p>
						<p class="text-gray-400 dark:text-gray-500 text-xs mt-1">Add .bat, .cmd, .ps1, or .sh files to C:\Titan\scripts</p>
					</div>
				{/if}
			</div>

			<!-- Branches Panel -->
			<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col min-h-0">
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
						<Icon name="folderUpload" size={20} class="text-gray-600 dark:text-gray-400" />
						Branches ({Object.values(selectedBranches).filter(Boolean).length} selected)
					</h3>

					<!-- Branch Selection Controls -->
					<div class="flex items-center gap-2 text-sm">
						<Button variant="tertiary" disabled={isExecuting} onclick={selectAllBranches}>Select All</Button>
						<span class="text-gray-300 dark:text-gray-600">|</span>
						<Button variant="tertiary" class="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" disabled={isExecuting || !hasSelectedBranches} onclick={selectNoneBranches}>None</Button>
					</div>
				</div>

				<!-- Branches List -->
				{#if branchConfig}
					{@const folderNames = branchConfig.getFolderNames()}

					{#if folderNames.length > 0}
						<div class="space-y-4 overflow-y-auto" style="max-height: calc(100vh - 24rem);">
							{#each folderNames as folderName}
								{@const folder = branchConfig.getFolder(folderName)}

								{#if folder && folder.branchIds.length > 0}
									<div class="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
										<!-- Folder Header -->
										<div class="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center gap-2">
											<div class="w-4 h-4 rounded-full" style="background-color: {folder.color}"></div>
											<span class="font-medium text-gray-900 dark:text-gray-100 text-sm">{folderName}</span>
											<span class="text-xs text-gray-500 dark:text-gray-400">({folder.branchIds.length})</span>
										</div>

										<!-- Branches -->
										<div class="divide-y divide-gray-100 dark:divide-gray-600">
											{#each folder.branchIds as branchId}
												{@const branch = branchConfig.getBranch(branchId)}
												{@const isSelected = selectedBranches[`${folderName}-${branchId}`] || false}

												{#if branch}
													<label class="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 {isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}" class:opacity-50={isExecuting}>
														<Checkbox checked={isSelected} disabled={isExecuting} onchange={() => toggleBranchSelection(branchId, folderName)} size="medium" aria-label="Select branch {branch.branchVersion}" />
														<div class="flex-1 min-w-0">
															<div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
																{branch.branchVersion}
															</div>
															<div class="text-xs text-gray-500 dark:text-gray-400 truncate">
																{branch.branchPath}
															</div>
														</div>
													</label>
												{/if}
											{/each}
										</div>
									</div>
								{/if}
							{/each}
						</div>
					{:else}
						<div class="text-center py-8">
							<div class="text-gray-400 dark:text-gray-500 mb-2">
								<Icon name="folderUpload" size={32} class="mx-auto" />
							</div>
							<p class="text-gray-500 dark:text-gray-400 text-sm">No branches configured</p>
							<p class="text-gray-400 dark:text-gray-500 text-xs mt-1">Configure branches in the Branches section</p>
						</div>
					{/if}
				{/if}
			</div>
		</div>

		<!-- Execution Status -->
		{#if isExecuting && currentlyExecuting}
			<div id="execution-status-container" class="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg overflow-hidden execution-status-appear">
				<div class="px-4 py-3 bg-amber-100 dark:bg-amber-900/30 border-b border-amber-300 dark:border-amber-700">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="w-5 h-5 border-2 border-amber-600 dark:border-amber-400 border-t-transparent rounded-full animate-spin"></div>
							<div>
								<div class="font-medium text-amber-900 dark:text-amber-100">
									Executing: {currentlyExecuting.script}
								</div>
								<div class="text-sm text-amber-700 dark:text-amber-300">
									On branch: {formatBranchDisplay(currentlyExecuting.branch)}
								</div>
							</div>
						</div>
						<div class="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
							<div class="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full animate-pulse"></div>
							<span>Live Output</span>
						</div>
					</div>
				</div>

				<!-- Live Output Area -->
				{#if currentExecutionOutput.length > 0}
					<div class="p-4 bg-gray-900 max-h-64 overflow-y-auto" id="live-output-container">
						<pre class="text-xs text-gray-100 font-mono whitespace-pre-wrap">{currentExecutionOutput.join("")}</pre>
					</div>
				{:else}
					<div class="p-4 bg-gray-900">
						<div class="text-xs text-gray-400 dark:text-gray-400 font-mono flex items-center gap-2">
							<span>Waiting for output</span>
							<span class="inline-block animate-pulse">...</span>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Execution Results Section -->
		{#if hasAnyResults}
			<div class="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
				<!-- Collapsible Header -->
				<button class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200" onclick={toggleExecutionResults} aria-expanded={showExecutionResults}>
					<div class="flex items-center gap-2">
						<Icon name="info" size={20} class="text-gray-600 dark:text-gray-400" />
						<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Execution Results</h3>
						<span class="text-sm text-gray-500 dark:text-gray-400">
							({executionResults.length} current, {scriptsStore.executionHistory.length} total)
						</span>
					</div>
					<div class="flex items-center gap-2">
						<Icon name={showExecutionResults ? "chevronUp" : "chevronDown"} size={16} class="text-gray-500 dark:text-gray-400 transition-transform duration-200" />
					</div>
				</button>

				<!-- Collapsible Content -->
				{#if showExecutionResults}
					<div class="border-t border-gray-200 dark:border-gray-700 p-6 space-y-4 fade-in">
						<!-- Current Session Results -->
						{#if executionResults.length > 0}
							<div>
								<h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
									<div class="w-2 h-2 bg-blue-500 rounded-full"></div>
									Current Execution ({executionResults.length})
								</h4>
								<div class="space-y-3 max-h-64 overflow-y-auto">
									{#each executionResults as result}
										<div class="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-blue-50/30 dark:bg-blue-900/30">
											<div class="flex items-center justify-between mb-2">
												<div class="flex items-center gap-2">
													<div class="w-3 h-3 rounded-full" class:bg-green-500={result.success} class:bg-red-500={!result.success}></div>
													<span class="font-medium text-gray-900 dark:text-gray-100">{result.scriptName}</span>
													<span class="text-gray-500 dark:text-gray-400">→</span>
													<span class="text-sm text-gray-600 dark:text-gray-400 truncate max-w-64">{formatBranchDisplay(result.branchPath)}</span>
												</div>
												<span class="text-xs text-gray-500 dark:text-gray-400">
													{formatRelativeTime(result.endTime)}
												</span>
											</div>

											{#if result.error}
												<div class="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded p-2 font-mono">
													{@html formatOutput(result.error)}
												</div>
											{:else if result.output}
												<div class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded p-2 font-mono min-h-16 max-h-32 overflow-y-auto">
													{@html formatOutput(result.output)}
												</div>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Execution History -->
						{#if scriptsStore.executionHistory.length > 0}
							<div>
								<h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
									<div class="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
									Execution History ({scriptsStore.executionHistory.length})
								</h4>
								<div class="space-y-2 max-h-48 overflow-y-auto">
									{#each scriptsStore.executionHistory.slice(0, 10) as execution, index}
										{@const isCollapsed = historyItemsCollapsed.get(index) ?? true}
										<div class="border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50/30 dark:bg-gray-700/50 overflow-hidden">
											<!-- Collapsible Header -->
											<button class="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200" onclick={() => toggleHistoryItem(index)} aria-expanded={!isCollapsed}>
												<div class="flex items-center gap-2">
													<div class="w-3 h-3 rounded-full" class:bg-green-500={execution.success} class:bg-red-500={!execution.success}></div>
													<span class="font-medium text-gray-900 dark:text-gray-100">{execution.scriptName}</span>
													<span class="text-xs text-gray-500 dark:text-gray-400">
														on {execution.branchPaths.length} branch{execution.branchPaths.length > 1 ? "es" : ""}
													</span>
												</div>
												<div class="flex items-center gap-2">
													<span class="text-xs text-gray-500 dark:text-gray-400">
														{formatRelativeTime(execution.executedAt)}
													</span>
													<Icon name={isCollapsed ? "chevronDown" : "chevronUp"} size={14} class="text-gray-500 dark:text-gray-400 transition-transform duration-200" />
												</div>
											</button>

											<!-- Collapsible Content -->
											{#if !isCollapsed}
												<div class="border-t border-gray-200 dark:border-gray-600 px-3 py-2 bg-white/50 dark:bg-gray-700">
													{#if execution.outputSample}
														<div class="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded p-2 font-mono min-h-12 max-h-32 overflow-y-auto">
															{@html formatOutput(execution.outputSample)}
														</div>
													{:else}
														<div class="text-xs text-gray-500 dark:text-gray-400 italic">No output available</div>
													{/if}
												</div>
											{/if}
										</div>
									{/each}
									{#if scriptsStore.executionHistory.length > 10}
										<div class="text-center py-2">
											<span class="text-xs text-gray-500 dark:text-gray-400">
												Showing 10 of {scriptsStore.executionHistory.length} executions
											</span>
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{:else}
	<div class="container mx-auto p-4">
		<p class="text-gray-500 dark:text-gray-400 text-center">No branch configuration available</p>
	</div>
{/if}

<style>
	/* Enhanced transitions */
	.transition-colors {
		will-change: color, background-color, border-color;
	}

	/* Collapsible animations */
	.collapsible-content {
		transition: all 0.3s ease-in-out;
		overflow: hidden;
	}

	.fade-in {
		animation: fadeIn 0.3s ease-in-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Custom scrollbar */
	.overflow-y-auto::-webkit-scrollbar {
		width: 6px;
	}

	.overflow-y-auto::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 3px;
	}

	:global(.dark) .overflow-y-auto::-webkit-scrollbar-track {
		background: #374151;
	}

	.overflow-y-auto::-webkit-scrollbar-thumb {
		background: #c1c1c1;
		border-radius: 3px;
	}

	:global(.dark) .overflow-y-auto::-webkit-scrollbar-thumb {
		background: #6b7280;
	}

	.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: #a8a8a8;
	}

	:global(.dark) .overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}

	/* Terminal-style output container */
	#live-output-container::-webkit-scrollbar {
		width: 8px;
	}

	#live-output-container::-webkit-scrollbar-track {
		background: #1a1a1a;
		border-radius: 4px;
	}

	:global(.dark) #live-output-container::-webkit-scrollbar-track {
		background: #0f0f0f;
	}

	#live-output-container::-webkit-scrollbar-thumb {
		background: #4a4a4a;
		border-radius: 4px;
	}

	:global(.dark) #live-output-container::-webkit-scrollbar-thumb {
		background: #6b7280;
	}

	#live-output-container::-webkit-scrollbar-thumb:hover {
		background: #6a6a6a;
	}

	:global(.dark) #live-output-container::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}

	/* Smooth scrolling for live output */
	#live-output-container {
		scroll-behavior: smooth;
	}

	/* Execution status appearance animation */
	.execution-status-appear {
		animation: slideInGlow 0.4s ease-out;
	}

	@keyframes slideInGlow {
		0% {
			opacity: 0;
			transform: translateY(-10px);
			box-shadow: 0 0 0 rgba(245, 158, 11, 0);
		}
		50% {
			opacity: 0.8;
			transform: translateY(-2px);
			box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
			box-shadow: 0 0 15px rgba(245, 158, 11, 0.15);
		}
	}

	/* Subtle glow that fades after animation */
	#execution-status-container {
		transition: box-shadow 0.3s ease-out;
	}

	#execution-status-container:hover {
		box-shadow: 0 0 20px rgba(245, 158, 11, 0.2);
	}
</style>
