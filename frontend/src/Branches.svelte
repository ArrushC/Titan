<script lang="ts">
	import { getBranchConfig, setBranchConfig, setIsCommitMode, setIsLogMode } from "./stores/app.svelte.ts";
	import { branchesStore } from "./stores/branches.svelte.ts";
	import Icon from "./components/Icon.svelte";
	import FolderCard from "./components/branches/FolderCard.svelte";
	import Button from "./components/Button.svelte";
	import ActionMenu from "./components/ActionMenu.svelte";
	import FloatingHeader from "./components/FloatingHeader.svelte";
	import { BranchConfig, type Branch } from "./utils/BranchConfig.ts";
	import { showError, showSuccess } from "./stores/toast.svelte.ts";
	import { showDanger } from "./stores/confirmationDialog.svelte.ts";
	import { SelectDirectory, GetBranchConfig, ReloadBranchConfig, GetBranchSVNStatuses, SVNUpdateBranches, SaveBranchConfig } from "../wailsjs/go/main/App.js";
	import { tooltip } from "./utils/tooltip";
	import { generateRandomColor } from "./utils/colorUtils";
	import { branchStatusStore } from "./stores/branchStatus.svelte.ts";
	import JsonEditorModal from "./components/branches/JsonEditorModal.svelte";
	import { validateBranchConfig, sanitizeBranchConfig, formatValidationMessage } from "./utils/branchConfigValidation";

	// Enhanced TypeScript interfaces
	interface DragHandlers {
		start: (e: DragEvent, branchId: string, folderName: string) => void;
		end: (e: DragEvent) => void;
		over: (e: DragEvent, folderName: string, index: number) => void;
		leave: (e: DragEvent) => void;
		drop: (e: DragEvent, folderName: string, index: number) => Promise<void>;
	}

	interface FolderDragHandlers {
		start: (e: DragEvent, folderName: string) => void;
		over: (e: DragEvent, targetIndex: number) => void;
		leave: (e: DragEvent) => void;
		drop: (e: DragEvent, targetIndex: number) => Promise<void>;
	}

	interface EditHandlers {
		startFolder: (folderName: string) => void;
		startBranch: (branchId: string) => void;
		cancelFolder: () => void;
		cancelBranch: () => void;
	}

	// Core reactive state
	let branchConfig = $derived(getBranchConfig());
	let isEditMode = $derived(branchesStore.isEditMode);

	// Edit mode state
	let tempBranchConfig = $state<BranchConfig | null>(null);
	let markedForDeletion = $state<Set<string>>(new Set());
	let markedForDeletionFolders = $state<Set<string>>(new Set());
	let newBranches = $state<Set<string>>(new Set());

	// UI state
	let isActionDropdownOpen = $state(false);
	let newlyCreatedFolders = $state<Set<string>>(new Set()); // Track folders created in current edit session

	// JSON Editor state
	let isJsonEditorVisible = $state(false);
	let jsonEditorContent = $state("");
	let isLoadingJsonConfig = $state(false);
	let hasJsonEditorChanges = $state(false);

	// Optimized derived state with memoization
	let activeConfig = $derived(isEditMode && tempBranchConfig ? tempBranchConfig : branchConfig);
	let folderList = $derived(activeConfig?.getFolderNames() ?? []);

	// Memoized checkbox states to avoid recalculation
	let folderCheckboxStates = $derived.by(() => {
		if (!activeConfig) return new Map();
		return new Map(
			folderList.map((folderName) => [
				folderName,
				{
					checked: isFolderSelected(folderName),
					indeterminate: isFolderIndeterminate(folderName),
				},
			])
		);
	});

	// Check if there are outdated branches to show the Update Outdated button
	let hasOutdatedBranches = $derived.by(() => {
		if (!branchConfig) return false;
		const allBranchIds = branchConfig.getBranchIds();
		return allBranchIds.some((branchId) => {
			const status = branchStatusStore.getStatus(branchId);
			return status && status.revisionsBehind != null && status.revisionsBehind > 0;
		});
	});

	// Check if there are disconnected branches to show the Refresh Disconnected button
	let hasDisconnectedBranches = $derived.by(() => {
		if (!branchConfig) return false;
		const allBranchIds = branchConfig.getBranchIds();
		return allBranchIds.some((branchId) => {
			const status = branchStatusStore.getStatus(branchId);
			return status && status.error === "Disconnected";
		});
	});

	// Determine if button should be "Update All" (no outdated branches) or "Update Status" (has outdated branches)
	let shouldUpdateAll = $derived.by(() => {
		if (!branchConfig) return false;
		const allBranchIds = branchConfig.getBranchIds();
		if (allBranchIds.length === 0) return false;
		// If no outdated branches exist, we should update all
		return !hasOutdatedBranches;
	});

	// Helper function to check if folder has any selected branches
	function hasSelectedBranches(folderName: string): boolean {
		if (!activeConfig) return false;
		const folder = activeConfig.getFolder(folderName);
		if (!folder) return false;

		return folder.branchIds.some((branchId) => branchesStore.selectedBranches[`${folderName}-${branchId}`]);
	}

	// Drag and drop state
	let draggedBranchId = $state<string | null>(null);
	let draggedFromFolder = $state<string | null>(null);
	let dropTargetFolder = $state<string | null>(null);
	let dropTargetIndex = $state<number | null>(null);

	// Folder drag and drop state
	let draggedFolderId = $state<string | null>(null);
	let dropTargetFolderIndex = $state<number | null>(null);

	// Inline editing state
	let editingFolderId = $state<string | null>(null);
	let editingBranchId = $state<string | null>(null);
	let tempFolderName = $state<string>("");
	let tempBranchVersion = $state<string>("");

	// Reactive input refs
	let folderInputRef = $state<HTMLInputElement | null>(null);
	let branchInputRef = $state<HTMLInputElement | null>(null);

	// Reload state
	let isReloading = $state(false);

	// Update outdated branches state
	let isUpdatingOutdated = $state(false);

	// Refresh disconnected branches state
	let isRefreshingDisconnected = $state(false);

	// SVN status checking state
	let statusCheckInterval: number | undefined = undefined;
	let statusCheckPaused = $state(false);
	let shownErrors = $state(new Set<string>()); // Track which errors have been shown to prevent spam
	let isCheckingStatuses = false; // Guard to prevent concurrent checks

	// SVN Action menu options
	const svnActionOptions = [
		{ id: "commit", label: "Commit", icon: "listChecks" as const },
		{ id: "log", label: "Log", icon: "history" as const }
	];

	// Handle SVN action execution
	function handleSVNAction(actionId: string) {
		if (!branchesStore.hasSelectedBranches) return;

		if (actionId === "commit") {
			setIsCommitMode(true);
		} else if (actionId === "log") {
			setIsLogMode(true);
		}
	}

	// New folder creation state - support multiple folders

	// Side effects using modern $effect
	$effect(() => {
		// Auto-focus editing inputs when they become active
		if (editingFolderId && folderInputRef) {
			folderInputRef.focus();
			folderInputRef.select();
		}
	});

	$effect(() => {
		if (editingBranchId && branchInputRef) {
			branchInputRef.focus();
			branchInputRef.select();
		}
	});

	// SVN status checking functions
	async function checkBranchStatuses(bypassCache = false) {
		if (!branchConfig || statusCheckPaused) return;

		// Guard against concurrent executions
		if (isCheckingStatuses) {
			console.log("Skipping branch status check: already checking");
			return;
		}

		// Get all branch IDs
		const allBranchIds = branchConfig.getBranchIds();
		if (allBranchIds.length === 0) return;

		try {
			isCheckingStatuses = true;
			branchStatusStore.setLoading(true);

			// Call the backend function to get real SVN statuses
			const backendResults = await GetBranchSVNStatuses(allBranchIds);

			// Transform backend results to store format and handle error toasts
			const statuses: Record<string, any> = {};
			for (const [branchId, result] of Object.entries(backendResults)) {
				statuses[branchId] = {
					revisionsBehind: result.revisionsBehind,
					error: result.error,
				};

				// Show error toast for scanning errors (but not for common expected errors)
				if (result.error && result.error !== "Disconnected" && result.error !== "No SVN" && result.error !== "No path configured") {
					const errorKey = `${branchId}-${result.error}`;
					if (!shownErrors.has(errorKey)) {
						const branch = branchConfig.getBranch(branchId);
						// Defer the toast notification to break the reactive cycle
						queueMicrotask(() => {
							showError(`Branch "${branch?.branchVersion || branchId}" error: ${result.error}`);
						});
						shownErrors = new Set([...shownErrors, errorKey]);
					}
				}
			}

			branchStatusStore.updateMultipleStatuses(statuses);
		} catch (error) {
			console.error("Failed to check branch statuses:", error);
			// Defer the toast notification to break the reactive cycle
			queueMicrotask(() => {
				showError("Failed to check SVN statuses");
			});
		} finally {
			isCheckingStatuses = false;
			branchStatusStore.setLoading(false);
		}
	}

	// Set up status checking interval (only called from effect)
	function startStatusInterval() {
		// Clear any existing interval to prevent duplicates
		if (statusCheckInterval) {
			clearInterval(statusCheckInterval);
		}

		// Delay the first check by 10 seconds to improve startup performance
		// This allows the UI to load quickly without heavy SVN operations
		setTimeout(() => {
			if (!statusCheckPaused && branchConfig) {
				checkBranchStatuses();
			}
		}, 10000);

		statusCheckInterval = setInterval(
			() => {
				if (!statusCheckPaused && branchConfig) {
					checkBranchStatuses();
				}
			},
			2 * 60 * 1000
		);
	}

	// Effect for interval management only
	$effect(() => {
		// Only set up status checking if we have a branch config and not in edit mode
		if (branchConfig && !isEditMode) {
			if (!statusCheckInterval) {
				startStatusInterval();
			}
		}

		// Cleanup interval on unmount
		return () => {
			if (statusCheckInterval) {
				clearInterval(statusCheckInterval);
				statusCheckInterval = undefined;
			}
		};
	});

	// Separate effect for edit mode handling
	$effect(() => {
		if (isEditMode) {
			// Pause status checking during edit mode
			statusCheckPaused = true;
		} else {
			// Resume checking when exiting edit mode
			statusCheckPaused = false;
			// If we have a branch config and interval exists, trigger immediate check
			if (branchConfig && statusCheckInterval) {
				// Use queueMicrotask to avoid immediate reactive loop
				queueMicrotask(() => {
					checkBranchStatuses();
				});
			}
		}
	});

	async function reloadConfig() {
		if (isReloading || isEditMode) return;

		try {
			isReloading = true;

			// Reload config from file system
			await ReloadBranchConfig();

			// Get the fresh config
			const branchConfigJson = await GetBranchConfig();

			// Create new BranchConfig instance with the reloaded data
			const currentConfig = getBranchConfig();
			const saveCallback = currentConfig?.saveCallback || ((_jsonString: string) => {});
			const newConfig = new BranchConfig(branchConfigJson, saveCallback, currentConfig?.debounceDelay ?? 1000, currentConfig?.autosaveEnabled ?? true);

			// Update the store
			setBranchConfig(newConfig);

			// Clear shown errors since configuration changed
			shownErrors = new Set();

			// Trigger status check after reload
			checkBranchStatuses();

			showSuccess("Configuration reloaded from file");
		} catch (error) {
			console.error("Failed to reload config:", error);
			showError("Failed to reload configuration");
		} finally {
			isReloading = false;
		}
	}

	async function updateOutdatedBranches() {
		if (isUpdatingOutdated || isEditMode || !branchConfig) return;

		try {
			isUpdatingOutdated = true;

			// Get all branches that are outdated (revisionsBehind > 0)
			const outdatedBranches: string[] = [];
			const allBranchIds = branchConfig.getBranchIds();

			for (const branchId of allBranchIds) {
				const status = branchStatusStore.getStatus(branchId);
				if (status && status.revisionsBehind != null && status.revisionsBehind > 0) {
					const branch = branchConfig.getBranch(branchId);
					if (branch?.branchPath) {
						outdatedBranches.push(branch.branchPath);
					}
				}
			}

			if (outdatedBranches.length === 0) {
				showSuccess("No outdated branches found to update");
				return;
			}

			// Call SVNUpdateBranches to update each branch individually
			const resultJson = await SVNUpdateBranches(outdatedBranches);
			const result = JSON.parse(resultJson);

			// Show detailed success/error messages
			if (result.successCount === result.totalBranches) {
				showSuccess(`Successfully updated all ${result.totalBranches} outdated branch${result.totalBranches > 1 ? "es" : ""}`);
			} else if (result.successCount > 0) {
				showSuccess(`Updated ${result.successCount} of ${result.totalBranches} branches successfully`);

				// Show errors for failed branches
				const failedBranches = result.results.filter((r: any) => !r.success);
				if (failedBranches.length > 0) {
					const failedPaths = failedBranches.map((r: any) => r.path).join(", ");
					showError(`Failed to update: ${failedPaths}`);
				}
			} else {
				showError("Failed to update any branches");
			}

			// Wait a moment for cache to be cleared, then refresh branch statuses
			await new Promise((resolve) => setTimeout(resolve, 100));
			await checkBranchStatuses();
		} catch (error) {
			console.error("Failed to update outdated branches:", error);
			showError("Failed to update outdated branches");
		} finally {
			isUpdatingOutdated = false;
		}
	}

	async function updateAllBranches() {
		if (isUpdatingOutdated || isEditMode || !branchConfig) return;

		try {
			isUpdatingOutdated = true;

			// Get all branch paths for SVN update
			const allBranchPaths: string[] = [];
			const allBranchIds = branchConfig.getBranchIds();

			for (const branchId of allBranchIds) {
				const branch = branchConfig.getBranch(branchId);
				if (branch?.branchPath) {
					allBranchPaths.push(branch.branchPath);
				}
			}

			if (allBranchPaths.length === 0) {
				showSuccess("No branches found to update");
				return;
			}

			// Call SVNUpdateBranches to update all branches
			const resultJson = await SVNUpdateBranches(allBranchPaths);
			const result = JSON.parse(resultJson);

			// Show detailed success/error messages
			if (result.successCount === result.totalBranches) {
				showSuccess(`Successfully updated all ${result.totalBranches} branch${result.totalBranches > 1 ? "es" : ""}`);
			} else if (result.successCount > 0) {
				showSuccess(`Updated ${result.successCount} of ${result.totalBranches} branches successfully`);

				// Show errors for failed branches
				const failedBranches = result.results.filter((r: any) => !r.success);
				if (failedBranches.length > 0) {
					const failedPaths = failedBranches.map((r: any) => r.path).join(", ");
					showError(`Failed to update: ${failedPaths}`);
				}
			} else {
				showError("Failed to update any branches");
			}

			// Wait a moment for cache to be cleared, then refresh branch statuses
			await new Promise((resolve) => setTimeout(resolve, 100));
			await checkBranchStatuses();
		} catch (error) {
			console.error("Failed to update all branches:", error);
			showError("Failed to update all branches");
		} finally {
			isUpdatingOutdated = false;
		}
	}

	async function refreshDisconnectedBranches() {
		if (isRefreshingDisconnected || isEditMode || !branchConfig) return;

		try {
			isRefreshingDisconnected = true;

			// Get all branches that are disconnected
			const disconnectedBranchIds: string[] = [];
			const allBranchIds = branchConfig.getBranchIds();

			for (const branchId of allBranchIds) {
				const status = branchStatusStore.getStatus(branchId);
				if (status && status.error === "Disconnected") {
					disconnectedBranchIds.push(branchId);
				}
			}

			if (disconnectedBranchIds.length === 0) {
				showSuccess("No disconnected branches found to refresh");
				return;
			}

			// Call backend to refresh status for only disconnected branches
			const backendResults = await GetBranchSVNStatuses(disconnectedBranchIds);

			// Transform results and update status store
			const statuses: Record<string, any> = {};
			let successCount = 0;
			let stillDisconnectedCount = 0;

			for (const [branchId, result] of Object.entries(backendResults)) {
				statuses[branchId] = {
					revisionsBehind: result.revisionsBehind,
					error: result.error,
				};

				if (result.error !== "Disconnected") {
					successCount++;
				} else {
					stillDisconnectedCount++;
				}
			}

			// Update the status store with new results
			branchStatusStore.updateMultipleStatuses(statuses);

			// Show appropriate feedback
			if (successCount === disconnectedBranchIds.length) {
				showSuccess(`Successfully reconnected all ${disconnectedBranchIds.length} disconnected branch${disconnectedBranchIds.length > 1 ? "es" : ""}`);
			} else if (successCount > 0) {
				showSuccess(`Reconnected ${successCount} of ${disconnectedBranchIds.length} branches`);
				if (stillDisconnectedCount > 0) {
					console.warn(`${stillDisconnectedCount} branches still disconnected`);
				}
			} else {
				showError("All branches remain disconnected - check network and repository access");
			}
		} catch (error) {
			console.error("Failed to refresh disconnected branches:", error);
			showError("Failed to refresh disconnected branches");
		} finally {
			isRefreshingDisconnected = false;
		}
	}

	// Optimized toggle functions using store
	function toggleBranch(branchId: string, folderId: string) {
		branchesStore.toggleBranch(branchId, folderId);
	}

	function toggleFolder(folderId: string) {
		branchesStore.toggleFolder(folderId, activeConfig);
	}

	function isFolderSelected(folderId: string): boolean {
		return branchesStore.isFolderSelected(folderId, activeConfig);
	}

	function isFolderIndeterminate(folderId: string): boolean {
		return branchesStore.isFolderIndeterminate(folderId, activeConfig);
	}

	// Optimized checkbox state getter using memoized map
	function getFolderCheckboxState(folderId: string) {
		return folderCheckboxStates.get(folderId) ?? { checked: false, indeterminate: false };
	}

	// Optimized drag and drop handlers
	const dragHandlers: DragHandlers = {
		start: (e: DragEvent, branchId: string, folderName: string) => {
			if (!e.dataTransfer) return;

			draggedBranchId = branchId;
			draggedFromFolder = folderName;
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/plain", branchId);

			// Add dragging class to the button's parent row
			const button = e.target as HTMLElement;
			const row = button.closest("tr");
			if (row) {
				row.classList.add("opacity-50");
			}
		},

		end: (_e: DragEvent) => {
			// Clean up all drag state
			draggedBranchId = null;
			draggedFromFolder = null;
			dropTargetFolder = null;
			dropTargetIndex = null;
			draggedFolderId = null;
			dropTargetFolderIndex = null;

			// Remove dragging classes
			const rows = document.querySelectorAll("tr.opacity-50");
			rows.forEach((row) => row.classList.remove("opacity-50"));
			const cards = document.querySelectorAll(".folder-card.opacity-50");
			cards.forEach((card) => card.classList.remove("opacity-50"));
		},

		over: (e: DragEvent, folderName: string, index: number) => {
			e.preventDefault();
			if (!e.dataTransfer || draggedFolderId) return;

			e.dataTransfer.dropEffect = "move";
			dropTargetFolder = folderName;
			dropTargetIndex = index;
		},

		leave: (e: DragEvent) => {
			const relatedTarget = e.relatedTarget as HTMLElement;
			if (!relatedTarget || !relatedTarget.closest("tbody")) {
				dropTargetFolder = null;
				dropTargetIndex = null;
			}
		},

		drop: async (e: DragEvent, folderName: string, index: number) => {
			e.preventDefault();
			if (draggedFolderId || !draggedBranchId || !draggedFromFolder || !isEditMode) return;

			try {
				if (draggedFromFolder === folderName) {
					reorderBranchInTempFolder(draggedBranchId, folderName, index);
				} else {
					moveAndReorderBranchInTempFolder(draggedBranchId, draggedFromFolder, folderName, index);
				}
			} catch (error) {
				console.error("Failed to move branch:", error);
				showError("Failed to move branch");
			}

			dragHandlers.end(e);
		},
	};

	function reorderBranchInTempFolder(branchId: string, folderName: string, newIndex: number) {
		if (!tempBranchConfig) {
			throw new Error("No temporary config available");
		}

		// Clone the config, apply the change, and reassign to trigger reactivity
		const clonedConfig = tempBranchConfig.clone();
		clonedConfig.reorderBranchInFolder(branchId, folderName, newIndex);
		tempBranchConfig = clonedConfig;
	}

	function moveAndReorderBranchInTempFolder(branchId: string, fromFolderName: string, toFolderName: string, newIndex: number) {
		if (!tempBranchConfig) {
			throw new Error("No temporary config available");
		}

		// Prevent moving existing branches to newly created folders
		if (newlyCreatedFolders.has(toFolderName) && !newBranches.has(branchId)) {
			showError("Cannot move existing branches to newly created folders. Only newly added branches can be placed in new folders.");
			return;
		}

		// Clone the config and perform atomic move+reorder operation
		const clonedConfig = tempBranchConfig.clone();
		clonedConfig.moveAndReorderBranch(branchId, fromFolderName, toFolderName, newIndex);
		tempBranchConfig = clonedConfig;
	}

	/**
	 * Helper function to extract the last path segment from a branch path
	 * Handles both Windows (\) and Unix (/) path separators
	 */
	function getLastPathSegment(path: string): string {
		if (!path || path.trim() === "") {
			return "";
		}

		// Normalize path by removing trailing slashes
		const normalizedPath = path.replace(/[\\\/]+$/, "");

		// Split by both Windows and Unix separators and get the last segment
		const segments = normalizedPath.split(/[\\\/]/);
		const lastSegment = segments[segments.length - 1];

		return lastSegment || "";
	}

	function generateUniqueVersion(desiredVersion: string, excludeBranchId?: string, targetPath?: string): string {
		if (!tempBranchConfig) {
			throw new Error("No temporary config available");
		}

		const allBranches = tempBranchConfig
			.getBranchIds()
			.filter((id) => id !== excludeBranchId)
			.map((id) => tempBranchConfig!.getBranch(id)!)
			.filter((branch) => branch); // Filter out any null branches

		// Determine the path context for uniqueness checking
		let currentBranchPath = "";
		if (targetPath !== undefined) {
			// Use explicitly provided target path
			currentBranchPath = targetPath;
		} else if (excludeBranchId) {
			// Use the path of the branch being edited
			const currentBranch = tempBranchConfig.getBranch(excludeBranchId);
			currentBranchPath = currentBranch?.branchPath || "";
		}
		// If neither targetPath nor excludeBranchId is provided, currentBranchPath remains empty
		// This means new branches with empty paths will be grouped together

		// Get the last path segment for the current branch
		const currentPathSegment = getLastPathSegment(currentBranchPath);

		// Filter branches to only include those with the same last path segment
		const branchesInSamePathGroup = allBranches.filter((branch) => {
			const branchPathSegment = getLastPathSegment(branch.branchPath);
			return branchPathSegment === currentPathSegment;
		});

		// Extract the base name (remove any existing -X suffix at the end)
		const baseNameMatch = desiredVersion.match(/^(.+?)-(\d+)$/);
		const baseName = baseNameMatch?.[1] ?? desiredVersion;

		// Find existing versions that match the base pattern within the same path group
		const existingVersions = branchesInSamePathGroup
			.map((b) => b.branchVersion)
			.filter((version) => {
				// Check if version starts with base name and optionally ends with -X where X is a number
				const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
				const pattern = new RegExp(`^${escapedBaseName}(-\\d+)?$`);
				return pattern.test(version);
			});

		// If the desired version doesn't conflict within the same path group, return it as-is
		if (!existingVersions.includes(desiredVersion)) {
			return desiredVersion;
		}

		// Find the highest number suffix within the same path group
		let maxSuffix = 1;
		existingVersions.forEach((version) => {
			if (version === baseName) {
				// Original version (no suffix) counts as 1
				maxSuffix = Math.max(maxSuffix, 1);
			} else {
				const match = version.match(/-(\d+)$/);
				if (match?.[1]) {
					maxSuffix = Math.max(maxSuffix, parseInt(match[1]));
				}
			}
		});

		// Create new version name
		return `${baseName}-${maxSuffix + 1}`;
	}

	function generateUniqueFolderName(baseName: string = "New Folder"): string {
		if (!tempBranchConfig) {
			throw new Error("No temporary config available");
		}

		// Get all existing folder names
		const existingFolderNames = Object.keys(tempBranchConfig.folders);
		const allFolderNames = [...existingFolderNames];

		// Extract the base name (remove any existing number suffix)
		const baseNameMatch = baseName.match(/^(.+?)\s+(\d+)$/);
		const actualBaseName = baseNameMatch?.[1] ?? baseName;

		// Find existing names that match the base pattern
		const existingNames = allFolderNames.filter((name) => {
			// Check if name matches base pattern: "New Folder" or "New Folder N"
			const escapedBaseName = actualBaseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const pattern = new RegExp(`^${escapedBaseName}(\\s+\\d+)?$`);
			return pattern.test(name);
		});

		// If the base name doesn't conflict, return it as-is
		if (!existingNames.includes(actualBaseName)) {
			return actualBaseName;
		}

		// Find the highest number suffix
		let maxSuffix = 1;
		existingNames.forEach((name) => {
			if (name === actualBaseName) {
				// Original name (no suffix) counts as 1
				maxSuffix = Math.max(maxSuffix, 1);
			} else {
				const match = name.match(/\s+(\d+)$/);
				if (match?.[1]) {
					maxSuffix = Math.max(maxSuffix, parseInt(match[1]));
				}
			}
		});

		// Create new name with next number
		return `${actualBaseName} ${maxSuffix + 1}`;
	}

	function copyBranch(branch: Branch, folderName: string) {
		if (!tempBranchConfig) {
			showError("Cannot copy branch: not in edit mode");
			return;
		}

		try {
			// Generate new branch ID using timestamp
			const newBranchId = Date.now().toString();

			// Generate unique version name using the shared function
			const newVersion = generateUniqueVersion(branch.branchVersion);

			// Create the new branch
			const clonedConfig = tempBranchConfig.clone();
			clonedConfig.updateBranch(newBranchId, {
				branchVersion: newVersion,
				branchPath: branch.branchPath,
			});

			// Add to the same folder
			clonedConfig.addBranchToFolder(newBranchId, folderName);

			// Update temp config
			tempBranchConfig = clonedConfig;

			// Add to newBranches set immutably
			newBranches = new Set([...newBranches, newBranchId]);

			showSuccess(`Branch copied as "${newVersion}"`);
		} catch (error) {
			console.error("Failed to copy branch:", error);
			showError("Failed to copy branch");
		}
	}

	async function changeBranchPath(branchId: string, branchPath: string) {
		if (!tempBranchConfig) {
			showError("Cannot change branch path: not in edit mode");
			return;
		}

		try {
			// Open directory selection dialog with current path as default
			const selectedPath = await SelectDirectory(branchPath || "");

			// If user cancelled the dialog, selectedPath will be empty
			if (!selectedPath) {
				return;
			}

			// Update the branch path in temp config
			const clonedConfig = tempBranchConfig.clone();
			clonedConfig.updateBranch(branchId, { branchPath: selectedPath });
			tempBranchConfig = clonedConfig;

			showSuccess(`Branch path updated to "${selectedPath}"`);
		} catch (error) {
			console.error("Failed to change branch path:", error);
			showError("Failed to change branch path");
		}
	}

	// Optimized state update functions
	function toggleBranchDeletion(branchId: string) {
		if (!isEditMode) return;

		// Check if this is a new branch
		if (newBranches.has(branchId)) {
			// For new branches, immediately remove them
			if (!tempBranchConfig) return;

			try {
				const clonedConfig = tempBranchConfig.clone();
				clonedConfig.removeBranch(branchId);
				tempBranchConfig = clonedConfig;

				// Immutable set update
				newBranches = new Set([...newBranches].filter((id) => id !== branchId));
				showSuccess("New branch removed");
			} catch (error) {
				console.error("Failed to remove new branch:", error);
				showError("Failed to remove new branch");
			}
			return;
		}

		// For existing branches, toggle deletion mark immutably
		markedForDeletion = markedForDeletion.has(branchId) ? new Set([...markedForDeletion].filter((id) => id !== branchId)) : new Set([...markedForDeletion, branchId]);
	}

	function toggleFolderDeletion(folderName: string) {
		if (!isEditMode || !tempBranchConfig) return;

		const folder = tempBranchConfig.getFolder(folderName);
		if (!folder) return;

		// Check if this is a newly created empty folder - if so, delete instantly
		if (newlyCreatedFolders.has(folderName) && folder.branchIds.length === 0) {
			try {
				const clonedConfig = tempBranchConfig.clone();
				clonedConfig.removeFolder(folderName);
				tempBranchConfig = clonedConfig;

				// Remove from newly created folders set
				newlyCreatedFolders = new Set([...newlyCreatedFolders].filter((name) => name !== folderName));

				showSuccess(`Folder "${folderName}" deleted instantly`);
			} catch (error) {
				console.error("Failed to delete new empty folder:", error);
				showError("Failed to delete folder");
			}
			return;
		}

		// Check if this is a newly created folder with branches - show confirmation dialog
		if (newlyCreatedFolders.has(folderName) && folder.branchIds.length > 0) {
			const branchCount = folder.branchIds.length;

			showDanger("Delete Folder", `This folder contains ${branchCount} branch${branchCount > 1 ? "es" : ""}. Deleting the folder will also delete all its branches. This action cannot be undone.`, "Delete Folder")
				.then((isConfirmed) => {
					if (isConfirmed && tempBranchConfig) {
						try {
							const clonedConfig = tempBranchConfig.clone();
							clonedConfig.removeFolder(folderName);
							tempBranchConfig = clonedConfig;

							// Remove from newly created folders set
							newlyCreatedFolders = new Set([...newlyCreatedFolders].filter((name) => name !== folderName));

							// Remove any branches that were in this folder from newBranches set
							folder.branchIds.forEach((branchId) => {
								if (newBranches.has(branchId)) {
									newBranches = new Set([...newBranches].filter((id) => id !== branchId));
								}
							});

							showSuccess(`Folder "${folderName}" and ${branchCount} branch${branchCount > 1 ? "es" : ""} deleted`);
						} catch (error) {
							console.error("Failed to delete new folder with branches:", error);
							showError("Failed to delete folder");
						}
					}
				})
				.catch((error) => {
					console.error("Error in confirmation dialog:", error);
				});
			return;
		}

		// For existing folders, use the standard marking system
		markedForDeletionFolders = markedForDeletionFolders.has(folderName) ? new Set([...markedForDeletionFolders].filter((name) => name !== folderName)) : new Set([...markedForDeletionFolders, folderName]);
	}

	async function addNewBranch(folderName: string) {
		if (!tempBranchConfig || !isEditMode) {
			showError("Cannot add branch: not in edit mode");
			return;
		}

		try {
			// Generate new branch ID using timestamp
			const newBranchId = Date.now().toString();

			// Generate unique version name for the new branch
			const uniqueVersion = generateUniqueVersion("New Branch");

			// Create the new branch using the addBranch method
			const clonedConfig = tempBranchConfig.clone();
			await clonedConfig.addBranch(newBranchId, uniqueVersion, "", [folderName]);

			tempBranchConfig = clonedConfig;

			// Add to newBranches set immutably
			newBranches = new Set([...newBranches, newBranchId]);

			// Start editing the new branch
			setTimeout(() => {
				editHandlers.startBranch(newBranchId);
			}, 50);

			showSuccess("New branch added");
		} catch (error) {
			console.error("Failed to add new branch:", error);
			showError("Failed to add new branch");
		}
	}

	function enterEditMode() {
		if (!branchConfig) return;

		// Clone the current config for editing
		tempBranchConfig = branchConfig.clone();

		// Disable autosave for the temp config
		tempBranchConfig.setAutosaveEnabled(false);

		// Ensure folders have order properties
		let maxOrder = 0;
		for (const [, folder] of Object.entries(tempBranchConfig.folders)) {
			if (folder.order === undefined) {
				folder.order = maxOrder++;
			}
		}

		// Reset state for tracking newly created items
		newlyCreatedFolders = new Set();

		// Enter edit mode (this will also clear selections)
		branchesStore.enterEditMode();
	}

	async function saveChanges() {
		if (!branchConfig || !tempBranchConfig) return;
		try {
			// Validate that all branches have paths before saving
			const branchesWithEmptyPaths: string[] = [];
			const allBranchIds = tempBranchConfig.getBranchIds();

			for (const branchId of allBranchIds) {
				const branch = tempBranchConfig.getBranch(branchId);
				if (branch && (!branch.branchPath || branch.branchPath.trim() === "")) {
					branchesWithEmptyPaths.push(branch.branchVersion);
				}
			}

			if (branchesWithEmptyPaths.length > 0) {
				const branchList = branchesWithEmptyPaths.join(", ");
				showError(`Please select paths for the following branches before saving: ${branchList}`);
				return;
			}

			// Process folder deletions first (this will also remove all branches in those folders)
			if (markedForDeletionFolders.size > 0) {
				const clonedConfig = tempBranchConfig.clone();

				// Remove each marked folder
				for (const folderName of markedForDeletionFolders) {
					try {
						await clonedConfig.removeFolder(folderName);
					} catch (error) {
						console.error(`Failed to remove folder ${folderName}:`, error);
					}
				}

				tempBranchConfig = clonedConfig;
			}

			// Process branch deletions after folder deletions
			if (markedForDeletion.size > 0) {
				const clonedConfig = tempBranchConfig.clone();

				// Remove each marked branch
				for (const branchId of markedForDeletion) {
					try {
						await clonedConfig.removeBranch(branchId);
					} catch (error) {
						console.error(`Failed to remove branch ${branchId}:`, error);
					}
				}

				tempBranchConfig = clonedConfig;
			}

			// Get the final JSON from the temporary config
			const configJson = tempBranchConfig.toJson();

			// Create a new BranchConfig with the updated data and original save settings
			const saveCallback = branchConfig.saveCallback || ((_: string) => {});
			const updatedConfig = new BranchConfig(configJson, saveCallback, branchConfig.debounceDelay, branchConfig.autosaveEnabled);

			// Save the config
			await updatedConfig.saveNow();

			// Update the actual config
			setBranchConfig(updatedConfig);

			// Exit edit mode and clear temp state
			tempBranchConfig = null;
			branchesStore.exitEditMode();

			// Clear inline editing state
			editingFolderId = null;
			editingBranchId = null;
			tempFolderName = "";
			tempBranchVersion = "";

			// Clear deletion marks
			markedForDeletion = new Set();
			markedForDeletionFolders = new Set();

			// Clear new branches set
			newBranches = new Set();

			// Clear newly created folders set
			newlyCreatedFolders = new Set();

			// Show success notification
			showSuccess("Changes saved successfully");
		} catch (error) {
			console.error("Failed to save changes:", error);
			showError("Failed to save changes");
		}
	}

	function cancelChanges() {
		// Discard temp state
		tempBranchConfig = null;
		branchesStore.exitEditMode();

		// Clear inline editing state
		editingFolderId = null;
		editingBranchId = null;
		tempFolderName = "";
		tempBranchVersion = "";

		// Clear deletion marks
		markedForDeletion = new Set();
		markedForDeletionFolders = new Set();

		// Clear new branches set
		newBranches = new Set();

		// Clear newly created folders set
		newlyCreatedFolders = new Set();
	}

	// Optimized folder drag handlers
	const folderDragHandlers: FolderDragHandlers = {
		start: (e: DragEvent, folderName: string) => {
			if (!e.dataTransfer) return;

			// Prevent dragging when clicking on interactive elements
			const target = e.target as HTMLElement;
			if (target.tagName === "INPUT" || target.tagName === "BUTTON") {
				e.preventDefault();
				return;
			}

			draggedFolderId = folderName;
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/plain", folderName);

			const folderCard = (e.currentTarget as HTMLElement).closest(".folder-card");
			if (folderCard) {
				folderCard.classList.add("opacity-50");
			}
		},

		over: (e: DragEvent, targetIndex: number) => {
			e.preventDefault();
			if (!e.dataTransfer || !draggedFolderId) return;

			e.dataTransfer.dropEffect = "move";
			dropTargetFolderIndex = targetIndex;
		},

		leave: (e: DragEvent) => {
			const relatedTarget = e.relatedTarget as HTMLElement;
			if (!relatedTarget || !relatedTarget.closest(".folder-grid")) {
				dropTargetFolderIndex = null;
			}
		},

		drop: async (e: DragEvent, targetIndex: number) => {
			e.preventDefault();
			if (!draggedFolderId || !isEditMode || !activeConfig) return;

			try {
				const folderNames = folderList;
				const currentIndex = folderNames.indexOf(draggedFolderId);
				if (currentIndex === -1) return;

				let insertIndex = targetIndex;
				if (currentIndex < targetIndex) {
					insertIndex = targetIndex - 1;
				}

				if (currentIndex === insertIndex) return;

				const newOrder = [...folderNames];
				newOrder.splice(currentIndex, 1);
				newOrder.splice(insertIndex, 0, draggedFolderId);

				if (tempBranchConfig) {
					const clonedConfig = tempBranchConfig.clone();
					clonedConfig.reorderFolders(newOrder);
					tempBranchConfig = clonedConfig;
				}
			} catch (error) {
				console.error("Failed to reorder folders:", error);
			}

			dragHandlers.end(e);
		},
	};

	// Optimized inline editing handlers
	const editHandlers: EditHandlers = {
		startFolder: (folderName: string) => {
			if (!isEditMode) return;
			editingFolderId = folderName;
			tempFolderName = folderName;
		},

		startBranch: (branchId: string) => {
			if (!isEditMode || !tempBranchConfig) return;
			const branch = tempBranchConfig.getBranch(branchId);
			if (!branch) return;
			editingBranchId = branchId;
			tempBranchVersion = branch.branchVersion;
		},

		cancelFolder: () => {
			editingFolderId = null;
			tempFolderName = "";
		},

		cancelBranch: () => {
			editingBranchId = null;
			tempBranchVersion = "";
		},
	};

	function saveInlineFolderEdit() {
		if (!editingFolderId || !tempFolderName.trim() || !tempBranchConfig) {
			editHandlers.cancelFolder();
			return;
		}

		const trimmedName = tempFolderName.trim();
		if (trimmedName === editingFolderId) {
			// No change, just cancel
			editHandlers.cancelFolder();
			return;
		}

		// Check if new name already exists
		if (tempBranchConfig.getFolder(trimmedName)) {
			// Show error toast and revert to original name
			showError(`A folder named "${trimmedName}" already exists`);
			tempFolderName = editingFolderId;
			// Keep the input focused and selected using ref
			if (folderInputRef) {
				folderInputRef.focus();
				folderInputRef.select();
			}
			return;
		}

		// Clone the config, apply the change, and reassign to trigger reactivity
		try {
			const clonedConfig = tempBranchConfig.clone();
			clonedConfig.renameFolderTo(editingFolderId, trimmedName);
			tempBranchConfig = clonedConfig;
			showSuccess(`Folder renamed to "${trimmedName}"`);
		} catch (error) {
			console.error("Failed to rename folder:", error);
			showError("Failed to rename folder");
			// Revert to original name
			tempFolderName = editingFolderId;
			return;
		}

		editingFolderId = null;
		tempFolderName = "";
	}

	function saveInlineBranchEdit() {
		if (!editingBranchId || !tempBranchVersion.trim() || !tempBranchConfig) {
			editHandlers.cancelBranch();
			return;
		}

		const trimmedVersion = tempBranchVersion.trim();
		const currentBranch = tempBranchConfig.getBranch(editingBranchId);

		// Check if version has changed
		if (currentBranch && trimmedVersion === currentBranch.branchVersion) {
			// No change, just cancel
			editHandlers.cancelBranch();
			return;
		}

		// Generate unique version name, excluding the current branch being edited
		const uniqueVersion = generateUniqueVersion(trimmedVersion, editingBranchId);

		// Clone the config, apply the change, and reassign to trigger reactivity
		try {
			const clonedConfig = tempBranchConfig.clone();
			clonedConfig.updateBranch(editingBranchId, { branchVersion: uniqueVersion });
			tempBranchConfig = clonedConfig;

			// Show appropriate success message
			if (uniqueVersion === trimmedVersion) {
				showSuccess(`Branch version updated to "${uniqueVersion}"`);
			} else {
				showSuccess(`Branch version updated to "${uniqueVersion}" (auto-generated to ensure uniqueness)`);
			}
		} catch (error) {
			console.error("Failed to update branch version:", error);
			showError("Failed to update branch version");
			// Don't clear the editing state if there was an error
			return;
		}

		editingBranchId = null;
		tempBranchVersion = "";
	}

	// Optimized keyboard handler
	const handleKeydown = (e: KeyboardEvent, type: "folder" | "branch") => {
		if (e.key === "Enter") {
			e.preventDefault();
			type === "folder" ? saveInlineFolderEdit() : saveInlineBranchEdit();
		} else if (e.key === "Escape") {
			e.preventDefault();
			type === "folder" ? editHandlers.cancelFolder() : editHandlers.cancelBranch();
		}
	};

	// New folder creation functions - updated for multiple folders
	async function startCreatingFolder() {
		if (!isEditMode) {
			showError("Must be in edit mode to create folders");
			return;
		}

		if (!tempBranchConfig) {
			showError("Invalid configuration state");
			return;
		}

		const uniqueName = generateUniqueFolderName();
		const color = generateRandomColor();

		try {
			// Clone the config and add the new folder immediately
			const clonedConfig = tempBranchConfig.clone();
			await clonedConfig.addFolder(uniqueName, color, []); // Empty branchIds array - no existing branches
			tempBranchConfig = clonedConfig;

			// Track this folder as newly created
			newlyCreatedFolders = new Set([...newlyCreatedFolders, uniqueName]);

			showSuccess(`Folder "${uniqueName}" created successfully`);
		} catch (error) {
			console.error("Failed to create folder:", error);
			showError("Failed to create folder");
		}
	}

	// JSON Editor functions
	async function openJsonEditor() {
		if (!isEditMode) {
			showError("Must be in edit mode to edit configuration file");
			return;
		}

		try {
			// Reset state and show loading
			isLoadingJsonConfig = true;
			jsonEditorContent = "";
			hasJsonEditorChanges = false;
			isJsonEditorVisible = true;

			// Get the current configuration from backend
			const configJson = await GetBranchConfig();
			jsonEditorContent = configJson;
		} catch (error) {
			console.error("Failed to load configuration:", error);
			showError("Failed to load configuration file");
			isJsonEditorVisible = false;
		} finally {
			isLoadingJsonConfig = false;
		}
	}

	function closeJsonEditor() {
		isJsonEditorVisible = false;
		jsonEditorContent = "";
		// Reset the changes flag when closing without saving
		hasJsonEditorChanges = false;
	}

	async function saveJsonConfig(content: string) {
		try {
			// Validate the configuration
			const validationResult = validateBranchConfig(content);

			if (!validationResult.isValid) {
				const errorMessage = formatValidationMessage(validationResult);
				showError("Configuration validation failed:\n" + errorMessage);
				throw new Error("Validation failed");
			}

			// Show warnings if any
			if (validationResult.warnings.length > 0) {
				const warningMessage = formatValidationMessage(validationResult);
				console.warn("Configuration warnings:", warningMessage);
			}

			// Sanitize the content
			const sanitizedContent = sanitizeBranchConfig(content);

			// Save to backend
			await SaveBranchConfig(sanitizedContent);

			// Mark that changes were saved
			hasJsonEditorChanges = true;

			// Exit edit mode first
			if (isEditMode) {
				// Clear all edit mode state
				tempBranchConfig = null;
				branchesStore.exitEditMode();

				// Clear inline editing state
				editingFolderId = null;
				editingBranchId = null;
				tempFolderName = "";
				tempBranchVersion = "";

				// Clear deletion marks
				markedForDeletion = new Set();
				markedForDeletionFolders = new Set();

				// Clear new branches set
				newBranches = new Set();

				// Clear newly created folders set
				newlyCreatedFolders = new Set();
			}

			// Reload the configuration to refresh the UI
			await reloadConfig();

			showSuccess("Configuration saved and reloaded successfully");
		} catch (error) {
			console.error("Failed to save configuration:", error);
			if (error instanceof Error && error.message !== "Validation failed") {
				showError("Failed to save configuration: " + error.message);
			}
			throw error; // Re-throw to prevent modal from closing
		}
	}
