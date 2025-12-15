<script lang="ts">
	import { toastStore } from '../stores/toast.svelte.ts';
	import Toast from './Toast.svelte';
	import { flip } from 'svelte/animate';
	import { quintOut, cubicOut } from 'svelte/easing';

	const toasts = $derived(toastStore.all);
	
	// Custom queue entry animation
	function queueEnter(node: Element, { duration = 300 }) {
		return {
			duration,
			css: (t: number) => {
				const eased = cubicOut(t);
				const translateY = (1 - eased) * -20;
				const opacity = eased;
				const scale = 0.95 + (eased * 0.05);
				
				return `
					transform: translateY(${translateY}px) scale(${scale});
					opacity: ${opacity};
				`;
			}
		};
	}
	
	// Custom queue exit animation
	function queueExit(node: Element, { duration = 250 }) {
		return {
			duration,
			css: (t: number) => {
				const eased = cubicOut(1 - t);
				const translateY = (1 - t) * -10;
				const opacity = t;
				const scale = 0.98 + (t * 0.02);
				
				return `
					transform: translateY(${translateY}px) scale(${scale});
					opacity: ${opacity};
				`;
			}
		};
	}
</script>

{#if toasts.length > 0}
	<div 
		class="toast-container fixed bottom-4 right-4 z-50 flex flex-col gap-2"
		aria-live="polite"
		aria-label="Notifications"
	>
		{#each toasts as toast (toast.id)}
			<div 
				class="toast-wrapper"
				in:queueEnter={{}}
				out:queueExit={{}}
				animate:flip={{ duration: 300, easing: quintOut }}
			>
				<Toast {toast} />
			</div>
		{/each}
	</div>
{/if}

<style>
	/* Ensure the container is above all other content */
	.z-50 {
		z-index: 9999;
	}
	
	.toast-container {
		pointer-events: none;
		max-height: 100vh;
		overflow: hidden;
		transition: all 0.3s ease-out;
	}
	
	.toast-wrapper {
		pointer-events: auto;
		transform-origin: bottom right;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
	}
	
	/* Stacking effect - each toast appears slightly behind the previous one */
	.toast-wrapper:nth-child(n+2) {
		transform: scale(0.98) translateY(-2px);
		opacity: 0.95;
	}
	
	.toast-wrapper:nth-child(n+3) {
		transform: scale(0.96) translateY(-4px);
		opacity: 0.9;
	}
	
	.toast-wrapper:nth-child(n+4) {
		transform: scale(0.94) translateY(-6px);
		opacity: 0.85;
	}
	
	/* Hide toasts beyond the 4th to prevent overwhelming the user */
	.toast-wrapper:nth-child(n+5) {
		display: none;
	}
	
	/* Container entrance animation */
	.toast-container {
		animation: containerFadeIn 0.3s ease-out;
	}
	
	@keyframes containerFadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	/* Responsive positioning */
	@media (max-width: 640px) {
		.toast-container {
			bottom: 1rem;
			right: 1rem;
			left: 1rem;
			width: auto;
		}
		
		.toast-container > div {
			width: 100%;
		}
	}
	
	/* Reduce animations on mobile for performance */
	@media (max-width: 768px) {
		.toast-container {
			animation-duration: 0.2s;
		}
	}
	
	@media (prefers-reduced-motion: reduce) {
		.toast-container {
			animation: none;
		}
	}
</style>