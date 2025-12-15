/**
 * Tooltip store using Svelte 5 runes
 * Manages a single global tooltip instance
 */

import { untrack } from 'svelte';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface TooltipOptions {
	position?: TooltipPosition;
	delay?: number;
	offset?: number;
	className?: string;
	hideDelay?: number;
	fullWidth?: boolean;
}

interface TooltipState {
	visible: boolean;
	content: string | null;
	targetElement: HTMLElement | null;
	position: TooltipPosition;
	x: number;
	y: number;
	actualPosition: TooltipPosition;
	showTimeout: number | null;
	hideTimeout: number | null;
	fullWidth: boolean;
}

class TooltipStore {
	private state = $state<TooltipState>({
		visible: false,
		content: null,
		targetElement: null,
		position: 'top',
		x: 0,
		y: 0,
		actualPosition: 'top',
		showTimeout: null,
		hideTimeout: null,
		fullWidth: false
	});

	private defaultOptions: Required<TooltipOptions> = {
		position: 'auto',
		delay: 300,
		offset: 2,
		className: '',
		hideDelay: 0,
		fullWidth: false
	};

	get visible(): boolean {
		return this.state.visible;
	}

	get content(): string | null {
		return this.state.content;
	}

	get targetElement(): HTMLElement | null {
		return this.state.targetElement;
	}

	get position(): TooltipPosition {
		return this.state.position;
	}

	get x(): number {
		return this.state.x;
	}

	get y(): number {
		return this.state.y;
	}

	get actualPosition(): TooltipPosition {
		return this.state.actualPosition;
	}

	get fullWidth(): boolean {
		return this.state.fullWidth;
	}

	/**
	 * Show tooltip for a specific element
	 */
	show(element: HTMLElement, content: string, options: TooltipOptions = {}): void {
		untrack(() => {
			// Clear any existing timeouts
			this.clearTimeouts();

			const opts = { ...this.defaultOptions, ...options };
			
			// Set up show delay
			if (opts.delay > 0) {
				this.state.showTimeout = window.setTimeout(() => {
					this.immediateShow(element, content, opts);
				}, opts.delay);
			} else {
				this.immediateShow(element, content, opts);
			}
		});
	}

	/**
	 * Hide the tooltip
	 */
	hide(options: { delay?: number } = {}): void {
		untrack(() => {
			// Clear show timeout if hiding
			if (this.state.showTimeout) {
				clearTimeout(this.state.showTimeout);
				this.state.showTimeout = null;
			}

			const delay = options.delay ?? this.defaultOptions.hideDelay;
			
			if (delay > 0) {
				this.state.hideTimeout = window.setTimeout(() => {
					this.immediateHide();
				}, delay);
			} else {
				this.immediateHide();
			}
		});
	}

	/**
	 * Update tooltip position (called on scroll/resize)
	 */
	updatePosition(): void {
		untrack(() => {
			if (!this.state.targetElement || !this.state.visible) return;

			// Check if target element is still in the DOM
			if (!document.body.contains(this.state.targetElement)) {
				this.forceClose();
				return;
			}

			const rect = this.state.targetElement.getBoundingClientRect();
			
			// Hide tooltip if target element is out of view
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;
			
			if (rect.bottom < 0 || rect.top > viewportHeight || rect.right < 0 || rect.left > viewportWidth) {
				this.hide();
				return;
			}

			const { x, y, actualPosition } = this.calculatePosition(
				rect,
				this.state.position,
				this.defaultOptions.offset
			);

			this.state.x = x;
			this.state.y = y;
			this.state.actualPosition = actualPosition;
		});
	}

	/**
	 * Immediately show tooltip without delay
	 */
	private immediateShow(element: HTMLElement, content: string, options: Required<TooltipOptions>): void {
		untrack(() => {
			const rect = element.getBoundingClientRect();
			const { x, y, actualPosition } = this.calculatePosition(rect, options.position, options.offset);

			this.state.visible = true;
			this.state.content = content;
			this.state.targetElement = element;
			this.state.position = options.position;
			this.state.x = x;
			this.state.y = y;
			this.state.actualPosition = actualPosition;
			this.state.fullWidth = options.fullWidth;
		});
	}

	/**
	 * Immediately hide tooltip without delay
	 */
	private immediateHide(): void {
		untrack(() => {
			this.state.visible = false;
			this.state.content = null;
			this.state.targetElement = null;
			this.clearTimeouts();
		});
	}

	/**
	 * Clear all timeouts
	 */
	private clearTimeouts(): void {
		untrack(() => {
			if (this.state.showTimeout) {
				clearTimeout(this.state.showTimeout);
				this.state.showTimeout = null;
			}
			if (this.state.hideTimeout) {
				clearTimeout(this.state.hideTimeout);
				this.state.hideTimeout = null;
			}
		});
	}

	/**
	 * Calculate tooltip position relative to target element
	 */
	private calculatePosition(
		targetRect: DOMRect,
		preferredPosition: TooltipPosition,
		offset: number
	): { x: number; y: number; actualPosition: TooltipPosition } {
		const centerX = targetRect.left + targetRect.width / 2;
		const centerY = targetRect.top + targetRect.height / 2;
		
		// Get viewport dimensions for boundary checking
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		let x = centerX;
		let y = targetRect.top;
		let actualPosition = preferredPosition;

		// Auto positioning logic
		if (preferredPosition === 'auto') {
			const spaceAbove = targetRect.top;
			const spaceBelow = viewportHeight - targetRect.bottom;
			const spaceLeft = targetRect.left;
			const spaceRight = viewportWidth - targetRect.right;
			
			const minVerticalSpace = 40; // Minimum space needed for vertical tooltip
			const minHorizontalSpace = 150; // Minimum space needed for horizontal tooltip

			// Priority order: top, bottom, right, left
			if (spaceAbove >= minVerticalSpace) {
				actualPosition = 'top';
			} else if (spaceBelow >= minVerticalSpace) {
				actualPosition = 'bottom';
			} else if (spaceRight >= minHorizontalSpace) {
				actualPosition = 'right';
			} else if (spaceLeft >= minHorizontalSpace) {
				actualPosition = 'left';
			} else {
				// Fallback to the position with the most space
				const maxSpace = Math.max(spaceAbove, spaceBelow, spaceLeft, spaceRight);
				if (maxSpace === spaceAbove) actualPosition = 'top';
				else if (maxSpace === spaceBelow) actualPosition = 'bottom';
				else if (maxSpace === spaceRight) actualPosition = 'right';
				else actualPosition = 'left';
			}
		}

		// Calculate position based on actual position
		switch (actualPosition) {
			case 'top':
				x = centerX;
				y = targetRect.top - offset;
				break;
			case 'bottom':
				x = centerX;
				y = targetRect.bottom + offset;
				break;
			case 'left':
				x = targetRect.left - offset;
				y = centerY;
				break;
			case 'right':
				x = targetRect.right + offset;
				y = centerY;
				break;
		}

		// Add scroll offset to convert from viewport to page coordinates
		// since we're using position: fixed, we need viewport coordinates
		// but we need to account for when the page scrolls
		
		return { x, y, actualPosition };
	}

	/**
	 * Force close tooltip (used for cleanup)
	 */
	forceClose(): void {
		this.clearTimeouts();
		this.immediateHide();
	}
}

// Create singleton instance
export const tooltipStore = new TooltipStore();

// Export convenience function
export const showTooltip = (element: HTMLElement, content: string, options?: TooltipOptions) => 
	tooltipStore.show(element, content, options);

export const hideTooltip = (options?: { delay?: number }) => 
	tooltipStore.hide(options);