</script>

{#if branchConfig}
	<div class="container mx-auto p-4">
		<FloatingHeader elevateZIndex={isActionDropdownOpen}>
			{#snippet children()}
					<!-- Edit/Cancel/Save Buttons -->
					<div class="flex gap-x-2 items-center">
						{#if !isEditMode}
							<Button variant="secondary" loading={isReloading} onclick={reloadConfig} tooltip="Reload configuration from file" class="text-sm transition-all duration-300">
								{isReloading ? "Reloading..." : "Reload"}
							</Button>
							<Button variant="secondary" onclick={enterEditMode} class="text-sm transition-all duration-300">Edit</Button>
							{#if branchesStore.hasSelectedBranches}
								<Button variant="danger" leftIcon="x" iconSize={16} onclick={() => branchesStore.clearSelection()} tooltip={`Clear selection of ${branchesStore.selectedBranchCount} branch${branchesStore.selectedBranchCount > 1 ? "es" : ""}`} class="text-sm transition-all duration-300">
									Unselect All
								</Button>
							{/if}
						{:else}
							<Button
								variant="secondary"
								leftIcon="settings"
								iconSize={14}
								onclick={openJsonEditor}
								tooltip="Edit configuration file as JSON"
								class="text-sm transition-all duration-300"
							>
								Edit Config File
							</Button>
						{/if}
					</div>

					<!-- Reload and Status Refresh Buttons -->
					<div class="flex gap-x-4 items-center">
						{#if !isEditMode}
							{#if hasDisconnectedBranches}
								<Button
									variant="secondary"
									class="flex items-center gap-2 text-sm transition-all duration-300"
									disabled={!hasDisconnectedBranches || isRefreshingDisconnected}
									loading={isRefreshingDisconnected}
									onclick={refreshDisconnectedBranches}
									tooltip={hasDisconnectedBranches ? "Refresh connection status for disconnected branches" : "No disconnected branches found"}
								>
									{isRefreshingDisconnected ? "Refreshing..." : "Retry Disconnected"}
								</Button>
							{/if}
							<Button
								variant="secondary"
								class="flex items-center gap-2 text-sm transition-all duration-300"
								disabled={isUpdatingOutdated}
								loading={isUpdatingOutdated}
								onclick={shouldUpdateAll ? updateAllBranches : updateOutdatedBranches}
								tooltip={shouldUpdateAll ? "Refresh status for all branches" : "Update all branches that are behind the latest revision"}
							>
								{isUpdatingOutdated ? "Updating..." : (shouldUpdateAll ? "Update All" : "Update Status")}
							</Button>
							<ActionMenu
								label="SVN Action"
								variant="primary"
								options={svnActionOptions}
								onaction={handleSVNAction}
								ondropdownchange={(open) => isActionDropdownOpen = open}
								disabled={!branchesStore.hasSelectedBranches}
								tooltip={branchesStore.hasSelectedBranches ? `Choose SVN action for ${branchesStore.selectedBranchCount} selected branch${branchesStore.selectedBranchCount > 1 ? 'es' : ''}` : "Select branches to enable SVN actions"}
								class="w-40 text-sm transition-all duration-300"
							/>
						{:else}
							<Button variant="secondary" onclick={cancelChanges} class="text-sm transition-all duration-300">Cancel</Button>
							<Button variant="primary" onclick={saveChanges} class="text-sm transition-all duration-300">Save</Button>
						{/if}
					</div>
			{/snippet}
		</FloatingHeader>

		<!-- Folder Grid -->
		<div class="folder-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each folderList as folderName, index (folderName)}
				{@const folder = activeConfig?.getFolder(folderName)}
				{@const branches = activeConfig?.getBranchesForFolder(folderName) ?? []}
				{@const isDropTarget = isEditMode && dropTargetFolderIndex === index && draggedFolderId && draggedFolderId !== folderName}

				<!-- Drop zone before each card -->
				{#if isDropTarget}
					<div
						class="flex items-center justify-center min-h-[200px] border-2 border-blue-500 dark:border-blue-400 border-dashed rounded-lg bg-blue-50 dark:bg-blue-900/20 transition-all duration-200"
						ondrop={(e) => folderDragHandlers.drop(e, index)}
						ondragover={(e) => folderDragHandlers.over(e, index)}
						ondragleave={folderDragHandlers.leave}
						role="region"
						aria-label="Drop zone for folder reordering"
					>
						<div class="text-center">
							<div class="w-8 h-8 bg-blue-500 dark:bg-blue-400 rounded-full mx-auto mb-2 flex items-center justify-center">
								<Icon name="plus" size={16} class="text-white" />
							</div>
							<p class="text-blue-600 dark:text-blue-400 font-medium">Drop folder here</p>
						</div>
					</div>
				{/if}

				{#if folder}
					<FolderCard
						{folderName}
						{folder}
						{branches}
						{index}
						{isEditMode}
						isBeingDragged={draggedFolderId === folderName}
						isSelected={!isEditMode && hasSelectedBranches(folderName)}
						checkboxState={getFolderCheckboxState(folderName)}
						{editingFolderId}
						{editingBranchId}
						bind:tempFolderName
						bind:tempBranchVersion
						{markedForDeletion}
						{markedForDeletionFolders}
						{newBranches}
						{newlyCreatedFolders}
						{draggedBranchId}
						{draggedFolderId}
						{dropTargetFolder}
						{dropTargetIndex}
						bind:folderInputRef
						bind:branchInputRef
						onToggleFolder={toggleFolder}
						onToggleBranch={toggleBranch}
						onFolderDragStart={folderDragHandlers.start}
						onFolderDragOver={folderDragHandlers.over}
						onFolderDrop={folderDragHandlers.drop}
						onFolderDragLeave={folderDragHandlers.leave}
						onDragEnd={dragHandlers.end}
						onBranchDragStart={dragHandlers.start}
						onBranchDragOver={dragHandlers.over}
						onBranchDrop={dragHandlers.drop}
						onBranchDragLeave={dragHandlers.leave}
						onStartEditFolder={editHandlers.startFolder}
						onStartEditBranch={editHandlers.startBranch}
						onKeydown={handleKeydown}
						onSaveFolderEdit={saveInlineFolderEdit}
						onSaveBranchEdit={saveInlineBranchEdit}
						onAddNewBranch={addNewBranch}
						onChangeBranchPath={changeBranchPath}
						onCopyBranch={copyBranch}
						onToggleBranchDeletion={toggleBranchDeletion}
						onToggleFolderDeletion={toggleFolderDeletion}
					/>
				{/if}
			{/each}

			<!-- Add Folder Button (persistent in edit mode) -->
			{#if isEditMode}
				<div class="flex items-center justify-center min-h-[200px]">
					<button
						class="add-folder-button group flex flex-col items-center justify-center gap-3 px-6 py-8 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 border-2 border-green-500 dark:border-green-400 border-dashed rounded-lg hover:border-green-600 dark:hover:border-green-300 transition-all duration-200 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 w-full h-full min-h-[200px]"
						onclick={startCreatingFolder}
						use:tooltip={"Create a new folder"}
					>
						<Icon name="plus" size={32} class="text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300" />
						<span class="font-medium text-lg">Add Folder</span>
						<span class="text-sm text-gray-500 dark:text-gray-400">Click to create a new folder</span>
					</button>
				</div>
			{/if}

			<!-- Drop zone at the end -->
			{#if isEditMode && draggedFolderId}
				{@const totalFolders = folderList.length}
				{@const isLastDropTarget = dropTargetFolderIndex === totalFolders}
				<div
					class="flex items-center justify-center min-h-[200px] border-2 border-dashed rounded-lg bg-gray-50 dark:bg-gray-800 transition-all duration-200 {isLastDropTarget ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''}"
					ondragover={(e) => folderDragHandlers.over(e, totalFolders)}
					ondrop={(e) => folderDragHandlers.drop(e, totalFolders)}
					ondragleave={folderDragHandlers.leave}
					role="region"
					aria-label="Drop zone for folder reordering at end"
				>
					<div class="text-center">
						<div class="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center transition-colors duration-200 {isLastDropTarget ? 'bg-blue-500 dark:bg-blue-400' : 'bg-gray-400 dark:bg-gray-500'}">
							<Icon name="plus" size={16} class="text-white" />
						</div>
						<p class="font-medium transition-colors duration-200 {isLastDropTarget ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}">Drop folder here</p>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- JSON Editor Modal -->
	<JsonEditorModal
		isVisible={isJsonEditorVisible}
		title="Edit Branch Configuration"
		jsonContent={jsonEditorContent}
		isLoading={isLoadingJsonConfig}
		onClose={closeJsonEditor}
		onSave={saveJsonConfig}
	/>
{:else}
	<div class="container mx-auto p-4">
		<p class="text-gray-500 dark:text-gray-400 text-center">No branch configuration available</p>
	</div>
{/if}

<style>
	/* Enhanced grid layout for better performance */
	.folder-grid {
		contain: layout style;
	}

	/* Optimized transitions */
	.transition-all {
		will-change: transform, opacity;
	}

	/* CSS custom properties for dark mode support */
	:root {
		--pulse-border-light: rgb(34, 197, 94);
		--pulse-border-dark: rgb(22, 163, 74);
		--pulse-bg-light: rgb(240, 253, 244);
		--pulse-bg-dark: rgb(220, 252, 231);
	}

	:root.dark {
		--pulse-border-light: rgb(74, 222, 128);
		--pulse-border-dark: rgb(34, 197, 94);
		--pulse-bg-light: rgba(34, 197, 94, 0.2);
		--pulse-bg-dark: rgba(34, 197, 94, 0.3);
	}

	/* Add Folder button styling */
	.add-folder-button {
		animation: pulse-green 3s ease-in-out infinite;
	}

	@keyframes pulse-green {
		0%,
		100% {
			border-color: var(--pulse-border-light);
			background-color: var(--pulse-bg-light);
		}
		50% {
			border-color: var(--pulse-border-dark);
			background-color: var(--pulse-bg-dark);
		}
	}

	.add-folder-button:hover {
		animation-play-state: paused;
	}

	/* Custom flashing animation for disconnected status that doesn't interfere with transforms */
	:global(.text-purple-flash) {
		animation: flash-text 1.5s ease-in-out infinite;
	}

	@keyframes flash-text {
		0%,
		100% {
			color: rgb(147, 51, 234);
			opacity: 1;
		}
		50% {
			color: rgb(196, 125, 255);
			opacity: 0.7;
		}
	}
</style>
