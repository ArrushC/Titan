<script lang="ts">
	import { getBranchConfig, setIsLogMode } from "./stores/app.svelte.ts";
	import { branchesStore } from "./stores/branches.svelte.ts";
	import Icon from "./components/Icon.svelte";
	import Button from "./components/Button.svelte";
	import FloatingHeader from "./components/FloatingHeader.svelte";
	import { showError, showToast } from "./stores/toast.svelte.ts";
	import { SVNLogCached, SVNGetFileContent } from "../wailsjs/go/main/App.js";
	import DiffModal from "./components/DiffModal.svelte";
	import { tooltip } from "./utils/tooltip";
	import VirtualizedTable from "./components/VirtualizedTable.svelte";
	import MessageCell from "./components/log/MessageCell.svelte";
	import DateCell from "./components/log/DateCell.svelte";
	import FilePathsList from "./components/log/FilePathsList.svelte";

	// Types for log functionality
	interface LogEntry {
		revision: string;
		author: string;
		date: string;
		msg: string;
		paths?: LogPath[];
	}

	interface LogPath {
		path: string;
		action: string;
		copyfromPath?: string;
		copyfromRev?: string;
	}

	interface BranchLogGroup {
		branchId: string;
		branchPath: string;
		branchFolder: string;
		branchVersion: string;
		folderColor: string;
		loading: boolean;
		error?: string;
		entries: LogEntry[];
		expanded: boolean;
		firstRevision?: string;
		lastRevision?: string;
		dateRange?: string;
		searchFilter: string;
		debouncedSearchFilter: string;
		filterPending: boolean;
		sortColumn: "Revision" | "Author" | "Date" | "Message";
		sortDirection: "asc" | "desc";
	}

	// Reactive state from stores
	let branchConfig = $derived(getBranchConfig());
	let selectedBranches = $derived(branchesStore.selectedBranches);
	let selectedBranchCount = $derived(branchesStore.selectedBranchCount);

	// Track previous selection to detect changes
	let previousSelectionKey = "";

	// Request ID to prevent overlapping loads
	let reqId = 0;
	let isLoading = $state(false);

	// Log workflow state
	let currentPhase = $state<"loading" | "viewing">("loading");
	let loadingMessage = $state("Initializing log viewer...");
	let loadingProgress = $state(0);

	// Log management state
	let branchLogGroups = $state<BranchLogGroup[]>([]);
	let expandAll = $state(false);

	// Filter timeout tracking
	let filterTimeouts = new Map<string, ReturnType<typeof setTimeout>>();


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

	// Helper functions
	function getSelectedBranchesInfo() {
		if (!branchConfig) return [];

		const branchInfo = [];
		for (const [key, isSelected] of Object.entries(selectedBranches)) {
			if (isSelected) {
				const [folderName, branchId] = key.split('-');
				const branch = branchConfig.getBranch(branchId);
				if (branch) {
					branchInfo.push({
						branchId,
						branchPath: branch.branchPath,
						branchVersion: branch.branchVersion,
						folderName,
						folder: branchConfig.getFolder(folderName)
					});
				}
			}
		}
		return branchInfo;
	}

	// Toggle expand/collapse for a branch
	function toggleBranchExpanded(branchId: string) {
		const group = branchLogGroups.find(g => g.branchId === branchId);
		if (group) {
			group.expanded = !group.expanded;
		}
	}

	// Expand or collapse all branches
	function toggleExpandAll() {
		expandAll = !expandAll;
		branchLogGroups.forEach(group => {
			group.expanded = expandAll;
		});
	}

	// Filter function for log entries
	function filterLogEntries(entries: any[], filter: string): any[] {
		if (!filter.trim()) return entries;

		const searchTerm = filter.toLowerCase().trim();
		return entries.filter(entry =>
			entry.Revision?.toLowerCase().includes(searchTerm) ||
			entry.Author?.toLowerCase().includes(searchTerm) ||
			entry.Date?.toLowerCase().includes(searchTerm) ||
			entry.Message?.toLowerCase().includes(searchTerm)
		);
	}

	// Update filter with debouncing
	function updateFilter(branchId: string, value: string) {
		const group = branchLogGroups.find(g => g.branchId === branchId);
		if (!group) return;

		group.searchFilter = value;
		group.filterPending = true;

		// Clear existing timeout
		const timeoutKey = branchId;
		if (filterTimeouts.has(timeoutKey)) {
			clearTimeout(filterTimeouts.get(timeoutKey));
		}

		// Set new timeout (150ms like in Commit.svelte pattern)
		const timeoutId = setTimeout(() => {
			group.debouncedSearchFilter = value;
			group.filterPending = false;
			filterTimeouts.delete(timeoutKey);
		}, 150);

		filterTimeouts.set(timeoutKey, timeoutId);
	}

	// Clear filter for a branch
	function clearFilter(branchId: string) {
		updateFilter(branchId, "");
	}

	// Sort function for log entries
	function sortLogEntries(entries: any[], sortColumn: string, sortDirection: "asc" | "desc"): any[] {
		const sorted = [...entries].sort((a, b) => {
			let aValue: any;
			let bValue: any;

			switch (sortColumn) {
				case "Revision":
					aValue = parseInt(a.Revision?.replace(/\D/g, '') || '0');
					bValue = parseInt(b.Revision?.replace(/\D/g, '') || '0');
					break;
				case "Author":
					aValue = a.Author?.toLowerCase() || '';
					bValue = b.Author?.toLowerCase() || '';
					break;
				case "Date":
					aValue = new Date(a.Date || 0).getTime();
					bValue = new Date(b.Date || 0).getTime();
					break;
				case "Message":
					aValue = a.Message?.toLowerCase() || '';
					bValue = b.Message?.toLowerCase() || '';
					break;
				default:
					return 0;
			}

			if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
			if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
			return 0;
		});

		return sorted;
	}

	// Handle column header click for sorting
	function handleSort(branchId: string, columnKey: string) {
		const group = branchLogGroups.find(g => g.branchId === branchId);
		if (!group) return;

		// Toggle direction if same column, otherwise set to desc
		if (group.sortColumn === columnKey) {
			group.sortDirection = group.sortDirection === "asc" ? "desc" : "asc";
		} else {
			group.sortColumn = columnKey as "Revision" | "Author" | "Date" | "Message";
			group.sortDirection = "desc";
		}
	}

	// Get processed (filtered and sorted) log entries for a group
	function getProcessedLogEntries(group: BranchLogGroup): any[] {
		// First apply filtering
		const filtered = filterLogEntries(group.entries, group.debouncedSearchFilter);
		// Then apply sorting
		return sortLogEntries(filtered, group.sortColumn, group.sortDirection);
	}

	// Load logs for selected branches with incremental caching
	async function loadLogs() {
		if (isLoading) return; // Prevent overlapping loads

		const id = ++reqId; // Capture the request ID for this load
		isLoading = true;
		currentPhase = "loading";
		loadingMessage = "Loading logs...";
		loadingProgress = 0;

		const branchesInfo = getSelectedBranchesInfo();
		if (branchesInfo.length === 0) {
			showError("No branches selected");
			setIsLogMode(false);
			isLoading = false;
			return;
		}

		// Initialize branch log groups
		const shouldExpand = branchesInfo.length <= 2;
		branchLogGroups = branchesInfo.map(info => ({
			branchId: info.branchId,
			branchPath: info.branchPath,
			branchFolder: info.folderName,
			branchVersion: info.branchVersion,
			folderColor: info.folder?.color || "#6B7280",
			loading: true,
			entries: [],
			expanded: shouldExpand,
			searchFilter: "",
			debouncedSearchFilter: "",
			filterPending: false,
			sortColumn: "Revision" as const,
			sortDirection: "desc" as const
		}));

		const totalBranches = branchesInfo.length;
		console.log("Beginning log loading for", totalBranches, "branches");

		// Create promises for parallel loading of individual branches
		const logPromises = branchesInfo.map(async (info, index) => {
			const group = branchLogGroups[index];

			try {
				// Always use cached version for incremental loading
				const cachedResult = await SVNLogCached(0, true, [info.branchPath], true);

				// Check if this is still the latest request
				if (id !== reqId) return { success: false, cancelled: true };

				const branchLogData = cachedResult.data;

				const branchLogResult = JSON.parse(branchLogData);
				const logEntries = branchLogResult.LogEntry || [];

				// Update group with results
				group.entries = logEntries;
				group.loading = false;
				group.error = undefined;

				// Calculate date range and revision info
				if (logEntries.length > 0) {
					group.firstRevision = logEntries[0].Revision;
					group.lastRevision = logEntries[logEntries.length - 1].Revision;

					// Format date range
					const firstDate = new Date(logEntries[logEntries.length - 1].Date);
					const lastDate = new Date(logEntries[0].Date);
					group.dateRange = `${firstDate.toLocaleDateString()} - ${lastDate.toLocaleDateString()}`;
				}

				return { success: true, branchVersion: info.branchVersion };
			} catch (error) {
				console.error(`Failed to load logs for ${info.branchVersion}:`, error);
				group.loading = false;
				group.error = (error as Error).message || "Failed to load logs";
				return { success: false, branchVersion: info.branchVersion, error: (error as Error).message };
			}
		});

		// Track progress
		let completedCount = 0;
		const progressPromises = logPromises.map(promise =>
			promise.finally(() => {
				completedCount++;
				// Use requestAnimationFrame to update progress without blocking UI
				requestAnimationFrame(() => {
					if (id === reqId) {
						loadingProgress = (completedCount / totalBranches) * 100;
						loadingMessage = `Loading logs... (${completedCount}/${totalBranches})`;
					}
				});
			})
		);

		// Execute all promises in parallel
		const results = await Promise.allSettled(progressPromises);

		// Show individual errors
		let errorCount = 0;
		results.forEach((result) => {
			if (result.status === 'fulfilled' && result.value) {
				if (!result.value.success && !result.value.cancelled) {
					errorCount++;
					if (errorCount <= 3) { // Limit error toasts to prevent spam
						showError(`Failed to load logs for ${result.value.branchVersion}: ${result.value.error}`);
					}
				}
			}
		});

		if (errorCount > 3) {
			showError(`Failed to load logs for ${errorCount} branches`);
		}

		console.log(`Finished loading logs for ${totalBranches} branches`);

		// Check if this is still the latest request before updating final state
		if (id !== reqId) {
			isLoading = false;
			return;
		}

		currentPhase = "viewing";
		loadingMessage = "";
		isLoading = false;

		// Check if we got any logs
		const totalLogs = branchLogGroups.reduce((sum, group) => sum + group.entries.length, 0);
		if (totalLogs === 0) {
			showToast("info", "No log entries found for selected branches");
		}
	}



	// View diff for a specific file in a revision
	async function viewDiff(entry: any, branchPath: string, specificFilePath?: string) {
		// Check if entry has files to diff
		if (!entry.Paths?.Path || entry.Paths.Path.length === 0) {
			showToast("info", "No files found in this revision");
			return;
		}

		// Use specific file path if provided, otherwise use the first file
		let filePath: string;
		if (specificFilePath) {
			filePath = specificFilePath;
		} else {
			const firstFile = entry.Paths.Path[0];
			filePath = firstFile.Value;
		}

		// Get branch info for modal display
		const branchInfo = getSelectedBranchesInfo().find(info => info.branchPath === branchPath);
		if (!branchInfo) {
			showError("Branch information not found");
			return;
		}

		try {
			// Set loading state and show modal
			diffLoading = true;
			showDiffModal = true;
			diffFilePath = filePath;
			diffBranchFolder = branchInfo.folderName;
			diffBranchVersion = branchInfo.branchVersion;
			diffLastPathSegment = branchInfo.branchPath.split(/[\\\\/]/).pop() || branchInfo.branchPath;
			diffFolderColor = branchInfo.folder?.color || "#6B7280";

			// Clear previous content
			diffOldContent = "";
			diffNewContent = "";

			// Get file content for the revision
			// Pass branchPath as working directory context for repository paths
			const result = await SVNGetFileContent(filePath, entry.Revision, branchPath);

			if (result && result.success) {
				diffOldContent = result.oldContent || "";
				diffNewContent = result.newContent || "";
			} else {
				throw new Error("Failed to retrieve file content");
			}

		} catch (error: any) {
			console.error("Failed to load diff:", error);
			showError(`Failed to load diff: ${error.message || error}`);
			closeDiffModal();
		} finally {
			diffLoading = false;
		}
	}

	// Close diff modal and reset state
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


	// Keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			event.preventDefault();
			handleBackToBranches();
			return;
		}
	}


	// Build selection key from current selection
	function buildSelectionKey() {
		return getSelectedBranchesInfo()
			.map(i => `${i.folderName}:${i.branchId}:${i.branchPath}`)
			.sort()
			.join('|');
	}

	// Effects
	// Watch for selection changes using a computed value
	const currentSelectionKey = $derived(buildSelectionKey());

	$effect(() => {
		// This effect will only run when currentSelectionKey actually changes
		if (currentSelectionKey !== previousSelectionKey) {
			previousSelectionKey = currentSelectionKey;
			if (currentSelectionKey) {
				// Use a small delay to debounce rapid selection changes
				setTimeout(() => {
					if (currentSelectionKey === previousSelectionKey) {
						loadLogs();
					}
				}, 100);
			}
		}
	});

	// Keyboard event listener
	$effect(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});



	// Navigation function to return to branches view
	function handleBackToBranches() {
		setIsLogMode(false);
	}
