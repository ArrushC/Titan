<script lang="ts">
	import { tooltip } from "../../utils/tooltip";

	interface Props {
		date?: string;
		item?: any;
		column?: any;
		variant?: "normal" | "compact";
		textSize?: string;
	}

	const { date, item, column, variant = "normal", textSize = "text-sm" }: Props = $props();

	// Get date from props or item/column
	const dateString = $derived(date || item?.[column?.key] || "");

	// Helper to format date in a more readable format
	function formatDate(dateStr: string): string {
		if (!dateStr) return "";

		const dateObj = new Date(dateStr);
		const now = new Date();
		const diffTime = now.getTime() - dateObj.getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		// If it's today, show time only
		if (diffDays === 0) {
			return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		}

		// If it's within the last 7 days, show "X days ago"
		if (diffDays < 7) {
			return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
		}

		// If it's this year, show month and day
		if (dateObj.getFullYear() === now.getFullYear()) {
			return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
		}

		// Otherwise show month, day, and year
		return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
	}

	const formattedDate = $derived(formatDate(dateString));
	const fullDateTime = $derived.by(() => {
		if (!dateString) return "";
		const dateObj = new Date(dateString);
		return dateObj.toLocaleString();
	});
</script>

<span
	class="{textSize} text-gray-700 dark:text-gray-300 whitespace-nowrap"
	use:tooltip={fullDateTime}
>
	{formattedDate}
</span>