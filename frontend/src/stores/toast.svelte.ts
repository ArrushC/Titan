/**
 * Toast notification store using Svelte 5 runes
 */

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
	createdAt: number;
}

class ToastStore {
	public toasts = $state<Toast[]>([]);
	private maxToasts = 5;
	private defaultDurations: Record<ToastType, number> = {
		success: 3000,
		info: 3000,
		warning: 5000,
		error: 5000,
	};

	/**
	 * Get all active toasts
	 */
	get all(): Toast[] {
		return this.toasts;
	}

	/**
	 * Add a new toast notification
	 */
	add(type: ToastType, message: string, duration?: number): void {
		const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const toast: Toast = {
			id,
			type,
			message,
			duration: duration ?? this.defaultDurations[type],
			createdAt: Date.now(),
		};

		// Remove oldest toast if we've reached the max
		if (this.toasts.length >= this.maxToasts) {
			this.toasts = this.toasts.slice(1);
		}

		// Add new toast
		this.toasts = [...this.toasts, toast];

		// Auto-remove after duration
		if (toast.duration && toast.duration > 0) {
			setTimeout(() => {
				this.remove(id);
			}, toast.duration);
		}
	}

	/**
	 * Remove a toast by ID
	 */
	remove(id: string): void {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}

	/**
	 * Clear all toasts
	 */
	clear(): void {
		this.toasts = [];
	}

	/**
	 * Convenience methods for different toast types
	 */
	success(message: string, duration?: number): void {
		this.add("success", message, duration);
	}

	error(message: string, duration?: number): void {
		this.add("error", message, duration);
	}

	warning(message: string, duration?: number): void {
		this.add("warning", message, duration);
	}

	info(message: string, duration?: number): void {
		this.add("info", message, duration);
	}
}

// Create singleton instance
export const toastStore = new ToastStore();

// Export convenience functions for easier usage
export const showToast = (type: ToastType, message: string, duration?: number) => toastStore.add(type, message, duration);

export const showSuccess = (message: string, duration?: number) => toastStore.success(message, duration);

export const showError = (message: string, duration?: number) => toastStore.error(message, duration);

export const showWarning = (message: string, duration?: number) => toastStore.warning(message, duration);

export const showInfo = (message: string, duration?: number) => toastStore.info(message, duration);
