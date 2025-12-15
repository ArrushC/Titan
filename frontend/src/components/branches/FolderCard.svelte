<script lang="ts">
	import Icon from "../Icon.svelte";
	import Checkbox from "../Checkbox.svelte";
	import BranchRow from "./BranchRow.svelte";
	import Button from "../Button.svelte";
	import type { Branch, Folder } from "../../utils/BranchConfig.ts";
	import { branchesStore } from "../../stores/branches.svelte.ts";
	import { tooltip } from "../../utils/tooltip.ts";

	interface Props {
		folderName: string;
		folder: Folder;
		branches: Branch[];
		index: number;
		isEditMode: boolean;
		isBeingDragged: boolean;
		isSelected?: boolean;
		checkboxState: { checked: boolean; indeterminate: boolean };
		editingFolderId: string | null;
		editingBranchId: string | null;
		tempFolderName: string;
		tempBranchVersion: string;
		markedForDeletion: Set<string>;
		markedForDeletionFolders: Set<string>;
		newBranches: Set<string>;
		newlyCreatedFolders: Set<string>;
		draggedBranchId: string | null;
		draggedFolderId: string | null;
		dropTargetFolder: string | null;
		dropTargetIndex: number | null;
		folderInputRef: HTMLInputElement | null;
		branchInputRef: HTMLInputElement | null;
		onToggleFolder: (folderId: string) => void;
		onToggleBranch: (branchId: string, folderId: string) => void;
		onFolderDragStart: (e: DragEvent, folderName: string) => void;
		onFolderDragOver: (e: DragEvent, targetIndex: number) => void;
		onFolderDrop: (e: DragEvent, targetIndex: number) => void;
		onFolderDragLeave: (e: DragEvent) => void;
		onDragEnd: (e: DragEvent) => void;
		onBranchDragStart: (e: DragEvent, branchId: string, folderName: string) => void;
		onBranchDragOver: (e: DragEvent, folderName: string, index: number) => void;
		onBranchDrop: (e: DragEvent, folderName: string, index: number) => void;
		onBranchDragLeave: (e: DragEvent) => void;
		onStartEditFolder: (folderName: string) => void;
		onStartEditBranch: (branchId: string) => void;
		onKeydown: (e: KeyboardEvent, type: "folder" | "branch") => void;
		onSaveFolderEdit: () => void;
		onSaveBranchEdit: () => void;
		onAddNewBranch: (folderName: string) => void;
		onChangeBranchPath: (branchId: string, branchPath: string) => void;
		onCopyBranch: (branch: Branch, folderName: string) => void;
		onToggleBranchDeletion: (branchId: string) => void;
		onToggleFolderDeletion: (folderName: string) => void;
	}

	let {
		folderName,
		folder,
		branches,
		index,
		isEditMode,
		isBeingDragged,
		isSelected = false,
		checkboxState,
		editingFolderId,
		editingBranchId,
		tempFolderName = $bindable(),
		tempBranchVersion = $bindable(),
		markedForDeletion,
		markedForDeletionFolders,
		newBranches,
		newlyCreatedFolders,
		draggedBranchId,
		draggedFolderId,
		dropTargetFolder,
		dropTargetIndex,
		folderInputRef = $bindable(),
		branchInputRef = $bindable(),
		onToggleFolder,
		onToggleBranch,
		onFolderDragStart,
		onFolderDragOver,
		onFolderDrop,
		onFolderDragLeave,
		onDragEnd,
		onBranchDragStart,
		onBranchDragOver,
		onBranchDrop,
		onBranchDragLeave,
		onStartEditFolder,
		onStartEditBranch,
		onKeydown,
		onSaveFolderEdit,
		onSaveBranchEdit,
		onAddNewBranch,
		onChangeBranchPath,
		onCopyBranch,
		onToggleBranchDeletion,
		onToggleFolderDeletion,
	}: Props = $props();

	const isMarkedForDeletion = $derived(markedForDeletionFolders.has(folderName));
	const isNewFolder = $derived(newlyCreatedFolders.has(folderName));
	const isNewEmptyFolder = $derived(isNewFolder && branches.length === 0);
	const isNewFolderWithBranches = $derived(isNewFolder && branches.length > 0);
	const selectedBranches = $derived(branchesStore.selectedBranches);

	const deleteTooltip = $derived(() => {
		if (isNewEmptyFolder) {
			return "Delete folder instantly";
		} else if (isNewFolderWithBranches) {
			return `Delete folder and ${branches.length} branch${branches.length > 1 ? "es" : ""}`;
		} else if (isMarkedForDeletion) {
			return "Unmark folder for deletion";
		} else {
			return "Mark folder for deletion";
		}
	});
