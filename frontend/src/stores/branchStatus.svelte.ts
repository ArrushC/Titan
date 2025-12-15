/**
 * Branch Status Store - Manages SVN status for branches
 * Tracks how many revisions each branch is behind or error states
 */

export interface BranchStatus {
	revisionsBehind?: number;
	error?: string;
	lastChecked?: number;
}

class BranchStatusStore {
	// State - key is branchId, value is status info
	private _statuses = $state<Record<string, BranchStatus>>({});
	private _isLoading = $state(false);
	private _lastGlobalCheck = $state<number | null>(null);
	private _loadingBranches = $state<Set<string>>(new Set());

	// Debouncing and rate limiting
	private _debounceTimers = new Map<string, number>();
	private _lastRequestTimes = new Map<string, number>();
	private _ongoingRequests = new Set<string>();

	// Performance configuration
	private readonly DEBOUNCE_DELAY = 300; // 300ms debounce
	private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second minimum between requests per branch
	private readonly CACHE_TTL = 30000; // 30 seconds cache TTL
	private readonly ERROR_CACHE_TTL = 5000; // 5 seconds for error caching

	// Getters
	get statuses(): Record<string, BranchStatus> {
		return this._statuses;
	}

	get isLoading(): boolean {
		return this._isLoading;
	}

	get lastGlobalCheck(): number | null {
		return this._lastGlobalCheck;
	}

	// Check if a specific branch is loading
	isBranchLoading(branchId: string): boolean {
		return this._loadingBranches.has(branchId);
	}

	// Get all loading branches
	get loadingBranches(): Set<string> {
		return this._loadingBranches;
	}

	// Get status for a specific branch
	getStatus(branchId: string): BranchStatus | undefined {
		return this._statuses[branchId];
	}

	// Get formatted status string for display
	getStatusDisplay(branchId: string): string {
		const status = this._statuses[branchId];
		if (!status) {
			return "Not scanned";
		}

		if (status.error) {
			// Special handling for known error types
			if (status.error === "No SVN") {
				return "No SVN";
			}
			if (status.error === "Disconnected") {
				return "Disconnected";
			}
			if (status.error === "No path configured") {
				return "No path";
			}
			// For other errors, return a generic message
			// The actual error will be shown in a toaster
			return "Error";
		}

		if (typeof status.revisionsBehind === "number") {
			if (status.revisionsBehind === 0) {
				return "🟢 Latest";
			} else if (status.revisionsBehind === -1) {
				// Special case: we know it's behind but couldn't count exact revisions
				return "🟠 Behind";
			} else if (status.revisionsBehind <= 3) {
				return `🟡 -${status.revisionsBehind} Revision${status.revisionsBehind !== 1 ? "s" : ""}`;
			} else if (status.revisionsBehind <= 8) {
				return `🟠 -${status.revisionsBehind} Revision${status.revisionsBehind !== 1 ? "s" : ""}`;
			} else {
				return `🔴 -${status.revisionsBehind} Revision${status.revisionsBehind !== 1 ? "s" : ""}`;
			}
		}

		return "Not scanned";
	}

	// Get status class for styling
	getStatusClass(branchId: string): string {
		const status = this._statuses[branchId];
		if (!status) {
			return "text-gray-500";
		}

		if (status.error) {
			if (status.error === "Disconnected") {
				// Purple with flashing animation (using custom class to avoid transform conflicts)
				return "text-purple-600 font-bold text-purple-flash";
			}
			// Red for other errors
			return "text-red-600 font-bold";
		}

		if (typeof status.revisionsBehind === "number") {
			if (status.revisionsBehind === 0) {
				return "text-green-600";
			} else if (status.revisionsBehind === -1) {
				// Special case: behind but count unknown
				return "text-orange-600 font-semibold";
			} else if (status.revisionsBehind <= 3) {
				// 1-3 revisions: yellowish, light font
				return "text-yellow-600 font-medium";
			} else if (status.revisionsBehind <= 8) {
				// 4-8 revisions: orange, medium bold
				return "text-orange-600 font-semibold";
			} else {
				// 9+ revisions: dark orange, bold
				return "text-orange-700 font-bold";
			}
		}

		return "text-gray-500";
	}

	// Get pill-styled status classes for modern UI
	getStatusPillClass(branchId: string): string {
		const status = this._statuses[branchId];
		if (!status) {
			return "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-full px-3 py-1 text-xs font-medium inline-flex items-center";
		}

		if (status.error) {
			if (status.error === "Disconnected") {
				// Soft purple pill with flashing animation
				return "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-600 rounded-full px-3 py-1 text-xs font-medium inline-flex items-center text-purple-flash";
			}
			// Soft red pill for other errors
			return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-600 rounded-full px-3 py-1 text-xs font-medium inline-flex items-center";
		}

		if (typeof status.revisionsBehind === "number") {
			if (status.revisionsBehind === 0) {
				// Green pill for "Latest"
				return "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-600 rounded-full px-3 py-1 text-xs font-medium inline-flex items-center";
			} else if (status.revisionsBehind === -1) {
				// Special case: soft orange pill for unknown count
				return "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-600 rounded-full px-3 py-1 text-xs font-medium inline-flex items-center";
			} else if (status.revisionsBehind <= 3) {
				// 1-3 revisions: soft amber pill
				return "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-600 rounded-full px-3 py-1 text-xs font-medium inline-flex items-center";
			} else if (status.revisionsBehind <= 8) {
				// 4-8 revisions: soft orange pill
				return "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-600 rounded-full px-3 py-1 text-xs font-medium inline-flex items-center";
			} else {
				// 9+ revisions: soft red pill
				return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-600 rounded-full px-3 py-1 text-xs font-medium inline-flex items-center";
			}
		}

		return "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-full px-3 py-1 text-xs font-medium inline-flex items-center";
	}

