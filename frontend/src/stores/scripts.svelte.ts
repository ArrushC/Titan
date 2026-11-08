/**
 * Scripts Store - Manages script state, selection, and execution
 * Provides reactive state management for the Scripts component
 */

// Script interfaces matching backend types
interface ScriptInfo {
	name: string;
	path: string;
	extension: string;
	size: number;
	modifiedTime: string;
	lastExecuted?: string;
}

interface ScriptExecution {
	scriptName: string;
	executedAt: string;
	branchPaths: string[];
	success: boolean;
	outputSample?: string;
}

interface ScriptExecutionResult {
	scriptName: string;
	branchPath: string;
	success: boolean;
	output: string;
	error?: string;
	startTime: string;
	endTime: string;
}

interface ScriptSelection {
	scriptPath: string;
	order: number; // Execution order based on selection sequence
}

class ScriptsStore {
	private _state = $state({
		// Scripts data
		scripts: [] as ScriptInfo[],
		executionHistory: [] as ScriptExecution[],
		
		// Selection state
		selectedScripts: new Map<string, ScriptSelection>(),
		selectionCounter: 0,
		
		// Execution state
		isExecuting: false,
		executionResults: [] as ScriptExecutionResult[],
		currentlyExecuting: null as { script: string; branch: string } | null,
		currentOutput: new Map<string, string[]>(), // Map of "script:branch" -> output lines
		
		// UI state
		isReloading: false,
		lastError: null as string | null,
		sortBy: "name" as "name" | "lastExecuted" | "extension",
		sortDirection: "asc" as "asc" | "desc",
	});

	// Scripts getters
	get scripts(): ScriptInfo[] {
		return this._state.scripts;
	}

	get executionHistory(): ScriptExecution[] {
		return this._state.executionHistory;
	}

	// Selection getters
	get selectedScripts(): Map<string, ScriptSelection> {
		return this._state.selectedScripts;
	}

	get selectedScriptPaths(): string[] {
		// Return paths sorted by selection order
		return Array.from(this._state.selectedScripts.entries())
			.sort((a, b) => a[1].order - b[1].order)
			.map(([path]) => path);
	}

	get hasSelectedScripts(): boolean {
		return this._state.selectedScripts.size > 0;
	}

	get selectionCount(): number {
		return this._state.selectedScripts.size;
	}

	// Execution getters
	get isExecuting(): boolean {
		return this._state.isExecuting;
	}

	get executionResults(): ScriptExecutionResult[] {
		return this._state.executionResults;
	}

	get currentlyExecuting(): { script: string; branch: string } | null {
		return this._state.currentlyExecuting;
	}

	get currentOutput(): Map<string, string[]> {
		return this._state.currentOutput;
	}

	// UI state getters
	get isReloading(): boolean {
		return this._state.isReloading;
	}

	get lastError(): string | null {
		return this._state.lastError;
	}

	get sortBy(): "name" | "lastExecuted" | "extension" {
		return this._state.sortBy;
	}

	get sortDirection(): "asc" | "desc" {
		return this._state.sortDirection;
	}

	// Computed properties
	get sortedScripts(): ScriptInfo[] {
		const scripts = [...this._state.scripts];
		
		scripts.sort((a, b) => {
			let aValue: any;
			let bValue: any;
			
			switch (this._state.sortBy) {
				case "name":
					aValue = a.name.toLowerCase();
					bValue = b.name.toLowerCase();
					break;
				case "lastExecuted":
					aValue = a.lastExecuted || "";
					bValue = b.lastExecuted || "";
					break;
				case "extension":
					aValue = a.extension;
					bValue = b.extension;
					break;
				default:
					aValue = a.name.toLowerCase();
					bValue = b.name.toLowerCase();
			}
			
			if (aValue < bValue) return this._state.sortDirection === "asc" ? -1 : 1;
			if (aValue > bValue) return this._state.sortDirection === "asc" ? 1 : -1;
			return 0;
		});
		
		return scripts;
	}

	// Script management methods
	setScripts(scripts: ScriptInfo[]): void {
		this._state.scripts = scripts;
		this._state.lastError = null;
	}

	setExecutionHistory(history: ScriptExecution[]): void {
		this._state.executionHistory = history;
	}

	// Selection methods
	toggleScriptSelection(scriptPath: string): void {
		const currentSelection = this._state.selectedScripts;
		
		if (currentSelection.has(scriptPath)) {
			// Remove from selection
			currentSelection.delete(scriptPath);
			// Recompact selection orders
			this.recompactSelectionOrders();
		} else {
			// Add to selection with current order
			currentSelection.set(scriptPath, {
				scriptPath,
				order: ++this._state.selectionCounter
			});
		}
		
		// Trigger reactivity
		this._state.selectedScripts = new Map(currentSelection);
	}

