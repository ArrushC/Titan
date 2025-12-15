<script lang="ts" generics="T">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import { tooltip } from '../utils/tooltip';
	import type { TooltipActionOptions } from '../utils/tooltip';

	interface Option<T> {
		value: T;
		label: string;
	}

	interface Props<T> {
		value: T;
		options: Option<T>[];
		placeholder?: string;
		disabled?: boolean;
		class?: string;
		tooltip?: string | TooltipActionOptions;
		onchange?: (value: T) => void;
	}

	let {
		value = $bindable(),
		options,
		placeholder = 'Select...',
		disabled = false,
		class: className = '',
		tooltip: tooltipProp,
		onchange
	}: Props<T> = $props();

	let isOpen = $state(false);
	let selectedIndex = $state(-1);
	let triggerRef = $state<HTMLButtonElement>();
	let dropdownRef = $state<HTMLDivElement>();

	// Get the label for the current value
	let selectedLabel = $derived.by(() => {
		const option = options.find(opt => opt.value === value);
		return option?.label || placeholder;
	});

	// Toggle dropdown
	function toggle() {
		if (disabled) return;
		isOpen = !isOpen;
		if (isOpen) {
			// Find current value index
			selectedIndex = options.findIndex(opt => opt.value === value);
		}
	}

	// Select an option
	function selectOption(option: Option<T>, index: number) {
		value = option.value;
		selectedIndex = index;
		isOpen = false;
		onchange?.(option.value);
		triggerRef?.focus();
	}

	// Handle keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		if (disabled) return;

		switch (event.key) {
			case 'Enter':
			case ' ':
				event.preventDefault();
				if (isOpen && selectedIndex >= 0 && selectedIndex < options.length) {
					const selectedOption = options[selectedIndex];
					if (selectedOption) {
						selectOption(selectedOption, selectedIndex);
					}
				} else {
					toggle();
				}
				break;
			case 'Escape':
				if (isOpen) {
					event.preventDefault();
					isOpen = false;
					triggerRef?.focus();
				}
				break;
			case 'ArrowDown':
				event.preventDefault();
				if (!isOpen) {
					isOpen = true;
					selectedIndex = options.findIndex(opt => opt.value === value);
				} else {
					selectedIndex = Math.min(selectedIndex + 1, options.length - 1);
				}
				break;
			case 'ArrowUp':
				event.preventDefault();
				if (isOpen) {
					selectedIndex = Math.max(selectedIndex - 1, 0);
				}
				break;
		}
	}

	// Click outside handler
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as Node;
		if (
			isOpen &&
			triggerRef &&
			dropdownRef &&
			!triggerRef.contains(target) &&
			!dropdownRef.contains(target)
		) {
			isOpen = false;
		}
	}

	// Focus management
	$effect(() => {
		if (isOpen && dropdownRef) {
			// Focus the dropdown for keyboard navigation
			const selectedOption = dropdownRef.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
			if (selectedOption) {
				selectedOption.scrollIntoView({ block: 'nearest' });
			}
		}
	});

	onMount(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	});

	// Styling classes
	const triggerClasses = $derived.by(() => {
		const base = 'w-full flex items-center justify-between px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800';
		const variant = disabled
			? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 cursor-not-allowed'
			: 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer';
		return `${base} ${variant} ${className}`;
	});

	const dropdownClasses = 'absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden';

	const optionClasses = (index: number, isSelected: boolean) => {
		const base = 'w-full px-3 py-2 text-left text-sm transition-colors duration-150';
		const state = index === selectedIndex
			? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
			: isSelected
				? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
				: 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700';
		return `${base} ${state}`;
	};
</script>

<div class="relative">
	{#if tooltipProp}
		<button
			bind:this={triggerRef}
			type="button"
			class={triggerClasses}
			onclick={toggle}
			onkeydown={handleKeydown}
			{disabled}
			use:tooltip={tooltipProp}
			aria-haspopup="listbox"
			aria-expanded={isOpen}
		>
			<span class="truncate">{selectedLabel}</span>
			<Icon 
				name="chevronDown" 
				size={16} 
				class="flex-shrink-0 ml-2 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" 
			/>
		</button>
	{:else}
		<button
			bind:this={triggerRef}
			type="button"
			class={triggerClasses}
			onclick={toggle}
			onkeydown={handleKeydown}
			{disabled}
			aria-haspopup="listbox"
			aria-expanded={isOpen}
		>
			<span class="truncate">{selectedLabel}</span>
			<Icon 
				name="chevronDown" 
				size={16} 
				class="flex-shrink-0 ml-2 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" 
			/>
		</button>
	{/if}

	{#if isOpen}
		<div
			bind:this={dropdownRef}
			class={dropdownClasses}
			role="listbox"
			aria-label="Select an option"
		>
			{#each options as option, index}
				<button
					type="button"
					class={optionClasses(index, option.value === value)}
					onclick={() => selectOption(option, index)}
					onmouseenter={() => selectedIndex = index}
					data-index={index}
					role="option"
					aria-selected={option.value === value}
				>
					<span class="flex items-center justify-between">
						<span>{option.label}</span>
						{#if option.value === value}
							<Icon name="success" size={14} class="text-blue-600 dark:text-blue-400" />
						{/if}
					</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Smooth dropdown animation */
	:global(.select-enter) {
		animation: slideDown 0.15s ease-out;
	}

	:global(.select-exit) {
		animation: slideUp 0.15s ease-in;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes slideUp {
		from {
			opacity: 1;
			transform: translateY(0);
		}
		to {
			opacity: 0;
			transform: translateY(-8px);
		}
	}
</style>