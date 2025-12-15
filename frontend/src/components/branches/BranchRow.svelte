<script lang="ts">
	import Icon from "../Icon.svelte";
	import Checkbox from "../Checkbox.svelte";
	import Button from "../Button.svelte";
	import type { Branch } from "../../utils/BranchConfig.ts";
	import { tooltip } from "../../utils/tooltip.ts";
	import { branchStatusStore, isBranchLoading } from "../../stores/branchStatus.svelte.ts";
	import { OpenFolderInExplorer } from "../../../wailsjs/go/main/App";

	interface Props {
		branch: Branch;
		branchId: string;
		folderName: string;
		index: number;
		isEditMode: boolean;
		isSelected: boolean;
		isBeingDragged: boolean;
		isDropTarget: boolean;
		isMarkedForDeletion: boolean;
		isNewBranch: boolean;
		isEditing: boolean;
		tempBranchVersion: string;
		onToggle: () => void;
		onDragStart: (e: DragEvent, branchId: string, folderName: string) => void;
		onDragEnd: (e: DragEvent) => void;
		onDragOver: (e: DragEvent, folderName: string, index: number) => void;
		onDragLeave: (e: DragEvent) => void;
		onDrop: (e: DragEvent, folderName: string, index: number) => void;
		onStartEdit: (branchId: string) => void;
		onKeydown: (e: KeyboardEvent, type: "branch") => void;
		onBlur: () => void;
		onChangePath: (branchId: string, branchPath: string) => void;
		onCopy: (branch: Branch, folderName: string) => void;
		onToggleDeletion: (branchId: string) => void;
		branchInputRef: HTMLInputElement | null;
	}

	let {
		branch,
		branchId,
		folderName,
		index,
		isEditMode,
		isSelected,
		isBeingDragged,
		isDropTarget,
		isMarkedForDeletion,
		isNewBranch,
		isEditing,
		tempBranchVersion = $bindable(),
		onToggle,
		onDragStart,
		onDragEnd,
		onDragOver,
		onDragLeave,
		onDrop,
		onStartEdit,
		onKeydown,
		onBlur,
		onChangePath,
		onCopy,
		onToggleDeletion,
		branchInputRef = $bindable(),
	}: Props = $props();

	function getLastFolderName(path: string): string {
		const parts = path.split(/[/\\]/);
		return parts[parts.length - 1] || path;
	}

	async function handlePathDoubleClick() {
		if (!isEditMode && !hasEmptyPath) {
			try {
				await OpenFolderInExplorer(branch.branchPath);
			} catch (error) {
				console.error("Failed to open folder:", error);
			}
		}
	}

	const hasEmptyPath = $derived(!branch.branchPath || branch.branchPath.trim() === "");

	// SVN status reactive variables
	const statusDisplay = $derived(branchStatusStore.getStatusDisplay(branchId));
	const statusPillClass = $derived(branchStatusStore.getStatusPillClass(branchId));
	const hasError = $derived(branchStatusStore.hasError(branchId));
	const errorMessage = $derived(branchStatusStore.getErrorMessage(branchId));
	const isLoading = $derived(isBranchLoading(branchId));

	// Note: Error toasting is now handled in the status checking function to prevent infinite loops
</script>

<tr
	class="border-b border-zinc-300 dark:border-gray-600 last:border-b-0 transition-all duration-200 {isNewBranch ? 'hover:bg-green-100 dark:hover:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} {isMarkedForDeletion && !isBeingDragged && !isNewBranch ? 'dark:bg-red-900/20' : ''} {isNewBranch && !isBeingDragged ? 'dark:bg-green-900/20' : ''}"
	class:opacity-50={isBeingDragged || isMarkedForDeletion}
	class:border-t-2={isDropTarget}
	class:border-t-blue-500={isDropTarget}
	class:bg-red-50={isMarkedForDeletion && !isBeingDragged && !isNewBranch}
	class:bg-green-50={isNewBranch && !isBeingDragged}
	class:border-l-4={isNewBranch || hasEmptyPath}
	class:border-l-green-500={isNewBranch}
	class:border-l-orange-500={hasEmptyPath && !isNewBranch}
	ondragover={(e) => isEditMode && onDragOver(e, folderName, index)}
	ondragleave={onDragLeave}
	ondrop={(e) => isEditMode && onDrop(e, folderName, index)}