	// Helper method to recompact selection orders (1, 2, 3, ...)
	private recompactSelectionOrders(): void {
		const selections = Array.from(this._state.selectedScripts.entries())
			.sort((a, b) => a[1].order - b[1].order);
		
		this._state.selectedScripts.clear();
		this._state.selectionCounter = 0;
		
		selections.forEach(([scriptPath]) => {
			this._state.selectedScripts.set(scriptPath, {
				scriptPath,
				order: ++this._state.selectionCounter
			});
		});
	}

	isScriptSelected(scriptPath: string): boolean {
		return this._state.selectedScripts.has(scriptPath);
	}

	getSelectionOrder(scriptPath: string): number | null {
		const selection = this._state.selectedScripts.get(scriptPath);
		return selection ? selection.order : null;
	}

	selectAllScripts(): void {
		const newSelection = new Map<string, ScriptSelection>();
		let counter = 0;
		
		this._state.scripts.forEach(script => {
			newSelection.set(script.path, {
				scriptPath: script.path,
				order: ++counter
			});
		});
		
		this._state.selectedScripts = newSelection;
		this._state.selectionCounter = counter;
	}

	selectNoneScripts(): void {
		this._state.selectedScripts = new Map();
		this._state.selectionCounter = 0;
	}

	// Execution methods
	setExecutionState(isExecuting: boolean): void {
		this._state.isExecuting = isExecuting;
		if (!isExecuting) {
			this._state.currentlyExecuting = null;
		}
	}

	setCurrentlyExecuting(script: string | null, branch: string | null): void {
		this._state.currentlyExecuting = script && branch ? { script, branch } : null;
		// Initialize output for the new execution
		if (script && branch) {
			const key = `${script}:${branch}`;
			this._state.currentOutput.set(key, []);
			// Trigger reactivity
			this._state.currentOutput = new Map(this._state.currentOutput);
		}
	}

	addExecutionResult(result: ScriptExecutionResult): void {
		this._state.executionResults = [...this._state.executionResults, result];
	}

	clearExecutionResults(): void {
		this._state.executionResults = [];
		this._state.currentOutput.clear();
		this._state.currentOutput = new Map();
	}

	// Add output line for current execution
	appendOutput(script: string, branch: string, output: string): void {
		const key = `${script}:${branch}`;
		const currentLines = this._state.currentOutput.get(key) || [];
		
		// Limit the number of lines to prevent performance issues
		const maxLines = 500;
		const newLines = [...currentLines, output];
		if (newLines.length > maxLines) {
			newLines.splice(0, newLines.length - maxLines);
		}
		
		this._state.currentOutput.set(key, newLines);
		// Trigger reactivity
		this._state.currentOutput = new Map(this._state.currentOutput);
	}

	// Get output for current execution
	getCurrentExecutionOutput(): string[] {
		if (!this._state.currentlyExecuting) {
			return [];
		}
		const key = `${this._state.currentlyExecuting.script}:${this._state.currentlyExecuting.branch}`;
		return this._state.currentOutput.get(key) || [];
	}

	// UI state methods
	setReloading(isReloading: boolean): void {
		this._state.isReloading = isReloading;
	}

	setError(error: string | null): void {
		this._state.lastError = error;
	}

	setSorting(sortBy: "name" | "lastExecuted" | "extension", direction?: "asc" | "desc"): void {
		// If same column, toggle direction
		if (sortBy === this._state.sortBy && !direction) {
			this._state.sortDirection = this._state.sortDirection === "asc" ? "desc" : "asc";
		} else {
			this._state.sortBy = sortBy;
			this._state.sortDirection = direction || "asc";
		}
	}

	// Utility methods
	getScriptByPath(scriptPath: string): ScriptInfo | undefined {
		return this._state.scripts.find(script => script.path === scriptPath);
	}

	getScriptsByExtension(extension: string): ScriptInfo[] {
		return this._state.scripts.filter(script => script.extension === extension);
	}

	// Reset all state
	reset(): void {
		this._state.scripts = [];
		this._state.executionHistory = [];
		this._state.selectedScripts = new Map();
		this._state.selectionCounter = 0;
		this._state.isExecuting = false;
		this._state.executionResults = [];
		this._state.currentlyExecuting = null;
		this._state.isReloading = false;
		this._state.lastError = null;
		this._state.sortBy = "name";
		this._state.sortDirection = "asc";
	}
}

// Create singleton instance
const scriptsStore = new ScriptsStore();

// Export the store instance
export { scriptsStore };

// Export types for use in components
export type { ScriptInfo, ScriptExecution, ScriptExecutionResult, ScriptSelection };