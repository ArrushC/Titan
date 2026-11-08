<script lang="ts">
	import Tooltip from './Tooltip.svelte';
</script>

<!-- Global tooltip container -->
<div class="tooltip-container" aria-live="polite" aria-label="Tooltip">
	<Tooltip />
</div>

<style>
	.tooltip-container {
		position: fixed;
		top: 0;
		left: 0;
		pointer-events: none;
		z-index: 10000;
	}
</style>