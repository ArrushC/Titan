<script lang="ts">
	import Button from "../Button.svelte";

	interface Variable {
		name: string;
		description: string;
		defaultValue: string;
		required: boolean;
	}

	interface Props {
		variable: Variable;
		isEditMode: boolean;
		isMarkedForDeletion: boolean;
		editingVariableId: string | null;
		editingVariableName: string;
		editingVariableDescription: string;
		editingVariableDefaultValue: string;
		editingVariableRequired: boolean;
		onStartEdit: (variable: Variable) => void;
		onCancelEdit: () => void;
		onSaveEdit: () => Promise<void>;
		onMarkForDeletion: (variableName: string) => void;
		onUndoDeletion: (variableName: string) => void;
		onUpdateEditingName: (value: string) => void;
		onUpdateEditingDescription: (value: string) => void;
		onUpdateEditingDefaultValue: (value: string) => void;
		onUpdateEditingRequired: (value: boolean) => void;
	}

	let {
		variable,
		isEditMode,
		isMarkedForDeletion,
		editingVariableId,
		editingVariableName,
		editingVariableDescription,
		editingVariableDefaultValue,
		editingVariableRequired,
		onStartEdit,
		onCancelEdit,
		onSaveEdit,
		onMarkForDeletion,
		onUndoDeletion,
		onUpdateEditingName,
		onUpdateEditingDescription,
		onUpdateEditingDefaultValue,
		onUpdateEditingRequired,
	}: Props = $props();

	const isEditing = $derived(editingVariableId === variable.name);
	const safeId = (s: string) => s.replace(/[^a-z0-9_-]/gi, "-");
</script>

<div
	class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-all duration-200"
	class:opacity-50={isMarkedForDeletion}
	class:bg-red-50={isMarkedForDeletion}
	class:dark:bg-red-900={isMarkedForDeletion}
>
	{#if isEditing}
		<!-- Edit mode -->
		<div class="flex-1 space-y-2">
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={editingVariableName}
					placeholder="Variable name"
					class="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
					disabled={!isEditMode}
				/>
				<input
					type="text"
					bind:value={editingVariableDefaultValue}
					placeholder="Default value"
					class="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
					disabled={!isEditMode}
				/>
			</div>
			<input
				type="text"
				bind:value={editingVariableDescription}
				placeholder="Description"
				class="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
				disabled={!isEditMode}
			/>
			<div class="flex items-center gap-2 mb-2">
				<input
					type="checkbox"
					bind:checked={editingVariableRequired}
					id="edit-variable-required-{safeId(variable.name)}"
					class="rounded"
					disabled={!isEditMode}
				/>
				<label for="edit-variable-required-{safeId(variable.name)}" class="text-sm text-gray-700 dark:text-gray-300">
					Required field
				</label>
			</div>
			<div class="flex gap-2">
				<Button
					variant="primary"
					onclick={onSaveEdit}
					class="px-3 py-1 text-sm"
					disabled={!isEditMode || !editingVariableName.trim()}
				>
					Save
				</Button>
				<Button variant="secondary" onclick={onCancelEdit} class="px-3 py-1 text-sm">Cancel</Button>
			</div>
		</div>
	{:else}
		<!-- View mode -->
		<div class="flex-1">
			<div class="flex items-center gap-2">
				<span
					class="font-medium text-gray-900 dark:text-gray-100 transition-all duration-200"
					class:line-through={isMarkedForDeletion}
					class:text-red-600={isMarkedForDeletion}
					class:dark:text-red-400={isMarkedForDeletion}
				>
					{variable.name}{#if variable.required}<span class="text-red-500"> *</span>{/if}
				</span>
				<code class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded text-xs transition-all duration-200" class:opacity-50={isMarkedForDeletion}>
					{`$t{${variable.name}}`}
				</code>
			</div>
			<div
				class="text-sm text-gray-600 dark:text-gray-400 transition-all duration-200"
				class:line-through={isMarkedForDeletion}
				class:text-red-600={isMarkedForDeletion}
				class:dark:text-red-400={isMarkedForDeletion}
			>
				{variable.description || "No description"}
				{#if variable.defaultValue}
					<span class="text-gray-400">• Default: "{variable.defaultValue}"</span>
				{/if}
			</div>
		</div>
		{#if isEditMode}
			<div class="flex gap-2">
				{#if !isMarkedForDeletion}
					<Button
						variant="tertiary"
						onclick={() => onStartEdit(variable)}
						class="text-blue-600 hover:text-blue-800 text-sm"
						aria-label="Edit variable {variable.name}"
					>
						Edit
					</Button>
					<Button
						variant="tertiary"
						onclick={() => onMarkForDeletion(variable.name)}
						class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
						aria-label="Delete variable {variable.name}"
					>
						Delete
					</Button>
				{:else}
					<Button
						variant="tertiary"
						onclick={() => onUndoDeletion(variable.name)}
						class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm"
						aria-label="Undo deletion of variable {variable.name}"
					>
						Undo
					</Button>
					<span class="text-xs text-red-600 italic">Marked for deletion</span>
				{/if}
			</div>
		{/if}
	{/if}
</div>