</script>

<!-- Original style for cards: -->
<!-- style="background-color: {isMarkedForDeletion ? '' : folder.color + '20'}; border: 2px solid {isMarkedForDeletion ? '#ef4444' : folder.color}" -->
<div
	class="card folder-card rounded-lg shadow-lg overflow-hidden flex flex-col transition-all duration-200 min-h-[200px] bg-white dark:bg-gray-800 {isMarkedForDeletion && !isBeingDragged ? 'bg-red-50 dark:bg-red-900/20' : ''}"
	class:opacity-50={isBeingDragged || isMarkedForDeletion}
	class:transform={isBeingDragged || isSelected}
	class:scale-95={isBeingDragged}
	class:scale-102={isSelected && !isBeingDragged}
	class:selected-folder={isSelected && !isBeingDragged && !isMarkedForDeletion}
	style="--folder-color: {folder.color}"
	role="button"
	tabindex="0"
	ondragover={(e) => isEditMode && onFolderDragOver(e, index)}
	ondrop={(e) => isEditMode && onFolderDrop(e, index)}
	ondragleave={onFolderDragLeave}
>
	<!-- Card Header -->
	<div
		class="card-header ps-5 pr-4 py-3 flex items-center gap-3"
		style="--folder-color-rgb: {folder.color
			.replace('#', '')
			.match(/.{2}/g)
			?.map((hex) => parseInt(hex, 16))
			.join(', ') || '59, 130, 246'}; --folder-color-hex: {folder.color};"
		class:cursor-move={isEditMode && editingFolderId !== folderName}
		draggable={isEditMode && editingFolderId !== folderName}
		ondragstart={(e) => isEditMode && editingFolderId !== folderName && onFolderDragStart(e, folderName)}
		ondragend={onDragEnd}
		role={isEditMode && editingFolderId !== folderName ? "button" : undefined}
		aria-label={isEditMode && editingFolderId !== folderName ? `Drag to reorder ${folderName} folder` : undefined}
	>
		{#if !isEditMode}
			<Checkbox checked={checkboxState.checked} indeterminate={checkboxState.indeterminate} onchange={() => onToggleFolder(folderName)} />
		{:else}
			<div class="pointer-events-none" use:tooltip={"Drag to reorder folder"}>
				<Icon name="grip" size={16} class="text-gray-600 dark:text-gray-300" />
			</div>
		{/if}
		{#if isEditMode && editingFolderId === folderName}
			<input
				bind:this={folderInputRef}
				type="text"
				bind:value={tempFolderName}
				class="w-full max-w-[200px] px-2 py-1 text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
				onkeydown={(e) => onKeydown(e, "folder")}
				onblur={onSaveFolderEdit}
				autofocus
			/>
		{:else if isEditMode}
			<button
				type="button"
				class="text-lg font-semibold flex-1 px-2 py-1 rounded transition-colors duration-150 relative group bg-transparent border-none text-left w-full cursor-text hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 {isMarkedForDeletion ? 'dark:text-red-400' : ''}"
				class:line-through={isMarkedForDeletion}
				class:text-red-600={isMarkedForDeletion}
				onclick={(e) => {
					e.stopPropagation();
					onStartEditFolder(folderName);
				}}
				onmousedown={(e) => e.stopPropagation()}
			>
				{folderName}
				<Icon name="edit" size={14} class="absolute top-1 right-1 text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-70 transition-opacity duration-150" />
			</button>
		{:else}
			<div class="text-lg font-semibold flex-1 px-2 py-1 text-gray-900 dark:text-gray-100">
				{folderName}
			</div>
		{/if}
		{#if isEditMode}
			<Button
				variant="minimal"
				iconOnly="plus"
				iconSize={20}
				class="hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
				onclick={() => onAddNewBranch(folderName)}
				tooltip="Add new branch"
			/>
			<Button
				variant="minimal"
				iconOnly="trash"
				iconSize={20}
				class={`hover:bg-gray-200 dark:hover:bg-gray-600 ${isMarkedForDeletion || isNewFolder ? 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300' : 'text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400'}`}
				onclick={() => onToggleFolderDeletion(folderName)}
				tooltip={deleteTooltip()}
			/>
		{/if}
	</div>

	<!-- Card Body -->
	<div class="card-body p-4 flex-1 bg-white/90 dark:bg-gray-800/90">
		{#if branches.length > 0}
			<div>
				<table class="w-full text-sm">
					<colgroup>
						<col width="16px" />
						<col width="" />
						<col width="" />
						{#if !isEditMode}
							<col width="150px" />
						{:else}
							<col width="1%" />
						{/if}
					</colgroup>
					<thead>
						<tr class="border-b border-zinc-300 dark:border-gray-600 text-gray-500 dark:text-gray-400">
							<th class="w-8"></th>
							<th class="text-left py-1 px-2 font-medium">Version</th>
							<th class="text-left py-1 px-2 font-medium">Path</th>
							<th class="text-left py-1 px-2 font-medium">
								{#if !isEditMode}Status{/if}
							</th>
						</tr>
					</thead>
					<tbody>
						{#each branches as branch, branchIndex}
							{@const branchId = folder.branchIds[branchIndex]}
							{#if branchId}
								<BranchRow
									{branch}
									{branchId}
									{folderName}
									index={branchIndex}
									{isEditMode}
									isSelected={selectedBranches[`${folderName}-${branchId}`] || false}
									isBeingDragged={draggedBranchId === branchId}
									isDropTarget={dropTargetFolder === folderName && dropTargetIndex === branchIndex && !draggedFolderId}
									isMarkedForDeletion={markedForDeletion.has(branchId) || isMarkedForDeletion}
									isNewBranch={newBranches.has(branchId)}
									isEditing={editingBranchId === branchId}
									bind:tempBranchVersion
									onToggle={() => onToggleBranch(branchId, folderName)}
									onDragStart={onBranchDragStart}
									{onDragEnd}
									onDragOver={onBranchDragOver}
									onDragLeave={onBranchDragLeave}
									onDrop={onBranchDrop}
									onStartEdit={onStartEditBranch}
									{onKeydown}
									onBlur={onSaveBranchEdit}
									onChangePath={onChangeBranchPath}
									onCopy={onCopyBranch}
									onToggleDeletion={onToggleBranchDeletion}
									bind:branchInputRef
								/>
							{/if}
						{/each}
						{#if isEditMode && branches.length > 0}
							<tr class="h-4 border-b-0" ondragover={(e) => !draggedFolderId && onBranchDragOver(e, folderName, branches.length)} ondrop={(e) => !draggedFolderId && onBranchDrop(e, folderName, branches.length)} ondragleave={onBranchDragLeave}>
								<td colspan="4" class="p-0">
									<div class="h-full w-full transition-all duration-200 {dropTargetFolder === folderName && dropTargetIndex === branches.length && !draggedFolderId ? 'bg-blue-100 dark:bg-blue-900/30 border-t-2 border-t-blue-500 dark:border-t-blue-400' : ''}"></div>
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		{:else}
			<div
				class="text-gray-500 dark:text-gray-400 text-center py-4 transition-all duration-200 rounded-lg {isEditMode && dropTargetFolder === folderName && dropTargetIndex === 0 && !draggedFolderId ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-400 border-dashed' : ''}"
				role="button"
				tabindex="0"
				ondragover={(e) => isEditMode && !draggedFolderId && onBranchDragOver(e, folderName, 0)}
				ondrop={(e) => isEditMode && !draggedFolderId && onBranchDrop(e, folderName, 0)}
				ondragleave={onBranchDragLeave}
			>
				{#if isEditMode && dropTargetFolder === folderName && dropTargetIndex === 0 && !draggedFolderId}
					<p class="text-blue-600 dark:text-blue-400 font-medium">Drop branch here</p>
				{:else}
					<p>No branches in this folder</p>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.card {
		transition:
			transform 0.2s ease-in-out,
			box-shadow 0.2s ease-in-out;
	}

	.card:hover {
		transform: translateY(-2px);
	}

	/* Selected folder styling */
	.selected-folder {
		box-shadow:
			0 8px 25px -5px var(--folder-color),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
		border: 2px solid var(--folder-color);
	}

	/* Dark mode selected folder styling */
	:global(.dark) .selected-folder {
		box-shadow:
			0 8px 25px -5px var(--folder-color),
			0 10px 10px -5px rgba(0, 0, 0, 0.15);
	}

	/* Focus state for accessibility */
	.card:focus-visible {
		outline: 2px solid var(--folder-color);
		outline-offset: 2px;
	}

	/* Dark mode focus state */
	:global(.dark) .card:focus-visible {
		outline-color: var(--folder-color);
		box-shadow:
			0 0 0 2px rgba(0, 0, 0, 0.5),
			0 0 0 4px var(--folder-color);
		outline: none;
	}

	/* Scale classes */
	.scale-102 {
		transform: scale(1.02);
	}

	.scale-95 {
		transform: scale(0.95);
	}

	/* Combined hover and selected state */
	.selected-folder:hover {
		transform: translateY(-2px) scale(1.02);
		box-shadow:
			0 12px 32px -8px var(--folder-color),
			0 15px 15px -8px rgba(0, 0, 0, 0.08);
	}

	/* Dark mode combined hover and selected state */
	:global(.dark) .selected-folder:hover {
		box-shadow:
			0 12px 32px -8px var(--folder-color),
			0 15px 15px -8px rgba(0, 0, 0, 0.35);
	}

	/* Drag and drop visual feedback */
	.card-header[draggable="true"] {
		cursor: move;
		transition: background-color 0.2s ease;
	}

	.card-header[draggable="true"]:hover {
		background-color: rgba(var(--folder-color-rgb), 0.18);
	}

	.card-header[draggable="true"]:active {
		background-color: rgba(var(--folder-color-rgb), 0.35);
	}

	/* Dark mode drag and drop feedback - even higher opacity for better visibility */
	:global(.dark) .card-header[draggable="true"]:hover {
		background-color: rgba(var(--folder-color-rgb), 0.32);
	}

	:global(.dark) .card-header[draggable="true"]:active {
		background-color: rgba(var(--folder-color-rgb), 0.42);
	}

	/* Card header background with optimized opacity for both themes */
	.card-header {
		position: relative;
		background-color: rgba(var(--folder-color-rgb), 0.12);
	}

	/* Dark mode: increase opacity for better visibility against dark backgrounds */
	:global(.dark) .card-header {
		background-color: rgba(var(--folder-color-rgb), 0.35);
	}

	.card-header[draggable="true"] input {
		cursor: text !important;
	}

	/* Folder drag styling */
	.folder-card {
		position: relative;
	}

	.folder-card.opacity-50 {
		transform: scale(0.95);
	}
</style>
