/**
 * Floating Header Responsive Width Calculation System
 *
 * This module provides accurate calculations for floating header dimensions
 * that adapt to viewport size and maintain consistent behavior across components.
 */

interface FloatingDimensions {
	width: string;
	left: string;
	transform: string;
	maxWidth: string;
}

interface AnimationState {
	isSticky: boolean;
	isTransitioning: boolean;
	direction: "down" | "up" | null;
	phase: "idle" | "entering" | "entered" | "exiting" | "exited";
}

interface FloatingHeaderOptions {
	viewportWidth?: number;
	customMarginFactor?: number;
	animationDuration?: number;
	enableSmoothTransitions?: boolean;
	widthExpansionFactor?: number;
}

interface BreakpointConfig {
	minWidth: number;
	containerMaxWidth: number; // in rem
	margin: number; // in rem
}

// Breakpoint configuration matching Tailwind and CSS custom properties
const BREAKPOINTS: Record<string, BreakpointConfig> = {
	base: { minWidth: 0, containerMaxWidth: 100, margin: 1.5 }, // 0px+, 100vw, 24px margin
	sm: { minWidth: 680, containerMaxWidth: 42.5, margin: 2 }, // 680px+, 680px max, 32px margin
	md: { minWidth: 820, containerMaxWidth: 51.25, margin: 2.5 }, // 820px+, 820px max, 40px margin
	lg: { minWidth: 1200, containerMaxWidth: 75, margin: 3 }, // 1200px+, 1200px max, 48px margin
	xl: { minWidth: 1400, containerMaxWidth: 87.5, margin: 3.5 }, // 1400px+, 1400px max, 56px margin
	"2xl": { minWidth: 1600, containerMaxWidth: 100, margin: 4 }, // 1600px+, 1600px max, 64px margin
};

/**
 * Determines the current active breakpoint based on viewport width
 */
function getCurrentBreakpoint(viewportWidth: number): BreakpointConfig {
	// Sort breakpoints by minWidth in descending order to find the largest matching breakpoint
	const breakpointEntries: [string, BreakpointConfig][] = Object.keys(BREAKPOINTS).map((key) => {
		const config = BREAKPOINTS[key];
		if (!config) {
			throw new Error(`Breakpoint configuration missing for key: ${key}`);
		}
		return [key, config] as [string, BreakpointConfig];
	});
	const sortedBreakpoints = breakpointEntries.sort(([, a], [, b]) => b.minWidth - a.minWidth);

	for (const [, config] of sortedBreakpoints) {
		if (viewportWidth >= config.minWidth) {
			return config;
		}
	}

	// Fallback to base breakpoint
	const baseBreakpoint = BREAKPOINTS["base"];
	if (!baseBreakpoint) {
		// Ultimate fallback if base is not found
		return { minWidth: 0, containerMaxWidth: 100, margin: 1.5 };
	}
	return baseBreakpoint;
}

/**
 * Calculates the optimal floating header dimensions for current viewport
 */
export function calculateFloatingDimensions(viewportWidth: number = window.innerWidth, customMarginFactor: number = 1, widthExpansionFactor: number = 1.1): FloatingDimensions {
	const breakpoint = getCurrentBreakpoint(viewportWidth);

	// Calculate effective margin with custom factor
	const effectiveMargin = breakpoint.margin * customMarginFactor;
	const marginPx = effectiveMargin * 16; // Convert rem to px (1rem = 16px)

	// Determine optimal width strategy
	let width: string;
	let maxWidth: string;

	// Account for the actual p-4 padding (16px total) on the container
	const containerPadding = 16; // p-4 = 0.5rem = 8px on each side

	if (viewportWidth <= 680) {
		// For small screens, use 95% of viewport width for better visual balance
		width = `95vw`;
		maxWidth = width;
	} else {
		// For larger screens, use expanded container width when possible
		const containerMaxWidthPx = breakpoint.containerMaxWidth * 16; // Convert rem to px
		const expandedContainerWidth = containerMaxWidthPx * widthExpansionFactor;
		const expandedPlusMargins = expandedContainerWidth + marginPx * 2;

		if (expandedPlusMargins <= viewportWidth) {
			// Expanded container fits comfortably, use expanded width
			width = `calc(${breakpoint.containerMaxWidth * widthExpansionFactor}rem - ${containerPadding}px)`;
			maxWidth = width;
		} else if (containerMaxWidthPx + marginPx * 2 <= viewportWidth) {
			// Standard container fits, use standard width
			width = `calc(${breakpoint.containerMaxWidth}rem - ${containerPadding}px)`;
			maxWidth = width;
		} else {
			// Use viewport-based calculation with better margins
			width = `calc(100vw - ${Math.max(marginPx * 2, 32)}px)`;
			maxWidth = `${breakpoint.containerMaxWidth * widthExpansionFactor}rem`;
		}
	}

	// Use CSS centering to match the container mx-auto behavior
	return {
		width,
		left: "50%",
		transform: `translateX(-50%) scale(1)`, // Full width without scaling
		maxWidth,
	};
}