	// Update status for a single branch - optimized for performance
	updateStatus(branchId: string, status: BranchStatus): void {
		// Check if the status actually changed to avoid unnecessary updates
		const currentStatus = this._statuses[branchId];
		if (currentStatus && currentStatus.revisionsBehind === status.revisionsBehind && currentStatus.error === status.error) {
			// Only update timestamp if data is the same
			currentStatus.lastChecked = Date.now();
			return;
		}

		// Create new status object only when necessary
		const newStatus: BranchStatus = {
			...(status.revisionsBehind !== undefined && { revisionsBehind: status.revisionsBehind }),
			...(status.error !== undefined && { error: status.error }),
			lastChecked: Date.now(),
		};

		// Use Object.assign for better performance than spread operator
		this._statuses = Object.assign({}, this._statuses, { [branchId]: newStatus });
	}

	// Update multiple statuses at once - optimized for batch operations
	updateMultipleStatuses(statuses: Record<string, BranchStatus>): void {
		const timestamp = Date.now();
		const updates: Record<string, BranchStatus> = {};
		let hasChanges = false;

		// Only create updates for branches that actually changed
		for (const [branchId, status] of Object.entries(statuses)) {
			const currentStatus = this._statuses[branchId];

			if (!currentStatus || currentStatus.revisionsBehind !== status.revisionsBehind || currentStatus.error !== status.error) {
				updates[branchId] = {
					...(status.revisionsBehind !== undefined && { revisionsBehind: status.revisionsBehind }),
					...(status.error !== undefined && { error: status.error }),
					lastChecked: timestamp,
				};
				hasChanges = true;
			} else {
				// Just update timestamp for unchanged status
				currentStatus.lastChecked = timestamp;
			}
		}

		// Only trigger reactivity if there are actual changes
		if (hasChanges) {
			this._statuses = Object.assign({}, this._statuses, updates);
		}

		this._lastGlobalCheck = timestamp;
	}

	// Clear status for a branch
	clearStatus(branchId: string): void {
		const newStatuses = { ...this._statuses };
		delete newStatuses[branchId];
		this._statuses = newStatuses;
	}

	// Clear all statuses
	clearAll(): void {
		this._statuses = {};
		this._lastGlobalCheck = null;
	}

	// Set loading state
	setLoading(loading: boolean): void {
		this._isLoading = loading;
	}

	// Set loading state for a specific branch - optimized to avoid unnecessary Set creation
	setBranchLoading(branchId: string, loading: boolean): void {
		const currentlyLoading = this._loadingBranches.has(branchId);

		// Only update if state actually changes
		if (loading !== currentlyLoading) {
			const newLoadingBranches = new Set(this._loadingBranches);
			if (loading) {
				newLoadingBranches.add(branchId);
			} else {
				newLoadingBranches.delete(branchId);
			}
			this._loadingBranches = newLoadingBranches;
		}
	}

	// Check if a branch has an error
	hasError(branchId: string): boolean {
		const status = this._statuses[branchId];
		return status?.error !== undefined;
	}

	// Get full error message for a branch
	getErrorMessage(branchId: string): string | undefined {
		const status = this._statuses[branchId];
		return status?.error;
	}

	// Debounced status check for a single branch
	debouncedCheckBranchStatus(branchId: string, checkFn: () => Promise<void>): void {
		// Clear existing timer for this branch
		if (this._debounceTimers.has(branchId)) {
			clearTimeout(this._debounceTimers.get(branchId)!);
		}

		// Set new debounced timer
		const timer = window.setTimeout(async () => {
			this._debounceTimers.delete(branchId);

			// Check rate limiting
			const lastRequestTime = this._lastRequestTimes.get(branchId) || 0;
			const timeSinceLastRequest = Date.now() - lastRequestTime;

			if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
				// Too soon, schedule for later
				const remainingWait = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
				window.setTimeout(() => this.debouncedCheckBranchStatus(branchId, checkFn), remainingWait);
				return;
			}

			// Check if request is already ongoing
			if (this._ongoingRequests.has(branchId)) {
				return;
			}

			// Check cache freshness
			const status = this._statuses[branchId];
			if (status?.lastChecked) {
				const cacheAge = Date.now() - status.lastChecked;
				const ttl = status.error ? this.ERROR_CACHE_TTL : this.CACHE_TTL;
				if (cacheAge < ttl) {
					return; // Cache is still fresh
				}
			}

			// Execute the status check
			this._ongoingRequests.add(branchId);
			this._lastRequestTimes.set(branchId, Date.now());

			try {
				await checkFn();
			} finally {
				this._ongoingRequests.delete(branchId);
			}
		}, this.DEBOUNCE_DELAY);

