import { tooltipStore } from "../stores/tooltip.svelte";
import type { TooltipOptions } from "../stores/tooltip.svelte";
import { tick } from "svelte";

export interface TooltipActionOptions extends TooltipOptions {
	content?: string;
	disabled?: boolean;
}

/**
 * Svelte action for adding tooltips to elements
 * Usage: <Button use:tooltip="Tooltip text">Button</Button>
 * Or: <Button use:tooltip={{ content: "Tooltip text", position: "bottom" }}>Button</Button>
 */
export function tooltip(element: HTMLElement, options?: string | TooltipActionOptions) {
	let content: string;
	let opts: TooltipActionOptions = {};

	// Parse options
	if (typeof options === "string") {
		content = options;
	} else if (options) {
		content = options.content || element.getAttribute("title") || "";
		opts = options;
	} else {
		content = element.getAttribute("title") || "";
	}

	// Remove native title to prevent browser tooltip
	const originalTitle = element.getAttribute("title");
	if (originalTitle) {
		element.removeAttribute("title");
	}

	let isHovering = false;
	let isFocused = false;

	const showTooltip = () => {
		if (!opts.disabled && content && (isHovering || isFocused)) {
			const options: TooltipOptions = {};
			if (opts.position !== undefined) options.position = opts.position;
			if (opts.delay !== undefined) options.delay = opts.delay;
			if (opts.offset !== undefined) options.offset = opts.offset;
			if (opts.className !== undefined) options.className = opts.className;
			if (opts.fullWidth !== undefined) options.fullWidth = opts.fullWidth;

			tick().then(() => {
				tooltipStore.show(element, content, options);
			});
		}
	};

	const hideTooltip = () => {
		if (!isHovering && !isFocused) {
			const hideOptions: { delay?: number } = {};
			if (opts.hideDelay !== undefined) hideOptions.delay = opts.hideDelay;
			tick().then(() => {
				tooltipStore.hide(hideOptions);
			});
		}
	};

	const handleMouseEnter = () => {
		isHovering = true;
		showTooltip();
	};

	const handleMouseLeave = () => {
		isHovering = false;
		hideTooltip();
	};

	const handleFocus = () => {
		isFocused = true;
		showTooltip();
	};

	const handleBlur = () => {
		isFocused = false;
		hideTooltip();
	};

	const handleClick = () => {
		tick().then(() => {
			tooltipStore.forceClose();
		});
	};

	// Add event listeners
	element.addEventListener("mouseenter", handleMouseEnter);
	element.addEventListener("mouseleave", handleMouseLeave);
	element.addEventListener("focus", handleFocus);
	element.addEventListener("blur", handleBlur);
	element.addEventListener("click", handleClick);

	return {
		update(newOptions?: string | TooltipActionOptions) {
			// Update options
			if (typeof newOptions === "string") {
				content = newOptions;
				opts = {};
			} else if (newOptions) {
				content = newOptions.content || content;
				opts = newOptions;
			}

			// Update tooltip if currently showing
			if (tooltipStore.visible && tooltipStore.targetElement === element) {
				if (opts.disabled) {
					tick().then(() => {
						tooltipStore.hide();
					});
				} else if (content) {
					const updateOptions: TooltipOptions = { delay: 0 }; // No delay on update
					if (opts.position !== undefined) updateOptions.position = opts.position;
					if (opts.offset !== undefined) updateOptions.offset = opts.offset;
					if (opts.className !== undefined) updateOptions.className = opts.className;
					if (opts.fullWidth !== undefined) updateOptions.fullWidth = opts.fullWidth;

					tick().then(() => {
						tooltipStore.show(element, content, updateOptions);
					});
				}
			}
		},
		destroy() {
			// Restore original title if it existed
			if (originalTitle) {
				element.setAttribute("title", originalTitle);
			}

			// Remove event listeners
			element.removeEventListener("mouseenter", handleMouseEnter);
			element.removeEventListener("mouseleave", handleMouseLeave);
			element.removeEventListener("focus", handleFocus);
			element.removeEventListener("blur", handleBlur);
			element.removeEventListener("click", handleClick);

			// Hide tooltip if it's showing for this element
			if (tooltipStore.targetElement === element) {
				tick().then(() => {
					tooltipStore.forceClose();
				});
			}
		},
	};
}
