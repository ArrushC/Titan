import { getUnusedColor, validateAndFormatColor } from './colorUtils';

// Type definitions for the configuration structure
interface Branch {
	branchVersion: string;
	branchPath: string;
}

interface Folder {
	color: string;
	branchIds: string[];
	order?: number;
}

interface ConfigData {
	folders: Record<string, Folder>;
	branches: Record<string, Branch>;
}

class BranchConfig {
	private _folders: Record<string, Folder>;
	private _branches: Record<string, Branch>;
	private _saveCallback: (jsonString: string) => void | Promise<void> | undefined;
	private _saveTimeout: ReturnType<typeof setTimeout> | undefined;
	private _debounceDelay: number;
	private _pendingSave: boolean = false;
	private _autosaveEnabled: boolean;

	constructor(jsonString: string, saveCallback: (jsonString: string) => void | Promise<void> | undefined, debounceDelay: number = 1000, autosaveEnabled: boolean = false) {
		this._folders = {};
		this._branches = {};
		this._saveCallback = saveCallback;
		this._debounceDelay = debounceDelay;
		this._autosaveEnabled = autosaveEnabled;
		this.loadFromJson(jsonString);
	}

	/**
	 * Parse JSON string and populate class properties
	 */
	private loadFromJson(jsonString: string): void {
		try {
			const data: ConfigData = JSON.parse(jsonString);

			if (!data.folders || !data.branches) {
				throw new Error("Invalid configuration: missing folders or branches");
			}

			this._folders = data.folders;
			this._branches = data.branches;
		} catch (error) {
			throw new Error(`Failed to parse configuration: ${error instanceof Error ? error.message : error}`);
		}
	}

	/**
	 * Get all folders
	 */
	get folders(): Record<string, Folder> {
		return this._folders;
	}

	/**
	 * Get all branches
	 */
	get branches(): Record<string, Branch> {
		return this._branches;
	}

	/**
	 * Get a specific folder by name
	 */
	getFolder(folderName: string): Folder | undefined {
		return this._folders[folderName];
	}

	/**
	 * Get a specific branch by ID
	 */
	getBranch(branchId: string): Branch | undefined {
		return this._branches[branchId];
	}

	/**
	 * Get all branches for a specific folder
	 */
	getBranchesForFolder(folderName: string): Branch[] {
		const folder = this.getFolder(folderName);
		if (!folder) {
			return [];
		}

		return folder.branchIds.map((branchId) => this.getBranch(branchId)).filter((branch): branch is Branch => branch !== undefined);
	}

	/**
	 * Get folder names sorted by order property
	 */
	getFolderNames(): string[] {
		return Object.entries(this._folders)
			.sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
			.map(([name]) => name);
	}

	/**
	 * Get branch IDs
	 */
	getBranchIds(): string[] {
		return Object.keys(this._branches);
	}

	/**
	 * Find which folder contains a specific branch ID
	 */
	findFolderForBranch(branchId: string): string | undefined {
		for (const [folderName, folder] of Object.entries(this._folders)) {
			if (folder.branchIds.includes(branchId)) {
				return folderName;
			}
		}
		return undefined;
	}

	/**
	 * Get branches by version pattern (e.g., all branches starting with "C3")
	 */
	getBranchesByVersionPattern(pattern: string): Branch[] {
		return Object.values(this._branches).filter((branch) => branch.branchVersion.includes(pattern));
	}

	/**
	 * Export current configuration back to JSON string
	 */
	toJson(): string {
		return JSON.stringify(
			{
				folders: this._folders,
				branches: this._branches,
			},
			null,
			2
		);
	}

	/**
	 * Save configuration using the provided callback (debounced)
	 */
	async save(): Promise<void> {
		if (this._saveCallback === undefined) {
			throw new Error("No save callback provided in constructor");
		}

		// Clear existing timeout
		if (this._saveTimeout) {
			clearTimeout(this._saveTimeout);
		}

		// Set up debounced save
		return new Promise((resolve, reject) => {
			this._saveTimeout = setTimeout(async () => {
				try {
					this._pendingSave = true;
					const jsonString = this.toJson();
					await this._saveCallback!(jsonString);
					this._pendingSave = false;
					resolve();
				} catch (error) {
					this._pendingSave = false;
					reject(error);
				}
			}, this._debounceDelay);
		});
	}

