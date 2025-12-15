<script lang="ts">
	import Button from "./Button.svelte";

	interface Props {
		id: string;
		label: string;
		value: string;
		placeholder: string;
		disabled?: boolean;
		inputClass?: string;
		oninput: (e: Event & { currentTarget: HTMLInputElement }) => void | Promise<void>;
	}

	let {
		id,
		label,
		value,
		placeholder,
		disabled = false,
		inputClass = "",
		oninput,
	}: Props = $props();

	let showPassword = $state(false);
</script>

<div>
	<label for={id} class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
		{label}
	</label>
	<div class="relative">
		<input
			{id}
			type={showPassword ? "text" : "password"}
			class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 {inputClass}"
			class:bg-gray-100={disabled}
			class:dark:bg-gray-800={disabled}
			{value}
			{disabled}
			{oninput}
			{placeholder}
		/>
		<Button
			variant="ghost"
			class="absolute inset-y-0 right-0 px-3"
			iconOnly={showPassword ? "eyeOff" : "eye"}
			iconSize={16}
			onclick={() => {
				showPassword = !showPassword;
			}}
			aria-label={showPassword ? "Hide password" : "Show password"}
		/>
	</div>
</div>