</script>

<div class="h-full flex flex-col">
	<!-- Header with floating controls -->
	<FloatingHeader>
		{#snippet children()}
			<!-- Left side content -->
			<div class="flex items-center gap-3">
				<h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
					SVN Log Viewer
				</h2>
				<div class="flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-md">
					<Icon name="branches" size={12} class="text-blue-600 dark:text-blue-400" />
					<span class="text-xs font-medium text-blue-600 dark:text-blue-400">
						{selectedBranchCount} {selectedBranchCount === 1 ? 'branch' : 'branches'}
					</span>
				</div>
			</div>

			<!-- Right side content -->
			{#if currentPhase === "viewing"}
				<div class="flex items-center gap-2">
					<!-- Expand/Collapse All button -->
					<Button
						variant="ghost"
						leftIcon={expandAll ? "chevronDoubleUp" : "chevronDoubleDown"}
						iconSize={14}
						onclick={toggleExpandAll}
						tooltip={expandAll ? "Collapse all branches" : "Expand all branches"}
						class="text-sm"
					>
						{expandAll ? 'Collapse All' : 'Expand All'}
					</Button>

					<!-- Refresh button -->
					<Button
						variant="secondary"
						leftIcon="reload"
						iconSize={14}
						onclick={() => loadLogs()}
						tooltip="Refresh log entries"
						class="text-sm"
						disabled={isLoading}
					>
						Refresh
					</Button>
				</div>
			{/if}
		{/snippet}
	</FloatingHeader>

	<!-- Main content -->
	<div class="flex-1 overflow-hidden">
		{#if currentPhase === "loading"}
			<!-- Loading state -->
			<div class="h-full flex items-center justify-center">
				<div class="text-center">
					<div class="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
						<Icon name="reload" size={24} class="text-blue-600 dark:text-blue-400 animate-spin" />
					</div>
					<h3 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{loadingMessage}</h3>
					{#if loadingProgress > 0}
						<div class="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mx-auto">
							<div
								class="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300"
								style="width: {loadingProgress}%"
							></div>
						</div>
					{/if}
				</div>
			</div>
		{:else if currentPhase === "viewing"}
			<!-- Log viewer with collapsible panels -->
			<div class="h-full overflow-y-auto">
				<div class="p-4 space-y-4">
					{#each branchLogGroups as group (group.branchId)}
						<div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
							<!-- Panel Header -->
							<button
								class="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
								onclick={() => toggleBranchExpanded(group.branchId)}
								aria-expanded={group.expanded}
							>
								<div class="flex items-center gap-3">
									<!-- Expand/Collapse Icon -->
									<Icon
										name={group.expanded ? "chevronDown" : "chevronRight"}
										size={16}
										class="text-gray-500 transition-transform {group.expanded ? 'rotate-0' : ''}"
									/>

									<!-- Branch Display (Simple inline style) -->
									<div class="flex items-center space-x-2 overflow-hidden">
										<div class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: {group.folderColor}"></div>
										<span class="font-medium text-sm flex-shrink-0 text-gray-900 dark:text-gray-100">{group.branchFolder}</span>
										<span class="text-sm text-gray-600 dark:text-gray-300 truncate">{group.branchVersion}</span>
										<span class="text-xs text-gray-400 dark:text-gray-500 truncate">{group.branchPath.split(/[\\/]/).pop() || group.branchPath}</span>
									</div>
								</div>

								<div class="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
									{#if group.loading}
										<Icon name="reload" size={14} class="animate-spin" />
										<span>Loading...</span>
									{:else if group.error}
										<Icon name="triangleAlert" size={14} class="text-red-500" />
										<span class="text-red-500">{group.error}</span>
									{:else}
										{@const processedCount = getProcessedLogEntries(group).length}
										{#if group.debouncedSearchFilter && processedCount !== group.entries.length}
											<span>{processedCount} / {group.entries.length} commits</span>
										{:else}
											<span>{group.entries.length} commits</span>
										{/if}
										{#if group.dateRange}
											<span>•</span>
											<span>{group.dateRange}</span>
										{/if}
										{#if group.firstRevision && group.lastRevision}
											<span>•</span>
											<span>r{group.lastRevision} - r{group.firstRevision}</span>
										{/if}
									{/if}
								</div>
							</button>

							<!-- Panel Content with Filter and VirtualizedTable -->
							{#if group.expanded && !group.loading && !group.error && group.entries.length > 0}
								<div id="panel-content-{group.branchId}" class="border-t border-gray-200 dark:border-gray-700">
									<!-- Filter Input -->
									<div class="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
										<div class="relative">
											<Icon
												name="search"
												size={16}
												class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
											/>
											<input
												type="text"
												placeholder="Filter logs (revision, author, date, message)..."
												bind:value={group.searchFilter}
												oninput={(e) => updateFilter(group.branchId, (e.target as HTMLInputElement).value)}
												class="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
											/>
											{#if group.searchFilter}
												<button
													type="button"
													onclick={() => clearFilter(group.branchId)}
													class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
													use:tooltip={"Clear filter"}
												>
													<Icon name="x" size={16} />
												</button>
											{/if}
											{#if group.filterPending}
												<div class="absolute right-8 top-1/2 transform -translate-y-1/2">
													<Icon name="reload" size={14} class="text-blue-500 dark:text-blue-400 animate-spin" />
												</div>
											{/if}
										</div>
										{#if group.debouncedSearchFilter}
											{@const filteredEntries = filterLogEntries(group.entries, group.debouncedSearchFilter)}
											{#if filteredEntries.length !== group.entries.length}
												<div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
													Showing {filteredEntries.length} of {group.entries.length} commits
												</div>
											{/if}
										{/if}
									</div>
									<VirtualizedTable
										data={getProcessedLogEntries(group)}
										variant="compact"
										sortable={true}
										sortColumn={group.sortColumn}
										sortDirection={group.sortDirection}
										onSort={(columnKey: string) => handleSort(group.branchId, columnKey)}
										expandable={true}
										expandedRowComponent={FilePathsList}
										getExpandedProps={(item) => ({
											paths: item.Paths?.Path || [],
											onViewDiff: (filePath: string) => viewDiff(item, group.branchPath, filePath),
											branchPath: group.branchPath
										})}
										getRowId={(item) => `${group.branchId}-${item.Revision}`}
										columns={[
											{
												key: 'Revision',
												label: 'Revision',
												width: '100px'
											},
											{
												key: 'Author',
												label: 'Author',
												width: '150px'
											},
											{
												key: 'Date',
												label: 'Date',
												width: '110px',
												component: DateCell,
												componentProps: (item) => ({ date: item.Date })
											},
											{
												key: 'Message',
												label: 'Message',
												component: MessageCell,
												componentProps: (item) => ({ message: item.Message || '' })
											}
										]}
										containerHeight="400px"
									/>
								</div>
							{:else if group.expanded && !group.loading && group.entries.length === 0}
								<div class="border-t border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
									No log entries found for this branch
								</div>
							{/if}
						</div>
					{:else}
						<div class="p-8 text-center text-gray-500 dark:text-gray-400">
							No branches to display
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Diff Modal -->
<DiffModal
	isVisible={showDiffModal}
	{diffOldContent}
	{diffNewContent}
	filePath={diffFilePath}
	isLoading={diffLoading}
	branchFolder={diffBranchFolder}
	branchVersion={diffBranchVersion}
	lastPathSegment={diffLastPathSegment}
	folderColor={diffFolderColor}
	onClose={closeDiffModal}
/>

<style>
	/* Custom scrollbar styles */
	:global(.dark) {
		scrollbar-color: #4b5563 #1f2937;
	}

</style>