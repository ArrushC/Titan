<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { tooltip } from '../utils/tooltip';
	import type { TooltipActionOptions } from '../utils/tooltip';
	import Icon, { type IconName } from './Icon.svelte';
	
	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'header' | 'ghost' | 'minimal';
		colorScheme?: 'blue' | 'orange' | 'red' | 'gray' | 'green';
		loading?: boolean;
		tooltip?: string | TooltipActionOptions;
		leftIcon?: IconName;
		rightIcon?: IconName;
		iconOnly?: IconName;
		iconSize?: number;
		square?: boolean;
		children?: any;
	}
	
	let { 
		variant = 'primary',
		colorScheme,
		loading = false,
		disabled = false,
		class: className = '',
		tooltip: tooltipProp,
		leftIcon,
		rightIcon,
		iconOnly,
		iconSize = 16,
		square = false,
		children,
		...restProps
	}: Props = $props();
	
	// Base padding/sizing that can be overridden by square or iconOnly
	const getBasePadding = () => {
		if (iconOnly && variant === 'minimal') return 'p-0';
		if (iconOnly) return 'p-2';
		if (square) return 'p-2';
		if (variant === 'header') return '';
		if (variant === 'minimal') return 'p-1';
		return 'px-4 py-2';
	};

	// Base styling for all buttons
	const getBaseClasses = () => {
		const basePadding = getBasePadding();
		const baseRounding = square || iconOnly ? 'rounded-md' : 'rounded-lg';
		
		if (variant === 'header') {
			return `transition-colors duration-200 text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`;
		}
		
		if (variant === 'minimal') {
			return `${basePadding} rounded transition-colors duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`;
		}
		
		return `${basePadding} ${baseRounding} transition-all duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed`;
	};
	
	// Color scheme definitions for different states
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

	// Helper function to get variant classes with dynamic color scheme
	const getVariantClasses = () => {
		const scheme = colorSchemes[colorScheme || 'blue'] || colorSchemes.blue;
		
		const variantClasses = {
			primary: `border border-transparent ${scheme.bg} text-white ${scheme.bgHoverSolid} ${scheme.focusRing}`,
			secondary: `border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 ${scheme.bgHoverSolid} hover:text-white ${scheme.border} ${scheme.focusRing}`,
			tertiary: `border border-transparent ${scheme.text} ${scheme.textHover} ${scheme.bgHover} ${scheme.focusRing}`,
			danger: 'border border-transparent bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800 focus:ring-red-500 dark:focus:ring-red-400',
			header: 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:underline',
			ghost: 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500 dark:focus:ring-gray-400',
			minimal: 'border border-transparent bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-gray-100'
		};
		
		return variantClasses[variant];
	};
	
	const buttonClass = $derived(`${getBaseClasses()} ${getVariantClasses()} ${className}`);
</script>

{#if tooltipProp}
	<button 
		class={buttonClass}
		disabled={disabled || loading}
		use:tooltip={tooltipProp}
		{...restProps}
	>
		{#if loading}
			<div class="flex items-center gap-2">
				<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
				{#if children && !iconOnly}
					{@render children()}
				{/if}
			</div>
		{:else if iconOnly}
			<Icon name={iconOnly} size={iconSize} />
		{:else if leftIcon || rightIcon}
			<div class="flex items-center gap-2">
				{#if leftIcon}
					<Icon name={leftIcon} size={iconSize} />
				{/if}
				{#if children}
					{@render children()}
				{/if}
				{#if rightIcon}
					<Icon name={rightIcon} size={iconSize} />
				{/if}
			</div>
		{:else}
			{#if children}
				{@render children()}
			{/if}
		{/if}
	</button>
{:else}
	<button 
		class={buttonClass}
		disabled={disabled || loading}
		{...restProps}
	>
		{#if loading}
			<div class="flex items-center gap-2">
				<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
				{#if children && !iconOnly}
					{@render children()}
				{/if}
			</div>
		{:else if iconOnly}
			<Icon name={iconOnly} size={iconSize} />
		{:else if leftIcon || rightIcon}
			<div class="flex items-center gap-2">
				{#if leftIcon}
					<Icon name={leftIcon} size={iconSize} />
				{/if}
				{#if children}
					{@render children()}
				{/if}
				{#if rightIcon}
					<Icon name={rightIcon} size={iconSize} />
				{/if}
			</div>
		{:else}
			{#if children}
				{@render children()}
			{/if}
		{/if}
	</button>
{/if}