>
	<td class="py-0.5 px-1 align-middle">
		{#if !isEditMode}
			<Checkbox checked={isSelected} onchange={onToggle} addClasses={"mt-1"} />
		{:else}
			<div class="flex items-center gap-1">
				<Button
					variant="minimal"
					iconOnly="grip"
					iconSize={16}
					class="cursor-move"
					tooltip="Drag to reorder"
					draggable="true"
					ondragstart={(e) => onDragStart(e, branchId, folderName)}
					ondragend={onDragEnd}
				/>
			</div>
		{/if}
	</td>
	<td class="py-0.5 px-2 font-semibold align-middle">
		{#if isEditMode && isEditing}
			<input
				bind:this={branchInputRef}
				type="text"
				bind:value={tempBranchVersion}
				class="min-w-0 max-w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
				style="width: {Math.max(tempBranchVersion.length * 8 + 20, 80)}px"
				onkeydown={(e) => onKeydown(e, "branch")}
				onblur={onBlur}
				autofocus
			/>
		{:else if isEditMode}
			<button
				type="button"
				class="px-2 py-1 rounded transition-colors duration-150 relative group bg-transparent border-none text-left w-full cursor-text hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
				class:line-through={isMarkedForDeletion}
				class:text-red-600={isMarkedForDeletion && !isNewBranch}
				class:dark:text-red-400={isMarkedForDeletion && !isNewBranch}
				class:text-green-600={isNewBranch}
				class:dark:text-green-400={isNewBranch}
				class:font-bold={isNewBranch}
				onclick={(e) => {
					e.stopPropagation();
					onStartEdit(branchId);
				}}
			>
				{branch.branchVersion}
				<Icon name="edit" size={12} class="absolute -top-1 -right-1 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
			</button>
		{:else}
			<span class="text-gray-900 dark:text-gray-100">{branch.branchVersion}</span>
		{/if}
	</td>
	<td
		class="py-2 px-2 align-middle truncate text-wrap inline-block max-w-[150px] text-gray-900 dark:text-gray-100"
		class:cursor-pointer={!isEditMode && !hasEmptyPath}
		class:cursor-help={isEditMode || hasEmptyPath}
		use:tooltip={!isEditMode && !hasEmptyPath ? `${branch.branchPath} (double-click to open)` : (branch.branchPath || "No path selected")}
		ondblclick={handlePathDoubleClick}
	>
		{#if hasEmptyPath}
			<span class="text-orange-600 dark:text-orange-400">Select path</span>
		{:else}
			<span class="{!isEditMode ? 'hover:text-blue-600 dark:hover:text-blue-400' : ''}">
				{getLastFolderName(branch.branchPath)}
			</span>
		{/if}
	</td>
	<td class="py-0.5 px-2 align-middle">
		{#if !isEditMode}
			<div class="flex items-center gap-2 py-1">
				{#if isLoading}
					<div class="w-4 h-4 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin" use:tooltip={"Checking status..."}></div>
				{/if}
				<span class={statusPillClass} use:tooltip={hasError ? errorMessage : ""}>
					{statusDisplay}
				</span>
			</div>
		{:else}
			<div class="flex items-center gap-2">
				<Button
					variant="minimal"
					iconOnly="folderUpload"
					iconSize={16}
					class={hasEmptyPath ? "text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300" : ""}
					tooltip={hasEmptyPath ? "Select path (required)" : "Change path"}
					onclick={() => onChangePath(branchId, branch.branchPath)}
				/>
				{#if !isNewBranch}
					<Button
						variant="minimal"
						iconOnly="copy"
						iconSize={16}
						tooltip="Copy row"
						onclick={() => onCopy(branch, folderName)}
					/>
				{/if}
				<Button
					variant="minimal"
					iconOnly="trash"
					iconSize={16}
					class={isMarkedForDeletion ? "text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300" : "hover:text-red-600 dark:hover:text-red-400"}
					tooltip={isNewBranch ? "Remove new branch" : isMarkedForDeletion ? "Unmark for deletion" : "Mark for deletion"}
					onclick={() => onToggleDeletion(branchId)}
				/>
			</div>
		{/if}
	</td>
</tr>