	/**
	 * Save configuration immediately without debouncing
	 */
	async saveNow(): Promise<void> {
		if (this._saveCallback === undefined) {
			throw new Error("No save callback provided in constructor");
		}

		// Clear any pending debounced save
		if (this._saveTimeout !== undefined) {
			clearTimeout(this._saveTimeout);
			this._saveTimeout = undefined;
		}

		this._pendingSave = true;
		try {
			const jsonString = this.toJson();
			await this._saveCallback(jsonString);
			this._pendingSave = false;
		} catch (error) {
			this._pendingSave = false;
			throw error;
		}
	}

	/**
	 * Cancel any pending save operation
	 */
	cancelPendingSave(): void {
		if (this._saveTimeout !== undefined) {
			clearTimeout(this._saveTimeout);
			this._saveTimeout = undefined;
		}
		this._pendingSave = false;
	}

	/**
	 * Check if there's a pending save operation
	 */
	get hasPendingSave(): boolean {
		return this._pendingSave || this._saveTimeout !== undefined;
	}

	/**
	 * Update debounce delay
	 */
	setDebounceDelay(delay: number): void {
		this._debounceDelay = delay;
	}

	/**
	 * Get current debounce delay
	 */
	get debounceDelay(): number {
		return this._debounceDelay;
	}

	/**
	 * Get autosave enabled status
	 */
	get autosaveEnabled(): boolean {
		return this._autosaveEnabled;
	}

	/**
	 * Get save callback function
	 */
	get saveCallback(): ((jsonString: string) => void | Promise<void>) | undefined {
		return this._saveCallback;
	}

	/**
	 * Set autosave enabled status
	 */
	setAutosaveEnabled(enabled: boolean): void {
		this._autosaveEnabled = enabled;
	}

	/**
	 * Auto-save wrapper for modification methods
	 */
	private async autoSave(): Promise<void> {
		if (this._autosaveEnabled && this._saveCallback !== undefined) {
			await this.save();
		}
	}

	/**
	 * Move a branch from one folder to another
	 */
	async moveBranchToFolder(branchId: string, fromFolderName: string, toFolderName: string): Promise<void> {
		const fromFolder = this.getFolder(fromFolderName);
		const toFolder = this.getFolder(toFolderName);

		if (!fromFolder) {
			throw new Error(`Source folder '${fromFolderName}' not found`);
		}
		if (!toFolder) {
			throw new Error(`Destination folder '${toFolderName}' not found`);
		}
		if (!this.getBranch(branchId)) {
			throw new Error(`Branch '${branchId}' not found`);
		}

		// Remove from source folder
		const branchIndex = fromFolder.branchIds.indexOf(branchId);
		if (branchIndex === -1) {
			throw new Error(`Branch '${branchId}' not found in folder '${fromFolderName}'`);
		}
		fromFolder.branchIds.splice(branchIndex, 1);

		// Add to destination folder (if not already there)
		if (!toFolder.branchIds.includes(branchId)) {
			toFolder.branchIds.push(branchId);
		}

		await this.autoSave();
	}

	/**
	 * Add a new folder
	 */
	async addFolder(folderName: string, color?: string, branchIds: string[] = [], order?: number): Promise<void> {
		if (this.getFolder(folderName)) {
			throw new Error(`Folder '${folderName}' already exists`);
		}

		// Validate branch IDs exist
		for (const branchId of branchIds) {
			if (!this.getBranch(branchId)) {
				throw new Error(`Branch '${branchId}' not found`);
			}
		}

		// Auto-generate color if not provided
		if (!color) {
			const usedColors = Object.values(this._folders).map(f => f.color);
			color = getUnusedColor(usedColors);
		} else {
			// Validate and format provided color
			color = validateAndFormatColor(color);
		}

		// Auto-assign order if not provided
		if (order === undefined) {
			const existingOrders = Object.values(this._folders).map(f => f.order ?? 0);
			order = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 0;
		}

		this._folders[folderName] = {
			color,
			branchIds: [...branchIds],
			order,
		};

		await this.autoSave();
	}

	/**
	 * Remove a folder and all its associated branches
	 */
	async removeFolder(folderName: string): Promise<void> {
		const folder = this.getFolder(folderName);
		if (!folder) {
			throw new Error(`Folder '${folderName}' not found`);
		}

		// First, remove all branches associated with this folder
		for (const branchId of folder.branchIds) {
			if (this.getBranch(branchId)) {
				delete this._branches[branchId];
			}
		}

		// Then remove the folder itself
		delete this._folders[folderName];
		await this.autoSave();
	}

