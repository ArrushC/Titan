<script lang="ts">
	import { confirmationDialog } from '../stores/confirmationDialog.svelte.ts';
	import Icon from './Icon.svelte';
	import Button from './Button.svelte';
	import { cubicOut } from 'svelte/easing';

	// Get the current dialog from the store
	let dialog = $derived(confirmationDialog.current);

	// Animation functions
	function dialogEnter(node: Element, { duration = 200 }) {
		return {
			duration,
			css: (t: number) => {
				const eased = cubicOut(t);
				const scale = 0.95 + (eased * 0.05);
				const opacity = t;
				const translateY = (1 - eased) * 10;

				return `
					transform: scale(${scale}) translateY(${translateY}px);
					opacity: ${opacity};
				`;
			}
		};
	}

	function dialogExit(node: Element, { duration = 150 }) {
		return {
			duration,
			css: (t: number) => {
				const scale = t * 0.98;
				const opacity = t;
				const translateY = (1 - t) * -5;

				return `
					transform: scale(${scale}) translateY(${translateY}px);
					opacity: ${opacity};
				`;
			}
		};
	}

	function backdropEnter(node: Element, { duration = 200 }) {
		return {
			duration,
			css: (t: number) => {
				const opacity = t;
				return `opacity: ${opacity};`;
			}
		};
	}

	function backdropExit(node: Element, { duration = 150 }) {
		return {
			duration,
			css: (t: number) => {
				const opacity = t;
				return `opacity: ${opacity};`;
			}
		};
	}

	// Handle keyboard events
	function handleKeydown(event: KeyboardEvent) {
		if (!dialog) return;

		switch (event.key) {
			case 'Escape':
				event.preventDefault();
				confirmationDialog.cancel();
				break;
			case 'Enter':
				event.preventDefault();
				confirmationDialog.confirm();
				break;
		}
	}

	// Handle backdrop click
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			confirmationDialog.cancel();
		}
	}

	// Get styling classes based on dialog type
	function getTypeStyles(type: string) {
		switch (type) {
			case 'danger':
				return {
					iconColor: 'text-red-600 dark:text-red-400',
					confirmButtonClass: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white',
					titleClass: 'text-red-900 dark:text-red-100'
				};
			case 'warning':
				return {
					iconColor: 'text-orange-600 dark:text-orange-400',
					confirmButtonClass: 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white',
					titleClass: 'text-orange-900 dark:text-orange-100'
				};
			case 'info':
			default:
				return {
					iconColor: 'text-blue-600 dark:text-blue-400',
					confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white',
					titleClass: 'text-gray-900 dark:text-gray-100'
				};
		}
	}

	$effect(() => {
		if (dialog) {
			// Add event listener for keyboard navigation
			document.addEventListener('keydown', handleKeydown);

			// Focus the dialog for accessibility
			const dialogElement = document.querySelector('[role="dialog"]') as HTMLElement;
			if (dialogElement) {
				dialogElement.focus();
			}

			return () => {
				document.removeEventListener('keydown', handleKeydown);
			};
		}
	});
</script>

{#if dialog}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-gray-900/20 dark:bg-gray-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
		in:backdropEnter
		out:backdropExit
		onclick={handleBackdropClick}
		role="presentation"
	>
		<!-- Dialog -->
		<div
			class="bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-gray-900/5 dark:ring-gray-700/50 max-w-md w-full"
			in:dialogEnter
			out:dialogExit
			role="dialog"
			aria-modal="true"
			aria-labelledby="dialog-title"
			aria-describedby="dialog-message"
			tabindex="-1"
		>
			{#if dialog}
				{@const typeStyles = getTypeStyles(dialog.type || 'info')}

				<!-- Dialog Content -->
			<div class="p-6">
				<!-- Header with Icon and Title -->
				<div class="flex items-start gap-4">
					{#if dialog.icon}
						<div class="flex-shrink-0">
							<Icon name={dialog.icon} size={24} class={typeStyles.iconColor} />
						</div>
					{/if}

					<div class="flex-1">
						<h3 id="dialog-title" class="text-xl font-semibold {typeStyles.titleClass} mb-2">
							{dialog.title}
						</h3>

						<p id="dialog-message" class="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
							{dialog.message}
						</p>
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 rounded-b-lg flex justify-end gap-3">
				<!-- Cancel Button -->
				<Button
					variant="secondary"
					onclick={() => confirmationDialog.cancel()}
					disabled={dialog.isLoading}
				>
					{dialog.cancelText}
				</Button>

				<!-- Confirm Button -->
				<Button
					variant={dialog.type === 'danger' ? 'danger' : 'primary'}
					onclick={() => confirmationDialog.confirm()}
					disabled={dialog.isLoading}
					loading={dialog.isLoading}
				>
					{dialog.isLoading ? 'Processing...' : dialog.confirmText}
				</Button>
			</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Ensure dialog is on top of everything */
	:global(.confirmation-dialog-backdrop) {
		z-index: 10000;
	}
</style>