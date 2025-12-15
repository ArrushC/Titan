import type { BranchConfig } from "../utils/BranchConfig.ts";

/**
 * Branches Store - Manages branch selection and edit mode state
 * Provides centralized state management for branch operations using Svelte 5 runes
 */
class BranchesStore {
	private _state = $state({
		// Branch selection state - key format: "folderId-branchId"
		selectedBranches: {} as Record<string, boolean>,
		
		// Edit mode state
		isEditMode: false
	});

	// Getters
	get selectedBranches(): Record<string, boolean> {
		return this._state.selectedBranches;
	}

	get isEditMode(): boolean {
		return this._state.isEditMode;
	}

	// Computed properties
	get hasSelectedBranches(): boolean {
		return Object.values(this._state.selectedBranches).some(selected => selected);
	}

	get selectedBranchCount(): number {
		return Object.values(this._state.selectedBranches).filter(selected => selected).length;
	}

	// Branch selection methods
	toggleBranch(branchId: string, folderId: string): void {
		const key = `${folderId}-${branchId}`;
		this._state.selectedBranches = {
			...this._state.selectedBranches,
			[key]: !this._state.selectedBranches[key]
		};
	}

	toggleFolder(folderId: string, branchConfig: BranchConfig | null): void {
		if (!branchConfig) return;
		
		const folder = branchConfig.getFolder(folderId);
		if (!folder) return;

		const isCurrentlySelected = this.isFolderSelected(folderId, branchConfig);
		const updates = Object.fromEntries(
			folder.branchIds.map(branchId => [`${folderId}-${branchId}`, !isCurrentlySelected])
		);
		
		this._state.selectedBranches = {
			...this._state.selectedBranches,
			...updates
		};
	}

	isBranchSelected(branchId: string, folderId: string): boolean {
		return this._state.selectedBranches[`${folderId}-${branchId}`] || false;
	}

	isFolderSelected(folderId: string, branchConfig: BranchConfig | null): boolean {
		if (!branchConfig) return false;
		
		const folder = branchConfig.getFolder(folderId);
		if (!folder || folder.branchIds.length === 0) return false;

		return folder.branchIds.every(branchId => 
			this._state.selectedBranches[`${folderId}-${branchId}`]
		);
	}

	isFolderIndeterminate(folderId: string, branchConfig: BranchConfig | null): boolean {
		if (!branchConfig) return false;
		
		const folder = branchConfig.getFolder(folderId);
		if (!folder || folder.branchIds.length === 0) return false;

		const selectedCount = folder.branchIds.filter(branchId => 
			this._state.selectedBranches[`${folderId}-${branchId}`]
		).length;

		return selectedCount > 0 && selectedCount < folder.branchIds.length;
	}

	// Selection management
	clearSelection(): void {
		this._state.selectedBranches = {};
	}

	selectAll(branchConfig: BranchConfig | null): void {
		if (!branchConfig) return;

		const allSelections: Record<string, boolean> = {};
		const folderNames = branchConfig.getFolderNames();
		
		folderNames.forEach(folderName => {
			const folder = branchConfig.getFolder(folderName);
			if (folder) {
				folder.branchIds.forEach(branchId => {
					allSelections[`${folderName}-${branchId}`] = true;
				});
			}
		});

		this._state.selectedBranches = allSelections;
	}

	// Edit mode management
	enterEditMode(): void {
		// Clear selections when entering edit mode
		this.clearSelection();
		this._state.isEditMode = true;
	}

	exitEditMode(): void {
		this._state.isEditMode = false;
	}

	// Get selected branch IDs for a specific folder
	getSelectedBranchIdsForFolder(folderId: string, branchConfig: BranchConfig | null): string[] {
		if (!branchConfig) return [];
		
		const folder = branchConfig.getFolder(folderId);
		if (!folder) return [];

		return folder.branchIds.filter(branchId => 
			this._state.selectedBranches[`${folderId}-${branchId}`]
		);
	}

	// Get all selected branch IDs across all folders
	getAllSelectedBranchIds(): { folderId: string; branchId: string }[] {
		return Object.entries(this._state.selectedBranches)
			.filter(([_, selected]) => selected)
			.map(([key]) => {
				const [folderId, branchId] = key.split('-');
				return { folderId: folderId || '', branchId: branchId || '' };
			});
	}

	// Legacy compatibility - get state
	getState() {
		return this._state;
	}
}

// Create singleton instance
const branchesStore = new BranchesStore();

// Export the store instance
export { branchesStore };

// Export convenient methods for direct use
export const toggleBranch = (branchId: string, folderId: string) => branchesStore.toggleBranch(branchId, folderId);
export const toggleFolder = (folderId: string, branchConfig: BranchConfig | null) => branchesStore.toggleFolder(folderId, branchConfig);
export const clearBranchSelection = () => branchesStore.clearSelection();
export const enterEditMode = () => branchesStore.enterEditMode();
export const exitEditMode = () => branchesStore.exitEditMode();
export const isEditMode = () => branchesStore.isEditMode;
export const hasSelectedBranches = () => branchesStore.hasSelectedBranches;