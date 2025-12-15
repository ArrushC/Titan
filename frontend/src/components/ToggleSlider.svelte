<script lang="ts">
	interface Props {
		value: string;
		options: Array<{ value: string; label: string }>;
		onchange: (value: string) => void;
		class?: string;
		disabled?: boolean;
	}

	let { value, options, onchange, class: className = '', disabled = false }: Props = $props();

	function handleClick(optionValue: string) {
		if (disabled || optionValue === value) return;
		onchange(optionValue);
	}

	function handleKeydown(event: KeyboardEvent, optionValue: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick(optionValue);
		}
	}

	let activeIndex = $derived(options.findIndex(option => option.value === value));
</script>

<div 
	class="relative flex items-center bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg p-0.5 {className}"
	role="tablist"
	aria-label="View mode selection"
>
	<!-- Sliding background indicator -->
	<div 
		class="absolute top-0.5 bottom-0.5 bg-white dark:bg-gray-800 rounded-md shadow-sm transition-all duration-200 ease-out border border-gray-200 dark:border-gray-700 {disabled ? 'opacity-50' : ''}"
		style="left: {activeIndex * (100 / options.length)}%; width: calc({100 / options.length}% - 4px); margin-left: 2px;"
		aria-hidden="true"
	></div>

	{#each options as option}
		<button
			class="relative z-10 px-5 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 whitespace-nowrap {
				value === option.value
					? 'text-gray-900 dark:text-gray-100'
					: 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
			} {disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
			style="width: {100 / options.length}%; min-width: 120px;"
			onclick={() => handleClick(option.value)}
			onkeydown={(event) => handleKeydown(event, option.value)}
			role="tab"
			tabindex={value === option.value ? 0 : -1}
			aria-selected={value === option.value}
			aria-controls="diff-content-panel"
			disabled={disabled}
			title={option.label}
		>
			{option.label}
		</button>
	{/each}
</div>