/**
 * Reactive function that updates CSS custom properties based on current viewport
 */
export function updateFloatingCSSProperties(viewportWidth: number = window.innerWidth, customMarginFactor: number = 1, widthExpansionFactor: number = 1.1): void {
	const breakpoint = getCurrentBreakpoint(viewportWidth);
	const effectiveMargin = breakpoint.margin * customMarginFactor;

	const root = document.documentElement;
	root.style.setProperty("--active-container-width", `${breakpoint.containerMaxWidth * widthExpansionFactor}rem`);
	root.style.setProperty("--active-floating-margin", `${effectiveMargin}rem`);
	root.style.setProperty("--width-expansion-factor", `${widthExpansionFactor}`);
}

/**
 * Calculates the actual height of the app header dynamically
 */
export function calculateActualHeaderHeight(): number {
	// Default fallback height if DOM elements aren't available
	const fallbackHeight = 73; // Previous estimated header height

	try {
		// Get the window controls bar height (always 32px)
		const windowControlsHeight = 32;

		// Try to find the header element
		const headerElement = document.querySelector("header");
		if (headerElement) {
			const headerRect = headerElement.getBoundingClientRect();
			return windowControlsHeight + headerRect.height;
		}

		// Fallback: calculate based on known structure
		return windowControlsHeight + fallbackHeight;
	} catch (error) {
		console.warn("Failed to calculate header height, using fallback:", error);
		return 32 + fallbackHeight; // Window controls + estimated header
	}
}

/**
 * Animation timing configuration
 */
const ANIMATION_CONFIG = {
	duration: 300, // Reduced from 500ms for snappier feel
	easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", // Natural motion curve
	staggerDelay: 50, // Delay between different property animations
};

/**
 * Creates enhanced style string with smooth directional animations
 */
export function getFloatingHeaderStyle(isSticky: boolean, options: FloatingHeaderOptions = {}): string {
	const { viewportWidth = window.innerWidth, customMarginFactor = 1, animationDuration = ANIMATION_CONFIG.duration, enableSmoothTransitions = true } = options;

	if (!isSticky) {
		// Non-floating state with enhanced transitions
		return `position: relative; transform: translateX(0) translateY(0) scale(1); opacity: 1; transition: ${enableSmoothTransitions ? `all ${animationDuration}ms ${ANIMATION_CONFIG.easing}` : "none"};`;
	}

	const dimensions = calculateFloatingDimensions(viewportWidth, customMarginFactor, 1.1);

	// Floating state with enhanced transitions
	// Calculate dynamic header height + small padding
	const totalHeaderHeight = calculateActualHeaderHeight() + 5; // Add small padding
	return `position: fixed; top: ${totalHeaderHeight}px; left: ${dimensions.left}; width: ${dimensions.width}; max-width: ${dimensions.maxWidth}; margin: 0; transform: translateX(-50%); opacity: 1; z-index: 40; transition: ${
		enableSmoothTransitions ? `all ${animationDuration}ms ${ANIMATION_CONFIG.easing}` : "none"
	};`;
}

/**
 * Enhanced floating header style with pure vertical animations
 * Maintains consistent horizontal positioning throughout all states
 */
