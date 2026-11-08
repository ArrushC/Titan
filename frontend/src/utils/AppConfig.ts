// Type definitions for the settings structure
interface Trello {
	key: string;
	token: string;
}

interface Subversion {
	author: string;
}

interface Integrations {
	trello: Trello;
}

interface IgnoredPaths {
	unknown: string[];
	modified: string[];
}

interface CommitVariable {
	name: string;
	defaultValue: string;
	description: string;
	required?: boolean;
}

interface CommitSettings {
	variables: CommitVariable[];
	messageTemplate: string;
	maxCommitDelay: number; // seconds between commit batches
	clipboardTemplate: string;
}

interface SettingsData {
	subversion: Subversion;
	integrations: Integrations;
	ignoredPaths: IgnoredPaths;
	commit?: CommitSettings;
	theme?: string;
}

type IntegrationName = string;
type PathCategory = "unknown" | "modified";

class AppConfig {
	private _subversion: Subversion;
	private _integrations: Integrations;
	private _ignoredPaths: IgnoredPaths;
	private _commit: CommitSettings;
	private _theme: string;
	private _saveCallback: (jsonString: string) => void | Promise<void> | undefined;
	private _saveTimeout: ReturnType<typeof setTimeout> | undefined;
	private _debounceDelay: number;
	private _pendingSave: boolean = false;
	private _autosaveEnabled: boolean;

