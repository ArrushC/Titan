<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import { tooltip } from '../utils/tooltip';
	import type { TooltipActionOptions } from '../utils/tooltip';
	import type { IconName } from './Icon.svelte';

	interface ActionOption {
		id: string;
		label: string;
		icon?: IconName;
		disabled?: boolean;
	}

	interface Props {
		label: string;
		options: ActionOption[];
		onaction: (actionId: string) => void;
		variant?: 'primary' | 'secondary' | 'tertiary';
		colorScheme?: 'blue' | 'orange' | 'red' | 'gray' | 'green';
		disabled?: boolean;
		class?: string;
		tooltip?: string | TooltipActionOptions;
		ondropdownchange?: (isOpen: boolean) => void;
	}

	let {
		label,
		options,
		onaction,
		variant = 'secondary',
		colorScheme = 'blue',
		disabled = false,
		class: className = '',
		tooltip: tooltipProp,
		ondropdownchange
	}: Props = $props();

	let isOpen = $state(false);
	let selectedIndex = $state(-1);
	let triggerRef = $state<HTMLButtonElement>();
	let dropdownRef = $state<HTMLDivElement>();
	let dropdownFlipped = $state(false);

	// Color scheme definitions (matching Button component)
	const colorSchemes = {
		blue: {
			text: 'text-blue-600 dark:text-blue-400',
			textHover: 'hover:text-blue-800 dark:hover:text-blue-200',
			bg: 'bg-blue-600 dark:bg-blue-700',
			bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-900',
			bgHoverSolid: 'hover:bg-blue-700 dark:hover:bg-blue-600',
			border: 'border-blue-700 dark:border-blue-600',
			focusRing: 'focus:ring-blue-500 dark:focus:ring-blue-400'
		},
		orange: {
			text: 'text-orange-600 dark:text-orange-400',
			textHover: 'hover:text-orange-800 dark:hover:text-orange-200',
			bg: 'bg-orange-600 dark:bg-orange-700',
			bgHover: 'hover:bg-orange-50 dark:hover:bg-orange-900',
			bgHoverSolid: 'hover:bg-orange-700 dark:hover:bg-orange-600',
			border: 'border-orange-700 dark:border-orange-600',
			focusRing: 'focus:ring-orange-500 dark:focus:ring-orange-400'
		},
		red: {
			text: 'text-red-600 dark:text-red-400',
			textHover: 'hover:text-red-800 dark:hover:text-red-200',
			bg: 'bg-red-600 dark:bg-red-700',
			bgHover: 'hover:bg-red-50 dark:hover:bg-red-900',
			bgHoverSolid: 'hover:bg-red-700 dark:hover:bg-red-800',
			border: 'border-red-700 dark:border-red-600',
			focusRing: 'focus:ring-red-500 dark:focus:ring-red-400'
		},
		gray: {
			text: 'text-gray-600 dark:text-gray-400',
			textHover: 'hover:text-gray-800 dark:hover:text-gray-200',
			bg: 'bg-gray-600 dark:bg-gray-700',
			bgHover: 'hover:bg-gray-50 dark:hover:bg-gray-700',
			bgHoverSolid: 'hover:bg-gray-700 dark:hover:bg-gray-600',
			border: 'border-gray-700 dark:border-gray-600',
			focusRing: 'focus:ring-gray-500 dark:focus:ring-gray-400'
		},
		green: {
			text: 'text-green-600 dark:text-green-400',
			textHover: 'hover:text-green-800 dark:hover:text-green-200',
			bg: 'bg-green-600 dark:bg-green-700',
			bgHover: 'hover:bg-green-50 dark:hover:bg-green-900',
			bgHoverSolid: 'hover:bg-green-700 dark:hover:bg-green-600',
			border: 'border-green-700 dark:border-green-600',
			focusRing: 'focus:ring-green-500 dark:focus:ring-green-400'
		}
	};

	// Toggle dropdown
	function toggle() {
		if (disabled) return;
		
		if (!isOpen) {
			// Opening dropdown - check for collision detection
			if (triggerRef) {
				const triggerRect = triggerRef.getBoundingClientRect();
				const viewportHeight = window.innerHeight;
				const estimatedDropdownHeight = options.length * 40; // Estimate 40px per option
				
				// Check if there's enough space below
				const spaceBelow = viewportHeight - triggerRect.bottom;
				dropdownFlipped = spaceBelow < estimatedDropdownHeight && triggerRect.top > estimatedDropdownHeight;
				
				selectedIndex = -1; // Always start with no selection
			}
		}
		
		isOpen = !isOpen;
		ondropdownchange?.(isOpen);
	}

	// Execute action
	function executeAction(option: ActionOption, index: number) {
		if (option.disabled) return;
		
		selectedIndex = index;
		isOpen = false;
		ondropdownchange?.(false);
		onaction(option.id);
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
					if (selectedOption && !selectedOption.disabled) {
						executeAction(selectedOption, selectedIndex);
					}
				} else {
					toggle();
				}
				break;
			case 'Escape':
				if (isOpen) {
					event.preventDefault();
					isOpen = false;
					ondropdownchange?.(false);
					triggerRef?.focus();
				}
				break;
			case 'ArrowDown':
				event.preventDefault();
				if (!isOpen) {
					isOpen = true;
					selectedIndex = 0;
				} else {
					// Move to next non-disabled option
					let nextIndex = selectedIndex + 1;
					while (nextIndex < options.length && options[nextIndex]?.disabled) {
						nextIndex++;
					}
					if (nextIndex < options.length) {
						selectedIndex = nextIndex;
					}
				}
				break;
			case 'ArrowUp':
				event.preventDefault();
				if (isOpen) {
					// Move to previous non-disabled option
					let prevIndex = selectedIndex - 1;
					while (prevIndex >= 0 && options[prevIndex]?.disabled) {
						prevIndex--;
					}
					if (prevIndex >= 0) {
						selectedIndex = prevIndex;
					}
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
			ondropdownchange?.(false);
		}
	}

	// Focus management
	$effect(() => {
		if (isOpen && dropdownRef && selectedIndex >= 0) {
			const selectedOption = dropdownRef.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
			if (selectedOption) {
				selectedOption.scrollIntoView({ block: 'nearest' });
			}
		}
	});

	// Update collision detection on scroll/resize
	function updatePosition() {
		if (isOpen && triggerRef) {
			const triggerRect = triggerRef.getBoundingClientRect();
			const viewportHeight = window.innerHeight;
			const estimatedDropdownHeight = options.length * 40;
			
			const spaceBelow = viewportHeight - triggerRect.bottom;
			dropdownFlipped = spaceBelow < estimatedDropdownHeight && triggerRect.top > estimatedDropdownHeight;
		}
	}

	onMount(() => {
		document.addEventListener('mousedown', handleClickOutside);
		window.addEventListener('resize', updatePosition);
		
		// Find the main scrollable element and listen to both window and main scroll events
		const mainElement = document.querySelector('main');
		if (mainElement) {
			mainElement.addEventListener('scroll', updatePosition);
		}
		window.addEventListener('scroll', updatePosition, true); // Use capture to catch all scroll events
		
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			window.removeEventListener('resize', updatePosition);
			if (mainElement) {
				mainElement.removeEventListener('scroll', updatePosition);
			}
			window.removeEventListener('scroll', updatePosition, true);
		};
	});

	// Helper function to get variant classes with dynamic color scheme (matching Button component)
	const getVariantClasses = () => {
		const scheme = colorSchemes[colorScheme] || colorSchemes.blue;
		
		const variantClasses = {
			primary: `border border-transparent ${scheme.bg} text-white ${scheme.bgHoverSolid} ${scheme.focusRing}`,
			secondary: `border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 ${scheme.bgHoverSolid} hover:text-white ${scheme.border} ${scheme.focusRing}`,
			tertiary: `border border-transparent ${scheme.text} ${scheme.textHover} ${scheme.bgHover} ${scheme.focusRing}`
		};
		
		return variantClasses[variant];
	};

	// Styling classes (matching Button component structure)
	const triggerClasses = $derived.by(() => {
		const base = 'w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed';
		const scheme = colorSchemes[colorScheme] || colorSchemes.blue;
		const variantStyles = disabled
			? `bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 ${scheme.focusRing}`
			: getVariantClasses();
		return `${base} ${variantStyles} ${className}`;
	});

	const dropdownClasses = $derived.by(() => {
		const baseClasses = 'absolute w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-[60]';
		const positionClasses = dropdownFlipped ? 'bottom-full mb-1' : 'top-full mt-1';
		return `${baseClasses} ${positionClasses}`;
	});

	const optionClasses = (index: number, isDisabled: boolean) => {
		const base = 'w-full px-3 py-2 text-left text-sm transition-colors duration-150 flex items-center gap-2';
		if (isDisabled) {
			return `${base} text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50`;
		}
		const state = index === selectedIndex
			? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
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
			aria-haspopup="menu"
			aria-expanded={isOpen}
			aria-label={label}
		>
			<span class="truncate">{label}</span>
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
			aria-haspopup="menu"
			aria-expanded={isOpen}
			aria-label={label}
		>
			<span class="truncate">{label}</span>
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
			role="menu"
			aria-label="Action menu"
		>
			{#each options as option, index}
				<button
					type="button"
					class={optionClasses(index, option.disabled || false)}
					onclick={() => executeAction(option, index)}
					onmouseenter={() => !option.disabled && (selectedIndex = index)}
					data-index={index}
					role="menuitem"
					disabled={option.disabled}
					aria-label={option.label}
				>
					{#if option.icon}
						<Icon name={option.icon} size={16} class="flex-shrink-0" />
					{/if}
					<span class="flex-1">{option.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Smooth dropdown animation */
	:global(.action-menu-enter) {
		animation: slideDown 0.15s ease-out;
	}

	:global(.action-menu-exit) {
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