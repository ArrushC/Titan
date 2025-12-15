<script lang="ts">
	import Icon from "../Icon.svelte";
	import { tooltip } from "../../utils/tooltip";

	interface Props {
		paths?: Array<{
			Action: string;
			Kind?: string;
			PropMods?: string;
			TextMods?: string;
			Value: string;  // This is the actual file path
		}>;
		onViewDiff?: (filePath: string) => void;
		branchPath?: string;
		variant?: "normal" | "compact";
		item?: any;
		index?: number;
	}

	const { 
		paths = [], 
		onViewDiff, 
		branchPath = "", 
		variant = "compact",
		item,
		index
	}: Props = $props();

	// Action type styling
	function getActionStyle(action: string): string {
		switch (action?.toUpperCase()) {
			case 'A': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
			case 'M': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
			case 'D': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
			case 'R': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
			default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
		}
	}

	function getActionLabel(action: string): string {
		switch (action?.toUpperCase()) {
			case 'A': return 'Added';
			case 'M': return 'Modified';
			case 'D': return 'Deleted';
			case 'R': return 'Replaced';
			default: return action || 'Unknown';
		}
	}

	// Extract just the filename for display
	function getFileName(path: string): string {
		return path.split(/[\\\/]/).pop() || path;
	}

	// Get relative path without filename
	function getRelativePath(path: string): string {
		const parts = path.split(/[\\\/]/);
		return parts.slice(0, -1).join('/');
	}
</script>

<div class="p-3 space-y-2">
	{#if paths.length > 0}
		<div class="text-xs text-gray-600 dark:text-gray-400 mb-2">
			{paths.length} file{paths.length === 1 ? '' : 's'} changed
		</div>
		{#each paths as pathInfo}
			<div class="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
				<!-- Action badge -->
				<div 
					class="flex-shrink-0 w-6 h-6 rounded text-xs font-medium flex items-center justify-center {getActionStyle(pathInfo.Action)}"
					use:tooltip={getActionLabel(pathInfo.Action)}
				>
					{pathInfo.Action?.toUpperCase() || '?'}
				</div>
				
				<!-- File info -->
				<div class="flex-1 min-w-0">
					<div class="flex items-center gap-2">
						<span class="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
							{getFileName(pathInfo.Value)}
						</span>
						{#if getRelativePath(pathInfo.Value)}
							<span class="text-xs text-gray-500 dark:text-gray-400 truncate">
								in {getRelativePath(pathInfo.Value)}
							</span>
						{/if}
					</div>
				</div>
				
				<!-- Diff button -->
				{#if onViewDiff && pathInfo.Action?.toUpperCase() !== 'D'}
					<button
						class="flex-shrink-0 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
						onclick={() => onViewDiff?.(pathInfo.Value)}
						title="View changes for {getFileName(pathInfo.Value)}"
						aria-label="View changes for {getFileName(pathInfo.Value)}"
					>
						<Icon name="diff" size={12} class="text-gray-600 dark:text-gray-400" />
					</button>
				{/if}
			</div>
		{/each}
	{:else}
		<div class="text-xs text-gray-500 dark:text-gray-400 p-2">
			No file changes found
		</div>
	{/if}
</div>