<script lang="ts">
	import type { Toast } from "../stores/toast.svelte.ts";
	import Icon from "./Icon.svelte";
	import Button from "./Button.svelte";
	import { toastStore } from "../stores/toast.svelte.ts";
	import { cubicOut } from "svelte/easing";

	// Simplified toast content animation (since wrapper handles main transitions)
	function toastContentEnter(_node: Element, { duration = 200 }) {
		const toastType = toast.type;

		return {
			duration,
			css: (t: number) => {
				const eased = cubicOut(t);
				const scale = 0.95 + eased * 0.05;
				const opacity = t;

				// Subtle type-specific effects
				let extraTransform = "";
				if (toastType === "error" && t < 0.6) {
					// Minor shake for errors
					const shake = Math.sin(t * 15) * (1 - t) * 1;
					extraTransform = `translateX(${shake}px)`;
				}

				return `
					transform: scale(${scale}) ${extraTransform};
					opacity: ${opacity};
				`;
			},
		};
	}

	// Simplified exit animation
	function toastContentExit(_node: Element, { duration = 150 }) {
		return {
			duration,
			css: (t: number) => {
				const scale = t * 0.98;
				const opacity = t;

				return `
					transform: scale(${scale});
					opacity: ${opacity};
				`;
			},
		};
	}

	interface Props {
		toast: Toast;
	}

	let { toast }: Props = $props();

	let isHovered = $state(false);

	// Get icon name based on toast type
	const iconName = $derived(() => {
		switch (toast.type) {
			case "success":
				return "success" as const;
			case "error":
				return "error" as const;
			case "warning":
				return "info" as const;
			case "info":
				return "info" as const;
			default:
				return "info" as const;
		}
	});

	function handleClose() {
		toastStore.remove(toast.id);
	}

	function handleMouseEnter() {
		isHovered = true;
	}

	function handleMouseLeave() {
		isHovered = false;
	}
</script>

<div
	class="toast toast-{toast.type} relative flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg dark:shadow-gray-900/50 text-white dark:text-gray-50 min-w-[250px] max-w-[500px] transition-all duration-200 ease-out"
	class:bg-green-500={toast.type === "success"}
	class:dark:bg-green-600={toast.type === "success"}
	class:bg-red-500={toast.type === "error"}
	class:dark:bg-red-600={toast.type === "error"}
	class:bg-yellow-500={toast.type === "warning"}
	class:dark:bg-yellow-600={toast.type === "warning"}
	class:bg-blue-500={toast.type === "info"}
	class:dark:bg-blue-600={toast.type === "info"}
	class:hovered={isHovered}
	in:toastContentEnter={{}}
	out:toastContentExit={{}}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	role="alert"
	aria-live="polite"
>
	<div class="flex-shrink-0 icon">
		<Icon name={iconName()} size={20} class="text-white {toast.type === 'success' ? 'dark:text-green-50' : toast.type === 'error' ? 'dark:text-red-50' : toast.type === 'warning' ? 'dark:text-yellow-50' : 'dark:text-blue-50'}" />
	</div>

	<div class="flex-1 text-sm font-medium break-words whitespace-normal">
		{toast.message}
	</div>

	<Button variant="minimal" iconOnly="close" iconSize={16} class="flex-shrink-0 ml-2 text-white/80 dark:text-gray-50/80 hover:text-white dark:hover:text-gray-50" onclick={handleClose} aria-label="Close notification" />

	{#if toast.duration && toast.duration > 0}
		<div class="progress-bar absolute bottom-0 left-0 h-1 bg-white/30 dark:bg-gray-50/30 rounded-b-lg" style="animation: slideProgress {toast.duration}ms linear forwards;"></div>
	{/if}
</div>

<style>
	@keyframes shrink {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}

	@keyframes slideProgress {
		from {
			transform: scaleX(1);
		}
		to {
			transform: scaleX(0);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.8;
		}
	}

	.toast {
		backdrop-filter: blur(8px);
		background-color: rgba(0, 0, 0, 0.05);
		transform-origin: right center;
		will-change: transform, opacity;
	}

	:global(.dark) .toast {
		background-color: rgba(0, 0, 0, 0.1);
		backdrop-filter: blur(8px) saturate(1.2);
	}

	.toast.hovered {
		transform: scale(1.02) translateY(-2px);
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .toast.hovered {
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.3),
			0 10px 10px -5px rgba(0, 0, 0, 0.15);
	}

	.toast .progress-bar {
		transform-origin: left center;
		animation-play-state: running;
		transition: opacity 0.3s ease;
	}

	.toast.hovered .progress-bar {
		animation-play-state: paused;
		opacity: 0.6;
	}

	/* Icon animations */
	.toast .icon {
		transition: transform 0.3s ease;
	}

	.toast.hovered .icon {
		transform: scale(1.1);
	}

	/* Type-specific icon animations */
	.toast-success .icon {
		animation: successPulse 0.6s ease-out 0.2s;
	}

	.toast-error .icon {
		animation: errorShake 0.4s ease-out;
	}

	.toast-warning .icon {
		animation: warningBounce 0.5s ease-out;
	}

	.toast-info .icon {
		animation: infoPulse 0.4s ease-out;
	}

	@keyframes successPulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.2);
		}
	}

	@keyframes errorShake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-2px);
		}
		75% {
			transform: translateX(2px);
		}
	}

	@keyframes warningBounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-3px);
		}
	}

	@keyframes infoPulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	/* Ensure proper opacity for Tailwind background colors */
	.toast.bg-green-500 {
		background-color: rgba(34, 197, 94, 0.95);
	}

	.toast.bg-red-500 {
		background-color: rgba(239, 68, 68, 0.95);
	}

	.toast.bg-yellow-500 {
		background-color: rgba(234, 179, 8, 0.95);
	}

	.toast.bg-blue-500 {
		background-color: rgba(59, 130, 246, 0.95);
	}

	/* Dark mode background colors with enhanced visibility */
	:global(.dark) .toast.bg-green-500 {
		background-color: rgba(22, 163, 74, 0.98);
	}

	:global(.dark) .toast.bg-red-500 {
		background-color: rgba(220, 38, 38, 0.98);
	}

	:global(.dark) .toast.bg-yellow-500 {
		background-color: rgba(202, 138, 4, 0.98);
	}

	:global(.dark) .toast.bg-blue-500 {
		background-color: rgba(37, 99, 235, 0.98);
	}

	/* Responsive motion */
	@media (prefers-reduced-motion: reduce) {
		.toast {
			animation: none;
			transition: none;
		}

		.toast.hovered {
			transform: none;
		}

		.progress-bar {
			animation: none;
		}
	}
</style>