		this._debounceTimers.set(branchId, timer);
	}

	// Batch debounced status check for multiple branches
	debouncedCheckMultipleBranchStatuses(branchIds: string[], checkFn: (batchIds: string[]) => Promise<void>): void {
		// Filter out branches that are too recent or ongoing
		const now = Date.now();
		const eligibleBranches = branchIds.filter((branchId) => {
			// Skip if ongoing
			if (this._ongoingRequests.has(branchId)) {
				return false;
			}

			// Skip if too recent
			const lastRequestTime = this._lastRequestTimes.get(branchId) || 0;
			if (now - lastRequestTime < this.MIN_REQUEST_INTERVAL) {
				return false;
			}

			// Skip if cache is fresh
			const status = this._statuses[branchId];
			if (status?.lastChecked) {
				const cacheAge = now - status.lastChecked;
				const ttl = status.error ? this.ERROR_CACHE_TTL : this.CACHE_TTL;
				if (cacheAge < ttl) {
					return false;
				}
			}

			return true;
		});

		if (eligibleBranches.length === 0) {
			return; // Nothing to check
		}

		// Use a single timer for the batch with the branch IDs as key
		const batchKey = `batch:${eligibleBranches.sort().join(",")}`;

		// Clear existing timer for this batch
		if (this._debounceTimers.has(batchKey)) {
			clearTimeout(this._debounceTimers.get(batchKey)!);
		}

		// Set new debounced timer for batch
		const timer = window.setTimeout(async () => {
			this._debounceTimers.delete(batchKey);

			// Mark all branches as ongoing
			eligibleBranches.forEach((branchId) => {
				this._ongoingRequests.add(branchId);
				this._lastRequestTimes.set(branchId, Date.now());
			});

			try {
				await checkFn(eligibleBranches);
			} finally {
				// Clean up ongoing requests
				eligibleBranches.forEach((branchId) => {
					this._ongoingRequests.delete(branchId);
				});
			}
		}, this.DEBOUNCE_DELAY);

		this._debounceTimers.set(batchKey, timer);
	}

	// Clean up method for memory management
	cleanup(): void {
		// Clear all debounce timers
		this._debounceTimers.forEach((timer) => clearTimeout(timer));
		this._debounceTimers.clear();

		// Clear tracking maps
		this._lastRequestTimes.clear();
		this._ongoingRequests.clear();
	}

	// Check if a branch status check is eligible (not rate limited or cached)
	isCheckEligible(branchId: string): boolean {
		// Check if ongoing
		if (this._ongoingRequests.has(branchId)) {
			return false;
		}

		// Check rate limiting
		const lastRequestTime = this._lastRequestTimes.get(branchId) || 0;
		const timeSinceLastRequest = Date.now() - lastRequestTime;
		if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
			return false;
		}

		// Check cache freshness
		const status = this._statuses[branchId];
		if (status?.lastChecked) {
			const cacheAge = Date.now() - status.lastChecked;
			const ttl = status.error ? this.ERROR_CACHE_TTL : this.CACHE_TTL;
			if (cacheAge < ttl) {
				return false;
			}
		}

		return true;
	}
}

// Create singleton instance
export const branchStatusStore = new BranchStatusStore();

// Export convenience functions
export const getBranchStatus = (branchId: string) => branchStatusStore.getStatus(branchId);
export const getBranchStatusDisplay = (branchId: string) => branchStatusStore.getStatusDisplay(branchId);
export const getBranchStatusClass = (branchId: string) => branchStatusStore.getStatusClass(branchId);
export const getBranchStatusPillClass = (branchId: string) => branchStatusStore.getStatusPillClass(branchId);
export const updateBranchStatus = (branchId: string, status: BranchStatus) => branchStatusStore.updateStatus(branchId, status);
export const updateMultipleBranchStatuses = (statuses: Record<string, BranchStatus>) => branchStatusStore.updateMultipleStatuses(statuses);
export const clearBranchStatuses = () => branchStatusStore.clearAll();
export const setBranchStatusLoading = (loading: boolean) => branchStatusStore.setLoading(loading);
export const setBranchLoading = (branchId: string, loading: boolean) => branchStatusStore.setBranchLoading(branchId, loading);
export const isBranchLoading = (branchId: string) => branchStatusStore.isBranchLoading(branchId);

// Performance optimized functions
export const debouncedCheckBranchStatus = (branchId: string, checkFn: () => Promise<void>) => branchStatusStore.debouncedCheckBranchStatus(branchId, checkFn);
export const debouncedCheckMultipleBranchStatuses = (branchIds: string[], checkFn: (batchIds: string[]) => Promise<void>) => branchStatusStore.debouncedCheckMultipleBranchStatuses(branchIds, checkFn);
export const isCheckEligible = (branchId: string) => branchStatusStore.isCheckEligible(branchId);
export const cleanupBranchStatusStore = () => branchStatusStore.cleanup();