	/**
	 * Add a branch to a folder
	 */
	async addBranchToFolder(branchId: string, folderName: string): Promise<void> {
		const folder = this.getFolder(folderName);
		if (!folder) {
			throw new Error(`Folder '${folderName}' not found`);
		}
		if (!this.getBranch(branchId)) {
			throw new Error(`Branch '${branchId}' not found`);
		}

		if (!folder.branchIds.includes(branchId)) {
			folder.branchIds.push(branchId);
		}

		await this.autoSave();
	}

	/**
	 * Remove a branch from a folder
	 */
	async removeBranchFromFolder(branchId: string, folderName: string): Promise<void> {
		const folder = this.getFolder(folderName);
		if (!folder) {
			throw new Error(`Folder '${folderName}' not found`);
		}

		const branchIndex = folder.branchIds.indexOf(branchId);
		if (branchIndex === -1) {
			throw new Error(`Branch '${branchId}' not found in folder '${folderName}'`);
		}

		folder.branchIds.splice(branchIndex, 1);
		await this.autoSave();
	}

	/**
	 * Add a new branch or update an existing one
	 */
	async updateBranch(branchId: string, updates: Partial<Branch>): Promise<void> {
		const existingBranch = this.getBranch(branchId);

		if (existingBranch) {
			// Update existing branch
			Object.assign(existingBranch, updates);
		} else {
			// Create new branch - require all fields for new branches
			if (!updates.branchVersion || !updates.branchPath) {
				throw new Error("New branches require both branchVersion and branchPath");
			}

			this._branches[branchId] = {
				branchVersion: updates.branchVersion,
				branchPath: updates.branchPath,
			};
		}

		await this.autoSave();
	}

	/**
	 * Remove a branch entirely (from all folders and branch collection)
	 */
	async removeBranch(branchId: string): Promise<void> {
		if (!this.getBranch(branchId)) {
			throw new Error(`Branch '${branchId}' not found`);
		}

		// Remove from all folders
		for (const folder of Object.values(this._folders)) {
			const branchIndex = folder.branchIds.indexOf(branchId);
			if (branchIndex !== -1) {
				folder.branchIds.splice(branchIndex, 1);
			}
		}

		// Remove from branches collection
		delete this._branches[branchId];
		await this.autoSave();
	}

	/**
	 * Add a new branch with required fields and assign it to specified folders
	 */
	async addBranch(branchId: string, branchVersion: string, branchPath: string, folderNames: string[]): Promise<void> {
		// Check if branch already exists
		if (this.getBranch(branchId)) {
			throw new Error(`Branch '${branchId}' already exists`);
		}

		// Validate required fields (branchPath can be empty for new branches)
		if (!branchVersion) {
			throw new Error("Branch version is required");
		}

		// Validate folders exist
		for (const folderName of folderNames) {
			if (!this.getFolder(folderName)) {
				throw new Error(`Folder '${folderName}' not found`);
			}
		}

		// Create the branch
		this._branches[branchId] = {
			branchVersion,
			branchPath
		};

		// Add to folders
		for (const folderName of folderNames) {
			const folder = this._folders[folderName];
			if (folder && !folder.branchIds.includes(branchId)) {
				folder.branchIds.push(branchId);
			}
		}

		await this.autoSave();
	}

	/**
	 * Update folder color
	 */
	async updateFolderColor(folderName: string, color: string): Promise<void> {
		const folder = this.getFolder(folderName);
		if (!folder) {
			throw new Error(`Folder '${folderName}' not found`);
		}

		folder.color = color;
		await this.autoSave();
	}

	/**
	 * Update folder name (creates new folder with same properties and removes old one)
	 */
	async renameFolderTo(oldName: string, newName: string): Promise<void> {
		const folder = this.getFolder(oldName);
		if (!folder) {
			throw new Error(`Folder '${oldName}' not found`);
		}
		if (this.getFolder(newName)) {
			throw new Error(`Folder '${newName}' already exists`);
		}

		// Create new folder with same properties
		this._folders[newName] = {
			color: folder.color,
			branchIds: [...folder.branchIds],
		};

		// Remove old folder
		delete this._folders[oldName];
		await this.autoSave();
	}

