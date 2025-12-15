<script lang="ts">
	import Icon from "../Icon.svelte";

	interface Props {
		onViewDiff?: () => void;
		revision?: string;
		item?: any;
		column?: any;
		variant?: "normal" | "compact";
		textSize?: string;
	}

	const { onViewDiff, revision, item, column, variant = "normal", textSize = "text-sm" }: Props = $props();

	// Get revision from props or item
	const displayRevision = $derived(revision || item?.Revision || "");
</script>

<button
	class="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
	onclick={onViewDiff}
	title="View changes in revision {displayRevision}"
	aria-label="View changes in revision {displayRevision}"
>
	<Icon name="diff" size={14} />
</button>