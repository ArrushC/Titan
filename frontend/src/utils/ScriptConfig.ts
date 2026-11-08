// Type definitions for the scripts configuration structure
interface ScriptExecution {
	scriptName: string;
	executedAt: string;
	branchPaths: string[];
	success: boolean;
	outputSample?: string;
}

interface ScriptSettings {
	scriptsPath: string;
	maxHistorySize: number;
	enableNotifications: boolean;
}

interface ScriptsData {
	executionHistory: ScriptExecution[];
	settings: ScriptSettings;
}

class ScriptConfig {
	private _executionHistory: ScriptExecution[];
	private _settings: ScriptSettings;
	private _saveCallback: (jsonString: string) => void | Promise<void> | undefined;
	private _saveTimeout: ReturnType<typeof setTimeout> | undefined;
	private _debounceDelay: number;
	private _pendingSave: boolean = false;
	private _autosaveEnabled: boolean;

	constructor(jsonString: string, saveCallback: (jsonString: string) => void | Promise<void> | undefined, debounceDelay: number = 1000, autosaveEnabled: boolean = false) {
		this._executionHistory = [];
		this._settings = {
			scriptsPath: 'C:\\Titan\\scripts',
			maxHistorySize: 100,
			enableNotifications: true
		};
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
			const data: ScriptsData = JSON.parse(jsonString);

			this._executionHistory = data.executionHistory || [];
			this._settings = {
				...this._settings,
				...data.settings
			};
		} catch (error) {
			// If parsing fails, use default values
			console.warn('Failed to parse scripts config, using defaults:', error);
		}
	}

	/**
	 * Get execution history
	 */
	get executionHistory(): ScriptExecution[] {
		return this._executionHistory;
	}

	/**
	 * Get settings
	 */
	get settings(): ScriptSettings {
		return this._settings;
	}

	/**
	 * Get scripts directory path
	 */
	getScriptsPath(): string {
		return this._settings.scriptsPath;
	}

	/**
	 * Set scripts directory path
	 */
	async setScriptsPath(path: string): Promise<void> {
		this._settings.scriptsPath = path;
		await this.autoSave();
	}

	/**
	 * Get max history size
	 */
	getMaxHistorySize(): number {
		return this._settings.maxHistorySize;
	}

	/**
	 * Set max history size
	 */
	async setMaxHistorySize(size: number): Promise<void> {
		this._settings.maxHistorySize = size;
		// Trim history if needed
		if (this._executionHistory.length > size) {
			this._executionHistory = this._executionHistory.slice(0, size);
		}
		await this.autoSave();
	}

	/**
	 * Get notifications enabled status
	 */
	getNotificationsEnabled(): boolean {
		return this._settings.enableNotifications;
	}

	/**
	 * Set notifications enabled status
	 */
	async setNotificationsEnabled(enabled: boolean): Promise<void> {
		this._settings.enableNotifications = enabled;
		await this.autoSave();
	}

	/**
	 * Add a script execution to history
	 */
	async addScriptExecution(execution: ScriptExecution): Promise<void> {
		// Add to beginning of array (most recent first)
		this._executionHistory.unshift(execution);
		
		// Keep only max history size
		if (this._executionHistory.length > this._settings.maxHistorySize) {
			this._executionHistory = this._executionHistory.slice(0, this._settings.maxHistorySize);
		}
		
		await this.autoSave();
	}

	/**
	 * Clear script execution history
	 */
	async clearExecutionHistory(): Promise<void> {
		this._executionHistory = [];
		await this.autoSave();
	}

	/**
	 * Get executions for a specific script
	 */
	getScriptExecutions(scriptName: string): ScriptExecution[] {
		return this._executionHistory.filter(execution => execution.scriptName === scriptName);
	}

	/**
	 * Get last execution time for a script
	 */
	getLastExecutionTime(scriptName: string): string | undefined {
		const executions = this.getScriptExecutions(scriptName);
		return executions.length > 0 ? executions[0]?.executedAt : undefined;
	}

	/**
	 * Get execution statistics
	 */
	getExecutionStats(): {
		totalExecutions: number;
		successfulExecutions: number;
		failedExecutions: number;
		successRate: number;
		uniqueScripts: number;
		lastExecutionTime?: string;
	} {
		const successful = this._executionHistory.filter(exec => exec.success).length;
		const failed = this._executionHistory.filter(exec => !exec.success).length;
		const uniqueScripts = new Set(this._executionHistory.map(exec => exec.scriptName)).size;
		
		const stats = {
			totalExecutions: this._executionHistory.length,
			successfulExecutions: successful,
			failedExecutions: failed,
			successRate: this._executionHistory.length > 0 ? (successful / this._executionHistory.length) * 100 : 0,
			uniqueScripts,
		} as const;
		
		const lastExecution = this._executionHistory.length > 0 ? this._executionHistory[0]?.executedAt : undefined;
		
		return {
			...stats,
			...(lastExecution && { lastExecutionTime: lastExecution }),
		};
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
	 * Export current configuration back to JSON string
	 */
	toJson(): string {
		return JSON.stringify(
			{
				executionHistory: this._executionHistory,
				settings: this._settings,
			},
			null,
			2
		);
	}

	/**
	 * Create a deep clone of the configuration
	 */
	clone(): ScriptConfig {
		// Create a deep copy of the configuration data
		const clonedData = {
			executionHistory: JSON.parse(JSON.stringify(this._executionHistory)),
			settings: JSON.parse(JSON.stringify(this._settings))
		};
		
		// Create a new ScriptConfig instance with the cloned data
		const clonedConfig = new ScriptConfig(
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
		totalExecutions: number;
		recentExecutions: number;
		scriptsPath: string;
		notificationsEnabled: boolean;
	} {
		// Count executions from last 24 hours
		const oneDayAgo = new Date();
		oneDayAgo.setDate(oneDayAgo.getDate() - 1);
		const recentExecutions = this._executionHistory.filter(exec => 
			new Date(exec.executedAt) > oneDayAgo
		).length;

		return {
			totalExecutions: this._executionHistory.length,
			recentExecutions,
			scriptsPath: this._settings.scriptsPath,
			notificationsEnabled: this._settings.enableNotifications,
		};
	}
}

// Export types for external use
export { ScriptConfig };
export type { ScriptExecution, ScriptSettings, ScriptsData };