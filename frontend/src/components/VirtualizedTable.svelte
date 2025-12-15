<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';

	// Props using Svelte 5 runes
	interface Props {
		data?: any[];
		columns?: Array<{
			key: string;
			label: string;
			width?: string;
			align?: 'left' | 'center' | 'right';
			class?: string;
			component?: any; // Svelte component for custom rendering
			componentProps?: ((item: any, column: any) => Record<string, any>) | null; // Props function for component
			sortable?: boolean; // Whether this column is sortable
		}>;
		rowHeight?: number;
		containerHeight?: string;
		onRowClick?: ((item: any, index: number) => void) | null;
		renderCell?: ((item: any, column: any) => string | any) | null;
		// Styling variant
		variant?: "normal" | "compact";
		// Sorting props
		sortable?: boolean;
		sortColumn?: string;
		sortDirection?: "asc" | "desc";
		onSort?: ((columnKey: string) => void) | null;
		// Expandable rows props
		expandable?: boolean; // Enable expandable rows functionality
		expandedRowComponent?: any; // Svelte component for expanded row content
		getExpandedProps?: ((item: any, index: number) => Record<string, any>) | null; // Props function for expanded row component
		defaultExpanded?: boolean; // Default expansion state for rows
		getRowId?: ((item: any, index: number) => string) | null; // Function to get unique row ID for expansion tracking
	}

	const {
		data = [],
		columns = [],
		rowHeight,
		containerHeight = '400px',
		onRowClick = null,
		renderCell = null,
		variant = "normal",
		sortable = false,
		sortColumn = "",
		sortDirection = "asc",
		onSort = null,
		expandable = false,
		expandedRowComponent = null,
		getExpandedProps = null,
		defaultExpanded = false,
		getRowId = null
	}: Props = $props();

	// Internal state
	let container: HTMLDivElement;
	let scrollTop = $state(0);
	let containerHeightPx = $state(400);
	let bufferSize = 5; // Extra rows to render outside viewport
	
	// Expandable rows state
	let expandedRows = $state(new Set<string>());
	
	// Default row ID generator using index if not provided
	function getEffectiveRowId(item: any, index: number): string {
		if (getRowId) {
			return getRowId(item, index);
		}
		// Fallback to using a combination of index and a property if available
		return item.id || item.key || item.Revision || `row-${index}`;
	}
	
	// Row expansion functions
	function toggleRowExpansion(item: any, index: number) {
		if (!expandable) return;
		
		const rowId = getEffectiveRowId(item, index);
		const newExpandedRows = new Set(expandedRows);
		
		if (newExpandedRows.has(rowId)) {
			newExpandedRows.delete(rowId);
		} else {
			newExpandedRows.add(rowId);
		}
		
		expandedRows = newExpandedRows;
	}
	
	function isRowExpanded(item: any, index: number): boolean {
		if (!expandable) return false;
		const rowId = getEffectiveRowId(item, index);
		return expandedRows.has(rowId);
	}

	// Variant-specific styling
	const variantStyles = $derived.by(() => {
		switch (variant) {
			case "compact":
				return {
					headerHeight: "32px",
					headerPadding: "px-2 py-1.5",
					cellPadding: "px-2 py-1.5",
					textSize: "text-xs",
					fontWeight: "font-medium",
					defaultRowHeight: 40
				};
			default: // "normal"
				return {
					headerHeight: "40px",
					headerPadding: "px-3 py-2",
					cellPadding: "px-3 py-2",
					textSize: "text-sm",
					fontWeight: "font-medium",
					defaultRowHeight: 60
				};
		}
	});

	// Computed rowHeight using variant default if not provided
	const effectiveRowHeight = $derived(rowHeight ?? variantStyles.defaultRowHeight);
	// Use a conservative estimate for expanded content for virtual scrolling calculations
	// The actual height will be determined by CSS and content, not this calculation
	const expandedRowHeight = $derived(expandable ? 150 : 0); // Conservative estimate for virtual scrolling
	
	// Row height calculation function
	function getRowHeight(item: any, index: number): number {
		const baseHeight = effectiveRowHeight;
		if (expandable && isRowExpanded(item, index)) {
			return baseHeight + expandedRowHeight;
		}
		return baseHeight;
	}
	
	// Calculate cumulative heights for virtual scrolling with variable heights
	const rowHeights = $derived(data.map((item, index) => getRowHeight(item, index)));
	const cumulativeHeights = $derived(rowHeights.reduce((acc, height, index) => {
		acc[index] = (acc[index - 1] || 0) + height;
		return acc;
	}, [] as number[]));
	const totalHeight = $derived(cumulativeHeights[cumulativeHeights.length - 1] || 0);
	
	// Find visible range with variable heights
	const visibleStartIndex = $derived(() => {
		if (cumulativeHeights.length === 0) return 0;
		let index = cumulativeHeights.findIndex(height => height > scrollTop);
		return Math.max(0, (index === -1 ? cumulativeHeights.length - 1 : index) - bufferSize);
	});
	
	const visibleEndIndex = $derived(() => {
		if (cumulativeHeights.length === 0) return 0;
		const targetHeight = scrollTop + containerHeightPx;
		let index = cumulativeHeights.findIndex(height => height > targetHeight);
		return Math.min(data.length, (index === -1 ? cumulativeHeights.length : index + 1) + bufferSize);
	});
	
	const visibleData = $derived(data.slice(visibleStartIndex(), visibleEndIndex()));
	const offsetY = $derived(visibleStartIndex() > 0 ? cumulativeHeights[visibleStartIndex() - 1] : 0);

	// Update container height when mounted
	onMount(() => {
		if (container) {
			containerHeightPx = container.clientHeight;
		}
	});

	function handleScroll(e: Event) {
		const target = e.target as HTMLDivElement;
		scrollTop = target.scrollTop;
	}

	function handleRowClick(item: any, index: number) {
		if (onRowClick) {
			onRowClick(item, visibleStartIndex + index);
		}
	}

	function getAlignClass(align: string = 'left') {
		switch (align) {
			case 'center': return 'text-center';
			case 'right': return 'text-right';
			default: return 'text-left';
		}
	}
