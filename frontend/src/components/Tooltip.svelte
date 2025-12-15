<script lang="ts">
	import { onMount } from 'svelte';
	import { tooltipStore } from '../stores/tooltip.svelte.ts';

	let tooltipElement = $state<HTMLDivElement | null>(null);

	const visible = $derived(tooltipStore.visible);
	const content = $derived(tooltipStore.content);
	const x = $derived(tooltipStore.x);
	const y = $derived(tooltipStore.y);
	const actualPosition = $derived(tooltipStore.actualPosition);
	const fullWidth = $derived(tooltipStore.fullWidth);

	let tooltipWidth = $state(0);
	let tooltipHeight = $state(0);
	let finalX = $state(0);
	let finalY = $state(0);

	// Calculate final position with viewport boundaries
	$effect(() => {
		if (!tooltipElement || !visible) return;

		const padding = 8;
		const arrowSize = 8;
		
		// Wait for tooltip to be rendered and get its dimensions
		requestAnimationFrame(() => {
			if (!tooltipElement) return;
			
			const rect = tooltipElement.getBoundingClientRect();
			tooltipWidth = rect.width;
			tooltipHeight = rect.height;

			// Initial position calculation
			let tempX = x;
			let tempY = y;

			// Calculate position based on actualPosition (arrows handled by CSS)
			switch (actualPosition) {
				case 'top':
					tempX = x - tooltipWidth / 2;
					tempY = y - tooltipHeight - arrowSize;
					break;
				case 'bottom':
					tempX = x - tooltipWidth / 2;
					tempY = y + arrowSize;
					break;
				case 'left':
					tempX = x - tooltipWidth - arrowSize;
					tempY = y - tooltipHeight / 2;
					break;
				case 'right':
					tempX = x + arrowSize;
					tempY = y - tooltipHeight / 2;
					break;
			}

			// Adjust for viewport boundaries
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			// Horizontal bounds adjustment
			if (tempX < padding) {
				tempX = padding;
			} else if (tempX + tooltipWidth > viewportWidth - padding) {
				tempX = viewportWidth - padding - tooltipWidth;
			}

			// Vertical bounds adjustment
			if (tempY < padding) {
				tempY = padding;
			} else if (tempY + tooltipHeight > viewportHeight - padding) {
				tempY = viewportHeight - padding - tooltipHeight;
			}

			// Update final positions
			finalX = tempX;
			finalY = tempY;
		});
	});

	// Handle scroll and resize events with improved performance
	onMount(() => {
		let ticking = false;
		let lastUpdate = 0;
		const updateThreshold = 16; // ~60fps limit
		
		const handleScrollResize = () => {
			if (!visible) return;
			
			const now = performance.now();
			if (!ticking && (now - lastUpdate) >= updateThreshold) {
				requestAnimationFrame(() => {
					tooltipStore.updatePosition();
					lastUpdate = performance.now();
					ticking = false;
				});
				ticking = true;
			}
		};

		// Passive listeners for better performance
		window.addEventListener('scroll', handleScrollResize, { passive: true, capture: true });
		window.addEventListener('resize', handleScrollResize, { passive: true });
		window.addEventListener('orientationchange', handleScrollResize, { passive: true });

		return () => {
			window.removeEventListener('scroll', handleScrollResize, true);
			window.removeEventListener('resize', handleScrollResize);
			window.removeEventListener('orientationchange', handleScrollResize);
		};
	});

</script>

{#if visible && content}
	<div
		bind:this={tooltipElement}
		class="fixed z-[10000] pointer-events-none opacity-0 transition-opacity duration-200"
		class:opacity-100={visible}
		style="left: {finalX}px; top: {finalY}px;"
		role="tooltip"
		aria-hidden={!visible}
	>
		<div class="relative bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs px-2.5 py-1.5 rounded-md shadow-lg dark:shadow-black/20 border border-gray-700 dark:border-gray-200 min-w-8 {fullWidth ? 'max-w-none whitespace-nowrap' : 'max-w-64 whitespace-normal break-words'} leading-relaxed backdrop-blur-sm tooltip-content tooltip-{actualPosition}">
			{content}
		</div>
	</div>
{/if}

<style>
	/* Ensure smooth transitions */
	div {
		will-change: opacity;
	}
	
	/* Tooltip arrow using pseudo-elements */
	.tooltip-content::after {
		content: '';
		position: absolute;
		width: 0;
		height: 0;
		border: 8px solid transparent;
	}
	
	/* Arrow for tooltip positioned above target (pointing down) */
	.tooltip-top::after {
		top: 100%;
		left: 50%;
		margin-left: -8px;
		border-top-color: #111827;
		border-bottom: none;
	}

	:global(.dark) .tooltip-top::after {
		border-top-color: #ffffff;
	}
	
	/* Arrow for tooltip positioned below target (pointing up) */
	.tooltip-bottom::after {
		bottom: 100%;
		left: 50%;
		margin-left: -8px;
		border-bottom-color: #111827;
		border-top: none;
	}

	:global(.dark) .tooltip-bottom::after {
		border-bottom-color: #ffffff;
	}
	
	/* Arrow for tooltip positioned to left of target (pointing right) */
	.tooltip-left::after {
		top: 50%;
		left: 100%;
		margin-top: -8px;
		border-left-color: #111827;
		border-right: none;
	}

	:global(.dark) .tooltip-left::after {
		border-left-color: #ffffff;
	}
	
	/* Arrow for tooltip positioned to right of target (pointing left) */
	.tooltip-right::after {
		top: 50%;
		right: 100%;
		margin-top: -8px;
		border-right-color: #111827;
		border-left: none;
	}

	:global(.dark) .tooltip-right::after {
		border-right-color: #ffffff;
	}
</style>