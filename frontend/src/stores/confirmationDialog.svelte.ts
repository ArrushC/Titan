/**
 * Confirmation Dialog store using Svelte 5 runes
 * Provides a promise-based API for showing confirmation dialogs
 */

export type ConfirmationType = "info" | "warning" | "danger";

export interface ConfirmationConfig {
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	type?: ConfirmationType;
	icon?: string;
	onConfirm?: () => void | Promise<void>;
	onCancel?: () => void;
}

export interface ConfirmationDialog {
	id: string;
	title: string;
	message: string;
	confirmText: string;
	cancelText: string;
	type: ConfirmationType;
	icon: string | undefined;
	onConfirm: (() => void | Promise<void>) | undefined;
	onCancel: (() => void) | undefined;
	resolve: (confirmed: boolean) => void;
	isLoading: boolean;
}

class ConfirmationDialogStore {
	private dialog = $state<ConfirmationDialog | null>(null);

	/**
	 * Get the current active dialog
	 */
	get current(): ConfirmationDialog | null {
		return this.dialog;
	}

	/**
	 * Show a confirmation dialog and return a promise that resolves with the user's choice
	 */
	show(config: ConfirmationConfig): Promise<boolean> {
		return new Promise((resolve) => {
			// Close any existing dialog first
			if (this.dialog) {
				this.dialog.resolve(false);
			}

			// Create new dialog
			this.dialog = {
				id: Date.now().toString(),
				title: config.title,
				message: config.message,
				confirmText: config.confirmText || "Confirm",
				cancelText: config.cancelText || "Cancel",
				type: config.type || "info",
				icon: config.icon,
				onConfirm: config.onConfirm,
				onCancel: config.onCancel,
				resolve,
				isLoading: false,
			};
		});
	}

	/**
	 * Confirm the current dialog
	 */
	async confirm(): Promise<void> {
		if (!this.dialog) return;

		try {
			// Set loading state
			this.dialog.isLoading = true;

			// Execute onConfirm callback if provided
			if (this.dialog.onConfirm) {
				await this.dialog.onConfirm();
			}

			// Resolve with true and close dialog
			this.dialog.resolve(true);
			this.dialog = null;
		} catch (error) {
			console.error("Error in confirmation dialog:", error);
			// Reset loading state on error
			if (this.dialog) {
				this.dialog.isLoading = false;
			}
			throw error;
		}
	}

	/**
	 * Cancel the current dialog
	 */
	cancel(): void {
		if (!this.dialog) return;

		try {
			// Execute onCancel callback if provided
			if (this.dialog.onCancel) {
				this.dialog.onCancel();
			}

			// Resolve with false and close dialog
			this.dialog.resolve(false);
			this.dialog = null;
		} catch (error) {
			console.error("Error in confirmation dialog cancel:", error);
			// Still close the dialog even if callback fails
			if (this.dialog) {
				this.dialog.resolve(false);
				this.dialog = null;
			}
		}
	}

	/**
	 * Close the dialog without triggering callbacks (for programmatic closure)
	 */
	close(): void {
		if (!this.dialog) return;

		this.dialog.resolve(false);
		this.dialog = null;
	}

	/**
	 * Set loading state for the current dialog
	 */
	setLoading(loading: boolean): void {
		if (this.dialog) {
			this.dialog.isLoading = loading;
		}
	}
}

// Export singleton instance
export const confirmationDialog = new ConfirmationDialogStore();

// Convenience functions for common dialog types
export const showConfirmation = (config: ConfirmationConfig): Promise<boolean> => {
	return confirmationDialog.show(config);
};

export const showWarning = (title: string, message: string, confirmText?: string): Promise<boolean> => {
	return confirmationDialog.show({
		title,
		message,
		confirmText: confirmText || "Confirm",
		type: "warning",
		icon: "triangleAlert",
	});
};

export const showDanger = (title: string, message: string, confirmText?: string): Promise<boolean> => {
	return confirmationDialog.show({
		title,
		message,
		confirmText: confirmText || "Confirm",
		type: "danger",
		icon: "triangleAlert",
	});
};

export const showInfo = (title: string, message: string, confirmText?: string): Promise<boolean> => {
	return confirmationDialog.show({
		title,
		message,
		confirmText: confirmText || "Confirm",
		type: "info",
		icon: "info",
	});
};