	constructor(jsonString: string, saveCallback: (jsonString: string) => void | Promise<void> | undefined, debounceDelay: number = 1000, autosaveEnabled: boolean = false) {
		this._subversion = { author: '' };
		this._integrations = { trello: { key: '', token: '' } };
		this._ignoredPaths = { unknown: [], modified: [] };
		this._commit = {
			variables: [
				{ name: 'issueNumber', defaultValue: '', description: 'Issue or ticket number' },
				{ name: 'component', defaultValue: '', description: 'Component or module name' }
			],
			messageTemplate: '$t{issueNumber}: $t{component}',
			maxCommitDelay: 1.5,
			clipboardTemplate: '$t{{branchFolder}} Revision $t{{revision}}'
		};
		this._theme = 'light';
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
			const data: SettingsData = JSON.parse(jsonString);

			if (!data.integrations || !data.ignoredPaths) {
				throw new Error("Invalid settings: missing integrations or ignoredPaths");
			}

			this._subversion = data.subversion || { author: '' };
			this._integrations = data.integrations;
			this._ignoredPaths = data.ignoredPaths;
			
			// Merge commit settings, preserving default values for missing fields
			if (data.commit) {
				this._commit = {
					...this._commit,
					...data.commit,
					variables: data.commit.variables || this._commit.variables || []
				};
			}
			
			// Load theme, default to 'light' if not specified
			this._theme = data.theme || 'light';
		} catch (error) {
			throw new Error(`Failed to parse settings: ${error instanceof Error ? error.message : error}`);
		}
	}

	/**
	 * Get all integrations
	 */
	get integrations(): Integrations {
		return this._integrations;
	}

	/**
	 * Get subversion configuration
	 */
	get subversion(): Subversion {
		return this._subversion;
	}

	/**
	 * Get ignored paths
	 */
	get ignoredPaths(): IgnoredPaths {
		return this._ignoredPaths;
	}

	/**
	 * Get commit settings
	 */
	get commit(): CommitSettings {
		return this._commit;
	}

	/**
	 * Get theme
	 */
	get theme(): string {
		return this._theme;
	}


	/**
	 * Get the Trello integration
	 */
	getTrelloIntegration(): Trello {
		return this._integrations.trello;
	}

	/**
	 * Get ignored paths for a specific category
	 */
	getIgnoredPaths(category: PathCategory): string[] {
		return this._ignoredPaths[category];
	}

	/**
	 * Check if Trello integration has valid credentials
	 */
	hasTrelloCredentials(): boolean {
		const trello = this._integrations.trello;
		return trello.key.length > 0 && trello.token.length > 0;
	}

	/**
	 * Get subversion author
	 */
	getSubversionAuthor(): string {
		return this._subversion.author;
	}

	/**
	 * Check if a path is ignored in a specific category
	 */
	isPathIgnored(path: string, category: PathCategory): boolean {
		return this._ignoredPaths[category].some((ignoredPath) => {
			try {
				// Try as regex first
				const regex = new RegExp(ignoredPath);
				return regex.test(path);
			} catch {
				// Fall back to exact string match
				return path === ignoredPath;
			}
		});
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
	 * Save settings using the provided callback (debounced)
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
	 * Save settings immediately without debouncing
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

	// Integration Management Methods

	/**
	 * Set Trello integration credentials
	 */
	async setTrelloIntegration(key: string, token: string): Promise<void> {
		this._integrations.trello = { key, token };
		await this.autoSave();
	}

	/**
	 * Update Trello integration key
	 */
	async updateTrelloKey(key: string): Promise<void> {
		this._integrations.trello.key = key;
		await this.autoSave();
	}

	/**
	 * Update Trello integration token
	 */
	async updateTrelloToken(token: string): Promise<void> {
		this._integrations.trello.token = token;
		await this.autoSave();
	}

	/**
	 * Clear Trello integration credentials
	 */
	async clearTrelloIntegration(): Promise<void> {
		this._integrations.trello = { key: '', token: '' };
		await this.autoSave();
	}

	// Subversion Management Methods

	/**
	 * Set subversion author
	 */
	async setSubversionAuthor(author: string): Promise<void> {
		this._subversion.author = author;
		await this.autoSave();
	}

	// Ignored Paths Management Methods

	/**
	 * Add a path to ignored paths
	 */
	async addIgnoredPath(category: PathCategory, path: string): Promise<void> {
		if (!this._ignoredPaths[category].includes(path)) {
			this._ignoredPaths[category].push(path);
			await this.autoSave();
		}
	}

	/**
	 * Remove a path from ignored paths
	 */
	async removeIgnoredPath(category: PathCategory, path: string): Promise<void> {
		const index = this._ignoredPaths[category].indexOf(path);
		if (index === -1) {
			throw new Error(`Path '${path}' not found in ${category} ignored paths`);
		}

		this._ignoredPaths[category].splice(index, 1);
		await this.autoSave();
	}

	/**
	 * Clear all ignored paths for a category
	 */
	async clearIgnoredPaths(category: PathCategory): Promise<void> {
		this._ignoredPaths[category] = [];
		await this.autoSave();
	}

	/**
	 * Replace all ignored paths for a category
	 */
	async setIgnoredPaths(category: PathCategory, paths: string[]): Promise<void> {
		this._ignoredPaths[category] = [...paths];
		await this.autoSave();
	}

	/**
	 * Move a path from one category to another
	 */
	async moveIgnoredPath(path: string, fromCategory: PathCategory, toCategory: PathCategory): Promise<void> {
		const fromIndex = this._ignoredPaths[fromCategory].indexOf(path);
		if (fromIndex === -1) {
			throw new Error(`Path '${path}' not found in ${fromCategory} ignored paths`);
		}

		// Remove from source category
		this._ignoredPaths[fromCategory].splice(fromIndex, 1);

		// Add to destination category (if not already there)
		if (!this._ignoredPaths[toCategory].includes(path)) {
			this._ignoredPaths[toCategory].push(path);
		}

		await this.autoSave();
	}

	/**
	 * Find which category contains a specific path
	 */
	findPathCategory(path: string): PathCategory | undefined {
		if (this._ignoredPaths.unknown.includes(path)) return "unknown";
		if (this._ignoredPaths.modified.includes(path)) return "modified";
		return undefined;
	}

	// Commit Management Methods

	/**
	 * Get commit variables
	 */
	getCommitVariables(): CommitVariable[] {
		return this._commit.variables || [];
	}

	/**
	 * Get commit message template
	 */
	getCommitMessageTemplate(): string {
		return this._commit.messageTemplate || '';
	}

	/**
	 * Get max commit delay
	 */
	getMaxCommitDelay(): number {
		return this._commit.maxCommitDelay || 1.5;
	}

	/**
	 * Get clipboard template
	 */
	getClipboardTemplate(): string {
		return this._commit.clipboardTemplate || '$t{{branchFolder}} Revision $t{{revision}}';
	}

	/**
	 * Add a commit variable
	 */
	async addCommitVariable(name: string, defaultValue: string, description?: string, required?: boolean): Promise<void> {
		// Ensure variables array exists
		if (!this._commit.variables) {
			this._commit.variables = [];
		}
		
		if (this._commit.variables.some(v => v.name === name)) {
			throw new Error(`Commit variable '${name}' already exists`);
		}

		this._commit.variables.push({ name, defaultValue, description: description || '', required: required || false });
		await this.autoSave();
	}

	/**
	 * Update a commit variable
	 */
	async updateCommitVariable(name: string, updates: Partial<Omit<CommitVariable, 'name'>>): Promise<void> {
		// Ensure variables array exists
		if (!this._commit.variables) {
			this._commit.variables = [];
		}
		
		const variable = this._commit.variables.find(v => v.name === name);
		if (!variable) {
			throw new Error(`Commit variable '${name}' not found`);
		}

		Object.assign(variable, updates);
		await this.autoSave();
	}

	/**
	 * Remove a commit variable
	 */
	async removeCommitVariable(name: string): Promise<void> {
		// Ensure variables array exists
		if (!this._commit.variables) {
			this._commit.variables = [];
		}
		
		const index = this._commit.variables.findIndex(v => v.name === name);
		if (index === -1) {
			throw new Error(`Commit variable '${name}' not found`);
		}

		this._commit.variables.splice(index, 1);
		await this.autoSave();
	}

	/**
	 * Set commit message template
	 */
	async setCommitMessageTemplate(template: string): Promise<void> {
		this._commit.messageTemplate = template;
		await this.autoSave();
	}

	/**
	 * Set max commit delay
	 */
	async setMaxCommitDelay(delay: number): Promise<void> {
		if (delay < 0.5 || delay > 10) {
			throw new Error('Max commit delay must be between 0.5 and 10 seconds');
		}
		this._commit.maxCommitDelay = delay;
		await this.autoSave();
	}

	/**
	 * Set clipboard template
	 */
	async setClipboardTemplate(template: string): Promise<void> {
		this._commit.clipboardTemplate = template;
		await this.autoSave();
	}

	/**
	 * Set theme
	 */
	async setTheme(theme: string): Promise<void> {
		if (theme !== 'light' && theme !== 'dark') {
			throw new Error('Theme must be either "light" or "dark"');
		}
		this._theme = theme;
		await this.autoSave();
	}


	/**
	 * Interpolate commit message with variables
	 */
	interpolateCommitMessage(variableValues: Record<string, string>): string {
		let message = this._commit.messageTemplate;
		
		// Replace $t{variableName} with actual values
		for (const [name, value] of Object.entries(variableValues)) {
			const regex = new RegExp(`\\$t\\{${name}\\}`, 'g');
			message = message.replace(regex, value);
		}
		
		// Clean up any remaining unused variables
		message = message.replace(/\$t\{[^}]+\}/g, '');
		
		return message.trim();
	}


	/**
	 * Export current settings back to JSON string
	 */
	toJson(): string {
		return JSON.stringify(
			{
				subversion: this._subversion,
				integrations: this._integrations,
				ignoredPaths: this._ignoredPaths,
				commit: this._commit,
				theme: this._theme,
			},
			null,
			2
		);
	}

	/**
	 * Get summary statistics
	 */
	getSummary(): {
		hasTrelloCredentials: boolean;
		totalIgnoredPaths: number;
		unknownPaths: number;
		modifiedPaths: number;
		subversionAuthor: string;
	} {
		return {
			hasTrelloCredentials: this.hasTrelloCredentials(),
			totalIgnoredPaths: this._ignoredPaths.unknown.length + this._ignoredPaths.modified.length,
			unknownPaths: this._ignoredPaths.unknown.length,
			modifiedPaths: this._ignoredPaths.modified.length,
			subversionAuthor: this._subversion.author,
		};
	}

	/**
	 * Validate Trello integration credentials format
	 */
	validateTrelloIntegration(): boolean {
		const trello = this._integrations.trello;
		// Basic validation - can be extended based on specific requirements
		return trello.key.length > 0 && trello.token.length > 0;
	}

	/**
	 * Test if a path matches any ignored path pattern
	 */
	testPathAgainstIgnored(testPath: string): {
		unknown: boolean;
		modified: boolean;
		matchedPatterns: { category: PathCategory; pattern: string }[];
	} {
		const matchedPatterns: { category: PathCategory; pattern: string }[] = [];

		const unknownMatch = this.isPathIgnored(testPath, "unknown");
		const modifiedMatch = this.isPathIgnored(testPath, "modified");

		// Find which patterns matched
		if (unknownMatch) {
			for (const pattern of this._ignoredPaths.unknown) {
				try {
					if (new RegExp(pattern).test(testPath) || testPath === pattern) {
						matchedPatterns.push({ category: "unknown", pattern });
					}
				} catch {
					if (testPath === pattern) {
						matchedPatterns.push({ category: "unknown", pattern });
					}
				}
			}
		}

		if (modifiedMatch) {
			for (const pattern of this._ignoredPaths.modified) {
				try {
					if (new RegExp(pattern).test(testPath) || testPath === pattern) {
						matchedPatterns.push({ category: "modified", pattern });
					}
				} catch {
					if (testPath === pattern) {
						matchedPatterns.push({ category: "modified", pattern });
					}
				}
			}
		}

		return {
			unknown: unknownMatch,
			modified: modifiedMatch,
			matchedPatterns,
		};
	}

	/**
	 * Create a deep clone of the configuration
	 */
	clone(): AppConfig {
		// Create a deep copy of the configuration data
		const clonedData = {
			subversion: JSON.parse(JSON.stringify(this._subversion)),
			integrations: JSON.parse(JSON.stringify(this._integrations)),
			ignoredPaths: JSON.parse(JSON.stringify(this._ignoredPaths)),
			commit: JSON.parse(JSON.stringify(this._commit))
		};
		
		// Create a new AppConfig instance with the cloned data
		const clonedConfig = new AppConfig(
			JSON.stringify(clonedData),
			this._saveCallback,
			this._debounceDelay,
			this._autosaveEnabled
		);
		
		return clonedConfig;
	}
}

// Export types for external use
export { AppConfig };
export type { Subversion, Trello, Integrations, IgnoredPaths, CommitVariable, CommitSettings, SettingsData, IntegrationName, PathCategory }