export function getEnhancedFloatingHeaderStyle(animationState: AnimationState, options: FloatingHeaderOptions = {}): { style: string; className: string } {
	const { viewportWidth = window.innerWidth, customMarginFactor = 1 } = options;

	const dimensions = calculateFloatingDimensions(viewportWidth, customMarginFactor, 1.1);

	let style = "";
	let className = "";

	// Common fixed positioning base for all floating states
	// Calculate dynamic header height + padding
	const totalHeaderHeight = calculateActualHeaderHeight() + 5; // Add small padding
	const fixedBase = `position: fixed; top: ${totalHeaderHeight}px; left: ${dimensions.left}; width: ${dimensions.width}; max-width: ${dimensions.maxWidth}; margin: 0; z-index: 40;`;

	switch (animationState.phase) {
		case "idle":
			if (!animationState.isSticky) {
				// Static state - use relative positioning without transforms
				style = `position: relative; opacity: 1;`;
				className = "floating-header-static";
			} else {
				// Fully floating state - fixed positioning with final transform
				style = `${fixedBase} transform: translateX(-50%) translateY(0); opacity: 1;`;
				className = "floating-header-floating";
			}
			break;

		case "entering":
			// Entering floating state - start with translateX positioning for smooth animation
			style = `${fixedBase} transform: translateX(-50%) translateY(-20px); opacity: 0.7;`;
			className = "floating-header-entering";
			break;

		case "exiting":
			// Exiting to static - start with floating transform for smooth animation
			style = `position: relative; transform: none; opacity: 1;`;
			className = "floating-header-exiting";
			break;

		default:
			// Fallback to standard behavior
			return {
				style: getFloatingHeaderStyle(animationState.isSticky, options),
				className: "floating-header-fallback",
			};
	}

	return { style, className };
}

/**
 * Creates an animation state manager for smooth transitions
 */
export function createAnimationStateManager() {
	let state: AnimationState = {
		isSticky: false,
		isTransitioning: false,
		direction: null,
		phase: "idle",
	};

	let transitionTimeout: number | null = null;

	const setState = (newSticky: boolean, callback?: (state: AnimationState) => void) => {
		if (state.isSticky === newSticky) {
			return state; // No change needed
		}

		// Prevent overlapping transitions - if already transitioning, ignore new requests
		if (state.isTransitioning) {
			return state; // Skip if already transitioning
		}

		// Clear any existing transition timeout (defensive)
		if (transitionTimeout) {
			clearTimeout(transitionTimeout);
		}

		// Update state
		state.isSticky = newSticky;
		state.isTransitioning = true;
		state.direction = newSticky ? "down" : "up";
		state.phase = newSticky ? "entering" : "exiting";

		// Trigger callback immediately for the transition state
		if (callback) callback({ ...state });

		// Set timeout for completing the transition with settling period
		transitionTimeout = setTimeout(() => {
			state.isTransitioning = false;
			state.direction = null;
			state.phase = "idle";

			// Final callback for the completed state
			if (callback) callback({ ...state });

			// Add a small settling period to prevent immediate re-triggers
			setTimeout(() => {
				// Additional settling time completed - no action needed
			}, 50);
		}, ANIMATION_CONFIG.duration);

		return state;
	};

	const getState = () => ({ ...state });

	const cleanup = () => {
		if (transitionTimeout) {
			clearTimeout(transitionTimeout);
			transitionTimeout = null;
		}
	};

	return { setState, getState, cleanup };
}

/**
 * Debounced resize handler for updating floating header dimensions
 */
let resizeTimeout: number | null = null;

export function setupResponsiveFloatingHeaders(customMarginFactor: number = 1, widthExpansionFactor: number = 1.1): () => void {
	const handleResize = () => {
		if (resizeTimeout) {
			clearTimeout(resizeTimeout);
		}

		resizeTimeout = setTimeout(() => {
			updateFloatingCSSProperties(window.innerWidth, customMarginFactor, widthExpansionFactor);
		}, 250);
	};

	// Initial setup
	updateFloatingCSSProperties(window.innerWidth, customMarginFactor, widthExpansionFactor);

	// Add resize listener
	window.addEventListener("resize", handleResize);

	// Return cleanup function
	return () => {
		if (resizeTimeout) {
			clearTimeout(resizeTimeout);
		}
		window.removeEventListener("resize", handleResize);
	};
}
