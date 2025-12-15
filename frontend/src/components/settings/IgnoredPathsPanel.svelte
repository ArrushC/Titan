<script lang="ts">
	import Button from "../Button.svelte";
	import Icon from "../Icon.svelte";

	interface Props {
		title: string;
		help: string;
		paths: string[];
		isEditMode: boolean;
		category: "unknown" | "modified";
		icon: string;
		iconColor: string;
		placeholder: string;
		editingCategory: "unknown" | "modified" | null;
		editingIndex: number | null;
		editingValue: string;
		newValue: string;
		onTest: (pattern: string) => void;
		onAdd: (category: "unknown" | "modified", value: string) => Promise<void>;
		onEdit: (category: "unknown" | "modified", index: number, value: string) => Promise<void>;
		onDelete: (category: "unknown" | "modified", index: number) => Promise<void>;
		onStartEdit: (category: "unknown" | "modified", index: number, value: string) => void;
		onCancelEdit: () => void;
		onSaveEdit: () => Promise<void>;
		onUpdateNewValue: (value: string) => void;
		onUpdateEditingValue: (value: string) => void;
	}

	let {
		title,
		help,
		paths,
		isEditMode,
		category,
		icon,
		iconColor,
		placeholder,
		editingCategory,
		editingIndex,
		editingValue,
		newValue,
		onTest,
		onAdd,
		onEdit,
		onDelete,
		onStartEdit,
		onCancelEdit,
		onSaveEdit,
		onUpdateNewValue,
		onUpdateEditingValue,
	}: Props = $props();

</script>

<div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
	<h4 class="text-md font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
		<Icon name={icon} size={16} class={iconColor} />
		{title}
	</h4>
	<p class="text-sm text-gray-500 dark:text-gray-400 mb-3">{help}</p>

	<div class="border border-gray-200 dark:border-gray-600 rounded-lg">
		{#if paths.length > 0}
			<div class="divide-y divide-gray-200 dark:divide-gray-600">
				{#each paths as path, index (index)}
					<div class="p-3 flex items-center justify-between">
						{#if editingCategory === category && editingIndex === index}
							<div class="flex-1 flex items-center gap-2">
								<input
									type="text"
									bind:value={editingValue}
									class="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
									placeholder="Pattern (regex or literal)"
									oninput={(e) => onUpdateEditingValue((e.currentTarget as HTMLInputElement).value)}
									onkeydown={(e) => {
										if (e.key === "Enter") {
											onSaveEdit();
										} else if (e.key === "Escape") {
											onCancelEdit();
										}
									}}
								/>
								<Button variant="primary" class="px-2 py-1 text-sm bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600" onclick={onSaveEdit}>Save</Button>
								<Button variant="secondary" class="px-2 py-1 text-sm" onclick={onCancelEdit}>Cancel</Button>
							</div>
						{:else}
							<span class="flex-1 text-sm font-mono text-gray-700 dark:text-gray-300">{path}</span>
							<div class="flex items-center gap-2">
								<Button
									variant="ghost"
									class="p-1 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400"
									iconOnly="search"
									iconSize={14}
									onclick={() => onTest(path)}
									tooltip="Test this pattern"
									aria-label="Test this pattern"
								/>
								{#if isEditMode}
									<Button
										variant="ghost"
										class="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
										iconOnly="edit"
										iconSize={14}
										onclick={() => onStartEdit(category, index, path)}
										tooltip="Edit pattern"
										aria-label="Edit pattern"
									/>
									<Button
										variant="ghost"
										class="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
										iconOnly="trash"
										iconSize={14}
										onclick={() => onDelete(category, index)}
										tooltip="Delete pattern"
										aria-label="Delete pattern"
									/>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">No patterns configured</div>
		{/if}

		{#if isEditMode}
			<div class="border-t border-gray-200 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-700">
				<div class="flex items-center gap-2">
					<input
						type="text"
						bind:value={newValue}
						class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
						placeholder={placeholder}
						oninput={(e) => onUpdateNewValue((e.currentTarget as HTMLInputElement).value)}
						onkeydown={(e) => {
							if (e.key === "Enter") {
								onAdd(category, newValue);
							}
						}}
					/>
					<button
						type="button"
						class="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
						disabled={!newValue.trim()}
						onclick={() => onAdd(category, newValue)}
					>
						Add
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>