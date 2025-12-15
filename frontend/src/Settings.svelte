<script lang="ts">
	import { onMount } from "svelte";
	import { getAppConfig, setAppConfig, getBranchConfig, setBranchConfig } from "./stores/app.svelte.ts";
	import Icon from "./components/Icon.svelte";
	import Button from "./components/Button.svelte";
	import IgnoredPathsPanel from "./components/settings/IgnoredPathsPanel.svelte";
	import SecretInput from "./components/SecretInput.svelte";
	import CommitVariablesRow from "./components/settings/CommitVariablesRow.svelte";
	import ColorPicker from "./components/ColorPicker.svelte";
	import FloatingHeader from "./components/FloatingHeader.svelte";
	import { AppConfig } from "./utils/AppConfig.ts";
	import { BranchConfig } from "./utils/BranchConfig.ts";
	import { showError, showSuccess } from "./stores/toast.svelte.ts";
	import { GetAppConfig, ReloadAppConfig, GetBranchConfig } from "../wailsjs/go/main/App.js";

	// Constants
	const CARD = "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6";

	// Core reactive state
	let appConfig = $derived.by(() => getAppConfig());
	let branchConfig = $derived.by(() => getBranchConfig());

	// Edit mode state
	let isEditMode = $state(false);
	let tempAppConfig = $state<AppConfig | null>(null);
	let tempBranchConfig = $state<BranchConfig | null>(null);

	// Optimized derived state
	let activeAppConfig = $derived(isEditMode && tempAppConfig ? tempAppConfig : appConfig);
	let activeBranchConfig = $derived(isEditMode && tempBranchConfig ? tempBranchConfig : branchConfig);

	// Reload state
	let isReloading = $state(false);
	let isSaving = $state(false);

	// Ignored paths state
	let editingPathCategory = $state<"unknown" | "modified" | null>(null);
	let editingPathIndex = $state<number | null>(null);
	let editingPathValue = $state<string>("");
	let newPathCategory = $state<"unknown" | "modified">("unknown");
	let newUnknownPath = $state("");
	let newModifiedPath = $state("");

	// Regex testing dialog state
	let showRegexTestDialog = $state(false);
	let testPattern = $state<string>("");
	let testInput = $state<string>("");
	let testResults = $state<{ matches: boolean; error?: string; matchedPatterns?: string[] }>({ matches: false });

	// Commit variables state
	let editingVariableId = $state<string | null>(null);
	let editingVariableName = $state<string>("");
	let editingVariableDescription = $state<string>("");
	let editingVariableDefaultValue = $state<string>("");
	let editingVariableRequired = $state<boolean>(false);
	let newVariableName = $state<string>("");
	let newVariableDescription = $state<string>("");
	let newVariableDefaultValue = $state<string>("");
	let newVariableRequired = $state<boolean>(false);
	let markedForDeletionVariables = $state<Set<string>>(new Set());

	// Commit message template state
	let commitMessageTemplate = $state<string>("");

	// Derived value for template preview
	const templatePreview = $derived.by(() => {
		const template = isEditMode ? commitMessageTemplate : activeAppConfig?.getCommitMessageTemplate();
		const config = isEditMode ? tempAppConfig : activeAppConfig;

		if (!template || !config) return "";

		return template.replace(/\$t\{([^}]+)\}/g, (match, varName) => {
			const variable = config.getCommitVariables().find((v) => v.name === varName);
			return variable?.defaultValue || `[${varName}]`;
		});
	});

	async function reloadConfig() {
		if (isReloading || isEditMode) return;

		try {
			isReloading = true;

			// Reload config from file system
			await ReloadAppConfig();

			// Get both configs in parallel
			const [appConfigJson, branchConfigJson] = await Promise.all([GetAppConfig(), GetBranchConfig()]);

			const currentApp = getAppConfig(),
				currentBranch = getBranchConfig();

			// Create new instances - if either fails, don't swap either store
			const nextApp = new AppConfig(appConfigJson, currentApp?.saveCallback ?? (() => {}), currentApp?.debounceDelay ?? 1000, currentApp?.autosaveEnabled ?? true);
			const nextBranch = new BranchConfig(branchConfigJson, currentBranch?.saveCallback ?? (() => {}), currentBranch?.debounceDelay ?? 1000, currentBranch?.autosaveEnabled ?? true);

			// Update stores atomically
			setAppConfig(nextApp);
			setBranchConfig(nextBranch);

			showSuccess("Configuration reloaded from file");
		} catch (error) {
			console.error("Failed to reload config:", error);
			showError(`Failed to reload configuration: ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			isReloading = false;
		}
	}

	function enterEditMode() {
		if (!appConfig || !branchConfig) return;

		// Clone the current configs for editing
		tempAppConfig = appConfig.clone();
		tempBranchConfig = branchConfig.clone();

		// Disable autosave for the temp configs
		tempAppConfig.setAutosaveEnabled(false);
		tempBranchConfig.setAutosaveEnabled(false);

		// Initialize commit message template from the temp config
		commitMessageTemplate = tempAppConfig.getCommitMessageTemplate();

		// Enter edit mode
		isEditMode = true;
	}

	async function saveChanges() {
		if (!appConfig || !tempAppConfig || !branchConfig || !tempBranchConfig || isSaving) return;

		try {
			isSaving = true;

			// Apply variable deletions before saving
			await applyVariableDeletions();

			// Get the final JSON from the temporary configs
			const appConfigJson = tempAppConfig.toJson();
			const branchConfigJson = tempBranchConfig.toJson();

			// Create new configs with the updated data and original save settings
			const updatedAppConfig = new AppConfig(appConfigJson, appConfig.saveCallback ?? (() => {}), appConfig.debounceDelay, appConfig.autosaveEnabled);
			const updatedBranchConfig = new BranchConfig(branchConfigJson, branchConfig.saveCallback ?? (() => {}), branchConfig.debounceDelay, branchConfig.autosaveEnabled);

			// Save both configs in parallel
			await Promise.all([updatedAppConfig.saveNow(), updatedBranchConfig.saveNow()]);

			// Update the actual configs
			setAppConfig(updatedAppConfig);
			setBranchConfig(updatedBranchConfig);

			// Exit edit mode and clear temp state
			exitEditMode();

			// Show success notification
			showSuccess("Settings saved successfully");
		} catch (error) {
			console.error("Failed to save settings:", error);
			showError(`Failed to save settings: ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			isSaving = false;
		}
	}

	function cancelChanges() {
		exitEditMode();
	}

	function exitEditMode() {
		// Discard temp state
		tempAppConfig = null;
		tempBranchConfig = null;
		isEditMode = false;

		// Clear ignored paths editing state
		editingPathCategory = null;
		editingPathIndex = null;
		editingPathValue = "";
		newPathCategory = "unknown";
		newUnknownPath = "";
		newModifiedPath = "";

		// Clear regex testing state
		showRegexTestDialog = false;
		testPattern = "";
		testInput = "";
		testResults = { matches: false };

		// Clear commit variables editing state
		editingVariableId = null;
		editingVariableName = "";
		editingVariableDescription = "";
		editingVariableDefaultValue = "";
		editingVariableRequired = false;
		newVariableName = "";
		newVariableDescription = "";
		newVariableDefaultValue = "";
		newVariableRequired = false;
		commitMessageTemplate = "";

		// Clear marked deletions
		clearMarkedDeletions();
	}

	// Ignored paths management functions
	function startEditingPath(category: "unknown" | "modified", index: number, currentValue: string) {
		editingPathCategory = category;
		editingPathIndex = index;
		editingPathValue = currentValue;
	}

	function cancelEditingPath() {
		editingPathCategory = null;
		editingPathIndex = null;
		editingPathValue = "";
	}

	async function saveEditingPath() {
		if (!tempAppConfig || editingPathCategory === null || editingPathIndex === null) return;

		const trimmedValue = editingPathValue.trim();
		if (!trimmedValue) {
			showError("Path pattern cannot be empty");
			return;
		}

		// Test if it's a valid regex
		try {
			new RegExp(trimmedValue);
		} catch (regexError) {
			// Invalid regex, but we'll allow it as a literal string
		}

		try {
			const cloned = tempAppConfig.clone();
			const paths = cloned.getIgnoredPaths(editingPathCategory);
			const newPaths = [...paths];
			newPaths[editingPathIndex] = trimmedValue;

			await cloned.setIgnoredPaths(editingPathCategory, newPaths);
			tempAppConfig = cloned; // trigger reactivity

			cancelEditingPath();
			showSuccess("Path pattern updated");
		} catch (error) {
			console.error("Failed to update path pattern:", error);
			showError("Failed to update path pattern");
		}
	}

	// Generalized path handlers
	type Cat = "unknown" | "modified";

	async function addPath(cat: Cat, value: string) {
		if (!tempAppConfig) return;
		const v = value.trim();
		if (!v) return showError("Path pattern cannot be empty");

		try {
			new RegExp(v);
		} catch {} // allow literal fallback

		try {
			const c = tempAppConfig.clone();
			await c.addIgnoredPath(cat, v);
			tempAppConfig = c;
			// Clear the appropriate input
			if (cat === "unknown") newUnknownPath = "";
			else newModifiedPath = "";
			showSuccess("Path pattern added");
		} catch (error) {
			console.error(`Failed to add path pattern:`, error);
			showError(`Failed to add path pattern: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	async function editPath(cat: Cat, i: number, v: string) {
		if (!tempAppConfig) return;
		const c = tempAppConfig.clone();
		const arr = [...c.getIgnoredPaths(cat)];
		arr[i] = v.trim();
		await c.setIgnoredPaths(cat, arr);
		tempAppConfig = c;
		showSuccess("Path pattern updated");
	}

	async function deletePath(cat: Cat, i: number) {
		if (!tempAppConfig) return;
		const c = tempAppConfig.clone();
		const arr = c.getIgnoredPaths(cat);
		const toDel = arr[i];
		if (toDel) await c.removeIgnoredPath(cat, toDel);
		tempAppConfig = c;
		showSuccess("Path pattern deleted");
	}

	// Regex testing functions
	function openRegexTestDialog() {
		showRegexTestDialog = true;
		testPattern = "";
		testInput = "";
		testResults = { matches: false };
	}

	function openRegexTestDialogWithPattern(pattern: string) {
		showRegexTestDialog = true;
		testPattern = pattern;
		testInput = "";
		testResults = { matches: false };
	}

	function closeRegexTestDialog() {
		showRegexTestDialog = false;
		testPattern = "";
		testInput = "";
		testResults = { matches: false };
	}

	function testRegexPattern() {
		if (!activeAppConfig || !testPattern.trim() || !testInput.trim()) {
			testResults = { matches: false, error: "Please provide both pattern and test input" };
			return;
		}

		try {
			// Test against the current app config
			const result = activeAppConfig.testPathAgainstIgnored(testInput.trim());

			// Also test the specific pattern
			let patternMatches = false;
			let patternError: string | undefined;

			try {
				const regex = new RegExp(testPattern.trim());
				patternMatches = regex.test(testInput.trim());
			} catch (regexError) {
				// Try as literal string match
				patternMatches = testInput.trim() === testPattern.trim();
				if (!patternMatches) {
					patternError = `Invalid regex pattern: ${regexError instanceof Error ? regexError.message : "Unknown error"}`;
				}
			}

			const matched = Array.isArray(result.matchedPatterns) ? result.matchedPatterns : [];
			testResults = {
				matches: result.unknown || result.modified || patternMatches,
				...(patternError && { error: patternError }),
				matchedPatterns: matched.map((mp) => `${mp.category}: ${mp.pattern}`),
			};
		} catch (error) {
			testResults = {
				matches: false,
				error: `Test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	// Auto-test when pattern or input changes
	$effect(() => {
		if (showRegexTestDialog && testPattern && testInput) {
			testRegexPattern();
		}
	});

	// Commit variables management functions
	function startEditingVariable(variable: any) {
		editingVariableId = variable.name;
		editingVariableName = variable.name;
		editingVariableDescription = variable.description || "";
		editingVariableDefaultValue = variable.defaultValue || "";
		editingVariableRequired = variable.required || false;
	}

	function cancelEditingVariable() {
		editingVariableId = null;
		editingVariableName = "";
		editingVariableDescription = "";
		editingVariableDefaultValue = "";
		editingVariableRequired = false;
	}

	async function saveEditingVariable() {
		if (!tempAppConfig || !editingVariableId) return;

		try {
			const trimmedName = editingVariableName.trim();
			const trimmedDescription = editingVariableDescription.trim();
			const trimmedDefaultValue = editingVariableDefaultValue.trim();

			if (!trimmedName) {
				showError("Variable name cannot be empty");
				return;
			}

			// Check for duplicate names (excluding current variable) - case insensitive
			const existingVariables = tempAppConfig.getCommitVariables();
			const isDuplicate = existingVariables.some((v) => v.name.toLowerCase() === trimmedName.toLowerCase() && v.name.toLowerCase() !== editingVariableId.toLowerCase());
			if (isDuplicate) {
				showError(`Variable name "${trimmedName}" already exists`);
				return;
			}

			const cloned = tempAppConfig.clone();
			await cloned.updateCommitVariable(editingVariableId, {
				description: trimmedDescription,
				defaultValue: trimmedDefaultValue,
				required: editingVariableRequired,
			});

			// If name changed, we need to remove old and add new
			if (trimmedName !== editingVariableId) {
				await cloned.removeCommitVariable(editingVariableId);
				await cloned.addCommitVariable(trimmedName, trimmedDefaultValue, trimmedDescription, editingVariableRequired);
			}

			tempAppConfig = cloned; // trigger reactivity

			// reset local edit state
			cancelEditingVariable();
			showSuccess("Variable updated successfully");
		} catch (error) {
			console.error("Failed to update variable:", error);
			showError("Failed to update variable");
		}
	}

	async function deleteVariable(variableName: string) {
		if (!tempAppConfig) return;

		try {
			const cloned = tempAppConfig.clone();
			await cloned.removeCommitVariable(variableName);
			tempAppConfig = cloned; // trigger reactivity
			showSuccess("Variable deleted successfully");
		} catch (error) {
			console.error("Failed to delete variable:", error);
			showError("Failed to delete variable");
		}
	}

	async function addNewVariable() {
		if (!tempAppConfig) return;

		try {
			const trimmedName = newVariableName.trim();
			const trimmedDescription = newVariableDescription.trim();
			const trimmedDefaultValue = newVariableDefaultValue.trim();

			if (!trimmedName) {
				showError("Variable name cannot be empty");
				return;
			}

			const cloned = tempAppConfig.clone();
			await cloned.addCommitVariable(trimmedName, trimmedDefaultValue, trimmedDescription, newVariableRequired);

			tempAppConfig = cloned; // trigger reactivity

			// Clear the form
			newVariableName = "";
			newVariableDescription = "";
			newVariableDefaultValue = "";
			newVariableRequired = false;
			showSuccess("Variable added successfully");
		} catch (error) {
			console.error("Failed to add variable:", error);
			if (error instanceof Error && error.message.includes("already exists")) {
				showError(`Variable "${trimmedName}" already exists`);
			} else {
				showError("Failed to add variable");
			}
		}
	}

	// Mark variable for deletion
	function markVariableForDeletion(variableName: string) {
		markedForDeletionVariables.add(variableName);
		markedForDeletionVariables = new Set(markedForDeletionVariables); // Trigger reactivity
	}

	// Undo variable deletion marking
	function undoVariableDeletion(variableName: string) {
		markedForDeletionVariables.delete(variableName);
		markedForDeletionVariables = new Set(markedForDeletionVariables); // Trigger reactivity
	}

	// Apply actual deletions when saving
	async function applyVariableDeletions() {
		if (!tempAppConfig) return;

		const errors: Array<{ variable: string; error: string }> = [];

		for (const variableName of markedForDeletionVariables) {
			try {
				await tempAppConfig.removeCommitVariable(variableName);
			} catch (error) {
				console.error(`Failed to delete variable ${variableName}:`, error);
				errors.push({
					variable: variableName,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		// If any errors occurred, fail-fast and report all failures
		if (errors.length > 0) {
			const errorMessage = errors.length === 1 ? `Failed to delete variable "${errors[0].variable}": ${errors[0].error}` : `Failed to delete ${errors.length} variables:\n${errors.map((e) => `• ${e.variable}: ${e.error}`).join("\n")}`;
			throw new Error(errorMessage);
		}

		// Clear marked deletions after applying
		markedForDeletionVariables.clear();
		markedForDeletionVariables = new Set(markedForDeletionVariables);
	}

	// Clear marked deletions when canceling edit mode
	function clearMarkedDeletions() {
		markedForDeletionVariables.clear();
		markedForDeletionVariables = new Set(markedForDeletionVariables);
	}

	// Initialize commit message template when entering edit mode
	$effect(() => {
		// Sync template value based on mode
		if (isEditMode && tempAppConfig) {
			commitMessageTemplate = tempAppConfig.getCommitMessageTemplate();
		} else if (!isEditMode && appConfig) {
			commitMessageTemplate = appConfig.getCommitMessageTemplate();
		}
	});

	async function updateCommitMessageTemplate() {
		if (!tempAppConfig) return;

		try {
			const cloned = tempAppConfig.clone();
			await cloned.setCommitMessageTemplate(commitMessageTemplate);
			tempAppConfig = cloned; // trigger reactivity
		} catch (error) {
			console.error("Failed to update template:", error);
			showError("Failed to update commit message template");
		}
	}

	// Wrapper functions to match UI function calls
	const deleteCommitVariable = deleteVariable;
	const addNewCommitVariable = addNewVariable;
	const updateCommitTemplate = updateCommitMessageTemplate;
</script>

{#if appConfig && branchConfig}
	<div class="container mx-auto p-4">
		<FloatingHeader>
			{#snippet children()}
				<!-- Header Controls -->
				<div class="flex items-center justify-between w-full">
					<!-- Reload Button -->
					{#if !isEditMode}
						<Button variant="secondary" loading={isReloading} onclick={reloadConfig} tooltip="Reload configuration from file" class="text-sm transition-all duration-300">
							{isReloading ? "Reloading..." : "Reload"}
						</Button>
					{:else}
						<div></div>
					{/if}

					<!-- Edit/Cancel/Save Buttons -->
					<div class="flex items-center gap-x-1.5">
						{#if !isEditMode}
							<Button variant="secondary" onclick={enterEditMode} class="text-sm transition-all duration-300">Edit</Button>
						{:else}
							<Button variant="secondary" onclick={cancelChanges} class="text-sm transition-all duration-300" disabled={isSaving}>Cancel</Button>
							<Button variant="primary" onclick={saveChanges} class="text-sm transition-all duration-300" loading={isSaving} disabled={isSaving}>
								{isSaving ? "Saving..." : "Save"}
							</Button>
						{/if}
					</div>
				</div>
			{/snippet}
		</FloatingHeader>

		<!-- Settings Content -->
		<div class="space-y-6">
			<!-- Subversion Section -->
			<div class={CARD}>
				<h3 class="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
					<Icon name="user" size={20} class="text-gray-600 dark:text-gray-400" />
					Subversion Configuration
				</h3>

				<div class="space-y-4">
					<div>
						<label for="svn-author" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Author Name </label>
						<input
							id="svn-author"
							type="text"
							class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
							class:bg-gray-100={!isEditMode}
							class:dark:bg-gray-800={!isEditMode}
							value={activeAppConfig?.subversion.author ?? ""}
							disabled={!isEditMode}
							oninput={async (e) => {
								if (tempAppConfig) {
									await tempAppConfig.setSubversionAuthor(e.currentTarget.value);
								}
							}}
							placeholder="Enter your SVN author name"
						/>
						<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">This will be used as the default author for SVN commits</p>
					</div>
				</div>
			</div>

			<!-- Commit Variables Section -->
			<div class={CARD}>
				<h3 class="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
					<Icon name="scripts" size={20} class="text-gray-600 dark:text-gray-400" />
					Commit Variables
				</h3>

				<div class="space-y-4">
					<p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
						Configure variables that can be used in commit message templates using <code class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded text-xs transition-all duration-200">$t&#123;variableName&#125;</code> syntax.
					</p>

					<!-- Variables List -->
					<div class="space-y-2">
						{#each (isEditMode ? tempAppConfig : appConfig)?.getCommitVariables() || [] as variable (variable.name)}
							<CommitVariablesRow
								{variable}
								{isEditMode}
								isMarkedForDeletion={markedForDeletionVariables.has(variable.name)}
								{editingVariableId}
								{editingVariableName}
								{editingVariableDescription}
								{editingVariableDefaultValue}
								{editingVariableRequired}
								onStartEdit={startEditingVariable}
								onCancelEdit={cancelEditingVariable}
								onSaveEdit={saveEditingVariable}
								onMarkForDeletion={markVariableForDeletion}
								onUndoDeletion={undoVariableDeletion}
								onUpdateEditingName={(value) => (editingVariableName = value)}
								onUpdateEditingDescription={(value) => (editingVariableDescription = value)}
								onUpdateEditingDefaultValue={(value) => (editingVariableDefaultValue = value)}
								onUpdateEditingRequired={(value) => (editingVariableRequired = value)}
							/>
						{/each}
					</div>

					<!-- Add New Variable -->
					{#if isEditMode}
						<div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
							<h4 class="font-medium text-gray-900 dark:text-gray-100 mb-4">Add New Variable</h4>
							<div class="space-y-4">
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label for="new-variable-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Variable Name <span class="text-red-500">*</span>
										</label>
										<input
											id="new-variable-name"
											type="text"
											bind:value={newVariableName}
											placeholder="e.g., issueNumber"
											class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
											required
										/>
										<p class="mt-1 text-xs text-gray-500">Used in templates as $t&#123;variableName&#125;</p>
									</div>
									<div>
										<label for="new-variable-default" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Default Value </label>
										<input
											id="new-variable-default"
											type="text"
											bind:value={newVariableDefaultValue}
											placeholder="Optional default value"
											class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
										/>
									</div>
								</div>
								<div>
									<label for="new-variable-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Description </label>
									<input
										id="new-variable-description"
										type="text"
										bind:value={newVariableDescription}
										placeholder="e.g., Issue or ticket number"
										class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
									/>
								</div>
								<div class="flex items-center gap-2 mb-4">
									<input type="checkbox" bind:checked={newVariableRequired} id="new-variable-required" class="rounded" />
									<label for="new-variable-required" class="text-sm text-gray-700 dark:text-gray-300"> Required field </label>
								</div>
								<div class="flex justify-start">
									<Button variant="primary" onclick={addNewCommitVariable} disabled={!newVariableName.trim()}>Add Variable</Button>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Commit Message Template Section -->
			<div class={CARD}>
				<h3 class="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
					<Icon name="edit" size={20} class="text-gray-600 dark:text-gray-400" />
					Commit Message Template
				</h3>

				<div class="space-y-4">
					<p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
						Configure the template used for commit messages. Use <code class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded text-xs transition-all duration-200">$t&#123;variableName&#125;</code> to reference variables.
					</p>

					<div class="space-y-2">
						<label for="commit-template" class="block text-sm font-medium text-gray-700 dark:text-gray-300"> Template </label>
						<textarea
							id="commit-template"
							bind:value={commitMessageTemplate}
							placeholder="Enter commit message template (e.g., $t&#123;issueNumber&#125;: $t&#123;component&#125;)"
							class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm h-24 font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
							class:bg-gray-100={!isEditMode}
							class:dark:bg-gray-600={!isEditMode}
							class:resize-y={isEditMode}
							class:resize-none={!isEditMode}
							disabled={!isEditMode}
							oninput={isEditMode ? updateCommitTemplate : undefined}
						></textarea>
						{#if isEditMode}
							<p class="text-xs text-gray-500 dark:text-gray-400">
								Available variables: {(tempAppConfig?.getCommitVariables() || []).map((v) => `$t{${v.name}}`).join(", ") || "None defined"}
							</p>
						{/if}
					</div>

					<!-- Template Preview -->
					{#if activeAppConfig?.getCommitMessageTemplate()}
						<div class="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
							<h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview with sample values:</h4>
							<div class="font-mono text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
								{templatePreview}
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Integrations Section -->
			<div class={CARD}>
				<h3 class="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
					<Icon name="link" size={20} class="text-gray-600 dark:text-gray-400" />
					Integrations
				</h3>

				<div class="space-y-4">
					<!-- Trello Integration -->
					<div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
						<h4 class="text-md font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
							<Icon name="trello" size={16} class="text-blue-600 dark:text-blue-400" />
							Trello
						</h4>

						{#if activeAppConfig}
							{@const trello = activeAppConfig.getTrelloIntegration()}
							{@const hasCredentials = activeAppConfig.hasTrelloCredentials()}

							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<SecretInput
									id="trello-key"
									label="API Key"
									value={trello?.key ?? ""}
									placeholder="Enter Trello API key"
									disabled={!isEditMode}
									class={!isEditMode ? "bg-gray-100 dark:bg-gray-800" : ""}
									oninput={async (e) => {
										if (tempAppConfig) {
											await tempAppConfig.updateTrelloKey(e.currentTarget.value);
										}
									}}
								/>

								<SecretInput
									id="trello-token"
									label="Token"
									value={trello?.token ?? ""}
									placeholder="Enter Trello token"
									disabled={!isEditMode}
									class={!isEditMode ? "bg-gray-100 dark:bg-gray-800" : ""}
									oninput={async (e) => {
										if (tempAppConfig) {
											await tempAppConfig.updateTrelloToken(e.currentTarget.value);
										}
									}}
								/>
							</div>

							<div class="mt-3 flex items-center gap-2">
								<div class="flex items-center gap-2">
									<div class="w-2 h-2 rounded-full" class:bg-green-500={hasCredentials} class:bg-gray-400={!hasCredentials} class:dark:bg-gray-500={!hasCredentials}></div>
									<span class="text-sm text-gray-600 dark:text-gray-400">
										{hasCredentials ? "Configured" : "Not configured"}
									</span>
								</div>
								{#if isEditMode && hasCredentials}
									<Button
										variant="tertiary"
										class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
										onclick={async () => {
											if (tempAppConfig) {
												await tempAppConfig.clearTrelloIntegration();
											}
										}}
									>
										Clear
									</Button>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Branch Folder Colors Section -->
			<div class={CARD}>
				<h3 class="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
					<Icon name="palette" size={20} class="text-gray-600 dark:text-gray-400" />
					Branch Folder Colors
				</h3>

				{#if activeBranchConfig}
					{@const folderNames = activeBranchConfig.getFolderNames()}

					{#if folderNames.length > 0}
						<div class="space-y-3">
							{#each folderNames as folderName}
								{@const folder = activeBranchConfig.getFolder(folderName)}
								{#if folder}
									<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
										<div class="flex items-center gap-3">
											<div class="w-6 h-6 rounded-full border-2 border-gray-300" style="background-color: {folder.color}"></div>
											<div>
												<span class="font-medium text-gray-900 dark:text-gray-100">{folderName}</span>
												<div class="text-sm text-gray-500 dark:text-gray-400">
													{folder.branchIds.length} branch{folder.branchIds.length !== 1 ? "es" : ""}
												</div>
											</div>
										</div>

										{#if isEditMode}
											<div class="flex items-center gap-2">
												<ColorPicker
													value={folder.color}
													disabled={!isEditMode}
													on:input={async (e) => {
														// live preview while dragging
														if (tempBranchConfig) {
															try {
																const c = tempBranchConfig.clone();
																await c.updateFolderColor(folderName, e.detail);
																tempBranchConfig = c;
															} catch (error) {
																console.error("Failed to update folder color:", error);
																showError("Failed to update folder color");
															}
														}
													}}
													on:change={async (e) => {
														// commit final picked color (no-op if already applied above)
														if (tempBranchConfig) {
															try {
																const c = tempBranchConfig.clone();
																await c.updateFolderColor(folderName, e.detail);
																tempBranchConfig = c;
															} catch (error) {
																console.error("Failed to update folder color:", error);
																showError("Failed to update folder color");
															}
														}
													}}
												/>
												<span class="text-xs text-gray-500 dark:text-gray-400 font-mono">{folder.color}</span>
											</div>
										{:else}
											<span class="text-xs text-gray-500 font-mono">{folder.color}</span>
										{/if}
									</div>
								{/if}
							{/each}
						</div>
					{:else}
						<div class="text-center py-6">
							<div class="text-gray-400 dark:text-gray-500 mb-2">
								<Icon name="file" size={32} class="mx-auto text-gray-400 dark:text-gray-500" />
							</div>
							<p class="text-gray-500 dark:text-gray-400 text-sm">No branch folders configured</p>
							<p class="text-gray-400 dark:text-gray-500 text-xs mt-1">Create folders in the Branches section to manage their colors here</p>
						</div>
					{/if}
				{:else}
					<div class="text-center py-6">
						<div class="text-gray-400 dark:text-gray-500 mb-2">
							<Icon name="file" size={32} class="mx-auto text-gray-400 dark:text-gray-500" />
						</div>
						<p class="text-gray-500 dark:text-gray-400 text-sm">No branch configuration available</p>
					</div>
				{/if}
			</div>

			<!-- Ignored Paths Section -->
			<div class={CARD}>
				<h3 class="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
					<Icon name="shield" size={20} class="text-gray-600 dark:text-gray-400" />
					Ignored Paths
				</h3>

				<div class="space-y-6">
					<IgnoredPathsPanel
						title="Unknown Files"
						help="Patterns for files with unknown status to ignore"
						paths={activeAppConfig?.getIgnoredPaths("unknown") ?? []}
						{isEditMode}
						category="unknown"
						icon="helpCircle"
						iconColor="text-orange-600 dark:text-orange-400"
						placeholder="Add new pattern (e.g., *.tmp, temp/*, .*\.log$)"
						editingCategory={editingPathCategory}
						editingIndex={editingPathIndex}
						editingValue={editingPathValue}
						newValue={newUnknownPath}
						onTest={openRegexTestDialogWithPattern}
						onAdd={addPath}
						onEdit={editPath}
						onDelete={deletePath}
						onStartEdit={startEditingPath}
						onCancelEdit={cancelEditingPath}
						onSaveEdit={saveEditingPath}
						onUpdateNewValue={(v) => (newUnknownPath = v)}
						onUpdateEditingValue={(v) => (editingPathValue = v)}
					/>

					<IgnoredPathsPanel
						title="Modified Files"
						help="Patterns for modified files to ignore"
						paths={activeAppConfig?.getIgnoredPaths("modified") ?? []}
						{isEditMode}
						category="modified"
						icon="edit"
						iconColor="text-blue-600 dark:text-blue-400"
						placeholder="Add new pattern (e.g., build/*, generated/*)"
						editingCategory={editingPathCategory}
						editingIndex={editingPathIndex}
						editingValue={editingPathValue}
						newValue={newModifiedPath}
						onTest={openRegexTestDialogWithPattern}
						onAdd={addPath}
						onEdit={editPath}
						onDelete={deletePath}
						onStartEdit={startEditingPath}
						onCancelEdit={cancelEditingPath}
						onSaveEdit={saveEditingPath}
						onUpdateNewValue={(v) => (newModifiedPath = v)}
						onUpdateEditingValue={(v) => (editingPathValue = v)}
					/>
				</div>
			</div>

			<!-- Regex Testing Section -->
			<div class={CARD}>
				<h3 class="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
					<Icon name="search" size={20} class="text-gray-600 dark:text-gray-400" />
					Pattern Testing
				</h3>

				<div class="space-y-4">
					<p class="text-sm text-gray-500 dark:text-gray-400">Test regex patterns and path matching against your configured ignored paths.</p>

					<Button variant="primary" leftIcon="search" onclick={openRegexTestDialog}>Open Pattern Tester</Button>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="container mx-auto p-4">
		<p class="text-gray-500 dark:text-gray-400 text-center">No configuration available</p>
	</div>
{/if}

<!-- Regex Testing Dialog -->
{#if showRegexTestDialog}
	<div class="fixed inset-0 bg-gray-900/20 dark:bg-gray-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="pattern-tester-title">
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-gray-900/5 dark:ring-gray-700/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<!-- Dialog Header -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
				<h3 id="pattern-tester-title" class="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
					<Icon name="search" size={20} class="text-blue-600 dark:text-blue-400" />
					Pattern Tester
				</h3>
				<Button variant="ghost" class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" iconOnly="x" iconSize={20} onclick={closeRegexTestDialog} />
			</div>

			<!-- Dialog Content -->
			<div class="p-6 space-y-6">
				<!-- Pattern Input -->
				<div>
					<label for="test-pattern" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Pattern to Test </label>
					<input
						id="test-pattern"
						type="text"
						bind:value={testPattern}
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
						placeholder="Enter regex pattern or literal string (e.g., *.tmp, build/.*, .*\.log$)"
					/>
					<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter a regex pattern or literal string to test against sample paths</p>
				</div>

				<!-- Test Input -->
				<div>
					<label for="test-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Test Input (File Path) </label>
					<textarea
						id="test-input"
						bind:value={testInput}
						rows="4"
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
						placeholder="Enter file paths to test (one per line)&#10;examples:&#10;temp/cache.tmp&#10;build/output.js&#10;src/main.ts&#10;logs/error.log"
					></textarea>
					<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter file paths to test against the pattern (one per line for multiple tests)</p>
				</div>

				<!-- Test Results -->
				{#if testPattern && testInput}
					<div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
						<h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Test Results</h4>

						{#if true}
							{@const inputLines = testInput.split("\n").filter((line) => line.trim())}

							<div class="space-y-2">
								{#each inputLines as line}
									{@const trimmedLine = line.trim()}
									{#if trimmedLine && activeAppConfig}
										{@const lineResult = activeAppConfig.testPathAgainstIgnored(trimmedLine)}
										{@const patternMatches = (() => {
											try {
												const regex = new RegExp(testPattern.trim());
												return regex.test(trimmedLine);
											} catch {
												return trimmedLine === testPattern.trim();
											}
										})()}

										<div class="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 text-sm">
											<span class="font-mono text-gray-700 dark:text-gray-300 flex-1">{trimmedLine}</span>
											<div class="flex items-center gap-3">
												<!-- Pattern Match -->
												<div class="flex items-center gap-1">
													<div class="w-2 h-2 rounded-full" class:bg-green-500={patternMatches} class:bg-gray-400={!patternMatches}></div>
													<span class="text-xs text-gray-600 dark:text-gray-400">Pattern</span>
												</div>

												<!-- Config Match -->
												<div class="flex items-center gap-1">
													<div class="w-2 h-2 rounded-full" class:bg-blue-500={lineResult?.unknown || lineResult?.modified} class:bg-gray-400={!lineResult?.unknown && !lineResult?.modified}></div>
													<span class="text-xs text-gray-600 dark:text-gray-400">Config</span>
												</div>

												<!-- Show matched patterns -->
												{#if lineResult?.matchedPatterns && lineResult.matchedPatterns.length > 0}
													<div class="text-xs text-gray-500 dark:text-gray-400" title={lineResult.matchedPatterns.map((mp) => `${mp.category}: ${mp.pattern}`).join(", ")}>
														{lineResult.matchedPatterns.length} match{lineResult.matchedPatterns.length !== 1 ? "es" : ""}
													</div>
												{/if}
											</div>
										</div>
									{/if}
								{/each}
							</div>

							{#if testResults.error}
								<div class="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
									<Icon name="triangleAlert" size={14} class="inline mr-1 text-red-600 dark:text-red-400" />
									{testResults.error}
								</div>
							{/if}

							<div class="mt-3 text-xs text-gray-500 dark:text-gray-400">
								<strong>Legend:</strong>
								<span class="ml-2">🟢 Pattern = Matches your test pattern</span>
								<span class="ml-2">🔵 Config = Matches existing ignored paths</span>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Dialog Footer -->
			<div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 rounded-b-lg flex justify-end gap-3">
				<Button variant="secondary" onclick={closeRegexTestDialog}>Close</Button>
			</div>
		</div>
	</div>
{/if}