	/**
	 * Reorder a branch within a folder
	 */
	async reorderBranchInFolder(branchId: string, folderName: string, newIndex: number): Promise<void> {
		const folder = this.getFolder(folderName);
		if (!folder) {
			throw new Error(`Folder '${folderName}' not found`);
		}
		if (!this.getBranch(branchId)) {
			throw new Error(`Branch '${branchId}' not found`);
		}

		// Safety check: Validate newIndex bounds
		if (newIndex < 0 || newIndex > folder.branchIds.length) {
			throw new Error(`Invalid index ${newIndex} for folder '${folderName}' with ${folder.branchIds.length} branches`);
		}

		const currentIndex = folder.branchIds.indexOf(branchId);
		if (currentIndex === -1) {
			throw new Error(`Branch '${branchId}' not found in folder '${folderName}'`);
		}

		// Safety check: Skip if already at target position
		if (currentIndex === newIndex) {
			return; // No need to reorder
		}

		// Remove from current position
		folder.branchIds.splice(currentIndex, 1);

		// Insert at new position (adjust index if removing from before the insertion point)
		const adjustedIndex = currentIndex < newIndex ? newIndex - 1 : newIndex;
		folder.branchIds.splice(adjustedIndex, 0, branchId);

		await this.autoSave();
	}

	/**
	 * Atomic operation to move a branch to a different folder and reorder it at a specific position
	 * This prevents race conditions that can occur when moving and reordering in separate operations
	 */
	async moveAndReorderBranch(branchId: string, fromFolderName: string, toFolderName: string, newIndex: number): Promise<void> {
		const fromFolder = this.getFolder(fromFolderName);
		const toFolder = this.getFolder(toFolderName);

		if (!fromFolder) {
			throw new Error(`Source folder '${fromFolderName}' not found`);
		}
		if (!toFolder) {
			throw new Error(`Destination folder '${toFolderName}' not found`);
		}
		if (!this.getBranch(branchId)) {
			throw new Error(`Branch '${branchId}' not found`);
		}

		// Remove from source folder
		const branchIndex = fromFolder.branchIds.indexOf(branchId);
		if (branchIndex === -1) {
			throw new Error(`Branch '${branchId}' not found in folder '${fromFolderName}'`);
		}
		fromFolder.branchIds.splice(branchIndex, 1);

		// Add to destination folder at specific position (if not already there)
		if (!toFolder.branchIds.includes(branchId)) {
			toFolder.branchIds.splice(newIndex, 0, branchId);
		} else {
			// If somehow already in destination folder, just reorder
			const currentIndex = toFolder.branchIds.indexOf(branchId);
			if (currentIndex !== newIndex) {
				toFolder.branchIds.splice(currentIndex, 1);
				toFolder.branchIds.splice(newIndex, 0, branchId);
			}
		}

		await this.autoSave();
	}

	/**
	 * Reorder folders by updating their order property
	 */
	async reorderFolders(folderNames: string[]): Promise<void> {
		// Validate all folder names exist
		for (const folderName of folderNames) {
			if (!this.getFolder(folderName)) {
				throw new Error(`Folder '${folderName}' not found`);
			}
		}

		// Update order property for each folder
		folderNames.forEach((folderName, index) => {
			const folder = this._folders[folderName];
			if (folder) {
				folder.order = index;
			}
		});

		await this.autoSave();
	}

	/**
	 * Create a deep clone of the configuration
	 */
	clone(): BranchConfig {
		// Create a deep copy of the configuration data
		const clonedData = {
			folders: JSON.parse(JSON.stringify(this._folders)),
			branches: JSON.parse(JSON.stringify(this._branches))
		};
		
		// Create a new BranchConfig instance with the cloned data
		const clonedConfig = new BranchConfig(
			JSON.stringify(clonedData),
			this._saveCallback,
			this._debounceDelay,
			this._autosaveEnabled
		);
		
		return clonedConfig;
	}
	/**
	 * Get summary statistics
	 */
	getSummary(): {
		totalFolders: number;
		totalBranches: number;
		averageBranchesPerFolder: number;
	} {
		const totalFolders = Object.keys(this._folders).length;
		const totalBranches = Object.keys(this._branches).length;
		const totalBranchReferences = Object.values(this._folders).reduce((sum, folder) => sum + folder.branchIds.length, 0);

		return {
			totalFolders,
			totalBranches,
			averageBranchesPerFolder: totalBranchReferences / totalFolders,
		};
	}
}

export { BranchConfig };
export type { Branch, Folder, ConfigData };
