<script lang="ts">
	import { tooltip } from "../../utils/tooltip";

	interface Props {
		message?: string;
		maxLines?: number;
		item?: any;
		column?: any;
		variant?: "normal" | "compact";
		textSize?: string;
	}

	const { message = "", maxLines = 1, item, column, variant = "normal", textSize = "text-sm" }: Props = $props();

	// Get message from props or item/column
	const displayMessage = $derived(message || item?.[column?.key] || "");
</script>

<span
	class="block {textSize} text-gray-700 dark:text-gray-300 truncate overflow-hidden text-ellipsis whitespace-nowrap"
	class:line-clamp-2={maxLines === 2}
	style="min-width: 0; max-width: 100%;"
	use:tooltip={displayMessage}
>
	{displayMessage}
</span>