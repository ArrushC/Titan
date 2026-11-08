<script lang="ts">
	interface Props {
		value: string;
		group: string;
		onchange?: () => void;
		addClasses?: string;
		size?: 'small' | 'medium' | 'large';
		disabled?: boolean;
		id?: string;
		'aria-label'?: string;
	}

	let { 
		value,
		group = $bindable(), 
		onchange, 
		addClasses = '', 
		size = 'medium',
		disabled = false,
		id,
		'aria-label': ariaLabel
	}: Props = $props();

	function handleChange() {
		if (onchange && !disabled) {
			onchange();
		}
	}

	const sizeClasses = {
		small: 'w-3 h-3',
		medium: 'w-4 h-4',
		large: 'w-5 h-5'
	};

	const getSizeClass = (size: string) => sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.medium;
</script>

<input 
	type="radio" 
	{value}
	bind:group 
	onchange={handleChange} 
	{disabled}
	{id}
	aria-label={ariaLabel}
	class="
		{getSizeClass(size)}
		rounded-full
		appearance-none
		bg-white dark:bg-gray-700
		border border-gray-300 dark:border-gray-600
		hover:border-gray-400 dark:hover:border-gray-500
		checked:border-blue-600 dark:checked:border-blue-500
		transition-all duration-200 ease-in-out
		focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-inset dark:focus:ring-blue-400
		disabled:opacity-50 disabled:cursor-not-allowed
		disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600
		disabled:hover:bg-white dark:disabled:hover:bg-gray-700
		cursor-pointer
		relative
		before:content-['']
		before:absolute
		before:inset-0
		before:scale-0
		checked:before:scale-[0.6]
		before:transition-transform
		before:duration-200
		before:bg-blue-600
		dark:before:bg-blue-500
		before:rounded-full
		{addClasses}
	" 
/>