</script>

<div
	bind:this={container}
	class="virtualized-table-container relative overflow-auto border border-gray-200 dark:border-gray-600"
	style="height: {containerHeight}; width: 100%; max-width: 100%;"
	onscroll={handleScroll}
>
	<!-- Table Header (Fixed) -->
	<div class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
		<div class="flex">
			{#if expandable}
				<!-- Expand/Collapse header column -->
				<div
					style="width: 40px; flex: 0 0 40px; height: {variantStyles.headerHeight};"
					class="flex items-center justify-center"
				>
					<div class="{variantStyles.headerPadding} {variantStyles.fontWeight} {variantStyles.textSize} text-gray-700 dark:text-gray-300 h-full flex items-center justify-center">
						<!-- Empty header for expand column -->
					</div>
				</div>
			{/if}
			{#each columns as column}
				{@const isSortable = sortable && (column.sortable !== false)}
				{@const isActiveSort = isSortable && sortColumn === column.key}
				<div
					style="width: {column.width || 'auto'}; flex: {column.width ? '0 0 ' + column.width : '1'}; height: {variantStyles.headerHeight};"
					class="{column.class || ''}"
				>
					{#if isSortable}
						<button
							type="button"
							class="w-full h-full {variantStyles.headerPadding} {getAlignClass(column.align)} {variantStyles.fontWeight} {variantStyles.textSize} text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 whitespace-nowrap overflow-hidden transition-colors"
							onclick={() => onSort && onSort(column.key)}
						>
							<div class="flex items-center min-w-0">
								<span class="flex-shrink-0">{column.label}</span>
								<div class="w-4 h-4 ml-1 flex-shrink-0">
									{#if isActiveSort}
										<Icon name={sortDirection === "asc" ? "chevronUp" : "chevronDown"} size={16} />
									{/if}
								</div>
							</div>
						</button>
					{:else}
						<div class="{variantStyles.headerPadding} {getAlignClass(column.align)} {variantStyles.fontWeight} {variantStyles.textSize} text-gray-700 dark:text-gray-300 whitespace-nowrap overflow-hidden h-full flex items-center">
							{column.label}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Virtual Scroll Content -->
	<div style="height: {totalHeight}px; position: relative;">
		<div style="transform: translateY({offsetY}px);">
			{#each visibleData as item, visibleIndex}
				{@const actualIndex = visibleStartIndex() + visibleIndex}
				{@const isExpanded = isRowExpanded(item, actualIndex)}
				{@const itemRowHeight = getRowHeight(item, actualIndex)}
				<div
					class="border-t border-gray-200 dark:border-gray-600 transition-colors"
					style="min-height: {effectiveRowHeight}px;"
				>
					<!-- Main row -->
					<div
						class="flex hover:bg-gray-50 dark:hover:bg-gray-700 {onRowClick ? 'cursor-pointer' : ''}"
						style="height: {effectiveRowHeight}px;"
						onclick={() => handleRowClick(item, visibleIndex)}
					>
						{#if expandable}
							<!-- Expand/Collapse button column -->
							<div
								class="flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
								style="width: 40px; flex: 0 0 40px; height: {effectiveRowHeight}px;"
								onclick={(e) => { e.stopPropagation(); toggleRowExpansion(item, actualIndex); }}
							>
								<Icon
									name={isExpanded ? "chevronDown" : "chevronRight"}
									size={14}
									class="text-gray-500 dark:text-gray-400"
								/>
							</div>
						{/if}
						{#each columns as column}
							<div
								class="{variantStyles.cellPadding} {getAlignClass(column.align)} {variantStyles.textSize} text-gray-700 dark:text-gray-300 flex items-center overflow-hidden {column.class || ''}"
								style="width: {column.width || 'auto'}; flex: {column.width ? '0 0 ' + column.width : '1 1 0'}; min-width: 0;"
							>
								{#if column.component}
									<svelte:component
										this={column.component}
										{...(column.componentProps ? column.componentProps(item, column) : {})}
										item={item}
										column={column}
										variant={variant}
										textSize={variantStyles.textSize}
									/>
								{:else if renderCell}
									{@html renderCell(item, column)}
								{:else}
									{item[column.key] || ''}
								{/if}
							</div>
						{/each}
					</div>
					
					<!-- Expanded row content -->
					{#if expandable && isExpanded && expandedRowComponent}
						<div
							class="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-600 overflow-hidden"
						>
							<svelte:component
								this={expandedRowComponent}
								{...(getExpandedProps ? getExpandedProps(item, actualIndex) : {})}
								item={item}
								index={actualIndex}
								variant={variant}
							/>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Loading/Empty State -->
	{#if data.length === 0}
		<div class="absolute inset-0 flex items-center justify-center">
			<div class="text-center text-gray-500 dark:text-gray-400">
				<p class="text-sm">No data available</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.virtualized-table-container {
		/* Custom scrollbar for better visual integration */
		scrollbar-width: thin;
		scrollbar-color: rgb(156 163 175) rgb(243 244 246);
	}

	.virtualized-table-container::-webkit-scrollbar {
		width: 8px;
	}

	.virtualized-table-container::-webkit-scrollbar-track {
		background: rgb(243 244 246);
		border-radius: 4px;
	}

	.virtualized-table-container::-webkit-scrollbar-thumb {
		background: rgb(156 163 175);
		border-radius: 4px;
	}

	.virtualized-table-container::-webkit-scrollbar-thumb:hover {
		background: rgb(107 114 128);
	}

	/* Dark mode scrollbar */
	:global(.dark) .virtualized-table-container {
		scrollbar-color: rgb(75 85 99) rgb(31 41 55);
	}

	:global(.dark) .virtualized-table-container::-webkit-scrollbar-track {
		background: rgb(31 41 55);
	}

	:global(.dark) .virtualized-table-container::-webkit-scrollbar-thumb {
		background: rgb(75 85 99);
	}

	:global(.dark) .virtualized-table-container::-webkit-scrollbar-thumb:hover {
		background: rgb(107 114 128);
	}

</style>