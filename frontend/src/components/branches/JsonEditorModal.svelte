<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { EditorView } from "@codemirror/view";
	import { EditorState, Compartment } from "@codemirror/state";
	import { json } from "@codemirror/lang-json";
	import { oneDark } from "@codemirror/theme-one-dark";
	import { basicSetup } from "codemirror";
	import Icon from "../Icon.svelte";
	import Button from "../Button.svelte";
	import { showError, showSuccess } from "../../stores/toast.svelte.ts";

	interface Props {
		isVisible: boolean;
		title?: string;
		jsonContent: string;
		isLoading?: boolean;
		onClose: () => void;
		onSave: (content: string) => Promise<void>;
	}

	let {
		isVisible = false,
		title = "Edit JSON Configuration",
		jsonContent = "",
		isLoading = false,
		onClose,
		onSave
	}: Props = $props();

	let editorContainer = $state<HTMLDivElement | null>(null);
	let editorView: EditorView | null = null;
	let hasUnsavedChanges = $state(false);
	let validationError = $state<string | null>(null);
	let isSaving = $state(false);
	let isDarkMode = $state(false);

	// Track if content has changed
	let originalContent = "";

	// Theme compartment for dynamic theme switching
	const themeCompartment = new Compartment();

	// Normalize JSON content for consistent comparison
	function normalized(content: string) {
		try { return JSON.stringify(JSON.parse(content), null, 2); }
		catch { return content; }
	}

	// Initialize editor
	onMount(() => {
		// Check if dark mode is enabled
		isDarkMode = document.documentElement.classList.contains('dark');

		// Watch for theme changes
		const observer = new MutationObserver(() => {
			isDarkMode = document.documentElement.classList.contains('dark');
			if (editorView) {
				updateEditorTheme();
			}
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

		return () => observer.disconnect();
	});

	// Update editor theme
	function updateEditorTheme() {
		if (!editorView) return;

		editorView.dispatch({
			effects: themeCompartment.reconfigure(isDarkMode ? oneDark : [])
		});
	}

	// 1) Create on show
	$effect(() => {
		if (isVisible && editorContainer && !editorView) {
			createEditor();
			updateEditorTheme(); // ensure correct theme on first mount
		}
	});

	// 2) Update doc when incoming json changes (normalized)
	$effect(() => {
		if (!isVisible || !editorView) return;
		const incoming = normalized(jsonContent);
		if (incoming !== originalContent) {
			updateEditorContent();
		}
	});

	// 3) Destroy on hide so we don't keep a view pointing at a removed node
	$effect(() => {
		if (!isVisible && editorView) {
			editorView.destroy();
			editorView = null;
		}
	});

	function createEditor() {
		if (!editorContainer) return;

		originalContent = normalized(jsonContent);
		hasUnsavedChanges = false;
		validationError = null;

		const state = EditorState.create({
			doc: originalContent,
			extensions: [
				basicSetup,
				json(),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						const content = editorView?.state.doc.toString() || "";
						hasUnsavedChanges = content !== originalContent;
						validateJSON(content);
					}
				}),
				EditorView.theme({
					"&": {
						height: "400px",
						maxHeight: "400px"
					},
					".cm-scroller": {
						overflow: "auto"
					}
				}),
				themeCompartment.of(isDarkMode ? oneDark : [])
			]
		});

		editorView = new EditorView({
			state,
			parent: editorContainer!
		});

		validateJSON(originalContent);
	}

	function updateEditorContent() {
		if (!editorView) return;

		const formattedContent = normalized(jsonContent);
		originalContent = formattedContent;
		hasUnsavedChanges = false;
		validationError = null;

		editorView.dispatch({
			changes: {
				from: 0,
				to: editorView.state.doc.length,
				insert: formattedContent
			}
		});

		validateJSON(formattedContent);
	}

	function formatJSON(content: string): string {
		try {
			const parsed = JSON.parse(content);
			return JSON.stringify(parsed, null, 2);
		} catch {
			// Return original content if parsing fails
			return content;
		}
	}

	function validateJSON(content: string): void {
		try {
			JSON.parse(content);
			validationError = null;
		} catch (error) {
			validationError = error instanceof Error ? error.message : "Invalid JSON";
		}
	}

	function getCurrentContent(): string {
		return editorView?.state.doc.toString() || "";
	}

	function handleRevert() {
		if (!editorView) return;

		// Format the original content before restoring
		const formattedOriginal = formatJSON(originalContent);

		// Restore formatted original content
		editorView.dispatch({
			changes: {
				from: 0,
				to: editorView.state.doc.length,
				insert: formattedOriginal
			}
		});

		// Reset state
		hasUnsavedChanges = false;
		validationError = null;
		validateJSON(formattedOriginal);
	}

	async function handleSave() {
		const content = getCurrentContent();

		if (validationError) {
			showError("Cannot save: " + validationError);
			return;
		}

		try {
			isSaving = true;
			await onSave(content);
			originalContent = content;
			hasUnsavedChanges = false;
			showSuccess("Configuration saved successfully");
			onClose();
		} catch (error) {
			console.error("Failed to save:", error);
			showError("Failed to save configuration");
		} finally {
			isSaving = false;
		}
	}

	function handleClose() {
		if (hasUnsavedChanges) {
			if (confirm("You have unsaved changes. Are you sure you want to close without saving?")) {
				onClose();
			}
		} else {
			onClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Escape" && isVisible) {
			handleClose();
		} else if (event.key === "s" && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			if (!validationError && !isSaving) {
				handleSave();
			}
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	onDestroy(() => {
		if (editorView) {
			editorView.destroy();
			editorView = null;
		}
	});
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isVisible}
	<!-- Modal backdrop -->
	<div
		class="fixed inset-0 bg-gray-900/20 dark:bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-label={title}
	>
		<!-- Modal content -->
		<div
			class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
				<div class="flex items-center gap-2">
					<Icon name="settings" size={20} class="text-gray-600 dark:text-gray-400" />
					<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
					{#if hasUnsavedChanges}
						<span class="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
							Unsaved changes
						</span>
					{/if}
				</div>
				<Button
					variant="ghost"
					iconOnly="x"
					iconSize={16}
					onclick={handleClose}
					aria-label="Close modal"
					class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
				/>
			</div>

			<!-- Content -->
			<div class="flex-1 p-4 overflow-hidden">
				{#if isLoading}
					<div class="flex items-center justify-center h-64">
						<div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
							<div class="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
							<span>Loading configuration...</span>
						</div>
					</div>
				{:else}
					<!-- Editor container -->
					<div class="space-y-3">
						{#if validationError}
							<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
								<div class="flex items-start gap-2">
									<Icon name="triangleAlert" size={16} class="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
									<div>
										<p class="text-sm font-medium text-red-900 dark:text-red-100">JSON Validation Error</p>
										<p class="text-sm text-red-800 dark:text-red-200 mt-1">{validationError}</p>
									</div>
								</div>
							</div>
						{/if}

						<div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
							<div bind:this={editorContainer} class="w-full h-96"></div>
						</div>

						<div class="text-xs text-gray-500 dark:text-gray-400">
							<p>💡 <strong>Tip:</strong> Use Ctrl+S (Cmd+S) to save, Escape to close</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
				<div class="flex items-center">
					{#if validationError}
						<div class="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm">
							<Icon name="triangleAlert" size={14} class="text-red-600 dark:text-red-400" />
							<span class="text-red-700 dark:text-red-300 font-medium">Invalid JSON</span>
						</div>
					{:else}
						<div class="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-sm">
							<Icon name="success" size={14} class="text-green-600 dark:text-green-400" />
							<span class="text-green-700 dark:text-green-300 font-medium">Valid JSON</span>
						</div>
					{/if}
				</div>

				<div class="flex items-center gap-2">
					{#if hasUnsavedChanges}
						<Button
							variant="ghost"
							leftIcon="undo"
							onclick={handleRevert}
							disabled={isSaving}
							class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
							title="Revert to original content"
						>
							Revert
						</Button>
					{/if}
					<Button
						variant="secondary"
						onclick={handleClose}
						disabled={isSaving}
						class="text-sm"
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						onclick={handleSave}
						disabled={!!validationError || isSaving || !hasUnsavedChanges}
						loading={isSaving}
						class="text-sm"
					>
						{isSaving ? "Saving..." : "Save Changes"}
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if}