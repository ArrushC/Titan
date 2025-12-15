<script lang="ts">
	import { getBranchConfig, getAppConfig, getWs, setCommitVariableValue, getCommitVariableValues, clearCommitVariableValues, setCommitPhase, setIsCommitInProgress, setIsCommitMode } from "./stores/app.svelte.ts";
	import { branchesStore } from "./stores/branches.svelte.ts";
	import { branchStatusStore } from "./stores/branchStatus.svelte.ts";
	import Icon from "./components/Icon.svelte";
	import Button from "./components/Button.svelte";
	import Checkbox from "./components/Checkbox.svelte";
	import FloatingHeader from "./components/FloatingHeader.svelte";
	import ActionMenu from "./components/ActionMenu.svelte";
	import { showError, showSuccess } from "./stores/toast.svelte.ts";
	import { showDanger } from "./stores/confirmationDialog.svelte.ts";
	import { SVNStatusDetailed, SVNRevert, SVNDelete, SVNCommitMultiBranch, SVNGetFileContent, SVNLog, SVNStatusForPaths, SVNAddWithKeywordsAndEOL, SVNUpdateBranches } from "../wailsjs/go/main/App.js";
	import DiffModal from "./components/DiffModal.svelte";
	import { tooltip } from "./utils/tooltip";
	import { storage } from "./lib/persistence";

	// Types for commit functionality
	interface FileEntry {
		path: string;
		status: string;
		propsStatus?: string;
		isConflicted: boolean;
		needsUpdate: boolean;
		branchPath: string;
		branchFolder: string;
		branchVersion: string;
		lastPathSegment: string;
		relativePath: string;
		lastModified?: string;
		isDirectory: boolean;
	}

	interface CommitGroup {
		branchPath: string;
		branchFolder: string;
		branchVersion: string;
		files: FileEntry[];
	}

	interface VariableColumn {
		id: string;
		name: string;
		description: string;
		defaultValue: string;
		required: boolean;
		values: Record<string, string>; // branchFolder -> value
	}

	// Reactive state from stores
	let branchConfig = $derived(getBranchConfig());
	let appConfig = $derived(getAppConfig());
	let selectedBranches = $derived(branchesStore.selectedBranches);
	let selectedBranchCount = $derived(branchesStore.selectedBranchCount);
	let ws = $derived(getWs());

	// Commit workflow state
	let currentPhase = $state<"loading" | "selection" | "committing" | "completed">("loading");
	let loadingMessage = $state("Initializing commit process...");
	let loadingProgress = $state(0);

	// File management state
	let allFiles = $state<FileEntry[]>([]);
	let stagedFiles = $state<FileEntry[]>([]);
	let searchFilter = $state("");
	let sortColumn = $state<"path" | "status" | "branch" | "modified">("modified");
	let sortDirection = $state<"asc" | "desc">("desc");

	// Variable management state
	let variableColumns = $state<VariableColumn[]>([]);
	let commitMessageTemplate = $state("");
	let commitMessageInput = $state(""); // Raw textarea input

	// Commit progress state
	let commitGroups = $state<CommitGroup[]>([]);
	let currentCommitGroup = $state(0);
	let commitResults = $state<any[]>([]);
	let commitInProgress = $state(false);
	let commitProcessStarted = $state(false);

	// Diff viewer state
	let showDiffModal = $state(false);
	let diffOldContent = $state("");
	let diffNewContent = $state("");
	let diffFilePath = $state("");
	let diffLoading = $state(false);
	let diffBranchFolder = $state("");
	let diffBranchVersion = $state("");
	let diffLastPathSegment = $state("");
	let diffFolderColor = $state("");

	// Add variable dialog state
	let showAddVariableDialog = $state(false);
	let newVariableName = $state("");
	let newVariableDescription = $state("");
	let newVariableDefaultValue = $state("");
	let newVariableRequired = $state(false);
	let isAddingVariable = $state(false);

	// Operation states for better UX
	let revertingFiles = $state<Set<string>>(new Set());
	let diffingFiles = $state<Set<string>>(new Set());
	let unversioningFiles = $state<Set<string>>(new Set());

	// Preview toggle state
	let showPreview = $state(false);

	// Tips toggle state
	let showTips = $state(false);

	// Refresh operation state
	let refreshing = $state(false);
	let refreshMessage = $state("");

	// Commit history state
	let showCommitHistory = $state(false);
	let commitHistory = $state<Array<{ revision: string; author: string; date: string; message: string }>>([]);
	let loadingHistory = $state(false);
	let historyError = $state("");
	let selectedHistoryIndex = $state(-1);
	let historySearchFilter = $state("");
	let historyBranchCount = $state(0);
	let historyLoadingMessage = $state("");

	// Commit templates state
	let showTemplates = $state(false);
	let templatesList = $state<Array<{ id: string; nickname: string; template: string; createdAt: string; usedCount: number }>>([]);
	let selectedTemplateIndex = $state(-1);
	let templateSearchFilter = $state("");
	let showSaveTemplateDialog = $state(false);
	let templateNickname = $state("");

	// Keyboard navigation state
	let selectedFileIndex = $state(-1);
	let selectedStagedFileIndex = $state(-1);

	let activeTable = $state<"files" | "staged" | null>(null);

	// Commit template state for copy-to-clipboard feature
	let commitTemplateInput = $state("");
	let includeCommitMessage = $state(false);

	// Auto-update state for branch updates after commit
	let isAutoUpdatingBranches = $state(false);
	let autoUpdateCompleted = $state(false);

	// Commit complete section state
	let showCommitCompleteTips = $state(false);
	let showCommitCompleteTemplates = $state(false);
	let commitCompleteTemplates = $state<Array<{ id: string; nickname: string; template: string; createdAt: string; usedCount: number }>>([]);
	let selectedCommitCompleteTemplateIndex = $state(-1);
	let commitCompleteTemplateSearchFilter = $state("");
	let showSaveCommitCompleteTemplateDialog = $state(false);
	let commitCompleteTemplateNickname = $state("");

	// Commit Again dropdown state
	let isCommitAgainDropdownOpen = $state(false);
	const commitAgainOptions = [
		{ id: "clear", label: "Clear Values", icon: "reload" as const },
		{ id: "keep", label: "Keep Values", icon: "copy" as const }
	];

	// Natural sort comparison function
	function naturalCompare(a: string, b: string): number {
		const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
		return collator.compare(a, b);
	}

	// Helper function to get relative path with proper path separator handling
	function getRelativePath(filePath: string, basePath: string): string {
		// Normalize path separators to forward slashes for consistent processing
		const normalizedFilePath = filePath.replace(/\\/g, "/");
		const normalizedBasePath = basePath.replace(/\\/g, "/");

		// Ensure base path ends with a separator for proper matching
		const basePathWithSeparator = normalizedBasePath.endsWith("/") ? normalizedBasePath : normalizedBasePath + "/";

		// Remove base path if file path starts with it
		let relativePath = normalizedFilePath.startsWith(basePathWithSeparator) ? normalizedFilePath.substring(basePathWithSeparator.length) : normalizedFilePath;

		// Remove leading separators
		relativePath = relativePath.replace(/^[\/\\]+/, "");

		return relativePath;
	}

	// Get selected branch details (pure derived computation)
	let selectedBranchDetails = $derived.by(() => {
		if (!branchConfig) return [];

		const details: Array<{
			folderId: string;
			folderName: string;
			folderColor: string;
			branchId: string;
			branchVersion: string;
			branchPath: string;
			lastPathSegment: string;
		}> = [];

		for (const [key, isSelected] of Object.entries(selectedBranches)) {
			if (isSelected) {
				const [folderName, branchId] = key.split("-");
				const branch = branchConfig.getBranch(branchId);
				const folder = branchConfig.getFolder(folderName);
				if (branch && folder) {
					// Extract last path segment
					const pathSegments = branch.branchPath.split(/[\\/]/);
					const lastSegment = pathSegments[pathSegments.length - 1] || "";

					details.push({
						folderId: folderName,
						folderName,
						folderColor: folder.color,
						branchId,
						branchVersion: branch.branchVersion,
						branchPath: branch.branchPath,
						lastPathSegment: lastSegment,
					});
				}
			}
		}

		// Sort by folder name (natural sort), then by branch version (natural sort)
		return details.sort((a, b) => {
			const folderCompare = naturalCompare(a.folderName, b.folderName);
			if (folderCompare !== 0) return folderCompare;
			return naturalCompare(a.branchVersion, b.branchVersion);
		});
	});

	// Get unique folder details for commit variables UI
	let uniqueFolderDetails = $derived.by(() => {
		const uniqueFolders = new Map<string, (typeof selectedBranchDetails)[0]>();
		selectedBranchDetails.forEach((branch) => {
			if (!uniqueFolders.has(branch.folderName)) {
				uniqueFolders.set(branch.folderName, branch);
			}
		});
		return Array.from(uniqueFolders.values());
	});

	// Commit message derived from template and input (reactive)
	// Note: All variables ($t{variableName} and $t{{specialVariable}}) are processed per-branch during commit
	let commitMessage = $derived.by(() => {
		if (!appConfig) return "";

		// Start with the template if input is empty, otherwise use the input
		// Keep all variables unprocessed - they will be handled per-branch during commit
		return commitMessageInput || commitMessageTemplate;
	});

	// Preview of what will be sent to the backend (processed with first branch's values for preview purposes)
	let commitMessagePreview = $derived.by(() => {
		if (!commitMessage || selectedBranchDetails.length === 0) {
			return sanitizeCommitMessage(commitMessage);
		}

		// Use the first selected branch for preview purposes
		const firstBranch = selectedBranchDetails[0];
		const processedMessage = processSpecialVariablesForBranch(commitMessage, firstBranch.folderName, firstBranch.branchVersion);
		return sanitizeCommitMessage(processedMessage);
	});

	// Filtered commit history based on search (no debouncing for instant feedback)
	let filteredCommitHistory = $derived.by(() => {
		if (!historySearchFilter.trim()) {
			return commitHistory;
		}

		const searchTerm = historySearchFilter.toLowerCase().trim();
		return commitHistory.filter((commit) => commit.message.toLowerCase().includes(searchTerm) || commit.revision.toLowerCase().includes(searchTerm) || commit.date.toLowerCase().includes(searchTerm));
	});

	// Note: selectedBranchDetails is already efficiently computed as a derived state

	// Initialize variable columns from AppConfig
	$effect(() => {
		if (appConfig && uniqueFolderDetails.length > 0) {
			const commitVars = appConfig.getCommitVariables();

			// Create a map of existing columns for merging
			const existingColumnsMap = new Map(variableColumns.map((col) => [col.name, col]));

			const newVariableColumns = commitVars.map((v) => {
				// Check if we already have this variable in our local state
				const existingColumn = existingColumnsMap.get(v.name);

				const values: Record<string, string> = {};

				// Load saved values for each unique folder only
				uniqueFolderDetails.forEach((branch) => {
					// Use existing local value if available, otherwise load from config
					const existingValue = existingColumn?.values[branch.folderName];
					if (existingValue !== undefined) {
						values[branch.folderName] = existingValue;
					} else {
						const savedValues = getCommitVariableValues(branch.folderName);
						const value = savedValues[v.name] || v.defaultValue || "";
						values[branch.folderName] = value.trim();
					}
				});

				return {
					id: existingColumn?.id || crypto.randomUUID(), // Preserve existing ID
					name: v.name,
					description: v.description || "",
					defaultValue: v.defaultValue,
					required: v.required || false,
					values: values,
				};
			});

			// Only update if there are actual changes or if we have no variables yet
			const hasChanges =
				variableColumns.length === 0 ||
				newVariableColumns.length !== variableColumns.length ||
				newVariableColumns.some((newCol) => {
					const oldCol = variableColumns.find((col) => col.name === newCol.name);
					return !oldCol || newCol.description !== oldCol.description || newCol.defaultValue !== oldCol.defaultValue;
				});

			if (hasChanges) {
				variableColumns = newVariableColumns;
			}

			const newTemplate = appConfig.getCommitMessageTemplate();
			if (newTemplate !== commitMessageTemplate) {
				commitMessageTemplate = newTemplate;
				// If input is empty, populate it with the template
				if (!commitMessageInput) {
					commitMessageInput = newTemplate;
				}
			}

			const newClipboardTemplate = appConfig.getClipboardTemplate();
			if (newClipboardTemplate !== commitTemplateInput) {
				// If input is empty, populate it with the template
				if (!commitTemplateInput) {
					commitTemplateInput = newClipboardTemplate;
				}
			}
		}
	});

	// Debounced save for clipboard template changes
	let templateSaveTimeout: ReturnType<typeof setTimeout> | null = null;
	let templateInitialized = $state(false);

	$effect(() => {
		if (appConfig && commitTemplateInput) {
			const currentTemplate = appConfig.getClipboardTemplate();

			// On first load, don't save, just mark as initialized
			if (!templateInitialized) {
				templateInitialized = true;
				return;
			}

			// Only save if template is different and we're past initialization
			if (commitTemplateInput !== currentTemplate) {
				// Clear existing timeout
				if (templateSaveTimeout) {
					clearTimeout(templateSaveTimeout);
				}

				// Set new timeout for debounced save (1 second delay)
				templateSaveTimeout = setTimeout(() => {
					appConfig.setClipboardTemplate(commitTemplateInput);
					templateSaveTimeout = null;
				}, 1000);
			}
		}

		// Cleanup function
		return () => {
			if (templateSaveTimeout) {
				clearTimeout(templateSaveTimeout);
				templateSaveTimeout = null;
			}
		};
	});

	// Start the commit process when component loads
	$effect(() => {
		if (selectedBranchDetails.length > 0 && currentPhase === "loading" && !commitProcessStarted) {
			commitProcessStarted = true;
			startCommitProcess();
		}
	});

	// Sync currentPhase and commitInProgress with global store
	$effect(() => {
		setCommitPhase(currentPhase);
	});

	$effect(() => {
		setIsCommitInProgress(commitInProgress);
	});

	// WebSocket message handling
	$effect(() => {
		if (ws) {
			const handleMessage = (event: MessageEvent) => {
				try {
					const message = JSON.parse(event.data);
					handleWebSocketMessage(message);
				} catch (error) {
					console.error("Failed to parse WebSocket message:", error);
				}
			};

			ws.addEventListener("message", handleMessage);
			return () => ws.removeEventListener("message", handleMessage);
		}
	});

	function handleWebSocketMessage(message: any) {
		switch (message.type) {
			case "commit:variables:updated":
				// Update variable values from other clients
				if (message.branchPath && message.variables) {
					const branchFolder = selectedBranchDetails.find((b) => b.branchPath === message.branchPath)?.folderName;
					if (branchFolder) {
						let updated = false;
						variableColumns.forEach((col) => {
							if (message.variables[col.name] !== undefined && col.values[branchFolder] !== message.variables[col.name]) {
								col.values[branchFolder] = message.variables[col.name].trim();
								updated = true;
							}
						});
						if (updated) {
							showSuccess(`Variables updated from another client for ${branchFolder}`);
						}
					}
				}
				break;
			case "commit:progress":
				// Handle commit progress updates from other clients
				if (message.currentGroup !== undefined) {
					currentCommitGroup = message.currentGroup;
				}
				if (message.result) {
					commitResults.push(message.result);
				}
				break;
			case "commit:variables:request":
				// Another client is requesting current variable values
				if (message.branchPath) {
					const branchFolder = selectedBranchDetails.find((b) => b.branchPath === message.branchPath)?.folderName;
					if (branchFolder && ws) {
						const variables = Object.fromEntries(variableColumns.map((col) => [col.name, col.values[branchFolder] || col.defaultValue]));

						ws.send(
							JSON.stringify({
								command: "commit:variables:response",
								branchPath: message.branchPath,
								variables: variables,
								requestId: message.requestId,
							})
						);
					}
				}
				break;
		}
	}

	// Template management functions
	function loadTemplatesFromStorage(): Array<{ id: string; nickname: string; template: string; createdAt: string; usedCount: number }> {
		return storage.getItem<Array<{ id: string; nickname: string; template: string; createdAt: string; usedCount: number }>>('commit-templates') ?? [];
	}

	function saveTemplatesToStorage(templates: Array<{ id: string; nickname: string; template: string; createdAt: string; usedCount: number }>): void {
		storage.setItem('commit-templates', templates);
	}

	function toggleTemplates(): void {
		if (!showTemplates) {
			// Close history dropdown first if it's open
			if (showCommitHistory) {
				closeHistoryDropdown();
			}

			templatesList = loadTemplatesFromStorage();
			selectedTemplateIndex = -1;
			templateSearchFilter = "";
			showTemplates = true;
		} else {
			closeTemplateDropdown();
		}
	}

	function selectTemplate(template: string): void {
		commitMessageInput = template;
		closeTemplateDropdown();

		// Update usage count
		const templates = loadTemplatesFromStorage();
		const templateIndex = templates.findIndex(t => t.template === template);
		if (templateIndex >= 0) {
			templates[templateIndex].usedCount += 1;
			saveTemplatesToStorage(templates);
		}
	}

	function closeTemplateDropdown(): void {
		showTemplates = false;
		selectedTemplateIndex = -1;
		templateSearchFilter = "";
	}

	function deleteTemplate(templateId: string): void {
		const templates = loadTemplatesFromStorage();
		const filtered = templates.filter(t => t.id !== templateId);
		saveTemplatesToStorage(filtered);
		templatesList = filtered;

		// Adjust selected index if necessary
		if (selectedTemplateIndex >= filtered.length) {
			selectedTemplateIndex = filtered.length - 1;
		}
	}

	function saveCurrentTemplate(): void {
		const currentMessage = commitMessageInput.trim();
		if (!currentMessage || !templateNickname.trim()) {
			return;
		}

		const templates = loadTemplatesFromStorage();
		const newTemplate = {
			id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			nickname: templateNickname.trim(),
			template: currentMessage,
			createdAt: new Date().toISOString(),
			usedCount: 0
		};

		templates.unshift(newTemplate);
		saveTemplatesToStorage(templates);
		templatesList = templates;

		// Reset dialog
		showSaveTemplateDialog = false;
		templateNickname = "";

		showSuccess(`Template "${newTemplate.nickname}" saved successfully!`);
	}

	function handleTemplateKeydown(event: KeyboardEvent): void {
		if (!showTemplates) return;

		const filteredTemplates = templatesList.filter(template =>
			template.nickname.toLowerCase().includes(templateSearchFilter.toLowerCase()) ||
			template.template.toLowerCase().includes(templateSearchFilter.toLowerCase())
		);

		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				if (selectedTemplateIndex < filteredTemplates.length - 1) {
					selectedTemplateIndex++;
					scrollToTemplateIndex(selectedTemplateIndex);
				}
				break;
			case "ArrowUp":
				event.preventDefault();
				if (selectedTemplateIndex > 0) {
					selectedTemplateIndex--;
					scrollToTemplateIndex(selectedTemplateIndex);
				} else if (selectedTemplateIndex === 0) {
					selectedTemplateIndex = -1;
					// Focus search input
					setTimeout(() => {
						const searchInput = document.querySelector('.template-search-input') as HTMLInputElement;
						if (searchInput) searchInput.focus();
					}, 0);
				}
				break;
			case "Enter":
				event.preventDefault();
				if (selectedTemplateIndex >= 0 && selectedTemplateIndex < filteredTemplates.length) {
					selectTemplate(filteredTemplates[selectedTemplateIndex].template);
				}
				break;
			case "Escape":
				event.preventDefault();
				closeTemplateDropdown();
				break;
		}
	}

	function scrollToTemplateIndex(index: number): void {
		setTimeout(() => {
			const templateItem = document.querySelector(`.template-item-${index}`);
			if (templateItem) {
				templateItem.scrollIntoView({ block: "nearest" });
			}
		}, 0);
	}

	function clearTemplateSearch(): void {
		templateSearchFilter = "";
		selectedTemplateIndex = -1;
	}

	// Handle textarea blur to potentially save as template
	function handleCommitMessageBlur(): void {
		// Only triggered when user explicitly focuses out, not on programmatic changes
		const currentMessage = commitMessageInput.trim();
		if (currentMessage && currentMessage.length > 10) {
			// Could show a subtle prompt to save as template, but per requirements,
			// we only save when user explicitly requests it
		}
	}

	// Commit Complete Template Management Functions
	function loadCommitCompleteTemplatesFromStorage(): Array<{ id: string; nickname: string; template: string; createdAt: string; usedCount: number }> {
		return storage.getItem<Array<{ id: string; nickname: string; template: string; createdAt: string; usedCount: number }>>('commit-complete-templates') ?? [];
	}

	function saveCommitCompleteTemplatesToStorage(templates: Array<{ id: string; nickname: string; template: string; createdAt: string; usedCount: number }>): void {
		storage.setItem('commit-complete-templates', templates);
	}

	function toggleCommitCompleteTemplates(): void {
		if (!showCommitCompleteTemplates) {
			commitCompleteTemplates = loadCommitCompleteTemplatesFromStorage();
			selectedCommitCompleteTemplateIndex = -1;
			commitCompleteTemplateSearchFilter = "";
			showCommitCompleteTemplates = true;
		} else {
			closeCommitCompleteTemplateDropdown();
		}
	}

	function selectCommitCompleteTemplate(template: string): void {
		commitTemplateInput = template;
		closeCommitCompleteTemplateDropdown();

		// Update usage count
		const templates = loadCommitCompleteTemplatesFromStorage();
		const templateIndex = templates.findIndex(t => t.template === template);
		if (templateIndex >= 0) {
			templates[templateIndex].usedCount += 1;
			saveCommitCompleteTemplatesToStorage(templates);
		}
	}

	function closeCommitCompleteTemplateDropdown(): void {
		showCommitCompleteTemplates = false;
		selectedCommitCompleteTemplateIndex = -1;
		commitCompleteTemplateSearchFilter = "";
	}

	function deleteCommitCompleteTemplate(templateId: string): void {
		const templates = loadCommitCompleteTemplatesFromStorage();
		const filtered = templates.filter(t => t.id !== templateId);
		saveCommitCompleteTemplatesToStorage(filtered);
		commitCompleteTemplates = filtered;

		// Adjust selected index if necessary
		if (selectedCommitCompleteTemplateIndex >= filtered.length) {
			selectedCommitCompleteTemplateIndex = filtered.length - 1;
		}
	}

	function saveCurrentCommitCompleteTemplate(): void {
		const currentTemplate = commitTemplateInput.trim();
		if (!currentTemplate || !commitCompleteTemplateNickname.trim()) {
			return;
		}

		const templates = loadCommitCompleteTemplatesFromStorage();
		const newTemplate = {
			id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			nickname: commitCompleteTemplateNickname.trim(),
			template: currentTemplate,
			createdAt: new Date().toISOString(),
			usedCount: 0
		};

		templates.unshift(newTemplate);
		saveCommitCompleteTemplatesToStorage(templates);
		commitCompleteTemplates = templates;

		// Reset dialog
		showSaveCommitCompleteTemplateDialog = false;
		commitCompleteTemplateNickname = "";

		showSuccess(`Template "${newTemplate.nickname}" saved successfully!`);
	}

	function handleCommitCompleteTemplateKeydown(event: KeyboardEvent): void {
		if (!showCommitCompleteTemplates) return;

		const filteredTemplates = commitCompleteTemplates.filter(template =>
			template.nickname.toLowerCase().includes(commitCompleteTemplateSearchFilter.toLowerCase()) ||
			template.template.toLowerCase().includes(commitCompleteTemplateSearchFilter.toLowerCase())
		);

		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				if (selectedCommitCompleteTemplateIndex < filteredTemplates.length - 1) {
					selectedCommitCompleteTemplateIndex++;
					scrollToCommitCompleteTemplateIndex(selectedCommitCompleteTemplateIndex);
				}
				break;
			case "ArrowUp":
				event.preventDefault();
				if (selectedCommitCompleteTemplateIndex > 0) {
					selectedCommitCompleteTemplateIndex--;
					scrollToCommitCompleteTemplateIndex(selectedCommitCompleteTemplateIndex);
				} else if (selectedCommitCompleteTemplateIndex === 0) {
					selectedCommitCompleteTemplateIndex = -1;
					// Focus search input
					setTimeout(() => {
						const searchInput = document.querySelector('.commit-complete-template-search-input') as HTMLInputElement;
						if (searchInput) searchInput.focus();
					}, 0);
				}
				break;
			case "Enter":
				event.preventDefault();
				if (selectedCommitCompleteTemplateIndex >= 0 && selectedCommitCompleteTemplateIndex < filteredTemplates.length) {
					selectCommitCompleteTemplate(filteredTemplates[selectedCommitCompleteTemplateIndex].template);
				}
				break;
			case "Escape":
				event.preventDefault();
				closeCommitCompleteTemplateDropdown();
				break;
		}
	}

	function scrollToCommitCompleteTemplateIndex(index: number): void {
		setTimeout(() => {
			const templateItem = document.querySelector(`.commit-complete-template-item-${index}`);
			if (templateItem) {
				templateItem.scrollIntoView({ block: "nearest" });
			}
		}, 0);
	}

	function clearCommitCompleteTemplateSearch(): void {
		commitCompleteTemplateSearchFilter = "";
		selectedCommitCompleteTemplateIndex = -1;
	}



	// Additional helper functions for templates
	function formatTemplateDate(dateString: string): string {
		try {
			const date = new Date(dateString);
			const now = new Date();
			const diffMs = now.getTime() - date.getTime();
			const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

			if (diffDays === 0) {
				return "Today";
			} else if (diffDays === 1) {
				return "Yesterday";
			} else if (diffDays < 7) {
				return `${diffDays} days ago`;
			} else if (diffDays < 30) {
				const weeks = Math.floor(diffDays / 7);
				return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
			} else if (diffDays < 365) {
				const months = Math.floor(diffDays / 30);
				return `${months} month${months > 1 ? 's' : ''} ago`;
			} else {
				const years = Math.floor(diffDays / 365);
				return `${years} year${years > 1 ? 's' : ''} ago`;
			}
		} catch (error) {
			return "Unknown date";
		}
	}


	async function startCommitProcess() {
		if (commitProcessStarted && currentPhase !== "loading") {
			return;
		}

		currentPhase = "loading";
		loadingMessage = "Fetching SVN status for selected branches...";
		loadingProgress = 0;

		try {
			const totalBranches = selectedBranchDetails.length;
			let files: FileEntry[] = [];

			for (let i = 0; i < selectedBranchDetails.length; i++) {
				const branch = selectedBranchDetails[i];
				loadingMessage = `Checking ${branch.branchVersion} (${i + 1}/${totalBranches})...`;
				loadingProgress = (i / totalBranches) * 100;

				try {
					const statusJson = await SVNStatusDetailed([branch.branchPath], false);

					let statusData;
					try {
						statusData = JSON.parse(statusJson);
					} catch (parseError) {
						throw new Error(`Failed to parse SVN status JSON: ${parseError.message}`);
					}

					// Process status data and extract files
					// Note: Go backend uses capitalized JSON keys (Target, Entry, Path)
					const targets = statusData.Target || statusData.target;
					if (targets && targets.length > 0) {
						for (const target of targets) {
							const entries = target.Entry || target.entry;
							if (entries && entries.length > 0) {
								for (const entry of entries) {
									// Handle both capitalized and lowercase field names
									const entryPath = entry.Path || entry.path;
									const wcStatus = entry.WCStatus || entry["wc-status"];
									const reposStatus = entry.ReposStatus || entry["repos-status"];

									// Improved path processing to handle Windows/Linux path separators
									const relativePath = getRelativePath(entryPath, branch.branchPath);
									const fileStatus = wcStatus?.Item || wcStatus?.item || "unknown";

									const shouldIgnore = shouldIgnoreFile(relativePath, fileStatus);

									if (!shouldIgnore) {
										// Detect if this is a directory using better heuristics
										// SVN typically shows directories without file extensions or as explicitly marked
										const lastPart = relativePath.split(/[\/\\]/).pop() || "";
										const isDirectory =
											// No extension and not a known file without extension
											!lastPart.includes(".") ||
											// Explicitly ends with directory separator
											relativePath.endsWith("/") ||
											relativePath.endsWith("\\") ||
											// Known directory names without extensions
											["src", "lib", "components", "utils", "assets", "build", "dist", "node_modules", "templates"].includes(lastPart.toLowerCase()) ||
											// If it's in our logs as a common directory structure
											/^(src|lib|components|utils|assets|build|dist|templates|js|css|img|images)$/i.test(lastPart);

										// Get file modification time from backend data
										let lastModified = "Unknown";
										if (entry.fileModTime && entry.fileModTime !== "Unknown") {
											try {
												// Parse RFC3339 timestamp from backend and format it for display
												const modTime = new Date(entry.fileModTime);
												lastModified = modTime.toLocaleString();
											} catch (error) {
												lastModified = entry.fileModTime; // Use raw value as fallback
											}
										}

										files.push({
											path: entryPath,
											status: fileStatus,
											propsStatus: wcStatus?.Props || wcStatus?.props || "normal",
											isConflicted: fileStatus === "conflicted",
											needsUpdate: (reposStatus?.Item || reposStatus?.item) === "modified",
											branchPath: branch.branchPath,
											branchFolder: branch.folderName,
											branchVersion: branch.branchVersion,
											lastPathSegment: branch.lastPathSegment,
											relativePath: relativePath,
											lastModified: lastModified,
											isDirectory: isDirectory,
										});
									}
								}
							}
						}

						// Deduplicate files by path to prevent Svelte key conflicts
						// But preserve directories - they can coexist with files of same path in SVN
						const uniqueFiles = new Map();
						files.forEach((file) => {
							const key = `${file.path}:${file.isDirectory ? "dir" : "file"}`;
							if (!uniqueFiles.has(key)) {
								uniqueFiles.set(key, file);
							}
						});
						files = Array.from(uniqueFiles.values());
					}
				} catch (error) {
					showError(`Failed to get status for ${branch.branchVersion}: ${error.message || error}`);

					// Continue with other branches even if one fails
					continue;
				}
			}

			allFiles = files;
			loadingProgress = 100;
			loadingMessage = `Status loading complete - found ${files.length} files`;

			// Move to selection phase
			window.setTimeout(() => {
				currentPhase = "selection";
			}, 500);
		} catch (error) {
			showError(`Failed to start commit process: ${error.message || error}`);

			// Provide recovery options
			currentPhase = "selection";
			loadingMessage = "Error occurred - showing available files";
			loadingProgress = 0;

			// If we have some files, show them anyway
			if (files.length > 0) {
				allFiles = files;
				showSuccess(`Showing ${files.length} files from successful branch checks`);
			}
		}
	}

	// Refresh SVN status without clearing commit variables or messages
	async function refreshSVNStatus() {
		if (refreshing || commitInProgress) {
			return;
		}

		refreshing = true;
		refreshMessage = "Fetching fresh SVN status...";

		try {
			const totalBranches = selectedBranchDetails.length;
			let files: FileEntry[] = [];

			for (let i = 0; i < selectedBranchDetails.length; i++) {
				const branch = selectedBranchDetails[i];
				refreshMessage = `Checking ${branch.branchVersion} (${i + 1}/${totalBranches})...`;

				try {
					const statusJson = await SVNStatusDetailed([branch.branchPath], false);

					let statusData;
					try {
						statusData = JSON.parse(statusJson);
					} catch (parseError) {
						throw new Error(`Failed to parse SVN status JSON: ${parseError.message}`);
					}

					// Process status data and extract files (reusing logic from startCommitProcess)
					const targets = statusData.Target || statusData.target;
					if (targets && targets.length > 0) {
						for (const target of targets) {
							const entries = target.Entry || target.entry;
							if (entries && entries.length > 0) {
								for (const entry of entries) {
									const entryPath = entry.Path || entry.path;
									const wcStatus = entry.WCStatus || entry["wc-status"];
									const reposStatus = entry.ReposStatus || entry["repos-status"];

									const relativePath = getRelativePath(entryPath, branch.branchPath);
									const fileStatus = wcStatus?.Item || wcStatus?.item || "unknown";

									const shouldIgnore = shouldIgnoreFile(relativePath, fileStatus);

									if (!shouldIgnore) {
										// Detect if this is a directory using better heuristics
										const lastPart = relativePath.split(/[\/\\]/).pop() || "";
										const isDirectory =
											!lastPart.includes(".") ||
											relativePath.endsWith("/") ||
											relativePath.endsWith("\\") ||
											["src", "lib", "components", "utils", "assets", "build", "dist", "node_modules", "templates"].includes(lastPart.toLowerCase()) ||
											/^(src|lib|components|utils|assets|build|dist|templates|js|css|img|images)$/i.test(lastPart);

										// Get file modification time from backend data
										let lastModified = "Unknown";
										if (entry.fileModTime && entry.fileModTime !== "Unknown") {
											try {
												const modTime = new Date(entry.fileModTime);
												lastModified = modTime.toLocaleString();
											} catch (error) {
												lastModified = entry.fileModTime;
											}
										}

										files.push({
											path: entryPath,
											status: fileStatus,
											propsStatus: wcStatus?.Props || wcStatus?.props || "normal",
											isConflicted: fileStatus === "conflicted",
											needsUpdate: (reposStatus?.Item || reposStatus?.item) === "modified",
											branchPath: branch.branchPath,
											branchFolder: branch.folderName,
											branchVersion: branch.branchVersion,
											lastPathSegment: branch.lastPathSegment,
											relativePath: relativePath,
											lastModified: lastModified,
											isDirectory: isDirectory,
										});
									}
								}
							}
						}

						// Deduplicate files by path to prevent Svelte key conflicts
						const uniqueFiles = new Map();
						files.forEach((file) => {
							const key = `${file.path}:${file.isDirectory ? "dir" : "file"}`;
							if (!uniqueFiles.has(key)) {
								uniqueFiles.set(key, file);
							}
						});
						files = Array.from(uniqueFiles.values());
					}
				} catch (error) {
					showError(`Failed to refresh status for ${branch.branchVersion}: ${error.message || error}`);
					continue;
				}
			}

			// Clear only the file lists and selection state, preserve everything else
			allFiles = files;
			stagedFiles = [];

			// Reset selection state
			selectedFileIndex = -1;
			selectedStagedFileIndex = -1;
			activeTable = null;

			// Clear search filter
			searchFilter = "";
			debouncedSearchFilter = "";

			refreshMessage = `Refresh complete - found ${files.length} files`;
			showSuccess(`Successfully refreshed SVN status - found ${files.length} files`);
		} catch (error) {
			showError(`Failed to refresh SVN status: ${error.message || error}`);
			refreshMessage = "Refresh failed";
		} finally {
			refreshing = false;

			// Clear the refresh message after a short delay
			setTimeout(() => {
				refreshMessage = "";
			}, 2000);
		}
	}

	function shouldIgnoreFile(relativePath: string, status: string): boolean {
		if (!appConfig) {
			return false;
		}

		// Determine the appropriate category for this file status
		const category = status === "unversioned" || status === "missing" ? "unknown" : "modified";

		try {
			const isIgnored = appConfig.isPathIgnored(relativePath, category);
			return isIgnored;
		} catch (error) {
			// If there's an error in the ignore logic, don't ignore the file
			return false;
		}
	}

	// Optimized search filters with debouncing for performance
	// Direct binding for immediate visual feedback
	// Debounced values for expensive computations
	let debouncedSearchFilter = $state("");
	let filterDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Loading state for filter operations
	let filterPending = $derived(searchFilter !== debouncedSearchFilter);

	// Efficient debouncing using Svelte's $effect
	$effect(() => {
		// Capture current value
		const currentSearch = searchFilter;

		// Clear existing timer
		if (filterDebounceTimer) {
			clearTimeout(filterDebounceTimer);
		}

		// Set new timer - 150ms is optimal for typing speed vs responsiveness
		filterDebounceTimer = setTimeout(() => {
			debouncedSearchFilter = currentSearch;
			filterDebounceTimer = null;
		}, 150);

		// Cleanup function
		return () => {
			if (filterDebounceTimer) {
				clearTimeout(filterDebounceTimer);
				filterDebounceTimer = null;
			}
		};
	});

	// Helper function to check if a file matches any of the comma-separated search terms
	function matchesSearchTerms(file: FileEntry, searchFilter: string): boolean {
		if (!searchFilter.trim()) return true;

		// Split by comma and trim each term
		const searchTerms = searchFilter.split(',').map(term => term.trim()).filter(term => term.length > 0);

		// Prepare searchable fields from the file
		const searchableFields = [
			file.path,
			file.relativePath,
			file.branchVersion,
			file.branchFolder,
			file.status,
			file.propsStatus || '',
			file.lastPathSegment,
			file.lastModified || ''
		];

		// Check if file matches ANY search term (OR logic)
		return searchTerms.some(term => {
			// Try to use term as regex pattern
			try {
				const regex = new RegExp(term, 'i'); // case-insensitive
				return searchableFields.some(field => regex.test(field));
			} catch (e) {
				// If regex fails, fall back to literal string matching (case-insensitive)
				const lowerTerm = term.toLowerCase();
				return searchableFields.some(field => field.toLowerCase().includes(lowerTerm));
			}
		});
	}

	// Filtered and sorted files for display
	let filteredFiles = $derived.by(() => {
		let files = allFiles;

		// Apply search filter if present
		if (debouncedSearchFilter.trim()) {
			files = files.filter((file) => matchesSearchTerms(file, debouncedSearchFilter));
		}

		// Exclude files that are already staged
		files = files.filter((file) => {
			return !stagedFiles.some((stagedFile) => stagedFile.path === file.path && stagedFile.branchPath === file.branchPath);
		});

		// Sort files using toSorted() to avoid mutation in derived context
		const sortedFiles = [...files].sort((a, b) => {
			let compareValue = 0;

			switch (sortColumn) {
				case "path":
					compareValue = naturalCompare(a.relativePath, b.relativePath);
					break;
				case "status":
					compareValue = naturalCompare(a.status, b.status);
					break;
				case "branch":
					compareValue = naturalCompare(`${a.branchFolder} ${a.branchVersion}`, `${b.branchFolder} ${b.branchVersion}`);
					break;
				case "modified":
					compareValue = naturalCompare(a.lastModified || "", b.lastModified || "");
					break;
			}

			return sortDirection === "asc" ? compareValue : -compareValue;
		});

		return sortedFiles;
	});

	// Filtered staged files for display
	let filteredStagedFiles = $derived.by(() => {
		let files = stagedFiles;

		// Apply search filter if present
		if (debouncedSearchFilter.trim()) {
			files = files.filter((file) => matchesSearchTerms(file, debouncedSearchFilter));
		}

		// Sort files using toSorted() to avoid mutation in derived context
		const sortedFiles = [...files].sort((a, b) => {
			let compareValue = 0;

			switch (sortColumn) {
				case "path":
					compareValue = naturalCompare(a.relativePath, b.relativePath);
					break;
				case "status":
					compareValue = naturalCompare(a.status, b.status);
					break;
				case "branch":
					compareValue = naturalCompare(`${a.branchFolder} ${a.branchVersion}`, `${b.branchFolder} ${b.branchVersion}`);
					break;
				case "modified":
					compareValue = naturalCompare(a.lastModified || "", b.lastModified || "");
					break;
			}

			return sortDirection === "asc" ? compareValue : -compareValue;
		});

		return sortedFiles;
	});

	// Helper function to determine if a file is selectable (not disabled due to conflicts or needing changes)
	function isFileSelectable(file: FileEntry): boolean {
		return !(file.isConflicted || file.needsUpdate);
	}

	// Sort files by dependency (directories first, then files)
	function sortFilesByDependency(files: FileEntry[]): FileEntry[] {
		return [...files].sort((a, b) => {
			// Directories come before files
			if (a.isDirectory && !b.isDirectory) return -1;
			if (!a.isDirectory && b.isDirectory) return 1;

			// Then sort by path depth (parent directories before subdirectories)
			const depthA = a.relativePath.split(/[/\\]/).length;
			const depthB = b.relativePath.split(/[/\\]/).length;

			if (depthA !== depthB) {
				return depthA - depthB;
			}

			// Finally sort lexicographically
			return a.relativePath.localeCompare(b.relativePath);
		});
	}

	// Find missing parent directories and automatically include them for staging
	function findAndIncludeMissingParents(files: FileEntry[]): FileEntry[] {
		const allFilesToStage = [...files];
		const pathSet = new Set(files.map((f) => f.path));
		const parentsToAdd: FileEntry[] = [];

		for (const file of files) {
			if (file.status === "unversioned") {
				// Check if all parent directories of this file are available and need to be included
				let currentPath = file.path;
				let parentPath = currentPath.substring(0, currentPath.lastIndexOf(currentPath.includes("/") ? "/" : "\\"));

				while (parentPath && parentPath !== file.branchPath) {
					// Check if parent directory is already in our staging list
					const parentInStaging = pathSet.has(parentPath);

					if (!parentInStaging) {
						// Check if parent directory is available in allFiles and is unversioned
						const parentInAllFiles = allFiles.find((f) => f.path === parentPath);

						if (parentInAllFiles && parentInAllFiles.status === "unversioned") {
							// Parent is available and unversioned - include it for staging
							if (!parentsToAdd.some((p) => p.path === parentPath)) {
								parentsToAdd.push(parentInAllFiles);
								pathSet.add(parentPath); // Add to set to avoid duplicates
							}
						}
					}

					// Move up to the next parent
					currentPath = parentPath;
					parentPath = currentPath.substring(0, currentPath.lastIndexOf(currentPath.includes("/") ? "/" : "\\"));
				}
			}
		}

		// Add parent directories at the beginning (they should be processed first)
		return [...parentsToAdd, ...allFilesToStage];
	}

	// Interface for unstaging conflict detection
	interface UnstageConflict {
		hasConflicts: boolean;
		affectedChildren: FileEntry[];
		warnings: string[];
		canProceed: boolean;
	}

	// Detect directory dependency conflicts when unstaging
	function detectDirectoryDependencyConflicts(directoryFile: FileEntry): UnstageConflict {
		const result: UnstageConflict = {
			hasConflicts: false,
			affectedChildren: [],
			warnings: [],
			canProceed: true,
		};

		// Only check directories that are added or deleted
		if (!directoryFile.isDirectory || (directoryFile.status !== "added" && directoryFile.status !== "deleted")) {
			return result;
		}

		// Find all children of this directory in staged files
		const children = stagedFiles.filter((file) => {
			// Check if file is a child of the directory being unstaged
			return file.path !== directoryFile.path && file.path.startsWith(directoryFile.path) && file.branchPath === directoryFile.branchPath;
		});

		if (children.length === 0) {
			return result;
		}

		// Check for problematic combinations
		if (directoryFile.status === "added") {
			// If directory is being unstaged from "added", child files with "added" status will become invalid
			const addedChildren = children.filter((child) => child.status === "added");
			if (addedChildren.length > 0) {
				result.hasConflicts = true;
				result.affectedChildren = addedChildren;
				result.warnings.push(`Unstaging this directory will make ${addedChildren.length} added child file${addedChildren.length !== 1 ? "s" : ""} invalid for commit.`);
				result.warnings.push("SVN requires parent directories to be added before their children can be committed.");
			}
		}

		if (directoryFile.status === "deleted") {
			// If directory is being unstaged from "deleted", child files with "deleted" status may become inconsistent
			const deletedChildren = children.filter((child) => child.status === "deleted");
			if (deletedChildren.length > 0) {
				result.hasConflicts = true;
				result.affectedChildren = [...result.affectedChildren, ...deletedChildren];
				result.warnings.push(`Unstaging this directory will leave ${deletedChildren.length} deleted child file${deletedChildren.length !== 1 ? "s" : ""} without their parent directory being deleted.`);
				result.warnings.push("This may create an inconsistent state in the repository.");
			}
		}

		// Check for mixed statuses that could cause issues
		const mixedStatusChildren = children.filter((child) => (directoryFile.status === "added" && child.status === "deleted") || (directoryFile.status === "deleted" && child.status === "added"));

		if (mixedStatusChildren.length > 0) {
			result.hasConflicts = true;
			result.affectedChildren = [...result.affectedChildren, ...mixedStatusChildren];
			result.warnings.push(`Found ${mixedStatusChildren.length} child file${mixedStatusChildren.length !== 1 ? "s" : ""} with conflicting operations.`);
		}

		return result;
	}

	// Get children of a directory from staged files

	// Validate SVN commit dependencies comprehensively
	function validateSVNCommitDependencies(files: FileEntry[]): { isValid: boolean; errors: string[]; warnings: string[] } {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Group files by branch path for easier processing
		const branchGroups = new Map<string, FileEntry[]>();
		files.forEach((file) => {
			if (!branchGroups.has(file.branchPath)) {
				branchGroups.set(file.branchPath, []);
			}
			branchGroups.get(file.branchPath)!.push(file);
		});

		// Check each branch independently
		branchGroups.forEach((branchFiles, branchPath) => {
			const addedFiles = branchFiles.filter((f) => f.status === "added");
			const deletedFiles = branchFiles.filter((f) => f.status === "deleted");

			// Check for added files without required parent directories
			addedFiles.forEach((file) => {
				if (!file.isDirectory) {
					// Check if all parent directories are either:
					// 1. Already versioned (not in the added files list)
					// 2. Also being added in this commit
					const parentPath = file.path.substring(0, file.path.lastIndexOf(file.path.includes("/") ? "/" : "\\"));

					// Find if parent directory is in the added files
					const parentInAdded = addedFiles.some((parent) => parent.isDirectory && parent.path === parentPath);

					// If parent is not in added files, check if it exists in all files (could be already versioned)
					if (!parentInAdded && parentPath && parentPath !== branchPath) {
						const parentInAllFiles = allFiles.some((f) => f.path === parentPath && f.branchPath === branchPath);

						// If parent doesn't exist at all, this could be a problem
						if (!parentInAllFiles) {
							warnings.push(`File ${file.relativePath} is being added but its parent directory may not exist in version control.`);
						}
					}
				}
			});

			// Check for deleted directories with remaining children
			deletedFiles.forEach((file) => {
				if (file.isDirectory) {
					// Check if there are any non-deleted children
					const nonDeletedChildren = branchFiles.filter((child) => child.path.startsWith(file.path) && child.path !== file.path && child.status !== "deleted");

					if (nonDeletedChildren.length > 0) {
						errors.push(`Cannot delete directory ${file.relativePath} while it contains ${nonDeletedChildren.length} non-deleted file${nonDeletedChildren.length !== 1 ? "s" : ""}.`);
					}
				}
			});
		});

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	// State for unstage warning dialog
	let showUnstageWarningDialog = $state(false);
	let unstageConflictInfo = $state<UnstageConflict | null>(null);
	let fileBeingUnstaged = $state<FileEntry | null>(null);

	// Helper function to check if a file has dependency conflicts (for UI indicators)
	function hasUnstageConflicts(file: FileEntry): boolean {
		if (!file.isDirectory || (file.status !== "added" && file.status !== "deleted")) {
			return false;
		}
		const conflicts = detectDirectoryDependencyConflicts(file);
		return conflicts.hasConflicts;
	}

	// Update file status after SVN operations
	async function updateFileStatusAfterSVNOperation(files: FileEntry[], operation: "add" | "delete" | "revert"): Promise<FileEntry[]> {
		const updatedFiles: FileEntry[] = [];

		// For revert operations, get actual SVN status for accuracy
		if (operation === "revert") {
			try {
				const filePaths = files.map((f) => f.path);
				const freshStatus = await getActualSVNStatus(filePaths);

				// Match fresh status with original files
				for (const file of files) {
					const freshFile = freshStatus.find((f) => f.path === file.path);
					if (freshFile) {
						// Use the fresh status from SVN
						updatedFiles.push({
							...file,
							status: freshFile.status,
							propsStatus: freshFile.propsStatus,
							isConflicted: freshFile.isConflicted,
							lastModified: "Just reverted",
						});
					} else {
						// File not found in SVN status, likely removed
						// Don't include it in the updated files list
						continue;
					}
				}
			} catch (error) {
				console.error("Failed to get actual SVN status after revert:", error);
				// Fallback to simple status mapping for revert
				for (const file of files) {
					let newStatus = file.status;
					if (file.status === "added") {
						newStatus = "unversioned";
					} else if (file.status === "deleted") {
						newStatus = "normal";
					} else if (file.status === "modified") {
						newStatus = "normal";
					}

					updatedFiles.push({
						...file,
						status: newStatus,
						lastModified: "Just reverted",
					});
				}
			}
		} else {
			// For add and delete operations, use simple status mapping
			for (const file of files) {
				let newStatus = file.status;

				switch (operation) {
					case "add":
						if (file.status === "unversioned") {
							newStatus = "added";
						}
						break;
					case "delete":
						if (file.status === "missing") {
							newStatus = "deleted";
						}
						break;
				}

				updatedFiles.push({
					...file,
					status: newStatus,
					lastModified: "Just updated",
				});
			}
		}

		return updatedFiles;
	}

	// Get fresh status from SVN for accurate state after operations
	async function getActualSVNStatus(filePaths: string[]): Promise<FileEntry[]> {
		try {
			const statusJson = await SVNStatusForPaths(filePaths);
			const statusData = JSON.parse(statusJson);
			const freshFiles: FileEntry[] = [];

			const targets = statusData.Target || statusData.target;
			if (targets && targets.length > 0) {
				for (const target of targets) {
					const entries = target.Entry || target.entry;
					if (entries && entries.length > 0) {
						for (const entry of entries) {
							const entryPath = entry.Path || entry.path;
							const wcStatus = entry.WCStatus || entry["wc-status"];
							const fileStatus = wcStatus?.Item || wcStatus?.item || "unknown";

							// Find the corresponding branch information
							const branchDetail = selectedBranchDetails.find((b) => entryPath.startsWith(b.branchPath));
							if (branchDetail) {
								const relativePath = getRelativePath(entryPath, branchDetail.branchPath);
								const lastPart = relativePath.split(/[/\\]/).pop() || "";
								const isDirectory = !lastPart.includes(".") || relativePath.endsWith("/") || relativePath.endsWith("\\");

								freshFiles.push({
									path: entryPath,
									status: fileStatus,
									propsStatus: wcStatus?.Props || wcStatus?.props || "normal",
									isConflicted: fileStatus === "conflicted",
									needsUpdate: false,
									branchPath: branchDetail.branchPath,
									branchFolder: branchDetail.folderName,
									branchVersion: branchDetail.branchVersion,
									lastPathSegment: branchDetail.lastPathSegment,
									relativePath: relativePath,
									lastModified: "Fresh from SVN",
									isDirectory: isDirectory,
								});
							}
						}
					}
				}
			}

			return freshFiles;
		} catch (error) {
			console.error("Failed to get actual SVN status:", error);
			return [];
		}
	}

	// Refresh staged files with actual SVN status after operations
	async function refreshStagedFilesFromSVN(operatedPaths: string[]) {
		try {
			// Get fresh status for the paths we operated on
			const statusJson = await SVNStatusForPaths(operatedPaths);
			const statusData = JSON.parse(statusJson);

			// Process the status data and extract files that are now properly staged
			const targets = statusData.Target || statusData.target;
			if (targets && targets.length > 0) {
				const freshFiles: FileEntry[] = [];
				const updatedExistingFiles: FileEntry[] = [];

				for (const target of targets) {
					const entries = target.Entry || target.entry;
					if (entries && entries.length > 0) {
						for (const entry of entries) {
							const entryPath = entry.Path || entry.path;
							const wcStatus = entry.WCStatus || entry["wc-status"];
							const fileStatus = wcStatus?.Item || wcStatus?.item || "unknown";

							// Find the corresponding branch information
							const branchDetail = selectedBranchDetails.find((b) => entryPath.startsWith(b.branchPath));
							if (!branchDetail) continue;

							const relativePath = getRelativePath(entryPath, branchDetail.branchPath);
							const lastPart = relativePath.split(/[/\\]/).pop() || "";
							const isDirectory = !lastPart.includes(".") || relativePath.endsWith("/") || relativePath.endsWith("\\");

							// Check if this file is already in our staged files
							const existingStagedIndex = stagedFiles.findIndex((f) => f.path === entryPath);
							const existingSelectionIndex = allFiles.findIndex((f) => f.path === entryPath && !stagedFiles.some((sf) => sf.path === f.path));

							if (existingStagedIndex !== -1) {
								// Update existing staged file status
								const updatedFile = {
									...stagedFiles[existingStagedIndex],
									status: fileStatus,
									propsStatus: wcStatus?.Props || wcStatus?.props || "normal",
									isConflicted: fileStatus === "conflicted",
									lastModified: "Just updated",
								};
								updatedExistingFiles.push(updatedFile);
							} else if (existingSelectionIndex !== -1 && (fileStatus === "added" || fileStatus === "deleted" || fileStatus === "modified")) {
								// File was in allFiles but not staged - move it to staged
								const fileToMove = {
									...allFiles[existingSelectionIndex],
									status: fileStatus,
									propsStatus: wcStatus?.Props || wcStatus?.props || "normal",
									isConflicted: fileStatus === "conflicted",
									lastModified: "Just updated",
								};
								freshFiles.push(fileToMove);

								// File will be automatically excluded from selection view since it's now in stagedFiles
							} else if (fileStatus === "added" || fileStatus === "deleted" || fileStatus === "modified") {
								// New file that should be staged (e.g., parent directory added by --parents)
								freshFiles.push({
									path: entryPath,
									status: fileStatus,
									propsStatus: wcStatus?.Props || wcStatus?.props || "normal",
									isConflicted: fileStatus === "conflicted",
									needsUpdate: false,
									branchPath: branchDetail.branchPath,
									branchFolder: branchDetail.folderName,
									branchVersion: branchDetail.branchVersion,
									lastPathSegment: branchDetail.lastPathSegment,
									relativePath: relativePath,
									lastModified: "Just updated",
									isDirectory: isDirectory,
								});
							}
						}
					}
				}

				// Update existing staged files with new status
				if (updatedExistingFiles.length > 0) {
					stagedFiles = stagedFiles.map((stagedFile) => {
						const updatedFile = updatedExistingFiles.find((uf) => uf.path === stagedFile.path);
						return updatedFile || stagedFile;
					});
				}

				// Add new staged files
				if (freshFiles.length > 0) {
					stagedFiles = [...stagedFiles, ...freshFiles];
				}

				// Update allFiles array to reflect all changes
				const allUpdatedFiles = [...updatedExistingFiles, ...freshFiles];
				if (allUpdatedFiles.length > 0) {
					allFiles = allFiles.map((allFile) => {
						const updatedFile = allUpdatedFiles.find((uf) => uf.path === allFile.path);
						return updatedFile || allFile;
					});

					const totalUpdated = updatedExistingFiles.length + freshFiles.length;
					if (totalUpdated > 0) {
						showSuccess(`Refreshed staging area: ${updatedExistingFiles.length} updated, ${freshFiles.length} newly staged`);
					}
				}
			}
		} catch (error) {
			console.error("Failed to refresh staged files:", error);
			// Don't show error to user as this is a background operation
		}
	}

	async function processSpecialFiles(files: FileEntry[]) {
		const filesToAdd: string[] = [];
		const filesToDelete: string[] = [];

		// Automatically find and include missing parent directories for unversioned files
		const filesWithParents = findAndIncludeMissingParents(files);

		// Sort files by dependency (directories first, then files)
		const sortedFiles = sortFilesByDependency(filesWithParents);

		// Count how many parent directories were automatically included
		const originalFileCount = files.length;
		const addedParentCount = sortedFiles.length - originalFileCount;

		sortedFiles.forEach((file) => {
			if (file.status === "unversioned") {
				filesToAdd.push(file.path);
			} else if (file.status === "missing") {
				filesToDelete.push(file.path);
			}
		});

		try {
			let operationCount = 0;
			let operationResults: string[] = [];
			let updatedFiles: FileEntry[] = [];

			// Process additions first (enhanced with line ending normalization, --parents, keywords, and eol-style)
			if (filesToAdd.length > 0) {
				const filesToAddEntries = sortedFiles.filter((f) => f.status === "unversioned");
				const addResult = await SVNAddWithKeywordsAndEOL(filesToAdd);
				operationResults.push(addResult);
				operationCount += filesToAdd.length;

				// Update file status for added files
				const addedFilesUpdated = await updateFileStatusAfterSVNOperation(filesToAddEntries, "add");
				updatedFiles.push(...addedFilesUpdated);

				// Parse the result to provide better user feedback
				const resultLines = addResult.split("\n");
				const normalizedFiles = resultLines.find((line) => line.includes("Normalized line endings"));
				const keywordFiles = resultLines.find((line) => line.includes("Set keywords"));
				const eolFiles = resultLines.find((line) => line.includes("Set eol-style"));

				let message = `Added ${filesToAdd.length} files to version control`;
				if (addedParentCount > 0) {
					message += ` (including ${addedParentCount} parent directories)`;
				}
				if (normalizedFiles) {
					message += ` (fixed line endings)`;
				}
				if (keywordFiles && eolFiles) {
					message += ` with properties`;
				}

				showSuccess(message);
			}

			// Process deletions
			if (filesToDelete.length > 0) {
				const filesToDeleteEntries = sortedFiles.filter((f) => f.status === "missing");
				const deleteResult = await SVNDelete(filesToDelete);
				operationResults.push(deleteResult);
				operationCount += filesToDelete.length;

				// Update file status for deleted files
				const deletedFilesUpdated = await updateFileStatusAfterSVNOperation(filesToDeleteEntries, "delete");
				updatedFiles.push(...deletedFilesUpdated);

				showSuccess(`Marked ${filesToDelete.length} files for deletion`);
			}

			// Update the staged files with the new status
			if (updatedFiles.length > 0) {
				// Update stagedFiles array with the new status
				stagedFiles = stagedFiles.map((stagedFile) => {
					const updatedFile = updatedFiles.find((uf) => uf.path === stagedFile.path);
					return updatedFile ? updatedFile : stagedFile;
				});

				// Also update allFiles array to reflect the changes
				allFiles = allFiles.map((allFile) => {
					const updatedFile = updatedFiles.find((uf) => uf.path === allFile.path);
					return updatedFile ? updatedFile : allFile;
				});
			}

			// Get fresh status from SVN for verification and to detect any additional files added by --parents
			if (operationCount > 0) {
				// Include all processed files (including parent directories that were automatically added)
				const allProcessedPaths = sortedFiles.map((f) => f.path);
				await refreshStagedFilesFromSVN(allProcessedPaths);
			}
		} catch (error) {
			console.error("Failed to process special files:", error);

			// Check for specific line ending errors and provide helpful messages
			const errorMessage = error.message || error.toString();
			if (errorMessage.includes("inconsistent newlines") || errorMessage.includes("Inconsistent line ending")) {
				showError(`Line ending error: Some files have mixed line endings that couldn't be automatically fixed. Please check the file manually and ensure consistent line endings (Windows: CRLF, Unix/Mac: LF).`);
			} else if (errorMessage.includes("line ending error")) {
				showError(`Line ending issue detected. The file may need manual correction of line endings before it can be added to SVN.`);
			} else {
				showError(`Failed to process some files for version control: ${errorMessage}`);
			}
		}
	}

	// New movement functions for arrow button functionality
	function moveFileToStaged(file: FileEntry) {
		// Add file to staged files if not already staged
		const isAlreadyStaged = stagedFiles.some((f) => f.path === file.path && f.branchPath === file.branchPath);
		if (!isAlreadyStaged) {
			stagedFiles = [...stagedFiles, file];
			// Process special cases (unversioned -> add, missing -> delete)
			processSpecialFiles([file]);
		}
	}

	async function moveFileToSelection(file: FileEntry) {
		// Check for directory dependency conflicts before unstaging
		if (file.isDirectory && (file.status === "added" || file.status === "deleted")) {
			const conflicts = detectDirectoryDependencyConflicts(file);

			if (conflicts.hasConflicts) {
				// Store the conflict info and file for the dialog
				unstageConflictInfo = conflicts;
				fileBeingUnstaged = file;
				showUnstageWarningDialog = true;
				return; // Don't proceed with unstaging yet
			}
		}

		// Proceed with unstaging (either no conflicts or user confirmed)
		await performUnstaging(file);
	}

	// Perform the actual unstaging operation
	async function performUnstaging(file: FileEntry) {
		// Remove file from staged files first
		stagedFiles = stagedFiles.filter((f) => f !== file);

		// Handle special cases - revert add/delete operations for files that were processed by SVN
		if (file.status === "added" || file.status === "deleted") {
			try {
				await SVNRevert([file.path]);

				// Update file status after successful revert
				const revertedFiles = await updateFileStatusAfterSVNOperation([file], "revert");

				if (revertedFiles.length > 0) {
					const revertedFile = revertedFiles[0];

					// Update the file in allFiles array
					allFiles = allFiles.map((f) => (f.path === file.path ? revertedFile : f));

					// For better accuracy, get fresh SVN status
					const freshStatus = await getActualSVNStatus([file.path]);
					if (freshStatus.length > 0) {
						const freshFile = freshStatus[0];
						allFiles = allFiles.map((f) => (f.path === file.path ? freshFile : f));
					}

					showSuccess(`Reverted ${file.relativePath} - status: ${revertedFile.status}`);
				}
			} catch (error) {
				console.error("Failed to revert file:", error);
				showError(`Failed to revert ${file.relativePath}: ${error.message || error}`);

				// If revert failed, add the file back to staged files
				stagedFiles = [...stagedFiles, file];
			}
		}
		// For files that were never processed by SVN (still original status), no revert needed
	}

	// Handle unstaging with children when user chooses this option
	async function performUnstageWithChildren(file: FileEntry) {
		if (!unstageConflictInfo) return;

		const allFilesToUnstage = [file, ...unstageConflictInfo.affectedChildren];

		// Unstage all files
		for (const fileToUnstage of allFilesToUnstage) {
			await performUnstaging(fileToUnstage);
		}

		showSuccess(`Unstaged ${file.relativePath} and ${unstageConflictInfo.affectedChildren.length} child files`);
		closeUnstageWarningDialog();
	}

	// Close the unstage warning dialog
	function closeUnstageWarningDialog() {
		showUnstageWarningDialog = false;
		unstageConflictInfo = null;
		fileBeingUnstaged = null;
	}

	// Confirm unstaging despite warnings
	async function confirmUnstaging() {
		if (fileBeingUnstaged) {
			await performUnstaging(fileBeingUnstaged);
			closeUnstageWarningDialog();
		}
	}

	function moveAllVisibleToStaged() {
		const selectableFiles = filteredFiles.filter(isFileSelectable);
		selectableFiles.forEach((file) => {
			const isAlreadyStaged = stagedFiles.some((f) => f.path === file.path && f.branchPath === file.branchPath);
			if (!isAlreadyStaged) {
				stagedFiles = [...stagedFiles, file];
			}
		});
		// Process special cases for all files at once
		processSpecialFiles(selectableFiles);
	}

	async function moveAllVisibleToSelection() {
		const selectableFiles = filteredStagedFiles.filter(isFileSelectable);
		const filesToRevert = selectableFiles.filter((f) => f.status === "added" || f.status === "deleted");

		// Remove all files from staged first
		selectableFiles.forEach((file) => {
			stagedFiles = stagedFiles.filter((f) => f !== file);
		});

		// Handle revert operations for files that were processed by SVN
		if (filesToRevert.length > 0) {
			try {
				const pathsToRevert = filesToRevert.map((f) => f.path);
				await SVNRevert(pathsToRevert);

				// Update file status after successful revert
				const revertedFiles = await updateFileStatusAfterSVNOperation(filesToRevert, "revert");

				// Update allFiles array with reverted status
				if (revertedFiles.length > 0) {
					allFiles = allFiles.map((allFile) => {
						const revertedFile = revertedFiles.find((rf) => rf.path === allFile.path);
						return revertedFile ? revertedFile : allFile;
					});

					// Get fresh SVN status for better accuracy
					const freshStatus = await getActualSVNStatus(pathsToRevert);
					if (freshStatus.length > 0) {
						allFiles = allFiles.map((allFile) => {
							const freshFile = freshStatus.find((fs) => fs.path === allFile.path);
							return freshFile ? freshFile : allFile;
						});
					}
				}

				showSuccess(`Reverted ${filesToRevert.length} files back to selection`);
			} catch (error) {
				console.error("Failed to revert files:", error);
				showError(`Failed to revert some files: ${error.message || error}`);

				// If revert failed, add the files back to staged
				filesToRevert.forEach((file) => {
					stagedFiles = [...stagedFiles, file];
				});
			}
		}
	}

	function addVariableColumn() {
		// Reset dialog state
		newVariableName = "";
		newVariableDescription = "";
		newVariableDefaultValue = "";
		showAddVariableDialog = true;
	}

	async function saveNewVariable() {
		if (!appConfig) {
			showError("App configuration not available");
			return;
		}

		const trimmedName = newVariableName.trim();
		const trimmedDescription = newVariableDescription.trim();
		const trimmedDefaultValue = newVariableDefaultValue.trim();

		if (!trimmedName) {
			showError("Variable name cannot be empty");
			return;
		}

		// Check for duplicate names
		const existingVariables = appConfig.getCommitVariables();
		if (existingVariables.some((v) => v.name === trimmedName)) {
			showError(`Variable name "${trimmedName}" already exists`);
			return;
		}

		try {
			isAddingVariable = true;

			// Add to app config
			await appConfig.addCommitVariable(trimmedName, trimmedDefaultValue, trimmedDescription, newVariableRequired);

			// Create new column for the UI
			const values: Record<string, string> = {};
			// Initialize UI values for current folders (these will be saved when user actually changes them)
			uniqueFolderDetails.forEach((branch) => {
				// Get any existing saved value, or use default value
				const savedValues = getCommitVariableValues(branch.folderName);
				values[branch.folderName] = (savedValues[trimmedName] || trimmedDefaultValue).trim();
			});

			const newColumn: VariableColumn = {
				id: crypto.randomUUID(),
				name: trimmedName,
				description: trimmedDescription,
				defaultValue: trimmedDefaultValue,
				required: newVariableRequired,
				values: values,
			};

			// Add to the local array
			variableColumns = [...variableColumns, newColumn];

			// Close dialog and show success
			showAddVariableDialog = false;
			// Reset form fields
			newVariableName = "";
			newVariableDescription = "";
			newVariableDefaultValue = "";
			newVariableRequired = false;
			showSuccess(`Variable "${trimmedName}" added successfully`);
		} catch (error) {
			console.error("Failed to add variable:", error);
			showError(`Failed to add variable: ${error}`);
		} finally {
			isAddingVariable = false;
		}
	}

	function cancelAddVariable() {
		showAddVariableDialog = false;
		newVariableName = "";
		newVariableDescription = "";
		newVariableDefaultValue = "";
		newVariableRequired = false;
	}

	async function removeVariableColumn(columnId: string) {
		const column = variableColumns.find((col) => col.id === columnId);
		if (!column || !appConfig) return;

		const confirmed = await showDanger(`Remove Variable "${column.name}"?`, `This will permanently remove the variable "${column.name}" from your configuration. This action cannot be undone.`, "Remove");

		if (confirmed) {
			try {
				// Remove from app config first
				await appConfig.removeCommitVariable(column.name);

				// Force UI update by manually removing from local array
				// This ensures immediate UI feedback while the reactive effect catches up
				variableColumns = variableColumns.filter((col) => col.id !== columnId);

				showSuccess(`Variable "${column.name}" removed successfully`);
			} catch (error) {
				console.error("Failed to remove variable:", error);
				showError(`Failed to remove variable: ${error}`);
			}
		}
	}

	// WebSocket message sending with error handling
	let wsUpdateTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

	function updateVariableValue(columnId: string, branchFolder: string, value: string) {
		const column = variableColumns.find((col) => col.id === columnId);
		if (!column) {
			return;
		}

		column.values[branchFolder] = value.trim();

		// Save to session store (not persisted to disk)
		setCommitVariableValue(branchFolder, column.name, value.trim());

		// Debounce WebSocket updates to avoid spam
		const timeoutKey = `${branchFolder}-${columnId}`;
		if (wsUpdateTimeouts.has(timeoutKey)) {
			clearTimeout(wsUpdateTimeouts.get(timeoutKey));
		}

		const timeoutId = window.setTimeout(() => {
			// Broadcast to other clients via WebSocket
			if (ws && ws.readyState === WebSocket.OPEN) {
				const branchPath = selectedBranchDetails.find((b) => b.folderName === branchFolder)?.branchPath;
				if (branchPath) {
					const variables = Object.fromEntries(variableColumns.map((col) => [col.name, col.values[branchFolder] || col.defaultValue]));

					try {
						ws.send(
							JSON.stringify({
								command: "commit:variables:update",
								branchPath: branchPath,
								variables: variables,
								timestamp: Date.now(),
							})
						);
					} catch (error) {
						// Silently fail if WebSocket send fails
					}
				}
			}

			wsUpdateTimeouts.delete(timeoutKey);
		}, 500);

		wsUpdateTimeouts.set(timeoutKey, timeoutId);
	}

	// Process all variables for a specific branch (custom variables: $t{variableName}, special variables: $t{{specialVariable}})
	function processSpecialVariablesForBranch(message: string, branchFolder: string, branchVersion: string): string {
		let processedMessage = message;

		// First, process custom variables (single braces syntax: $t{variableName})
		// Get variables for this specific branch folder
		const branchVariables: Record<string, string> = {};
		variableColumns.forEach((col) => {
			const value = col.values[branchFolder] || col.defaultValue || "";
			branchVariables[col.name] = value;
		});

		// Replace custom variable placeholders in the format $t{variableName}
		processedMessage = processedMessage.replace(/\$t\{([^}]+)\}/g, (match, variableName) => {
			// Check if the variable exists in branchVariables
			// Return its value even if it's empty string (for optional variables)
			// Only return empty string for non-existent variables (typos, removed variables)
			return variableName in branchVariables ? branchVariables[variableName] : "";
		});

		// Then, replace built-in special variables with branch-specific values (double braces syntax: $t{{specialVariable}})
		processedMessage = processedMessage.replace(/\$t\{\{branchFolder\}\}/g, branchFolder);
		processedMessage = processedMessage.replace(/\$t\{\{branchVersion\}\}/g, branchVersion);

		return processedMessage;
	}

	// Function to sanitize commit message input (replace backticks, quotes, and handle newlines)
	function sanitizeCommitMessage(message: string): string {
		return message
			.replace(/`/g, "'") // Replace backticks with single quotes
			.replace(/"/g, "'") // Replace double quotes with single quotes
			.replace(/\r\n|\r|\n/g, "; ") // Replace all types of newlines with "; "
			.replace(/;\s*;\s*/g, "; ") // Clean up multiple consecutive semicolons (e.g., ";; " becomes "; ")
			.replace(/;\s+/g, "; ") // Normalize semicolon spacing (e.g., ";   " becomes "; ")
			.replace(/\s+;/g, ";") // Remove spaces before semicolons (e.g., " ;" becomes ";")
			.replace(/;+\s*$/g, "") // Remove trailing semicolons
			.trim(); // Remove leading/trailing whitespace
	}

	// Comprehensive validation function for commit readiness
	function validateCommitReadiness(): { isValid: boolean; error?: string } {
		// 1. Check if any files are staged
		if (stagedFiles.length === 0) {
			return { isValid: false, error: "No files staged for commit" };
		}

		// 2. Check if commit message is provided
		if (!commitMessageInput.trim()) {
			return { isValid: false, error: "Commit message is required" };
		}

		// 3. Validate file states - check for conflicts or files needing updates
		const problematicFiles = stagedFiles.filter((file) => !isFileSelectable(file));
		if (problematicFiles.length > 0) {
			const conflictedFiles = problematicFiles.filter((f) => f.isConflicted);
			const outdatedFiles = problematicFiles.filter((f) => f.needsUpdate);

			if (conflictedFiles.length > 0) {
				return {
					isValid: false,
					error: `Cannot commit files with conflicts: ${conflictedFiles.map((f) => f.relativePath).join(", ")}. Please resolve conflicts first.`,
				};
			}
			if (outdatedFiles.length > 0) {
				return {
					isValid: false,
					error: `Cannot commit files that need updates: ${outdatedFiles.map((f) => f.relativePath).join(", ")}. Please update these files first.`,
				};
			}
		}

		// 4. Validate required variables are filled for each folder
		const requiredVariables = variableColumns.filter((col) => col.required);
		if (requiredVariables.length > 0) {
			for (const folder of uniqueFolderDetails) {
				for (const variable of requiredVariables) {
					const value = variable.values[folder.folderName];
					if (!value || !value.trim()) {
						return {
							isValid: false,
							error: `Required variable "${variable.name}" is not filled for folder "${folder.folderName}"`,
						};
					}
				}
			}
		}

		// 5. Validate commit message content - check for unresolved variables and meaningful content
		const sanitizedMessage = commitMessagePreview.trim();

		// Check if sanitized message is just whitespace or punctuation
		if (!sanitizedMessage || !/[a-zA-Z0-9]/.test(sanitizedMessage)) {
			return {
				isValid: false,
				error: "Commit message must contain meaningful content (letters or numbers)",
			};
		}

		// Check for unresolved variable placeholders
		// First check for invalid special variables (double braces: $t{{specialVariable}})
		const specialVariablesInMessage = sanitizedMessage.match(/\$t\{\{([^}]+)\}\}/g);
		if (specialVariablesInMessage) {
			const specialVariableNames = specialVariablesInMessage.map((match) => match.slice(4, -2)); // Remove $t{{ and }}
			const knownSpecialVariables = new Set(["branchFolder", "branchVersion", "revision"]);
			const nonExistentSpecialVariables = specialVariableNames.filter((name) => !knownSpecialVariables.has(name));

			// Only flag non-existent special variables as errors
			// Valid special variables ($t{{branchFolder}}, $t{{branchVersion}}) are expected to be unprocessed at this stage
			if (nonExistentSpecialVariables.length > 0) {
				return {
					isValid: false,
					error: `Commit message contains references to non-existent special variables: ${nonExistentSpecialVariables.join(", ")}. Available special variables: branchFolder, branchVersion, revision`,
				};
			}

			// Valid special variables are acceptable and will be processed per-branch during commit
		}

		// Then check for custom variables (single braces: $t{variableName})
		// Use negative lookahead to exclude special variables ($t{{...}}) from custom variable matching
		const customVariablesInMessage = sanitizedMessage.match(/\$t\{(?!\{)([^}]+)\}/g);
		if (customVariablesInMessage) {
			const variableNames = customVariablesInMessage.map((match) => match.slice(3, -1)); // Remove $t{ and }
			const existingVariableNames = new Set(variableColumns.map((col) => col.name));
			const nonExistentVariables = variableNames.filter((name) => !existingVariableNames.has(name));

			if (nonExistentVariables.length > 0) {
				return {
					isValid: false,
					error: `Commit message contains references to non-existent custom variables: ${nonExistentVariables.join(", ")}`,
				};
			}

			// For existing variables, check if they have values for all selected folders
			for (const variableName of variableNames) {
				const variable = variableColumns.find((col) => col.name === variableName);
				if (variable) {
					for (const folder of uniqueFolderDetails) {
						const value = variable.values[folder.folderName] || variable.defaultValue || "";
						if (!value.trim() && variable.required) {
							return {
								isValid: false,
								error: `Custom variable "${variableName}" has no value for folder "${folder.folderName}". Please provide a value.`,
							};
						}
					}
				}
			}
		}

		// 6. SVN-specific validation - ensure proper file staging for SVN requirements
		const unversionedFiles = stagedFiles.filter((f) => f.status === "unversioned");

		// For unversioned files, check if parent directories are properly handled
		if (unversionedFiles.length > 0) {
			const filesWithParents = findAndIncludeMissingParents(unversionedFiles);
			const missingParentCount = filesWithParents.length - unversionedFiles.length;

			if (missingParentCount > 0) {
				// This is actually informational - the system will handle it automatically
				console.info(`${missingParentCount} parent directories will be automatically added for unversioned files`);
			}
		}

		// 7. Basic branch accessibility check - ensure branch paths are accessible
		const uniqueBranchPaths = new Set(stagedFiles.map((f) => f.branchPath));
		for (const branchPath of uniqueBranchPaths) {
			// Basic check - ensure the branch path is not empty and looks like a valid path
			if (!branchPath || branchPath.length < 3) {
				return {
					isValid: false,
					error: `Invalid branch path detected: "${branchPath}"`,
				};
			}
		}

		// 8. SVN-specific dependency validation
		const svnValidation = validateSVNCommitDependencies(stagedFiles);
		if (!svnValidation.isValid) {
			return {
				isValid: false,
				error: svnValidation.errors[0], // Show the first error
			};
		}

		// Show warnings in the console for informational purposes
		if (svnValidation.warnings.length > 0) {
			console.warn("SVN validation warnings:", svnValidation.warnings);
		}

		return { isValid: true };
	}

	// Derived state for commit validation - used for button state and tooltips
	let commitValidation = $derived.by(() => {
		if (commitInProgress) {
			return { isValid: false, error: "Commit in progress..." };
		}
		return validateCommitReadiness();
	});

	// Derived tooltip message for commit button
	let commitButtonTooltip = $derived.by(() => {
		if (commitInProgress) {
			return "Commit in progress...";
		}
		if (!commitValidation.isValid && commitValidation.error) {
			return commitValidation.error;
		}
		return stagedFiles.length > 0 ? "Commit staged files" : "Stage files to enable commit";
	});

	async function startCommit() {
		// Perform comprehensive validation before starting commit
		const validation = validateCommitReadiness();
		if (!validation.isValid) {
			showError(validation.error!);
			return;
		}

		// Use the commit message with custom variables processed but special variables intact
		const baseMessage = commitMessage.trim();

		// Create commit groups in the same order as selectedBranchDetails (already sorted)
		// This eliminates the need for sorting since selectedBranchDetails is pre-sorted
		commitGroups = [];

		selectedBranchDetails.forEach((branchDetail) => {
			// Find all staged files for this branch
			const branchFiles = stagedFiles.filter((file) => file.branchPath === branchDetail.branchPath);

			// Only create a group if this branch has staged files
			if (branchFiles.length > 0) {
				commitGroups.push({
					branchPath: branchDetail.branchPath,
					branchFolder: branchDetail.folderName,
					branchVersion: branchDetail.branchVersion,
					files: branchFiles,
				});
			}
		});
		currentPhase = "committing";
		commitInProgress = true;
		currentCommitGroup = 0;
		commitResults = [];

		try {
			// Prepare commit groups for backend - process special variables per branch
			const processedMessages = new Map<string, string>(); // Store processed messages by branch path
			const commitGroupsData = commitGroups.map((group) => {
				// Process special variables for this specific branch
				const branchSpecificMessage = processSpecialVariablesForBranch(baseMessage, group.branchFolder, group.branchVersion);

				// Store the processed message for later use
				processedMessages.set(group.branchPath, branchSpecificMessage);

				return {
					branchPath: group.branchPath,
					branchFolder: group.branchFolder,
					branchVersion: group.branchVersion,
					commitMessage: sanitizeCommitMessage(branchSpecificMessage),
					filePaths: group.files.map((f) => f.path),
					fileInfo: group.files.map((f) => ({
						path: f.path,
						isDirectory: f.isDirectory,
					})),
				};
			});

			console.log("commitGroupsData:");
			console.log(commitGroupsData);

			const resultJson = await SVNCommitMultiBranch(commitGroupsData);
			const result = JSON.parse(resultJson);

			// Add processedMessage to each result
			// No sorting needed - backend processes groups sequentially in the order received
			commitResults = (result.results || []).map((r) => ({
				...r,
				processedMessage: sanitizeCommitMessage(processedMessages.get(r.branchPath) || ""),
			}));
			currentPhase = "completed";

			// Clear commit variable values since commit process is complete
			clearCommitVariableValues();

			// Automatically update branches that were successfully committed
			// This runs asynchronously and won't block the UI
			if (result.successCount > 0) {
				// Small delay to let the completion UI render first
				setTimeout(() => {
					autoUpdateCommittedBranches();
				}, 500);
			}

			if (result.successCount === result.totalGroups) {
				showSuccess(`Successfully committed to all ${result.totalGroups} branches`);
			} else if (result.successCount > 0) {
				showSuccess(`Committed to ${result.successCount} of ${result.totalGroups} branches`);
			} else {
				showError("Failed to commit to any branches");
			}
		} catch (error) {
			console.error("Commit failed:", error);

			// Provide more detailed error information
			let errorMessage = `Commit failed: ${error}`;
			if (error instanceof Error) {
				if (error.message.includes("timeout")) {
					errorMessage = "Commit timed out. This may be due to network issues or large files. Please try again.";
				} else if (error.message.includes("permission")) {
					errorMessage = "Permission denied. Please check your SVN credentials and try again.";
				} else if (error.message.includes("conflict")) {
					errorMessage = "Commit failed due to conflicts. Please resolve conflicts and try again.";
				}
			}

			showError(errorMessage);

			// Return to selection phase with current state preserved
			currentPhase = "selection";

			// Show option to retry or review files
			showSuccess("You can review your staged files and try committing again when ready.");
		} finally {
			commitInProgress = false;
		}
	}

	function backToCommitScreen() {
		// Reset phase back to selection while preserving all user data
		currentPhase = "selection";
		commitInProgress = false;

		// Intentionally preserve all user input:
		// - stagedFiles (keep staged files)
		// - commitMessageInput (keep commit message)
		// - variableColumns and their values (keep variable data)
		// - allFiles (keep file list)
		// This allows users to retry commits without losing their work
	}

	function setSortColumn(column: typeof sortColumn) {
		if (sortColumn === column) {
			sortDirection = sortDirection === "asc" ? "desc" : "asc";
		} else {
			sortColumn = column;
			sortDirection = "asc";
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				showSuccess("Copied to clipboard");
			})
			.catch(() => {
				showError("Failed to copy to clipboard");
			});
	}

	function clearSearchFilter() {
		searchFilter = "";
	}

	async function showFileDiff(file: FileEntry) {
		const fileKey = file.path;
		try {
			diffingFiles.add(fileKey);
			diffingFiles = new Set(diffingFiles); // Trigger reactivity

			diffLoading = true;
			diffFilePath = file.relativePath;
			diffBranchFolder = file.branchFolder;
			diffBranchVersion = file.branchVersion;
			diffLastPathSegment = file.lastPathSegment;

			// Find the folder color from selectedBranchDetails
			const branchDetail = selectedBranchDetails.find((b) => b.folderName === file.branchFolder);
			diffFolderColor = branchDetail?.folderColor || "#6b7280"; // Default gray if not found

			showDiffModal = true;
			diffOldContent = "";
			diffNewContent = "";

			// Get the file contents for both old (BASE) and new (WORKING) versions
			const contentResult = await SVNGetFileContent(file.path);
			diffOldContent = contentResult.oldContent || "";
			diffNewContent = contentResult.newContent || "";

			// Handle case where both contents are empty
			if (!diffOldContent && !diffNewContent) {
				showError(`No content available for ${file.relativePath}. This may be a binary file or there might be an issue accessing the file.`);
			}
		} catch (error) {
			console.error("Failed to get file content:", error);
			showError(`Failed to get file content for ${file.relativePath}: ${error}`);
			diffOldContent = "";
			diffNewContent = "";
		} finally {
			diffLoading = false;
			diffingFiles.delete(fileKey);
			diffingFiles = new Set(diffingFiles); // Trigger reactivity
		}
	}

	function closeDiffModal() {
		showDiffModal = false;
		diffOldContent = "";
		diffNewContent = "";
		diffFilePath = "";
		diffLoading = false;
		diffBranchFolder = "";
		diffBranchVersion = "";
		diffLastPathSegment = "";
		diffFolderColor = "";
	}

	async function revertFile(file: FileEntry) {
		const fileKey = file.path;
		try {
			// Show confirmation dialog first
			const confirmed = await showDanger("Revert File Changes", `Are you sure you want to revert changes to "${file.relativePath}"? This action cannot be undone.`, "Revert Changes");

			if (!confirmed) {
				return;
			}

			// Add to reverting set for UI feedback
			revertingFiles.add(fileKey);
			revertingFiles = new Set(revertingFiles); // Trigger reactivity

			// Perform the revert operation
			await SVNRevert([file.path]);
			showSuccess(`Successfully reverted changes to ${file.relativePath}`);

			// Remove the file from allFiles list as it no longer has changes
			allFiles = allFiles.filter((f) => f.path !== file.path);

			// Remove from staged files if it was staged
			stagedFiles = stagedFiles.filter((f) => f.path !== file.path);
		} catch (error) {
			console.error("Failed to revert file:", error);
			let errorMessage = `Failed to revert ${file.relativePath}: ${error}`;

			// Provide specific error messages
			if (error instanceof Error) {
				if (error.message.includes("not under version control")) {
					errorMessage = `Cannot revert ${file.relativePath}: file is not under version control`;
				} else if (error.message.includes("permission")) {
					errorMessage = `Permission denied when reverting ${file.relativePath}`;
				}
			}

			showError(errorMessage);
		} finally {
			revertingFiles.delete(fileKey);
			revertingFiles = new Set(revertingFiles); // Trigger reactivity
		}
	}

	async function unversionFile(file: FileEntry) {
		const fileKey = file.path;
		try {
			// Show confirmation dialog first
			const confirmed = await showDanger("Unversion File", `Are you sure you want to unversion "${file.relativePath}"? This will remove it from version control.`, "Unversion");

			if (!confirmed) {
				return;
			}

			// Add to unversioning set for UI feedback
			unversioningFiles.add(fileKey);
			unversioningFiles = new Set(unversioningFiles); // Trigger reactivity

			// Perform the unversion operation (revert the add/delete)
			await SVNRevert([file.path]);

			// Update file status after successful revert
			const revertedFiles = await updateFileStatusAfterSVNOperation([file], "revert");

			if (revertedFiles.length > 0) {
				const revertedFile = revertedFiles[0];

				// Update the file in allFiles array
				allFiles = allFiles.map((f) => (f.path === file.path ? revertedFile : f));

				// For better accuracy, get fresh SVN status
				const freshStatus = await getActualSVNStatus([file.path]);
				if (freshStatus.length > 0) {
					const freshFile = freshStatus[0];
					allFiles = allFiles.map((f) => (f.path === file.path ? freshFile : f));
				}

				showSuccess(`Successfully unversioned ${file.relativePath} - status: ${revertedFile.status}`);
			}

			// Remove from staged files if it was staged
			stagedFiles = stagedFiles.filter((f) => f.path !== file.path);
		} catch (error) {
			console.error("Failed to unversion file:", error);
			let errorMessage = `Failed to unversion ${file.relativePath}: ${error}`;

			// Provide specific error messages
			if (error instanceof Error) {
				if (error.message.includes("not under version control")) {
					errorMessage = `Cannot unversion ${file.relativePath}: file is not under version control`;
				} else if (error.message.includes("permission")) {
					errorMessage = `Permission denied when unversioning ${file.relativePath}`;
				}
			}

			showError(errorMessage);
		} finally {
			unversioningFiles.delete(fileKey);
			unversioningFiles = new Set(unversioningFiles); // Trigger reactivity
		}
	}

	// Commit history utility functions
	function formatCommitDate(dateString: string): string {
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
		} catch (error) {
			return dateString;
		}
	}


	// Simple commit message truncation
	function truncateCommitMessage(message: string, containerWidth?: number): string {
		if (!message) return "";

		// Clean the message first (replace newlines with spaces)
		const cleaned = message.replace(/\r?\n/g, " ").trim();

		// Use a simple character-based truncation
		const maxChars = Math.floor((containerWidth || 400) / 8); // Rough estimate: ~8px per character

		if (cleaned.length <= maxChars) {
			return cleaned;
		}

		return cleaned.substring(0, maxChars - 3) + "...";
	}

	// Get responsive width for commit history container
	let commitHistoryContainerWidth = $state(400); // Default width

	// Effect to measure commit history container width
	$effect(() => {
		if (showCommitHistory) {
			const container = document.querySelector(".commit-history-container .absolute");
			if (container) {
				// Use 80% of container width for messages, leaving space for revision info
				commitHistoryContainerWidth = container.clientWidth * 0.6;
			}
		}
	});

	function selectCommitMessage(message: string) {
		commitMessageInput = message;
		closeHistoryDropdown();
	}

	function closeHistoryDropdown() {
		showCommitHistory = false;
		selectedHistoryIndex = -1;
		historySearchFilter = ""; // Clear search when closing
	}

	function clearHistorySearch() {
		historySearchFilter = "";
		selectedHistoryIndex = -1; // Reset selection when clearing search
	}

	async function fetchCommitHistory() {
		if (loadingHistory || commitHistory.length > 0) return;

		loadingHistory = true;
		historyError = "";
		historyBranchCount = 0;
		historyLoadingMessage = "";

		try {
			// Get paths from selected branches
			const branchPaths = selectedBranchDetails.map((branch) => branch.branchPath);
			if (branchPaths.length === 0) {
				historyError = "No branches selected";
				return;
			}

			// Set progress indicators
			historyBranchCount = branchPaths.length;
			if (branchPaths.length > 1) {
				historyLoadingMessage = `Fetching commit history from ${branchPaths.length} branches...`;
				console.log(`Fetching commit history from ${branchPaths.length} branches in parallel...`);
			} else {
				historyLoadingMessage = "Fetching commit history...";
			}

			// Fetch commit log using the enhanced backend that handles multiple paths
			const logJson = await SVNLog(-1, false, branchPaths);
			const logData = JSON.parse(logJson);

			if (logData && logData.LogEntry) {
				commitHistory = logData.LogEntry.map((entry: any) => ({
					revision: entry.Revision || "",
					author: entry.Author || "",
					date: entry.Date || "",
					message: entry.Message || "",
				}));

				// Provide success feedback with statistics
				if (branchPaths.length > 1) {
					console.log(`Successfully loaded ${commitHistory.length} commit entries from ${branchPaths.length} branches`);
				}
			} else {
				commitHistory = [];

				// Check if this is a case where no commits were found vs. actual error
				if (branchPaths.length > 1) {
					historyError = "No commit history found in any of the selected branches";
				} else {
					historyError = "No commit history found";
				}
			}
		} catch (error) {
			console.error("Failed to fetch commit history:", error);

			// Enhanced error handling with specific messages
			let errorMessage = `Failed to load commit history: ${error}`;

			if (error instanceof Error) {
				const errorStr = error.message || error.toString();

				if (errorStr.includes("E200007")) {
					// This error should now be fixed by the backend, but provide fallback message
					errorMessage = "Multiple branch log request failed - please try refreshing the page";
				} else if (errorStr.includes("timeout")) {
					errorMessage = "Request timed out - some repositories may be slow to respond";
				} else if (errorStr.includes("permission")) {
					errorMessage = "Permission denied - check your SVN access rights";
				} else if (errorStr.includes("not a working copy")) {
					errorMessage = "One or more selected branches are not valid SVN working copies";
				} else if (errorStr.includes("failed to get log from any branch")) {
					// This indicates all branches failed individually
					if (selectedBranchDetails.length > 1) {
						errorMessage = "Unable to fetch commit history from any of the selected branches. Check that all branch paths are accessible.";
					} else {
						errorMessage = "Unable to fetch commit history. Please check that the branch path is accessible.";
					}
				}
			}

			historyError = errorMessage;
			commitHistory = [];
		} finally {
			loadingHistory = false;
			historyBranchCount = 0;
			historyLoadingMessage = "";
		}
	}

	// Clear all commit state and reset to initial values
	function clearAllCommitState() {
		// Reset file arrays
		allFiles = [];
		stagedFiles = [];

		// Clear session-only commit variable values
		clearCommitVariableValues();

		// Reset commit state
		commitResults = [];
		commitGroups = [];
		currentCommitGroup = 0;
		commitInProgress = false;
		commitProcessStarted = false;

		// Reset commit message
		commitMessageInput = commitMessageTemplate;

		// Reset variable values to defaults
		if (appConfig && variableColumns.length > 0) {
			variableColumns.forEach((col) => {
				uniqueFolderDetails.forEach((branch) => {
					col.values[branch.folderName] = col.defaultValue || "";
				});
			});
		}

		// Reset UI state
		searchFilter = "";
		debouncedSearchFilter = "";
		selectedFileIndex = -1;
		selectedStagedFileIndex = -1;
		activeTable = null;
		showPreview = false;
		showTips = false;
		showCommitHistory = false;
		commitHistory = [];
		historySearchFilter = "";
		selectedHistoryIndex = -1;

		// Reset operation states
		revertingFiles.clear();
		diffingFiles.clear();
		unversioningFiles.clear();

		// Reset loading state
		loadingMessage = "Initializing commit process...";
		loadingProgress = 0;
	}

	// Start another commit - clear state and restart the process
	async function commitAgainWithoutValues() {
		// Clear all state
		clearAllCommitState();

		// Reset phase to loading
		currentPhase = "loading";

		// Start the commit process again
		await startCommitProcess();
	}

	// Start another commit - preserve commit message and variable values
	async function commitAgainWithValues() {
		// Store current values before clearing
		const savedCommitMessage = commitMessageInput;
		const savedVariableValues: Record<string, Record<string, string>> = {};
		const savedIncludeCommitMessage = includeCommitMessage;

		// Save current variable values
		variableColumns.forEach((col) => {
			savedVariableValues[col.name] = { ...col.values };
		});

		// Clear file arrays and reset process state
		allFiles = [];
		stagedFiles = [];
		commitResults = [];
		commitGroups = [];
		currentCommitGroup = 0;
		commitInProgress = false;
		commitProcessStarted = false;

		// Reset UI state but keep the search and other user preferences
		selectedFileIndex = -1;
		selectedStagedFileIndex = -1;
		activeTable = null;
		showPreview = false;
		showTips = false;
		showCommitHistory = false;
		commitHistory = [];
		historySearchFilter = "";
		selectedHistoryIndex = -1;

		// Reset operation states
		revertingFiles.clear();
		diffingFiles.clear();
		unversioningFiles.clear();

		// Reset loading state
		loadingMessage = "Initializing commit process...";
		loadingProgress = 0;

		// Restore saved values
		commitMessageInput = savedCommitMessage;
		includeCommitMessage = savedIncludeCommitMessage;

		// Restore variable values
		if (variableColumns.length > 0) {
			variableColumns.forEach((col) => {
				if (savedVariableValues[col.name]) {
					col.values = { ...savedVariableValues[col.name] };
				}
			});
		}

		// Reset phase to loading
		currentPhase = "loading";

		// Start the commit process again
		await startCommitProcess();
	}

	// Handle commit again dropdown action
	function handleCommitAgainAction(actionId: string) {
		if (actionId === "clear") {
			commitAgainWithoutValues();
		} else if (actionId === "keep") {
			commitAgainWithValues();
		}
	}

	// Navigate to home page
	function goToHome() {
		// Navigate to the home/branches view
		setIsCommitMode(false);
	}

	// Automatically update branches that were successfully committed
	async function autoUpdateCommittedBranches() {
		if (isAutoUpdatingBranches || !commitResults.length) {
			return;
		}

		// Get branches that were successfully committed
		const successfulResults = commitResults.filter((result) => result.success && result.branchPath);
		if (successfulResults.length === 0) {
			return;
		}

		const branchPaths = successfulResults.map((result) => result.branchPath);
		const branchNames = successfulResults.map((result) => `${result.branchFolder}-${result.branchVersion}`);

		try {
			isAutoUpdatingBranches = true;
			autoUpdateCompleted = false;

			console.log(`Auto-updating ${branchPaths.length} committed branches:`, branchNames);

			// Call backend to update the committed branches
			const resultJson = await SVNUpdateBranches(branchPaths);
			const result = JSON.parse(resultJson);

			// Process results
			const updatedBranches: string[] = [];
			const failedBranches: string[] = [];

			if (result.results && Array.isArray(result.results)) {
				result.results.forEach((branchResult: any, index: number) => {
					if (branchResult.success) {
						updatedBranches.push(branchNames[index] || branchResult.path);
					} else {
						failedBranches.push(branchNames[index] || branchResult.path);
					}
				});
			}


			// Refresh branch statuses after update
			await refreshCommittedBranchStatuses(branchPaths);

			// Show appropriate toast notification
			if (result.successCount === result.totalBranches) {
				showSuccess(`✅ Successfully updated ${result.totalBranches} committed branch${result.totalBranches > 1 ? "es" : ""}`);
			} else if (result.successCount > 0) {
				showSuccess(`⚠️ Updated ${result.successCount} of ${result.totalBranches} committed branches successfully`);
				if (failedBranches.length > 0) {
					showError(`❌ Failed to update: ${failedBranches.slice(0, 2).join(", ")}${failedBranches.length > 2 ? ` and ${failedBranches.length - 2} more` : ""}`);
				}
			} else {
				showError("❌ Failed to update committed branches. Check network connection.");
			}
		} catch (error) {
			console.error("Failed to auto-update committed branches:", error);


			// Show error but don't let it break the commit completion flow
			showError("❌ Failed to automatically update committed branches after commit");
		} finally {
			isAutoUpdatingBranches = false;
			autoUpdateCompleted = true;
		}
	}

	// Refresh status for committed branches after update
	async function refreshCommittedBranchStatuses(branchPaths: string[]) {
		try {
			// Extract branch IDs from the committed branches if available
			const successfulResults = commitResults.filter((result) => result.success && result.branchPath);
			if (successfulResults.length === 0) return;

			console.log(`Refreshing status for ${branchPaths.length} updated branches`);

			// Map branch paths to branch IDs using selectedBranchDetails
			const branchPathToIdMap = new Map<string, string>();
			selectedBranchDetails.forEach((detail) => {
				branchPathToIdMap.set(detail.branchPath, detail.branchId);
			});

			// After successful SVN update, these branches are now at the latest revision
			// Update the branch status store to reflect this (0 revisions behind)
			const updatedBranchIds: string[] = [];

			branchPaths.forEach((branchPath) => {
				const branchId = branchPathToIdMap.get(branchPath);
				if (branchId) {
					// Set the branch status to "Latest" (0 revisions behind)
					branchStatusStore.updateStatus(branchId, {
						revisionsBehind: 0,
						error: undefined,
						lastChecked: Date.now(),
					});
					updatedBranchIds.push(branchId);
				}
			});

			if (updatedBranchIds.length > 0) {
				console.log(`Updated status for ${updatedBranchIds.length} branches to "Latest"`);
			}
		} catch (error) {
			console.error("Failed to refresh committed branch statuses:", error);
			// Don't show error to user as this is a background operation
		}
	}

	// Handle keyboard navigation for commit history dropdown
	function handleHistoryKeydown(event: KeyboardEvent) {
		if (!showCommitHistory) return;

		const target = event.target as HTMLElement;
		const isInSearchInput = target.tagName === "INPUT" && target.classList.contains("history-search-input");

		switch (event.key) {
			case "Escape":
				event.preventDefault();
				closeHistoryDropdown();
				break;

			case "ArrowDown":
				event.preventDefault();
				if (isInSearchInput) {
					// From search input, go to first item
					if (filteredCommitHistory.length > 0) {
						selectedHistoryIndex = 0;
						scrollToHistoryIndex(selectedHistoryIndex);
						// Remove focus from search to show visual selection
						(target as HTMLInputElement).blur();
					}
				} else {
					// In list navigation
					if (selectedHistoryIndex === filteredCommitHistory.length - 1) {
						// At last item, go back to search input
						selectedHistoryIndex = -1;
						const searchInput = document.querySelector(".history-search-input") as HTMLInputElement;
						if (searchInput) {
							searchInput.focus();
						}
					} else if (selectedHistoryIndex === -1 && filteredCommitHistory.length > 0) {
						// No selection, start at first item
						selectedHistoryIndex = 0;
						scrollToHistoryIndex(selectedHistoryIndex);
					} else {
						// Move to next item
						selectedHistoryIndex = Math.min(selectedHistoryIndex + 1, filteredCommitHistory.length - 1);
						scrollToHistoryIndex(selectedHistoryIndex);
					}
				}
				break;

			case "ArrowUp":
				event.preventDefault();
				if (isInSearchInput) {
					// From search input, go to last item
					if (filteredCommitHistory.length > 0) {
						selectedHistoryIndex = filteredCommitHistory.length - 1;
						scrollToHistoryIndex(selectedHistoryIndex);
						// Remove focus from search to show visual selection
						(target as HTMLInputElement).blur();
					}
				} else {
					// In list navigation
					if (selectedHistoryIndex <= 0) {
						// At first item or no selection, go to search input
						selectedHistoryIndex = -1;
						const searchInput = document.querySelector(".history-search-input") as HTMLInputElement;
						if (searchInput) {
							searchInput.focus();
						}
					} else {
						// Move to previous item
						selectedHistoryIndex = Math.max(selectedHistoryIndex - 1, 0);
						scrollToHistoryIndex(selectedHistoryIndex);
					}
				}
				break;

			case "Enter":
				event.preventDefault();
				if (selectedHistoryIndex >= 0 && selectedHistoryIndex < filteredCommitHistory.length) {
					selectCommitMessage(filteredCommitHistory[selectedHistoryIndex].message);
				}
				break;

			case "/":
			case "f":
				if (!isInSearchInput) {
					// Focus search input when pressing / or f
					event.preventDefault();
					const searchInput = document.querySelector(".history-search-input") as HTMLInputElement;
					if (searchInput) {
						searchInput.focus();
						selectedHistoryIndex = -1;
					}
				}
				break;

			case "Tab":
				// Prevent tab navigation outside dropdown
				event.preventDefault();
				break;
		}
	}

	function scrollToHistoryIndex(index: number) {
		const historyContainer = document.querySelector(".commit-history-container [role='listbox']");
		if (historyContainer && index >= 0) {
			// Only select buttons that are commit entries, not utility buttons
			const historyButtons = historyContainer.querySelectorAll("button.w-full.text-left");
			if (historyButtons[index]) {
				// Ensure the item is visible within the scrollable container
				const button = historyButtons[index] as HTMLElement;
				const containerRect = historyContainer.getBoundingClientRect();
				const buttonRect = button.getBoundingClientRect();

				// Check if button is outside visible area
				if (buttonRect.top < containerRect.top || buttonRect.bottom > containerRect.bottom) {
					button.scrollIntoView({ behavior: "smooth", block: "nearest" });
				}
			}
		}
	}

	// Handle global keyboard navigation for tables
	function handleGlobalKeydown(event: KeyboardEvent) {
		// Don't interfere with commit history navigation
		if (showCommitHistory) return;

		// Don't interfere with form inputs
		const target = event.target as HTMLElement;
		if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

		// Handle keyboard shortcuts for panel toggling
		if (event.ctrlKey || event.metaKey) {
			switch (event.key) {
				case "1":
					event.preventDefault();
					isSelectionCollapsed = !isSelectionCollapsed;
					return;
				case "2":
					event.preventDefault();
					isStagedCollapsed = !isStagedCollapsed;
					return;
			}
		}

		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				navigateTable("down");
				break;
			case "ArrowUp":
				event.preventDefault();
				navigateTable("up");
				break;
			case "Tab":
				event.preventDefault();
				switchTable();
				break;
			case "Enter":
			case " ":
				event.preventDefault();
				toggleCurrentSelection();
				break;
			case "Escape":
				event.preventDefault();
				clearTableSelection();
				break;
		}
	}

	function navigateTable(direction: "up" | "down") {
		if (activeTable === "files") {
			const maxIndex = filteredFiles.length - 1;
			if (direction === "down") {
				selectedFileIndex = Math.min(selectedFileIndex + 1, maxIndex);
			} else {
				selectedFileIndex = Math.max(selectedFileIndex - 1, 0);
			}
			scrollToFileIndex(selectedFileIndex);
		} else if (activeTable === "staged") {
			const maxIndex = filteredStagedFiles.length - 1;
			if (direction === "down") {
				selectedStagedFileIndex = Math.min(selectedStagedFileIndex + 1, maxIndex);
			} else {
				selectedStagedFileIndex = Math.max(selectedStagedFileIndex - 1, 0);
			}
			scrollToStagedFileIndex(selectedStagedFileIndex);
		} else {
			// Initialize navigation if no table is active
			if (filteredFiles.length > 0) {
				activeTable = "files";
				selectedFileIndex = 0;
				scrollToFileIndex(0);
			} else if (filteredStagedFiles.length > 0) {
				activeTable = "staged";
				selectedStagedFileIndex = 0;
				scrollToStagedFileIndex(0);
			}
		}
	}

	function switchTable() {
		if (activeTable === "files" && filteredStagedFiles.length > 0) {
			activeTable = "staged";
			selectedStagedFileIndex = Math.min(selectedStagedFileIndex, filteredStagedFiles.length - 1);
			if (selectedStagedFileIndex < 0) selectedStagedFileIndex = 0;
			scrollToStagedFileIndex(selectedStagedFileIndex);
		} else if (activeTable === "staged" && filteredFiles.length > 0) {
			activeTable = "files";
			selectedFileIndex = Math.min(selectedFileIndex, filteredFiles.length - 1);
			if (selectedFileIndex < 0) selectedFileIndex = 0;
			scrollToFileIndex(selectedFileIndex);
		} else if (!activeTable) {
			if (filteredFiles.length > 0) {
				activeTable = "files";
				selectedFileIndex = 0;
				scrollToFileIndex(0);
			} else if (filteredStagedFiles.length > 0) {
				activeTable = "staged";
				selectedStagedFileIndex = 0;
				scrollToStagedFileIndex(0);
			}
		}
	}

	function toggleCurrentSelection() {
		if (activeTable === "files" && selectedFileIndex >= 0 && selectedFileIndex < filteredFiles.length) {
			const file = filteredFiles[selectedFileIndex];
			if (isFileSelectable(file)) {
				moveFileToStaged(file);
			}
		} else if (activeTable === "staged" && selectedStagedFileIndex >= 0 && selectedStagedFileIndex < filteredStagedFiles.length) {
			const file = filteredStagedFiles[selectedStagedFileIndex];
			if (isFileSelectable(file)) {
				moveFileToSelection(file);
			}
		}
	}

	function clearTableSelection() {
		activeTable = null;
		selectedFileIndex = -1;
		selectedStagedFileIndex = -1;
	}

	function scrollToFileIndex(index: number) {
		const tableContainer = document.querySelector(".files-table-container");
		if (tableContainer && index >= 0) {
			const rows = tableContainer.querySelectorAll("tbody tr");
			if (rows[index]) {
				rows[index].scrollIntoView({ behavior: "smooth", block: "center" });
			}
		}
	}

	function scrollToStagedFileIndex(index: number) {
		const tableContainer = document.querySelector(".staged-table-container");
		if (tableContainer && index >= 0) {
			const rows = tableContainer.querySelectorAll("tbody tr");
			if (rows[index]) {
				rows[index].scrollIntoView({ behavior: "smooth", block: "center" });
			}
		}
	}

	// Toggle commit history dropdown
	async function toggleCommitHistory() {
		if (showCommitHistory) {
			closeHistoryDropdown();
		} else {
			// Close templates dropdown first if it's open
			if (showTemplates) {
				closeTemplateDropdown();
			}

			showCommitHistory = true;
			selectedHistoryIndex = -1; // Reset selection
			await fetchCommitHistory();

			// Focus search input after dropdown opens
			setTimeout(() => {
				const searchInput = document.querySelector(".history-search-input") as HTMLInputElement;
				const historyContainer = document.querySelector(".commit-history-container [role='listbox']") as HTMLElement;
				if (searchInput) {
					searchInput.focus();
				}
				// Ensure dropdown starts scrolled to top
				if (historyContainer) {
					historyContainer.scrollTop = 0;
				}
			}, 50);
		}
	}

	// Click outside to close history dropdown
	$effect(() => {
		if (!showCommitHistory) return;

		function handleClickOutside(event: MouseEvent) {
			const target = event.target as Element;
			if (target && !target.closest(".commit-history-container")) {
				closeHistoryDropdown();
			}
		}

		function handleEscapeKey(event: KeyboardEvent) {
			if (event.key === "Escape") {
				closeHistoryDropdown();
			}
		}

		document.addEventListener("click", handleClickOutside);
		document.addEventListener("keydown", handleEscapeKey);

		return () => {
			document.removeEventListener("click", handleClickOutside);
			document.removeEventListener("keydown", handleEscapeKey);
		};
	});

	// Click outside to close templates dropdown
	$effect(() => {
		if (!showTemplates) return;

		function handleClickOutside(event: MouseEvent) {
			const target = event.target as Element;
			if (target && !target.closest(".commit-templates-container")) {
				closeTemplateDropdown();
			}
		}

		function handleEscapeKey(event: KeyboardEvent) {
			if (event.key === "Escape") {
				closeTemplateDropdown();
			}
		}

		document.addEventListener("click", handleClickOutside);
		document.addEventListener("keydown", handleEscapeKey);

		return () => {
			document.removeEventListener("click", handleClickOutside);
			document.removeEventListener("keydown", handleEscapeKey);
		};
	});

	// Global keyboard navigation
	$effect(() => {
		document.addEventListener("keydown", handleGlobalKeydown);

		return () => {
			document.removeEventListener("keydown", handleGlobalKeydown);
		};
	});

	// Collapse state for panels
	let isSelectionCollapsed = $state(false);
	let isStagedCollapsed = $state(true); // Start collapsed until files are staged

	// Auto-expand staged panel when files are staged
	$effect(() => {
		if (stagedFiles.length > 0 && isStagedCollapsed) {
			isStagedCollapsed = false;
		}
	});

	// Helper function to get status breakdown for files
	function getStatusBreakdown(files: FileEntry[]) {
		const breakdown = {
			total: files.length,
			files: {
				modified: 0,
				added: 0,
				deleted: 0,
				unversioned: 0,
				missing: 0,
				conflicted: 0,
				other: 0,
			},
			directories: {
				modified: 0,
				added: 0,
				deleted: 0,
				unversioned: 0,
				missing: 0,
				conflicted: 0,
				other: 0,
			},
		};

		files.forEach((file) => {
			const target = file.isDirectory ? breakdown.directories : breakdown.files;

			if (file.isConflicted) {
				target.conflicted++;
			} else {
				switch (file.status) {
					case "modified":
						target.modified++;
						break;
					case "added":
						target.added++;
						break;
					case "deleted":
						target.deleted++;
						break;
					case "unversioned":
						target.unversioned++;
						break;
					case "missing":
						target.missing++;
						break;
					default:
						target.other++;
				}
			}
		});

		return breakdown;
	}

	// Helper function to format status breakdown as text
	function formatStatusBreakdown(files: FileEntry[]): string {
		const breakdown = getStatusBreakdown(files);
		const parts: string[] = [];

		// Add file counts
		const fileCount = Object.values(breakdown.files).reduce((sum, count) => sum + count, 0);
		if (fileCount > 0) {
			const fileDetails: string[] = [];
			if (breakdown.files.modified > 0) fileDetails.push(`${breakdown.files.modified} modified`);
			if (breakdown.files.added > 0) fileDetails.push(`${breakdown.files.added} added`);
			if (breakdown.files.deleted > 0) fileDetails.push(`${breakdown.files.deleted} deleted`);
			if (breakdown.files.unversioned > 0) fileDetails.push(`${breakdown.files.unversioned} unversioned`);
			if (breakdown.files.missing > 0) fileDetails.push(`${breakdown.files.missing} missing`);
			if (breakdown.files.conflicted > 0) fileDetails.push(`${breakdown.files.conflicted} conflicted`);
			if (breakdown.files.other > 0) fileDetails.push(`${breakdown.files.other} other`);

			if (fileDetails.length > 0) {
				parts.push(`${fileCount} file${fileCount !== 1 ? "s" : ""} (${fileDetails.join(", ")})`);
			}
		}

		// Add directory counts
		const dirCount = Object.values(breakdown.directories).reduce((sum, count) => sum + count, 0);
		if (dirCount > 0) {
			const dirDetails: string[] = [];
			if (breakdown.directories.modified > 0) dirDetails.push(`${breakdown.directories.modified} modified`);
			if (breakdown.directories.added > 0) dirDetails.push(`${breakdown.directories.added} added`);
			if (breakdown.directories.deleted > 0) dirDetails.push(`${breakdown.directories.deleted} deleted`);
			if (breakdown.directories.unversioned > 0) dirDetails.push(`${breakdown.directories.unversioned} unversioned`);
			if (breakdown.directories.missing > 0) dirDetails.push(`${breakdown.directories.missing} missing`);
			if (breakdown.directories.conflicted > 0) dirDetails.push(`${breakdown.directories.conflicted} conflicted`);
			if (breakdown.directories.other > 0) dirDetails.push(`${breakdown.directories.other} other`);

			if (dirDetails.length > 0) {
				parts.push(`${dirCount} director${dirCount !== 1 ? "ies" : "y"} (${dirDetails.join(", ")})`);
			}
		}

		return parts.join(", ");
	}
</script>

<div class="container mx-auto p-4 max-w-none">
	{#if currentPhase === "loading"}
		<!-- Loading Phase -->
		<div class="fixed inset-0 flex items-center justify-center">
			<div class="text-center">
				<div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
				<h2 class="text-base font-medium text-gray-800 dark:text-gray-100 mb-2">Preparing Commit</h2>
				<p class="text-gray-600 dark:text-gray-300 mb-4">{loadingMessage}</p>
				<div class="w-full max-w-md mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-2">
					<div class="bg-blue-500 h-2 rounded-full transition-all duration-500" style="width: {loadingProgress}%"></div>
				</div>
				<p class="text-sm text-gray-500 dark:text-gray-400 mt-2">{Math.round(loadingProgress)}% complete</p>
			</div>
		</div>
	{:else if currentPhase === "selection"}
		<!-- Selection Phase -->
		<div class="space-y-6">
			<FloatingHeader customMarginFactor={0.5}>
				{#snippet children()}
				<div class="flex items-center justify-between w-full">
					<div class="flex items-center gap-3">
						<h2 class="text-base font-medium text-gray-800 dark:text-gray-100">Selected Branches ({selectedBranchCount})</h2>
						<div class="flex flex-wrap gap-2">
							{#each selectedBranchDetails as branch (branch.branchId)}
								<div class="flex items-center px-3 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm transition-all duration-300">
									<div class="w-2 h-2 rounded-full flex-shrink-0 mr-2" style="background-color: {branch.folderColor}"></div>
									<span class="font-medium text-gray-900 dark:text-gray-100 mr-1">{branch.folderName}</span>
									<span class="text-gray-700 dark:text-gray-200 mr-1">{branch.branchVersion}</span>
									<span class="text-gray-500 dark:text-gray-400 text-xs">{branch.lastPathSegment}</span>
								</div>
							{/each}
						</div>
					</div>
					<Button variant="secondary" class="px-4 py-2 text-sm transition-all duration-300" onclick={refreshSVNStatus} disabled={refreshing || commitInProgress} tooltip={refreshing ? refreshMessage : "Refresh SVN status for selected branches"} leftIcon="reload" iconSize={16}>
						{refreshing ? "Refreshing..." : "Refresh"}
					</Button>
				</div>
				{/snippet}
			</FloatingHeader>

			<!-- Commit Variables and Message -->
			<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm" role="region" aria-label="Commit configuration">
				<!-- Variables Section -->
				<section aria-labelledby="variables-heading" class="mb-6">
					<div class="flex items-center justify-between mb-3">
						<h3 id="variables-heading" class="text-base font-medium text-gray-800 dark:text-gray-100">Commit Variables</h3>
						<Button variant="secondary" class="px-4 py-2 text-sm" onclick={addVariableColumn} leftIcon="plus" iconSize={16}>Variable</Button>
					</div>

					{#if variableColumns.length > 0}
						<div class="overflow-x-auto">
							<table class="w-full border-collapse">
								<thead>
									<tr class="bg-gray-50 dark:bg-gray-700">
										<th class="border border-gray-200 dark:border-gray-600 px-2 py-1.5 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Branch Folder</th>
										{#each variableColumns as column (column.id)}
											<th class="border border-gray-200 dark:border-gray-600 px-2 py-1.5 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
												<div class="flex items-center justify-between">
													<span class="font-medium text-xs flex items-center">
														{column.name}{#if column.required}<span class="text-red-500"> *</span>{/if}
														{#if column.description}
															<Button
																variant="minimal"
																iconOnly="info"
																iconSize={14}
																tooltip={column.description}
																aria-label="Show description for {column.name}"
																type="button"
																onclick={(e) => e.stopPropagation()}
																class="ml-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
															/>
														{/if}
													</span>
													<Button variant="minimal" iconOnly="close" iconSize={14} onclick={() => removeVariableColumn(column.id)} tooltip="Remove column" class="ml-1 text-red-500 hover:text-red-700" />
												</div>
											</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each uniqueFolderDetails as branch (branch.folderName)}
										<tr>
											<td class="border border-gray-200 dark:border-gray-600 px-2 py-1.5 font-medium">
												<div class="flex items-center space-x-1.5">
													<div class="w-2 h-2 rounded-full" style="background-color: {branch.folderColor}"></div>
													<span class="text-sm text-gray-700 dark:text-gray-300">{branch.folderName}</span>
												</div>
											</td>
											{#each variableColumns as column (column.id)}
												<td class="border border-gray-200 dark:border-gray-600 px-2 py-1.5">
													<input
														bind:value={column.values[branch.folderName]}
														class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
														placeholder={column.defaultValue}
														onchange={() => updateVariableValue(column.id, branch.folderName, column.values[branch.folderName]?.trim() || "")}
													/>
												</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</section>

				<!-- Message Section -->
				<section aria-labelledby="message-heading">
					<div class="flex items-center justify-between mb-3">
						<h3 id="message-heading" class="text-base font-medium text-gray-800 dark:text-gray-100">Commit Message <span class="text-red-500">*</span></h3>
						<Button variant="secondary" class="px-4 py-2 text-sm" onclick={() => (showPreview = !showPreview)} tooltip={showPreview ? "Hide preview" : "Show preview"} aria-label={showPreview ? "Hide message preview" : "Show message preview"} leftIcon={showPreview ? "eyeOff" : "eye"} iconSize={16}>
							Preview
						</Button>
					</div>
					<textarea
						bind:value={commitMessageInput}
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[72px] max-h-[200px] resize-vertical"
						placeholder="Enter your commit message..."
						aria-label="Commit message"
						onblur={handleCommitMessageBlur}
					></textarea>

					<!-- Tips and History Toggle Buttons -->
					<div class="mt-2 flex justify-start gap-4 relative">
						<Button
							variant="tertiary"
							class="py-1 px-2 text-xs flex items-center gap-1 {showTips ? 'text-blue-800 bg-blue-50 dark:text-blue-200 dark:bg-blue-900' : ''}"
							onclick={() => (showTips = !showTips)}
							tooltip={showTips ? "Hide commit tips" : "Show commit tips"}
							aria-label={showTips ? "Hide commit tips" : "Show commit tips"}
						>
							<Icon name="lightbulb" size={16} class="inline" />
							{showTips ? "Hide Tips" : "Show Tips"}
						</Button>
						<div class="static commit-templates-container">
							<Button
								variant="tertiary"
								class="py-1 px-2 text-xs flex items-center gap-1 {showTemplates ? 'text-blue-800 bg-blue-50 dark:text-blue-200 dark:bg-blue-900' : ''}"
								onclick={toggleTemplates}
								onkeydown={handleTemplateKeydown}
								tooltip="Select from saved commit message templates"
								aria-label="Select from saved commit message templates"
							>
								<Icon name="bookmark" size={16} class="inline" /> Templates
							</Button>

							<!-- Templates Dropdown -->
							{#if showTemplates}
								<div class="absolute top-full mt-1 left-0 right-0 min-w-[800px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-[30] max-h-96 overflow-y-auto" onkeydown={handleTemplateKeydown} tabindex="-1" role="listbox" aria-label="Commit templates">
									<div class="p-2">
										<!-- Header with Save Template Button -->
										<div class="flex items-center justify-between mb-3 px-2">
											<div class="text-xs font-medium text-gray-700 dark:text-gray-300">
												Saved Templates ({templatesList.length}):
											</div>
											<Button
												variant="secondary"
												class="px-3 py-1 text-xs"
												onclick={() => showSaveTemplateDialog = true}
												tooltip="Save current message as template"
												aria-label="Save current message as template"
												leftIcon="plus"
												iconSize={12}
												disabled={!commitMessageInput.trim()}
											>
												Save Template
											</Button>
										</div>

										<!-- Search input -->
										<div class="mb-3 px-2">
											<div class="relative">
												<input
													bind:value={templateSearchFilter}
													class="template-search-input w-full px-3 py-1.5 text-xs border rounded-md dark:bg-gray-700 dark:text-gray-100 focus:outline-none transition-colors pr-8 {selectedTemplateIndex === -1 ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300 dark:border-gray-600'}"
													placeholder="Search templates by nickname or content..."
													aria-label="Search templates"
													onkeydown={handleTemplateKeydown}
													onfocus={() => (selectedTemplateIndex = -1)}
												/>
												{#if templateSearchFilter.trim()}
													<Button variant="minimal" iconOnly="close" iconSize={12} onclick={clearTemplateSearch} tooltip="Clear search" aria-label="Clear search" class="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
												{:else}
													<div class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
														<Icon name="search" size={12} />
													</div>
												{/if}
											</div>
										</div>

										{#if templatesList.length === 0}
											<div class="p-4 text-center">
												<Icon name="bookmark" size={20} class="text-gray-400 mx-auto mb-2" />
												<div class="text-sm text-gray-600 dark:text-gray-300 mb-3">No templates saved yet</div>
												<div class="text-xs text-gray-500 dark:text-gray-400">
													Type a commit message and click "Save Template" to create your first template
												</div>
											</div>
										{:else}
											{@const filteredTemplates = templatesList.filter(template =>
												template.nickname.toLowerCase().includes(templateSearchFilter.toLowerCase()) ||
												template.template.toLowerCase().includes(templateSearchFilter.toLowerCase())
											)}

											{#if filteredTemplates.length === 0 && templateSearchFilter.trim()}
												<div class="p-4 text-center">
													<Icon name="search" size={20} class="text-gray-400 mx-auto mb-2" />
													<div class="text-sm text-gray-600 dark:text-gray-300">No templates found matching "{templateSearchFilter}"</div>
													<Button variant="header" onclick={clearTemplateSearch} class="mt-2 text-xs text-blue-600 hover:text-blue-800 underline">Clear search</Button>
												</div>
											{:else}
												{#each filteredTemplates as template, index (template.id)}
													<button
														class="template-item-{index} group w-full text-left p-3 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 {selectedTemplateIndex === index ? 'bg-blue-50 dark:bg-blue-900 border-l-2 border-blue-500' : ''}"
														onclick={() => selectTemplate(template.template)}
														onmouseenter={() => (selectedTemplateIndex = index)}
														role="option"
														aria-selected={selectedTemplateIndex === index}
													>
														<div class="flex items-start gap-3">
															<div class="flex-1">
																<div class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2 flex-wrap">
																	<Icon name="bookmark" size={12} class="text-blue-500 flex-shrink-0" />
																	<span class="break-words">{template.nickname}</span>
																	{#if template.usedCount > 0}
																		<span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1 py-0.5 rounded flex-shrink-0">{template.usedCount} uses</span>
																	{/if}
																</div>
																<div class="text-xs text-gray-600 dark:text-gray-400 break-words whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded mt-1">
																	{template.template}
																</div>
																<div class="text-xs text-gray-500 dark:text-gray-400 mt-2">
																	<span>Created {formatTemplateDate(template.createdAt)}</span>
																</div>
															</div>
															<div class="flex-shrink-0">
																<Button
																	variant="minimal"
																	iconOnly="trash"
																	iconSize={16}
																	onclick={(e) => {
																		e.stopPropagation();
																		deleteTemplate(template.id);
																	}}
																	tooltip="Delete template"
																	aria-label="Delete template"
																	class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded"
																/>
															</div>
														</div>
													</button>
												{/each}
											{/if}
										{/if}
									</div>
									<div class="border-t border-gray-200 dark:border-gray-600 p-2">
										<div class="text-xs text-gray-500 dark:text-gray-400 text-center">
											<Icon name="info" size={12} class="inline mr-1" />
											Use ↑↓ arrows to navigate, Enter to select, Esc to close
										</div>
									</div>
								</div>
							{/if}
						</div>
						<div class="static commit-history-container">
							<Button
								variant="tertiary"
								class="py-1 px-2 text-xs flex items-center gap-1 {showCommitHistory ? 'text-blue-800 bg-blue-50 dark:text-blue-200 dark:bg-blue-900' : ''}"
								onclick={toggleCommitHistory}
								onkeydown={handleHistoryKeydown}
								tooltip="Select from previous commit messages"
								aria-label="Select from previous commit messages"
							>
								<Icon name="history" size={16} class="inline" /> Previous Messages
							</Button>

							<!-- Commit History Dropdown -->
							{#if showCommitHistory}
								<div class="absolute top-full mt-1 left-0 right-0 min-w-[600px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-[30] max-h-80 overflow-y-auto" onkeydown={handleHistoryKeydown} tabindex="-1" role="listbox" aria-label="Commit history">
									{#if loadingHistory}
										<div class="p-4 text-center">
											<div class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
											<div class="text-sm text-gray-600">
												{historyLoadingMessage || "Loading commit history..."}
											</div>
											{#if historyBranchCount > 1}
												<div class="text-xs text-gray-500 mt-1">
													Processing {historyBranchCount} branches in parallel
												</div>
											{/if}
										</div>
									{:else if historyError}
										<div class="p-4 text-center">
											<Icon name="triangleAlert" size={20} class="text-red-500 mx-auto mb-2" />
											<div class="text-sm text-red-600">{historyError}</div>
										</div>
									{:else if commitHistory.length === 0}
										<div class="p-4 text-center">
											<Icon name="info" size={20} class="text-gray-400 mx-auto mb-2" />
											<div class="text-sm text-gray-600">No commit history found</div>
										</div>
									{:else}
										<div class="p-2">
											<!-- Search input -->
											<div class="mb-3 px-2">
												<div class="relative">
													<input
														bind:value={historySearchFilter}
														class="history-search-input w-full px-3 py-1.5 text-xs border rounded-md dark:bg-gray-700 dark:text-gray-100 focus:outline-none transition-colors pr-8 {selectedHistoryIndex === -1 ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300 dark:border-gray-600'}"
														placeholder="Search commits by message, revision, or date..."
														aria-label="Search commit history"
														onkeydown={handleHistoryKeydown}
														onfocus={() => (selectedHistoryIndex = -1)}
													/>
													{#if historySearchFilter.trim()}
														<Button variant="minimal" iconOnly="close" iconSize={12} onclick={clearHistorySearch} tooltip="Clear search" aria-label="Clear search" class="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
													{:else}
														<div class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
															<Icon name="search" size={12} />
														</div>
													{/if}
												</div>
											</div>

											<div class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">
												Recent Commits{historySearchFilter.trim() ? ` (${filteredCommitHistory.length} of ${commitHistory.length})` : ""}:
											</div>

											{#if filteredCommitHistory.length === 0 && historySearchFilter.trim()}
												<div class="p-4 text-center">
													<Icon name="search" size={20} class="text-gray-400 mx-auto mb-2" />
													<div class="text-sm text-gray-600 dark:text-gray-300">No commits found matching "{historySearchFilter}"</div>
													<Button variant="header" onclick={clearHistorySearch} class="mt-2 text-xs text-blue-600 hover:text-blue-800 underline">Clear search</Button>
												</div>
											{:else}
												{#each filteredCommitHistory as commit, index (commit.revision)}
													{@const truncatedMessage = truncateCommitMessage(commit.message, commitHistoryContainerWidth)}
													<button
														class="w-full text-left p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 {selectedHistoryIndex === index ? 'bg-blue-50 dark:bg-blue-900 border-l-2 border-blue-500' : ''}"
														onclick={() => selectCommitMessage(commit.message)}
														onmouseenter={() => (selectedHistoryIndex = index)}
														role="option"
														aria-selected={selectedHistoryIndex === index}
													>
														<div class="flex items-start gap-2">
															<div class="flex-1 min-w-0">
																<div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex items-center gap-1">
																	{truncatedMessage}
																	{#if truncatedMessage !== commit.message}
																		<span use:tooltip={commit.message}>
																			<Icon name="info" size={12} class="text-gray-400 dark:text-gray-500 flex-shrink-0" />
																		</span>
																	{/if}
																</div>
																<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
																	<span class="font-mono">Revision {commit.revision}</span>
																	<span class="mx-1">•</span>
																	<span>{formatCommitDate(commit.date)}</span>
																</div>
															</div>
														</div>
													</button>
												{/each}
											{/if}
										</div>
										<div class="border-t border-gray-200 dark:border-gray-600 p-2">
											<div class="text-xs text-gray-500 dark:text-gray-400 text-center">
												<Icon name="info" size={12} class="inline mr-1" />
												Use ↑↓ arrows to navigate, Enter to select, /f to search, Esc to close
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					</div>

					{#if showTips}
						<div class="text-xs mt-2 space-y-1">
							<div class="text-green-700 dark:text-green-400 font-medium flex items-center gap-1"><Icon name="info" size={16} class="text-green-600 dark:text-green-500" /> Info: Configure commit message templates in Settings to pre-fill messages with your preferred format</div>
							<div class="text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1">
								<Icon name="lightbulb" size={16} class="text-blue-600 dark:text-blue-500" /> Tip: Use custom variable placeholders like $t&#123;variableName&#125; that will be replaced with values from the variables table
							</div>
							<div class="text-purple-700 dark:text-purple-400 font-medium flex items-center gap-1">
								<Icon name="settings" size={16} class="text-purple-600 dark:text-purple-500" /> Special: Use built-in variables $t&#123;&#123;branchFolder&#125;&#125;, $t&#123;&#123;branchVersion&#125;&#125;, and $t&#123;&#123;revision&#125;&#125; for automatic branch information
							</div>
							<div class="text-indigo-700 dark:text-indigo-400 font-medium flex items-center gap-1">
								<Icon name="file" size={16} class="text-indigo-600 dark:text-indigo-500" /> Example: "feat($t&#123;&#123;branchFolder&#125;&#125;): $t&#123;description&#125; for $t&#123;&#123;branchVersion&#125;&#125;"
							</div>
							<div class="text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1"><Icon name="triangleAlert" size={16} class="text-orange-500 dark:text-orange-400" /> Multi-line messages will be converted to single-line format with semicolons (;)</div>
							<div class="text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1"><Icon name="triangleAlert" size={16} class="text-orange-500 dark:text-orange-400" /> Backticks (`) and double quotes (") will be replaced with single quotes (')</div>
						</div>
					{/if}

					<!-- Raw Preview Section -->
					{#if showPreview && commitMessageInput.trim()}
						<div class="mt-3 pt-2 bg-gray-50 dark:bg-gray-700 rounded-md p-2">
							<h4 class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Preview:</h4>
							<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md p-2 font-mono text-xs text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">
								{commitMessagePreview || "Empty commit message"}
							</div>
						</div>
					{/if}
				</section>
			</div>

			<!-- Unified Quick Filter Panel -->
			<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm mb-4">
				<div class="p-4 h-20">
					<div class="flex items-start gap-3">
						<label for="unified-search" class="text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0 mt-2">Quick filter:</label>
						<div class="flex-1 relative">
							<input
								id="unified-search"
								bind:value={searchFilter}
								class="quick-filter-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors {searchFilter.trim()
									? 'active border-blue-300 filter-active-bg'
									: ''}"
								placeholder="Search paths by path, status, branch, or date..."
								aria-label="Search paths in both tables by path, status, branch, or date"
							/>
							{#if filterPending && searchFilter.trim()}
								<div class="absolute right-8 top-1/2 -translate-y-1/2">
									<div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
								</div>
							{/if}
							{#if searchFilter.trim()}
								<Button
									variant="minimal"
									iconOnly="close"
									iconSize={14}
									onclick={clearSearchFilter}
									tooltip="Clear filter"
									aria-label="Clear search filter"
									class="clear-filter-btn absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
								/>
							{/if}
							{#if searchFilter.trim()}
								<div class="absolute top-full mt-1 text-xs text-gray-500 dark:text-gray-400">Filtering both selection and staged tables</div>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- File Selection Table -->
			<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm {isSelectionCollapsed ? 'collapsed-panel' : ''}">
				<div class="p-4 border-b border-gray-200 dark:border-gray-700">
					<div class="flex items-center justify-between">
						<h3
							class="text-base font-medium text-gray-800 dark:text-gray-100 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
							onclick={() => (isSelectionCollapsed = !isSelectionCollapsed)}
							aria-label={isSelectionCollapsed ? "Expand selection panel" : "Collapse selection panel"}
						>
							Select Paths ({allFiles.length})
							{#if searchFilter.trim()}
								- {filteredFiles.length} shown
							{/if}
						</h3>
					</div>
				</div>

				{#if isSelectionCollapsed}
					<div class="p-3 text-sm text-gray-600 dark:text-gray-300">
						<div class="flex items-start gap-2">
							<Icon name="info" size={14} class="mt-0.5 flex-shrink-0" />
							<div>
								<div class="font-medium">
									{filteredFiles.length} path{filteredFiles.length !== 1 ? "s" : ""} available for staging
								</div>
								{#if filteredFiles.length > 0}
									<div class="text-xs mt-1 text-gray-500 dark:text-gray-400">
										{formatStatusBreakdown(filteredFiles)}
									</div>
								{/if}
							</div>
						</div>
					</div>
				{:else}
					<div class="overflow-auto h-96 files-table-container {allFiles.length > 500 ? 'large-table' : ''}">
						<table class="commit-table w-full">
							<colgroup>
								<col class="checkbox-column" /><!-- Checkbox -->
								<col class="branch-column" /><!-- Branch -->
								<col class="path-column" /><!-- Path -->
								<col class="status-column" /><!-- Status -->
								<col class="modified-column" /><!-- Last Modified -->
								<col class="actions-column" /><!-- Actions -->
							</colgroup>
							<thead class="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 text-gray-500 dark:text-gray-400">
								<tr>
									<th class="px-3 py-2 text-left" style="height: 40px;">
										<Button
											variant="tertiary"
											iconOnly="chevronDoubleDown"
											onclick={moveAllVisibleToStaged}
											disabled={filteredFiles.filter(isFileSelectable).length === 0}
											tooltip={{ content: "Move all visible files to staged", position: "right" }}
											aria-label="Move all visible files to staged"
											class="p-1"
										/>
									</th>
									<th class="px-3 py-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 whitespace-nowrap overflow-hidden font-medium" style="height: 40px;" onclick={() => setSortColumn("branch")}>
										<div class="flex items-center min-w-0">
											<span class="flex-shrink-0">Branch</span>
											<div class="w-4 h-4 ml-1 flex-shrink-0">
												{#if sortColumn === "branch"}
													<Icon name={sortDirection === "asc" ? "chevronUp" : "chevronDown"} size={16} />
												{/if}
											</div>
										</div>
									</th>
									<th class="px-3 py-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 whitespace-nowrap overflow-hidden font-medium" style="height: 40px;" onclick={() => setSortColumn("path")}>
										<div class="flex items-center min-w-0">
											<span class="flex-shrink-0">Path</span>
											<div class="w-4 h-4 ml-1 flex-shrink-0">
												{#if sortColumn === "path"}
													<Icon name={sortDirection === "asc" ? "chevronUp" : "chevronDown"} size={16} />
												{/if}
											</div>
										</div>
									</th>
									<th class="px-3 py-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 whitespace-nowrap overflow-hidden font-medium" style="height: 40px;" onclick={() => setSortColumn("status")}>
										<div class="flex items-center min-w-0">
											<span class="flex-shrink-0">Status</span>
											<div class="w-4 h-4 ml-1 flex-shrink-0">
												{#if sortColumn === "status"}
													<Icon name={sortDirection === "asc" ? "chevronUp" : "chevronDown"} size={16} />
												{/if}
											</div>
										</div>
									</th>
									<th class="px-3 py-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 whitespace-nowrap overflow-hidden font-medium" style="height: 40px;" onclick={() => setSortColumn("modified")}>
										<div class="flex items-center min-w-0">
											<span class="flex-shrink-0">Last Modified</span>
											<div class="w-4 h-4 ml-1 flex-shrink-0">
												{#if sortColumn === "modified"}
													<Icon name={sortDirection === "asc" ? "chevronUp" : "chevronDown"} size={16} />
												{/if}
											</div>
										</div>
									</th>
									<th class="px-3 py-2 text-left font-medium" style="height: 40px;">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#if filteredFiles.length > 0}
									{#each filteredFiles as file, index (`${file.branchPath}:${file.path}`)}

										<tr class="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 {activeTable === 'files' && selectedFileIndex === index ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500' : ''}">
											<td class="px-3 py-2">
												<Button
													variant="tertiary"
													iconOnly="chevronDoubleDown"
													onclick={() => moveFileToStaged(file)}
													disabled={file.isConflicted || file.needsUpdate}
													tooltip={{
														content: file.isConflicted || file.needsUpdate ? (file.isConflicted && file.needsUpdate ? "Cannot move: File is conflicted and needs update" : file.isConflicted ? "Cannot move: File is conflicted" : "Cannot move: File needs update") : "Move to staged",
														position: "right",
													}}
													aria-label={file.isConflicted || file.needsUpdate ? "Cannot move file" : `Move ${file.relativePath} to staged`}
													class="p-1"
												/>
											</td>
											<td class="px-3 py-2 whitespace-nowrap overflow-hidden">
												<div class="flex items-center space-x-2 overflow-hidden">
													<div class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: {selectedBranchDetails.find((b) => b.folderName === file.branchFolder)?.folderColor}"></div>
													<span class="font-medium text-sm flex-shrink-0 text-gray-900 dark:text-gray-100">{file.branchFolder}</span>
													<span class="text-sm text-gray-600 dark:text-gray-300 truncate" use:tooltip={file.branchVersion}>{file.branchVersion}</span>
													<span class="text-xs text-gray-400 dark:text-gray-500 truncate" use:tooltip={file.lastPathSegment}>{file.lastPathSegment}</span>
												</div>
											</td>
											<td class="px-3 py-2 min-w-0">
												<div class="space-y-1">
													<!-- Main path display with intelligent truncation -->
													<div class="flex items-center min-w-0">
														{#if file.isDirectory}
															<Icon name="folder" size={14} class="flex-shrink-0 mr-1 text-yellow-600" />
														{:else}
															<Icon name="file" size={14} class="flex-shrink-0 mr-1 text-gray-500 dark:text-gray-400" />
														{/if}
														<span class="min-w-0 flex-1 font-mono text-sm text-gray-900 dark:text-gray-100 truncate" use:tooltip={file.relativePath}>{file.relativePath}</span>
													</div>

													<!-- Secondary actions and status indicators -->
													<div class="flex flex-wrap items-center gap-2 min-h-0">
														{#if file.isConflicted}
															<div class="flex items-center text-xs text-red-600 font-semibold whitespace-nowrap">
																<Icon name="triangleAlert" size={12} class="mr-1.5 flex-shrink-0" />
																<span>Conflicted</span>
															</div>
														{/if}

														{#if file.needsUpdate}
															<div class="flex items-center text-xs text-yellow-600 font-semibold whitespace-nowrap">
																<Icon name="triangleAlert" size={12} class="mr-1.5 flex-shrink-0" />
																<span>Needs Update</span>
															</div>
														{/if}
													</div>
												</div>
											</td>
											<td class="px-3 py-2">
												<span
													class="px-2 py-1 rounded text-xs font-medium {file.status === 'modified'
														? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
														: file.status === 'added'
															? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
															: file.status === 'deleted'
																? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
																: file.status === 'unversioned'
																	? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
																	: file.status === 'missing'
																		? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
																		: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}"
												>
													{file.status}
												</span>
												{#if file.propsStatus && file.propsStatus !== "normal" && file.propsStatus !== "none"}
													<br />
													<span class="ml-1 px-1 py-0.5 rounded text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
														props: {file.propsStatus}
													</span>
												{/if}
											</td>
											<td class="px-3 py-2">
												<span class="text-sm text-gray-600 dark:text-gray-300">{file.lastModified}</span>
											</td>
											<td class="px-3 py-2">
												<div class="flex items-center space-x-1">
													{#if !file.isDirectory && file.status !== "unversioned"}
														<Button variant="minimal" class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900" onclick={() => showFileDiff(file)} disabled={diffingFiles.has(file.path)} tooltip="View differences" aria-label="View differences for {file.relativePath}">
															{#if diffingFiles.has(file.path)}
																<div class="w-4 h-4 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
															{:else}
																<Icon name="diff" size={16} />
															{/if}
														</Button>
													{:else}
														<!-- Invisible spacer to maintain consistent button alignment -->
														<div class="w-6 h-6"></div>
													{/if}
													{#if file.status === "added" || file.status === "deleted"}
														<Button variant="minimal" class="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900" onclick={() => unversionFile(file)} disabled={unversioningFiles.has(file.path)} tooltip="Unversion file" aria-label="Unversion {file.relativePath}">
															{#if unversioningFiles.has(file.path)}
																<div class="w-4 h-4 border border-purple-600 border-t-transparent rounded-full animate-spin"></div>
															{:else}
																<Icon name="flagOff" size={16} />
															{/if}
														</Button>
													{:else}
														<Button variant="minimal" class="p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900" onclick={() => revertFile(file)} disabled={revertingFiles.has(file.path)} tooltip="Revert changes" aria-label="Revert changes for {file.relativePath}">
															{#if revertingFiles.has(file.path)}
																<div class="w-4 h-4 border border-orange-600 border-t-transparent rounded-full animate-spin"></div>
															{:else}
																<Icon name="undo" size={16} />
															{/if}
														</Button>
													{/if}
												</div>
											</td>
										</tr>
									{/each}
								{:else}
									<tr>
										<td colspan="6" class="p-8 text-center text-gray-500 dark:text-gray-400">
											<Icon name="success" size={48} class="mx-auto mb-3 text-gray-300" />
											<p class="text-lg font-medium">No paths require staging</p>
											<p class="text-sm mt-1">All selected branches are up to date with no pending changes</p>
											<Button variant="tertiary" class="mt-3 px-3 py-1.5 text-sm" onclick={refreshSVNStatus} disabled={refreshing}>
												{refreshing ? "Refreshing..." : "Refresh status"}
											</Button>
										</td>
									</tr>
								{/if}
							</tbody>
						</table>
					</div>
				{/if}
			</div>

			<!-- Staging Area -->
			<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm {isStagedCollapsed ? 'collapsed-panel' : ''}">
				<div class="p-4 border-b border-gray-200 dark:border-gray-700">
					<div class="flex items-center justify-between">
						<h3 class="text-base font-medium text-gray-800 dark:text-gray-100 cursor-pointer hover:text-gray-600 dark:hover:text-gray-400 transition-colors" onclick={() => (isStagedCollapsed = !isStagedCollapsed)} aria-label={isStagedCollapsed ? "Expand staged panel" : "Collapse staged panel"}>
							Staged Paths ({stagedFiles.length})
							{#if searchFilter.trim()}
								- {filteredStagedFiles.length} shown
							{/if}
						</h3>
					</div>
				</div>
				{#if isStagedCollapsed}
					<div class="p-3 text-sm text-gray-600 dark:text-gray-300">
						<div class="flex items-start justify-between gap-2">
							<div class="flex items-start gap-2 flex-1">
								<Icon name="info" size={14} class="mt-0.5 flex-shrink-0" />
								<div>
									<div class="font-medium">
										{stagedFiles.length} path{stagedFiles.length !== 1 ? "s" : ""} staged for commit
									</div>
									{#if stagedFiles.length > 0}
										<div class="text-xs mt-1 text-gray-500 dark:text-gray-400">
											{formatStatusBreakdown(stagedFiles)}
										</div>
									{/if}
								</div>
							</div>
							{#if stagedFiles.length > 0}
								<Button variant="primary" class="px-3 py-1 bg-green-600 hover:bg-green-700 text-xs font-medium flex-shrink-0" onclick={startCommit} disabled={!commitValidation.isValid} tooltip={commitButtonTooltip}>Commit</Button>
							{/if}
						</div>
					</div>
				{:else}
					<div class="overflow-auto h-96 staged-table-container {stagedFiles.length > 500 ? 'large-table' : ''}">
						<table class="commit-table w-full">
							<colgroup>
								<col class="checkbox-column" /><!-- Checkbox -->
								<col class="branch-column" /><!-- Branch -->
								<col class="path-column" /><!-- Path -->
								<col class="status-column" /><!-- Status -->
								<col class="modified-column" /><!-- Last Modified -->
								<col class="actions-column" /><!-- Actions -->
							</colgroup>
							<thead class="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 text-gray-500 dark:text-gray-400">
								<tr>
									<th class="px-3 py-2 text-left" style="height: 40px;">
										<Button
											variant="tertiary"
											colorScheme="orange"
											iconOnly="chevronDoubleUp"
											onclick={moveAllVisibleToSelection}
											disabled={filteredStagedFiles.filter(isFileSelectable).length === 0}
											tooltip={{ content: "Move all visible files back to selection", position: "right" }}
											aria-label="Move all visible files back to selection"
											class="p-1"
										/>
									</th>
									<th class="px-3 py-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 whitespace-nowrap overflow-hidden font-medium" style="height: 40px;" onclick={() => setSortColumn("branch")}>
										<div class="flex items-center min-w-0">
											<span class="flex-shrink-0">Branch</span>
											<div class="w-4 h-4 ml-1 flex-shrink-0">
												{#if sortColumn === "branch"}
													<Icon name={sortDirection === "asc" ? "chevronUp" : "chevronDown"} size={16} />
												{/if}
											</div>
										</div>
									</th>
									<th class="px-3 py-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 whitespace-nowrap overflow-hidden font-medium" style="height: 40px;" onclick={() => setSortColumn("path")}>
										<div class="flex items-center min-w-0">
											<span class="flex-shrink-0">Path</span>
											<div class="w-4 h-4 ml-1 flex-shrink-0">
												{#if sortColumn === "path"}
													<Icon name={sortDirection === "asc" ? "chevronUp" : "chevronDown"} size={16} />
												{/if}
											</div>
										</div>
									</th>
									<th class="px-3 py-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 whitespace-nowrap overflow-hidden font-medium" style="height: 40px;" onclick={() => setSortColumn("status")}>
										<div class="flex items-center min-w-0">
											<span class="flex-shrink-0">Status</span>
											<div class="w-4 h-4 ml-1 flex-shrink-0">
												{#if sortColumn === "status"}
													<Icon name={sortDirection === "asc" ? "chevronUp" : "chevronDown"} size={16} />
												{/if}
											</div>
										</div>
									</th>
									<th class="px-3 py-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 whitespace-nowrap overflow-hidden font-medium" style="height: 40px;" onclick={() => setSortColumn("modified")}>
										<div class="flex items-center min-w-0">
											<span class="flex-shrink-0">Last Modified</span>
											<div class="w-4 h-4 ml-1 flex-shrink-0">
												{#if sortColumn === "modified"}
													<Icon name={sortDirection === "asc" ? "chevronUp" : "chevronDown"} size={16} />
												{/if}
											</div>
										</div>
									</th>
									<th class="px-3 py-2 text-left font-medium" style="height: 40px;">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#if stagedFiles.length > 0}
									{#each filteredStagedFiles as file, index (`${file.branchPath}:${file.path}`)}

										{@const hasDependencyConflicts = hasUnstageConflicts(file)}
										<tr class="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 {activeTable === 'staged' && selectedStagedFileIndex === index ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500' : ''}">
											<td class="px-3 py-2">
												<div class="relative inline-block">
													<Button
														variant="tertiary"
														colorScheme={file.isConflicted || file.needsUpdate ? 'gray' : 'orange'}
														iconOnly="chevronDoubleUp"
														onclick={() => moveFileToSelection(file)}
														disabled={file.isConflicted || file.needsUpdate}
														tooltip={{
															content:
																file.isConflicted || file.needsUpdate
																	? file.isConflicted && file.needsUpdate
																		? "Cannot move: File is conflicted and needs update"
																		: file.isConflicted
																			? "Cannot move: File is conflicted"
																			: "Cannot move: File needs update"
																	: hasDependencyConflicts
																		? `Directory has child dependencies - click to see warning`
																		: "Move back to selection",
															position: "right",
														}}
														aria-label={file.isConflicted || file.needsUpdate ? "Cannot move file" : hasDependencyConflicts ? `Move ${file.relativePath} with dependency warnings` : `Move ${file.relativePath} back to selection`}
														class="p-1 {hasDependencyConflicts && !file.isConflicted && !file.needsUpdate ? 'border border-orange-300 dark:border-orange-600' : ''}"
													/>
													{#if hasDependencyConflicts && !file.isConflicted && !file.needsUpdate}
														<div class="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
															<Icon name="triangleAlert" size={8} class="text-white" />
														</div>
													{/if}
												</div>
											</td>
											<td class="px-3 py-2 whitespace-nowrap overflow-hidden">
												<div class="flex items-center space-x-2 overflow-hidden">
													<div class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: {selectedBranchDetails.find((b) => b.folderName === file.branchFolder)?.folderColor}"></div>
													<span class="font-medium text-sm flex-shrink-0 text-gray-900 dark:text-gray-100">{file.branchFolder}</span>
													<span class="text-sm text-gray-600 dark:text-gray-300 truncate" use:tooltip={file.branchVersion}>{file.branchVersion}</span>
													<span class="text-xs text-gray-400 dark:text-gray-500 truncate" use:tooltip={file.lastPathSegment}>{file.lastPathSegment}</span>
												</div>
											</td>
											<td class="px-3 py-2 min-w-0">
												<div class="space-y-1">
													<!-- Main path display with intelligent truncation -->
													<div class="flex items-center min-w-0">
														{#if file.isDirectory}
															<Icon name="folder" size={14} class="flex-shrink-0 mr-1 text-yellow-600" />
														{:else}
															<Icon name="file" size={14} class="flex-shrink-0 mr-1 text-gray-500 dark:text-gray-400" />
														{/if}
														<span class="min-w-0 flex-1 font-mono text-sm text-gray-900 dark:text-gray-100 truncate" use:tooltip={file.relativePath}>{file.relativePath}</span>
													</div>

													<!-- Secondary actions and status indicators -->
													<div class="flex flex-wrap items-center gap-2 min-h-0">
														{#if file.isConflicted}
															<div class="flex items-center text-xs text-red-600 font-medium whitespace-nowrap">
																<span class="mr-1" aria-hidden="true">⚠</span>
																<span>Conflicted</span>
															</div>
														{/if}

														{#if file.needsUpdate}
															<div class="flex items-center text-xs text-yellow-600 whitespace-nowrap">
																<span class="mr-1" aria-hidden="true">⬆</span>
																<span>Needs Update</span>
															</div>
														{/if}
													</div>
												</div>
											</td>
											<td class="px-3 py-2">
												<span
													class="px-2 py-1 rounded text-xs font-medium {file.status === 'modified'
														? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
														: file.status === 'added'
															? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
															: file.status === 'deleted'
																? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
																: file.status === 'unversioned'
																	? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
																	: file.status === 'missing'
																		? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
																		: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}"
												>
													{file.status}
												</span>
												{#if file.propsStatus && file.propsStatus !== "normal" && file.propsStatus !== "none"}
													<br />
													<span class="ml-1 px-1 py-0.5 rounded text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
														props: {file.propsStatus}
													</span>
												{/if}
											</td>
											<td class="px-3 py-2">
												<span class="text-sm text-gray-600 dark:text-gray-300">{file.lastModified}</span>
											</td>
											<td class="px-3 py-2">
												<div class="flex items-center space-x-1">
													{#if !file.isDirectory && file.status !== "unversioned"}
														<Button variant="minimal" class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900" onclick={() => showFileDiff(file)} disabled={diffingFiles.has(file.path)} tooltip="View differences" aria-label="View differences for {file.relativePath}">
															{#if diffingFiles.has(file.path)}
																<div class="w-4 h-4 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
															{:else}
																<Icon name="diff" size={16} />
															{/if}
														</Button>
													{:else}
														<!-- Invisible spacer to maintain consistent button alignment -->
														<div class="w-6 h-6"></div>
													{/if}
												</div>
											</td>
										</tr>
									{/each}
								{:else}
									<tr>
										<td colspan="6" class="p-8 text-center text-gray-500 dark:text-gray-400">
											<Icon name="info" size={48} class="mx-auto mb-3 text-gray-300" />
											<p class="text-lg font-medium">No paths staged yet</p>
											<p class="text-sm mt-1">Select paths from the table above to stage them for commit</p>
										</td>
									</tr>
								{/if}
							</tbody>
						</table>
					</div>
					<div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-end">
						<button
							class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							onclick={startCommit}
							disabled={!commitValidation.isValid}
							use:tooltip={commitButtonTooltip}
							aria-label={commitInProgress ? "Commit in progress" : stagedFiles.length > 0 ? "Commit staged files" : "No files staged"}
						>
							{commitInProgress ? "Committing..." : stagedFiles.length > 0 ? `Commit ${stagedFiles.length} File${stagedFiles.length !== 1 ? "s" : ""}` : "Commit"}
						</button>
					</div>
				{/if}
			</div>
		</div>
	{:else if currentPhase === "committing"}
		<!-- Committing Phase -->
		<div class="text-center py-12">
			<div class="mb-6">
				<div class="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
				<h2 class="text-base font-medium text-gray-800 dark:text-gray-100 mb-4">Committing Changes</h2>
				<div class="max-w-md mx-auto">
					<div class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
						Group {currentCommitGroup} of {commitGroups.length}
					</div>
					<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
						<div class="bg-green-500 h-3 rounded-full transition-all duration-500" style="width: {(currentCommitGroup / commitGroups.length) * 100}%"></div>
					</div>
				</div>
			</div>

			{#if commitResults.length > 0}
				<div class="max-w-2xl mx-auto">
					<h3 class="text-base font-medium text-gray-800 dark:text-gray-100 mb-4">Progress</h3>
					<div class="space-y-2">
						{#each commitResults as result}
							<div class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border rounded-lg {result.success ? 'border-green-200 dark:border-green-700' : 'border-red-200 dark:border-red-700'}">
								<div class="flex items-center space-x-3">
									<Icon name={result.success ? "success" : "close"} size={16} class={result.success ? "text-green-600" : "text-red-600"} />
									<span class="font-medium text-gray-800 dark:text-gray-100">{result.branchPath}</span>
								</div>
								{#if result.success}
									<span class="text-green-600 text-sm">{result.revision || "Success"}</span>
								{:else}
									<span class="text-red-600 text-sm">Failed</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{:else if currentPhase === "completed"}
		<!-- Completed Phase -->
		<div class="py-12">
			<div class="text-center mb-6">
				<Icon name="success" size={64} class="text-green-500 mx-auto mb-4" />
				<h2 class="text-base font-medium text-gray-800 dark:text-gray-100 mb-4">Commit Complete</h2>
			</div>

			<div class="max-w-4xl mx-auto">
				<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
					<div class="p-4 border-b border-gray-200 dark:border-gray-700">
						<h3 class="text-base font-medium text-gray-800 dark:text-gray-100 text-left">Commit Results</h3>
					</div>
					<div class="overflow-x-auto">
						<table class="commit-results-table w-full border-collapse">
							<thead class="bg-gray-50 dark:bg-gray-700">
								<tr>
									<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Branch</th>
									<th class="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
									<th class="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Files</th>
									<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revision</th>
									<th class="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
								</tr>
							</thead>
							<tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
								{#each commitResults as result}
									{@const pathSegments = result.branchPath.split(/[\\/]/)}
									{@const lastPathSegment = pathSegments[pathSegments.length - 1] || ""}
									{@const folderDetail = selectedBranchDetails.find((b) => b.folderName === result.branchFolder)}
									{@const folderColor = folderDetail?.folderColor || "#6b7280"}
									<tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
										<td class="px-4 py-3 whitespace-nowrap text-left">
											<div class="flex items-center space-x-2">
												<div class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: {folderColor}"></div>
												<span class="font-medium text-sm dark:text-gray-300">{result.branchFolder || "Unknown"}</span>
												<span class="text-sm text-gray-600 dark:text-gray-300">{result.branchVersion || "Unknown"}</span>
												<span class="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[100px]" use:tooltip={lastPathSegment}>{lastPathSegment}</span>
											</div>
										</td>
										<td class="px-2 py-3 whitespace-nowrap text-left">
											<span class="px-1.5 py-0.5 rounded text-xs font-medium {result.success ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}">
												{result.success ? "✓" : "✗"}
											</span>
										</td>
										<td class="px-2 py-3 whitespace-nowrap text-left text-sm text-gray-900 dark:text-gray-100">{result.fileCount || 0}</td>
										<td class="px-4 py-3 whitespace-nowrap text-left">
											{#if result.success && result.revision}
												<span class="font-mono text-sm text-gray-900 dark:text-gray-100">{result.revision}</span>
											{:else if result.error}
												<span class="text-red-600 dark:text-red-400 text-sm" use:tooltip={result.error}>{result.error.length > 30 ? result.error.substring(0, 30) + "..." : result.error}</span>
											{:else}
												<span class="text-gray-400" use:tooltip={`Debug: success=${result.success}, revision='${result.revision}', hasRevision=${"revision" in result}`}>-</span>
											{/if}
										</td>
										<td class="px-2 py-3 whitespace-nowrap text-left">
											<div class="flex items-center gap-1">
												{#if result.success && result.revision}
													<Button
														variant="minimal"
														iconOnly="copy"
														iconSize={14}
														onclick={() => copyToClipboard(result.revision)}
														tooltip="Copy revision number"
														aria-label="Copy revision {result.revision}"
														class="p-1 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-700 dark:text-green-200 rounded transition-colors"
													/>
												{/if}
												{#if result.success && result.processedMessage}
													<Button
														variant="minimal"
														iconOnly="copy"
														iconSize={14}
														onclick={() => copyToClipboard(result.processedMessage)}
														tooltip="Copy processed commit message"
														aria-label="Copy processed message for {result.branchFolder}"
														class="p-1 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 rounded transition-colors"
													/>
												{/if}
												{#if result.success && result.output}
													<Button
														variant="minimal"
														iconOnly="copy"
														iconSize={14}
														onclick={() => copyToClipboard(result.output)}
														tooltip="Copy commit output"
														aria-label="Copy output for {result.branchFolder}"
														class="p-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
													/>
												{/if}
												{#if !result.success && result.error}
													<Button
														variant="minimal"
														iconOnly="copy"
														iconSize={14}
														onclick={() => copyToClipboard(result.error)}
														tooltip="Copy error message"
														aria-label="Copy error message for {result.branchFolder}"
														class="p-1 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-200 rounded transition-colors"
													/>
												{:else if !result.success || (!result.revision && !result.processedMessage && !result.output)}
													<span class="text-gray-400 dark:text-gray-500">-</span>
												{/if}
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				<!-- Commit Template Section -->
				{#if commitResults.some((r) => r.success)}
					<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm mt-4">
						<div class="p-4 border-b border-gray-200 dark:border-gray-700">
							<h3 class="text-base font-medium text-gray-800 dark:text-gray-100 text-left">Generate Copy Text</h3>
						</div>
						<div class="p-4 space-y-4">
							<!-- Template Input -->
							<div>
								<label for="commit-template-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left"> Template (use placeholders for group-specific values) </label>
								<input
									id="commit-template-input"
									bind:value={commitTemplateInput}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="Enter template with placeholders..."
									aria-label="Commit template for copy text generation"
								/>

								<!-- Show Tips and Templates Buttons -->
								<div class="mt-2 flex justify-start gap-4 relative">
									<Button
										variant="tertiary"
										class="py-1 px-2 text-xs flex items-center gap-1 {showCommitCompleteTips ? 'text-blue-800 bg-blue-50 dark:text-blue-200 dark:bg-blue-900' : ''}"
										onclick={() => (showCommitCompleteTips = !showCommitCompleteTips)}
										tooltip={showCommitCompleteTips ? "Hide commit tips" : "Show commit tips"}
										aria-label={showCommitCompleteTips ? "Hide commit tips" : "Show commit tips"}
									>
										<Icon name="lightbulb" size={16} class="inline" />
										{showCommitCompleteTips ? "Hide Tips" : "Show Tips"}
									</Button>
									<div class="static commit-complete-templates-container">
										<Button
											variant="tertiary"
											class="py-1 px-2 text-xs flex items-center gap-1 {showCommitCompleteTemplates ? 'text-blue-800 bg-blue-50 dark:text-blue-200 dark:bg-blue-900' : ''}"
											onclick={toggleCommitCompleteTemplates}
											onkeydown={handleCommitCompleteTemplateKeydown}
											tooltip="Select from saved copy text templates"
											aria-label="Select from saved copy text templates"
										>
											<Icon name="bookmark" size={16} class="inline" /> Templates
										</Button>

										<!-- Templates Dropdown -->
										{#if showCommitCompleteTemplates}
											<div class="absolute top-full mt-1 left-0 right-0 min-w-[600px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-[30] max-h-96 overflow-y-auto" onkeydown={handleCommitCompleteTemplateKeydown} tabindex="-1" role="listbox" aria-label="Copy text templates">
												<div class="p-2">
													<!-- Header with Save Template Button -->
													<div class="flex items-center justify-between mb-3 px-2">
														<div class="text-xs font-medium text-gray-700 dark:text-gray-300">
															Saved Templates ({commitCompleteTemplates.length}):
														</div>
														<Button
															variant="secondary"
															class="px-3 py-1 text-xs"
															onclick={() => showSaveCommitCompleteTemplateDialog = true}
															tooltip="Save current template as saved template"
															aria-label="Save current template as saved template"
															leftIcon="plus"
															iconSize={12}
															disabled={!commitTemplateInput.trim()}
														>
															Save Template
														</Button>
													</div>

													<!-- Search input -->
													<div class="mb-3 px-2">
														<div class="relative">
															<input
																bind:value={commitCompleteTemplateSearchFilter}
																class="commit-complete-template-search-input w-full px-3 py-1.5 text-xs border rounded-md dark:bg-gray-700 dark:text-gray-100 focus:outline-none transition-colors pr-8 {selectedCommitCompleteTemplateIndex === -1 ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300 dark:border-gray-600'}"
																placeholder="Search templates by nickname or content..."
																aria-label="Search templates"
																onkeydown={handleCommitCompleteTemplateKeydown}
																onfocus={() => (selectedCommitCompleteTemplateIndex = -1)}
															/>
															{#if commitCompleteTemplateSearchFilter.trim()}
																<Button variant="minimal" iconOnly="close" iconSize={12} onclick={clearCommitCompleteTemplateSearch} tooltip="Clear search" aria-label="Clear search" class="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
															{:else}
																<div class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
																	<Icon name="search" size={12} />
																</div>
															{/if}
														</div>
													</div>

													{#if commitCompleteTemplates.length === 0}
														<div class="p-4 text-center">
															<Icon name="bookmark" size={20} class="text-gray-400 mx-auto mb-2" />
															<div class="text-sm text-gray-600 dark:text-gray-300 mb-3">No templates saved yet</div>
															<div class="text-xs text-gray-500 dark:text-gray-400">
																Type a template and click "Save Template" to create your first template
															</div>
														</div>
													{:else}
														{@const filteredCommitCompleteTemplates = commitCompleteTemplates.filter(template =>
															template.nickname.toLowerCase().includes(commitCompleteTemplateSearchFilter.toLowerCase()) ||
															template.template.toLowerCase().includes(commitCompleteTemplateSearchFilter.toLowerCase())
														)}

														{#if filteredCommitCompleteTemplates.length === 0 && commitCompleteTemplateSearchFilter.trim()}
															<div class="p-4 text-center">
																<Icon name="search" size={20} class="text-gray-400 mx-auto mb-2" />
																<div class="text-sm text-gray-600 dark:text-gray-300">No templates found matching "{commitCompleteTemplateSearchFilter}"</div>
																<Button variant="header" onclick={clearCommitCompleteTemplateSearch} class="mt-2 text-xs text-blue-600 hover:text-blue-800 underline">Clear search</Button>
															</div>
														{:else}
															{#each filteredCommitCompleteTemplates as template, index (template.id)}
																<button
																	class="commit-complete-template-item-{index} group w-full text-left p-3 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 {selectedCommitCompleteTemplateIndex === index ? 'bg-blue-50 dark:bg-blue-900 border-l-2 border-blue-500' : ''}"
																	onclick={() => selectCommitCompleteTemplate(template.template)}
																	onmouseenter={() => (selectedCommitCompleteTemplateIndex = index)}
																	role="option"
																	aria-selected={selectedCommitCompleteTemplateIndex === index}
																>
																	<div class="flex items-start gap-3">
																		<div class="flex-1">
																			<div class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2 flex-wrap">
																				<Icon name="bookmark" size={12} class="text-blue-500 flex-shrink-0" />
																				<span class="break-words">{template.nickname}</span>
																				{#if template.usedCount > 0}
																					<span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1 py-0.5 rounded flex-shrink-0">{template.usedCount} uses</span>
																				{/if}
																			</div>
																			<div class="text-xs text-gray-600 dark:text-gray-400 break-words whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded mt-1">
																				{template.template}
																			</div>
																			<div class="text-xs text-gray-500 dark:text-gray-400 mt-2">
																				<span>Created {formatTemplateDate(template.createdAt)}</span>
																			</div>
																		</div>
																		<div class="flex-shrink-0">
																			<Button
																				variant="minimal"
																				iconOnly="trash"
																				iconSize={16}
																				onclick={(e) => {
																					e.stopPropagation();
																					deleteCommitCompleteTemplate(template.id);
																				}}
																				tooltip="Delete template"
																				aria-label="Delete template"
																				class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded"
																			/>
																		</div>
																	</div>
																</button>
															{/each}
														{/if}
													{/if}
												</div>
												<div class="border-t border-gray-200 dark:border-gray-600 p-2">
													<div class="text-xs text-gray-500 dark:text-gray-400 text-center">
														<Icon name="info" size={12} class="inline mr-1" />
														Use ↑↓ arrows to navigate, Enter to select, Esc to close
													</div>
												</div>
											</div>
										{/if}
									</div>
								</div>

								{#if showCommitCompleteTips}
									<div class="mt-2 text-xs text-gray-600 dark:text-gray-300 space-y-1">
										<div class="flex items-start gap-1">
											<Icon name="info" size={12} class="mt-0.5 flex-shrink-0" />
											<div class="flex flex-wrap items-center gap-1">
												<span>Available placeholders:</span>
												<code class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded text-xs transition-all duration-200">$t&#123;&#123;branchFolder&#125;&#125;</code>
												<code class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded text-xs transition-all duration-200">$t&#123;&#123;branchVersion&#125;&#125;</code>
												<code class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded text-xs transition-all duration-200">$t&#123;&#123;revision&#125;&#125;</code>
											</div>
										</div>
										{#if variableColumns.length > 0}
											<div class="flex items-start gap-1">
												<Icon name="lightbulb" size={12} class="mt-0.5 flex-shrink-0" />
												<div class="flex flex-wrap items-center gap-1">
													<span>Available custom variables:</span>
													{#each variableColumns as col}
														<code class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded text-xs transition-all duration-200">$t&#123;{col.name}&#125;</code>
													{/each}
												</div>
											</div>
										{:else}
											<div class="flex items-start gap-1">
												<Icon name="lightbulb" size={12} class="mt-0.5 flex-shrink-0" />
												<span>No custom variables defined. Add variables above to use in your template.</span>
											</div>
										{/if}
									</div>
								{/if}
							</div>

							<!-- Generated Text Preview -->
							{#if commitResults.some((r) => r.success)}
								{@const successfulCommits = commitResults.filter((r) => r.success)}
								{@const generatedTexts = successfulCommits.map((result) => {
									let text = commitTemplateInput;

									// Process special variables
									text = text.replace(/\$t\{\{branchFolder\}\}/g, result.branchFolder || "Unknown");
									text = text.replace(/\$t\{\{branchVersion\}\}/g, result.branchVersion || "Unknown");
									text = text.replace(/\$t\{\{revision\}\}/g, result.revision || "Unknown");

									// Process custom variables if they exist
									if (variableColumns.length > 0 && result.branchFolder) {
										variableColumns.forEach((col) => {
											const value = col.values[result.branchFolder] || col.defaultValue || "";
											text = text.replace(new RegExp(`\\$t\\{${col.name}\\}`, "g"), value);
										});
									}

									return text;
								})}
								{@const combinedText = includeCommitMessage && commitResults.length > 0 && commitResults[0].processedMessage ? `${commitResults[0].processedMessage}\n\n${generatedTexts.join("\n")}` : generatedTexts.join("\n")}
								<div>
									<div class="flex items-center justify-between mb-2">
										<div class="flex items-center gap-4">
											<span class="text-sm font-medium text-gray-700 dark:text-gray-300">
												Generated Text ({successfulCommits.length} branches)
											</span>
											<div class="flex items-center gap-2">
												<Checkbox id="include-commit-message" bind:checked={includeCommitMessage} />
												<label for="include-commit-message" class="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"> Include commit message </label>
											</div>
										</div>
										<Button variant="primary" class="px-4 py-2 text-sm" onclick={() => copyToClipboard(combinedText)} tooltip="Copy all generated text to clipboard" leftIcon="copy">Copy All</Button>
									</div>
									<div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 font-mono text-xs max-h-40 overflow-y-auto">
										<div class="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-left">
											{combinedText}
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Action Buttons -->
				<div class="p-4 flex justify-center gap-4">
					<Button variant="secondary" class="px-6 py-2" onclick={goToHome} disabled={isAutoUpdatingBranches || !autoUpdateCompleted} tooltip={isAutoUpdatingBranches || !autoUpdateCompleted ? "Please wait for auto-update to complete" : "Return to the branches view"} leftIcon="home">
						Go Home
					</Button>
					{#if commitResults.some(r => !r.success)}
						<Button variant="secondary" class="px-6 py-2" onclick={backToCommitScreen} tooltip="Return to commit screen with current data preserved" leftIcon="chevronLeft">
							Go Back
						</Button>
					{/if}
					<ActionMenu
						label="Commit Again"
						variant="secondary"
						options={commitAgainOptions}
						onaction={handleCommitAgainAction}
						ondropdownchange={(open) => isCommitAgainDropdownOpen = open}
						disabled={isAutoUpdatingBranches || !autoUpdateCompleted}
						tooltip={isAutoUpdatingBranches || !autoUpdateCompleted ? "Please wait for auto-update to complete" : "Choose how to start a new commit"}
						class="px-6 py-2"
					/>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Add Variable Dialog -->
{#if showAddVariableDialog}
	<div class="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-gray-900/5 max-w-md w-full">
			<!-- Dialog Header -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
				<h3 class="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
					<Icon name="plus" size={20} class="text-blue-600" />
					Add Commit Variable
				</h3>
				<Button variant="minimal" iconOnly="x" iconSize={20} type="button" onclick={cancelAddVariable} class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
			</div>

			<!-- Dialog Content -->
			<div class="p-6 space-y-4">
				<!-- Variable Name -->
				<div>
					<label for="new-variable-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Variable Name <span class="text-red-500">*</span>
					</label>
					<input
						id="new-variable-name"
						type="text"
						bind:value={newVariableName}
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="e.g., issueNumber, component"
						disabled={isAddingVariable}
					/>
					<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Used in the commit message as $t&#123;variableName&#125;</p>
				</div>

				<!-- Description -->
				<div>
					<label for="new-variable-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Description (Optional) </label>
					<input
						id="new-variable-description"
						type="text"
						bind:value={newVariableDescription}
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="e.g., Issue or ticket number"
						disabled={isAddingVariable}
					/>
				</div>

				<!-- Default Value -->
				<div>
					<label for="new-variable-default" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Default Value (Optional) </label>
					<input
						id="new-variable-default"
						type="text"
						bind:value={newVariableDefaultValue}
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="Default value for this variable"
						disabled={isAddingVariable}
					/>
				</div>

				<!-- Required Field -->
				<div class="flex items-center gap-2">
					<input type="checkbox" bind:checked={newVariableRequired} id="new-variable-required" class="rounded" disabled={isAddingVariable} />
					<label for="new-variable-required" class="text-sm text-gray-700 dark:text-gray-300"> Required field </label>
				</div>
			</div>

			<!-- Dialog Footer -->
			<div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700 rounded-b-lg flex justify-end gap-3">
				<Button variant="secondary" type="button" class="px-4 py-2 text-sm" onclick={cancelAddVariable} disabled={isAddingVariable}>Cancel</Button>
				<Button variant="primary" type="button" class="px-4 py-2 text-sm" onclick={saveNewVariable} disabled={isAddingVariable || !newVariableName.trim()} loading={isAddingVariable}>
					{isAddingVariable ? "Adding..." : "Add Variable"}
				</Button>
			</div>
		</div>
	</div>
{/if}

<!-- Unstage Warning Dialog -->
{#if showUnstageWarningDialog && unstageConflictInfo && fileBeingUnstaged}
	<div class="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onclick={closeUnstageWarningDialog} aria-labelledby="unstage-dialog-title" role="dialog" aria-modal="true">
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-gray-900/5 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onclick={(e) => e.stopPropagation()}>
			<div class="flex items-start space-x-3 mb-4">
				<div class="flex-shrink-0">
					<Icon name="triangleAlert" size={24} class="text-orange-500" />
				</div>
				<div class="min-w-0 flex-1">
					<h3 id="unstage-dialog-title" class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Warning: Directory Dependencies Detected</h3>
					<p class="text-sm text-gray-700 mb-3">
						Unstaging directory <span class="font-mono font-medium">{fileBeingUnstaged.relativePath}</span> may affect child files.
					</p>
				</div>
			</div>

			<!-- Warning Messages -->
			<div class="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
				<div class="space-y-2">
					{#each unstageConflictInfo.warnings as warning}
						<p class="text-sm text-orange-800">{warning}</p>
					{/each}
				</div>
			</div>

			<!-- Affected Files -->
			{#if unstageConflictInfo.affectedChildren.length > 0}
				<div class="mb-4">
					<h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
						Affected child files ({unstageConflictInfo.affectedChildren.length}):
					</h4>
					<div class="bg-gray-50 dark:bg-gray-800 rounded-md p-3 max-h-32 overflow-y-auto">
						<ul class="space-y-1 text-sm">
							{#each unstageConflictInfo.affectedChildren as child}
								<li class="flex items-center space-x-2">
									<Icon name={child.isDirectory ? "folder" : "file"} size={14} class={child.isDirectory ? "text-yellow-600" : "text-gray-500"} />
									<span class="font-mono text-xs text-gray-700 dark:text-gray-300">{child.relativePath}</span>
									<span
										class="px-2 py-0.5 rounded text-xs font-medium {child.status === 'added'
											? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
											: child.status === 'deleted'
												? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
												: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}"
									>
										{child.status}
									</span>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="flex justify-end space-x-3">
				<Button variant="secondary" class="px-4 py-2 text-sm" onclick={closeUnstageWarningDialog}>Cancel</Button>
				<Button variant="danger" class="px-4 py-2 text-sm text-orange-600 bg-white border-orange-600 hover:bg-orange-600 hover:text-white" onclick={confirmUnstaging}>Force Unstage Directory</Button>
				{#if unstageConflictInfo.affectedChildren.length > 0}
					<Button variant="primary" class="px-4 py-2 text-sm" onclick={() => performUnstageWithChildren(fileBeingUnstaged)}>Unstage Directory + Children</Button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Diff Modal -->
<DiffModal isVisible={showDiffModal} filePath={diffFilePath} {diffOldContent} {diffNewContent} isLoading={diffLoading} branchFolder={diffBranchFolder} branchVersion={diffBranchVersion} lastPathSegment={diffLastPathSegment} folderColor={diffFolderColor} onClose={closeDiffModal} />

<!-- Save Template Dialog -->
{#if showSaveTemplateDialog}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]" onclick={() => (showSaveTemplateDialog = false)}>
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md mx-4" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Save Commit Template</h3>

			<div class="mb-4">
				<label for="template-nickname" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Template Nickname <span class="text-red-500">*</span>
				</label>
				<input
					id="template-nickname"
					bind:value={templateNickname}
					type="text"
					class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="e.g., Feature fix, Bug fix, Release prep..."
					maxlength="50"
					onkeydown={(e) => {
						if (e.key === 'Enter' && templateNickname.trim() && commitMessageInput.trim()) {
							saveCurrentTemplate();
						} else if (e.key === 'Escape') {
							showSaveTemplateDialog = false;
							templateNickname = '';
						}
					}}
				/>
				<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
					Give your template a memorable name to find it easily later
				</div>
			</div>

			<div class="mb-4">
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Template Content
				</label>
				<div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-3 max-h-32 overflow-y-auto">
					<div class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words font-mono">
						{commitMessageInput || "No message to save"}
					</div>
				</div>
			</div>

			<div class="flex justify-end gap-3">
				<Button
					variant="secondary"
					onclick={() => {
						showSaveTemplateDialog = false;
						templateNickname = '';
					}}
				>
					Cancel
				</Button>
				<Button
					variant="primary"
					onclick={saveCurrentTemplate}
					disabled={!templateNickname.trim() || !commitMessageInput.trim()}
				>
					Save Template
				</Button>
			</div>
		</div>
	</div>
{/if}

<!-- Save Commit Complete Template Dialog -->
{#if showSaveCommitCompleteTemplateDialog}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
				Save Copy Text Template
			</h3>

			<div class="mb-4">
				<label for="commit-complete-template-nickname" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Template Nickname
				</label>
				<input
					id="commit-complete-template-nickname"
					bind:value={commitCompleteTemplateNickname}
					type="text"
					class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="e.g., Release notes, Branch summary..."
					maxlength="50"
					onkeydown={(e) => {
						if (e.key === 'Enter' && commitCompleteTemplateNickname.trim() && commitTemplateInput.trim()) {
							saveCurrentCommitCompleteTemplate();
						} else if (e.key === 'Escape') {
							showSaveCommitCompleteTemplateDialog = false;
							commitCompleteTemplateNickname = '';
						}
					}}
				/>
				<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
					Give your template a memorable name to find it easily later
				</div>
			</div>

			<div class="mb-4">
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Template Content
				</label>
				<div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-3 max-h-32 overflow-y-auto">
					<div class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words font-mono">
						{commitTemplateInput || "No template to save"}
					</div>
				</div>
			</div>

			<div class="flex justify-end gap-3">
				<Button
					variant="secondary"
					onclick={() => {
						showSaveCommitCompleteTemplateDialog = false;
						commitCompleteTemplateNickname = '';
					}}
				>
					Cancel
				</Button>
				<Button
					variant="primary"
					onclick={saveCurrentCommitCompleteTemplate}
					disabled={!commitCompleteTemplateNickname.trim() || !commitTemplateInput.trim()}
				>
					Save Template
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* CSS Variables for consistent column widths */
	:root {
		--branch-column-width: 100px;
		--path-column-width: 300px;
		--status-column-width: 70px;
		--modified-column-width: 90px;
		--actions-column-width: 60px;
		--checkbox-column-width: 24px;
	}

	/* Custom scrollbar styling for table containers */
	.overflow-auto::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	.overflow-auto::-webkit-scrollbar-track {
		background: #f1f5f9;
		border-radius: 4px;
	}

	.overflow-auto::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 4px;
	}

	.overflow-auto::-webkit-scrollbar-thumb:hover {
		background: #94a3b8;
	}

	/* Dark mode scrollbar styling */
	:global(.dark) .overflow-auto::-webkit-scrollbar-track {
		background: #374151;
	}

	:global(.dark) .overflow-auto::-webkit-scrollbar-thumb {
		background: #6b7280;
	}

	:global(.dark) .overflow-auto::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}

	/* Enhanced table layout for path truncation */
	:global(.commit-table) {
		width: 100%;
		table-layout: fixed !important;
	}

	:global(.commit-table .path-column) {
		width: var(--path-column-width) !important;
		min-width: var(--path-column-width) !important;
		max-width: var(--path-column-width) !important;
	}

	:global(.commit-table .branch-column) {
		width: var(--branch-column-width) !important;
		min-width: var(--branch-column-width) !important;
		max-width: var(--branch-column-width) !important;
	}

	:global(.commit-table .status-column) {
		width: var(--status-column-width) !important;
		min-width: var(--status-column-width) !important;
		max-width: var(--status-column-width) !important;
	}

	:global(.commit-table .modified-column) {
		width: var(--modified-column-width) !important;
		min-width: var(--modified-column-width) !important;
		max-width: var(--modified-column-width) !important;
	}

	:global(.commit-table .actions-column) {
		width: var(--actions-column-width) !important;
		min-width: var(--actions-column-width) !important;
		max-width: var(--actions-column-width) !important;
	}

	:global(.commit-table .checkbox-column) {
		width: var(--checkbox-column-width) !important;
		min-width: var(--checkbox-column-width) !important;
		max-width: var(--checkbox-column-width) !important;
	}

	/* Responsive path truncation styling */
	:global(.truncated-path-container) {
		min-width: 0;
		max-width: 100%;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	/* Visual indicators for truncated paths */
	:global(.path-truncated) {
		position: relative;
	}

	:global(.path-truncated::after) {
		content: "";
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
		opacity: 0.6;
	}

	/* Enhanced hover effects for truncated paths */
	:global(.path-truncated:hover) {
		background-color: rgba(59, 130, 246, 0.05);
		border-radius: 3px;
		transition: background-color 0.15s ease;
	}

	:global(.path-truncated:hover::after) {
		opacity: 1;
		background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.6), transparent);
	}

	/* Performance optimization for large tables */
	:global(.large-table .commit-table) {
		contain: layout style;
	}

	:global(.large-table .commit-table tbody tr) {
		contain: layout;
	}

	/* Utility classes for text handling */
	:global(.break-all) {
		word-break: break-all;
		hyphens: auto;
	}

	/* Loading states for path truncation */
	:global(.path-loading) {
		opacity: 0.7;
		position: relative;
	}

	:global(.path-loading::before) {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
		animation: shimmer 1.5s infinite;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	/* Responsive table adjustments */
	@media (max-width: 1024px) {
		:root {
			--branch-column-width: 140px;
			--path-column-width: 250px;
			--status-column-width: 65px;
			--modified-column-width: 80px;
			--actions-column-width: 60px;
		}
	}

	@media (max-width: 768px) {
		:root {
			--branch-column-width: 110px;
			--path-column-width: 200px;
			--status-column-width: 60px;
			--modified-column-width: 75px;
			--actions-column-width: 60px;
		}
	}

	/* Enhanced textarea styling */
	textarea {
		line-height: 1.5;
		font-family: inherit;
	}

	textarea:focus {
		outline: none;
	}

	/* Quick filter styling */
	.quick-filter-container {
		transition: all 0.2s ease;
	}

	.quick-filter-input {
		transition: all 0.2s ease;
	}

	.quick-filter-input:focus {
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.quick-filter-input.active {
		background-color: rgba(59, 130, 246, 0.05);
		border-color: rgba(59, 130, 246, 0.3);
	}

	.filter-active-bg {
		background-color: rgba(59, 130, 246, 0.05);
	}

	.clear-filter-btn {
		opacity: 0.7;
		transition:
			opacity 0.2s ease,
			background-color 0.2s ease;
	}

	.clear-filter-btn:hover {
		opacity: 1;
		background-color: rgba(0, 0, 0, 0.05);
	}

	/* Responsive filter adjustments */
	@media (max-width: 640px) {
		.quick-filter-container {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}

		.quick-filter-container label {
			font-size: 0.875rem;
		}
	}

	/* Navigation row highlighting */
	.bg-blue-100.ring-2.ring-blue-500 {
		background-color: rgba(147, 197, 253, 0.3) !important;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.8) !important;
		border-radius: 0.25rem;
	}

	.bg-blue-100.ring-2.ring-blue-500:hover {
		background-color: rgba(147, 197, 253, 0.4) !important;
	}

	/* Smooth transitions for collapsible panels */
	.panel-content {
		transition: all 0.3s ease-in-out;
		overflow: hidden;
	}

	/* Optional: Add a subtle border color change when collapsed */
	.collapsed-panel {
		border-color: rgba(209, 213, 219, 0.7);
	}

	/* Commit results table styling */
	.commit-results-table th {
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.commit-results-table td {
		vertical-align: middle;
	}

	/* Button hover effects */
	.commit-results-table button:active {
		transform: scale(0.95);
	}

	/* Ensure consistent button sizes in tables */
	.commit-results-table button {
		transition: all 0.15s ease;
	}

	/* Responsive adjustments for commit results */
	@media (max-width: 1024px) {
		.commit-results-table {
			font-size: 0.875rem;
		}

		.commit-results-table th,
		.commit-results-table td {
			padding: 0.5rem;
		}
	}
</style>
