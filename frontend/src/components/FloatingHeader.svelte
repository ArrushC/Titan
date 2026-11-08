<script lang="ts">
	import { onMount } from "svelte";
	import { createAnimationStateManager, setupResponsiveFloatingHeaders, getEnhancedFloatingHeaderStyle, calculateActualHeaderHeight } from "../utils/floatingHeader";

	interface Props {
		/** Custom margin factor for responsive calculations */
		customMarginFactor?: number;
		/** Width expansion factor for wider headers */
		widthExpansionFactor?: number;
		/** Classes to apply to the header content */
		contentClasses?: string;
		/** Style to apply when header is sticky */
		stickyContentClasses?: string;
		/** Style to apply when header is not sticky */
		normalContentClasses?: string;
		/** Whether header is sticky - bindable */
		isHeaderSticky?: boolean;
		/** Header height - bindable */
		headerHeight?: number;
		/** Whether to elevate z-index (for dropdowns) */
		elevateZIndex?: boolean;
		/** Children content */
		children?: any;
	}

	let {
		customMarginFactor = 1.0,
		widthExpansionFactor = 1.1,
		contentClasses = "",
		stickyContentClasses = 'bg-white dark:bg-gray-800 backdrop-blur-lg rounded-xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700 px-5 py-3 w-full',
		normalContentClasses = 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-5 py-3 mb-3 w-full shadow-sm',
		isHeaderSticky = $bindable(false),
		headerHeight = $bindable(0),
		elevateZIndex = false,
		children
	}: Props = $props();

	// Header element reference
	let headerElement: HTMLDivElement;
	let cleanupResponsiveHeaders: (() => void) | null = null;

	// Animation state management
	const animationStateManager = createAnimationStateManager();
	let headerStyle = $state("");
	let headerClassName = $state("");

	// Lifecycle
	onMount(() => {
		let scrollTimeout: number;
		let resizeTimeout: number;
		let lastStateChangeTime = 0;
		let lastViewportWidth = 0;
		let isInitialized = false;
		let cachedScrollThreshold = 0;
		let cachedScrollThresholdExit = 0;

		// Setup responsive floating headers system
		cleanupResponsiveHeaders = setupResponsiveFloatingHeaders(customMarginFactor, widthExpansionFactor);

		// Initialize header style using enhanced animation state manager
		const initialResult = getEnhancedFloatingHeaderStyle(animationStateManager.getState(), {
			viewportWidth: window.innerWidth,
			customMarginFactor,
			widthExpansionFactor,
		});
		headerStyle = initialResult.style;
		headerClassName = initialResult.className;

		// Initialize scroll thresholds once after DOM is ready
		const initializeThresholds = () => {
			if (!headerElement || isInitialized) return;

			// Find the main scrollable element
			const mainElement = document.querySelector('main');
			const currentScrollTop = mainElement ? mainElement.scrollTop : window.scrollY;

			// Get the original position of the header - calculate once and cache
			const rect = headerElement.getBoundingClientRect();
			const originalHeaderTop = rect.top + currentScrollTop;
			
			if (headerHeight === 0) {
				headerHeight = rect.height;
			}

			// Calculate stable scroll thresholds with hysteresis
			const mainHeaderHeight = calculateActualHeaderHeight(); // Dynamic header height calculation
			const padding = 20;
			const hysteresisBuffer = 10; // Buffer to prevent rapid switching

			cachedScrollThreshold = Math.max(originalHeaderTop - mainHeaderHeight - padding, 30);
			cachedScrollThresholdExit = Math.max(cachedScrollThreshold - hysteresisBuffer, 20);
			
			isInitialized = true;
		};

		const handleScroll = () => {
			clearTimeout(scrollTimeout);
			scrollTimeout = setTimeout(() => {
				if (!headerElement) return;

				// Initialize thresholds if not done yet
				initializeThresholds();
				
				if (!isInitialized) return;

				// Find the main scrollable element
				const mainElement = document.querySelector('main');
				const scrollTop = mainElement ? mainElement.scrollTop : window.scrollY;

				// Use hysteresis for smooth switching behavior
				const threshold = isHeaderSticky ? cachedScrollThresholdExit : cachedScrollThreshold;
				const shouldBeSticky = scrollTop > threshold;

				// Prevent rapid state changes - minimum 100ms between changes
				const now = Date.now();
				const timeSinceLastChange = now - lastStateChangeTime;
				const minStateChangeInterval = 100;

				if (shouldBeSticky !== isHeaderSticky && timeSinceLastChange >= minStateChangeInterval) {
					// Check if animation is already in progress
					const currentAnimationState = animationStateManager.getState();
					if (currentAnimationState.isTransitioning) {
						return; // Skip if already transitioning
					}

					isHeaderSticky = shouldBeSticky;
					lastStateChangeTime = now;

					// Use enhanced animation state manager for smooth transitions
					animationStateManager.setState(shouldBeSticky, (animationState) => {
						const result = getEnhancedFloatingHeaderStyle(animationState, {
							viewportWidth: window.innerWidth,
							customMarginFactor,
							widthExpansionFactor,
						});
						headerStyle = result.style;
						headerClassName = result.className;
					});
				}
			}, 16);
		};

		// Handle window resize to recalculate floating header dimensions
		const handleResize = () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				if (headerElement) {
					// Only recalculate thresholds if viewport size changed significantly
					const viewportWidthChange = Math.abs(window.innerWidth - (lastViewportWidth || window.innerWidth));
					const significantChange = viewportWidthChange > 50; // 50px threshold
					
					if (significantChange || !isInitialized) {
						// Store current viewport width
						lastViewportWidth = window.innerWidth;
						
						// Preserve current sticky state during resize
						const wasSticky = isHeaderSticky;
						
						// Reset initialization flag to recalculate thresholds after resize
						isInitialized = false;
						
						// Recalculate thresholds for new viewport size
						initializeThresholds();
						
						// Restore sticky state if it was sticky before
						if (wasSticky) {
							isHeaderSticky = true;
						}
					}
					
					// Always update styles for current sticky state with new dimensions
					if (isHeaderSticky) {
						const result = getEnhancedFloatingHeaderStyle(animationStateManager.getState(), {
							viewportWidth: window.innerWidth,
							customMarginFactor,
							widthExpansionFactor,
						});
						headerStyle = result.style;
						headerClassName = result.className;
					}
				}
			}, 250);
		};

		// Find the main scrollable element
		const mainElement = document.querySelector('main');

		// Attach to the correct scroll target
		if (mainElement) {
			mainElement.addEventListener("scroll", handleScroll);
		} else {
			window.addEventListener("scroll", handleScroll);
		}

		window.addEventListener("resize", handleResize);

		// Initial threshold setup - delayed to ensure DOM is ready
		setTimeout(() => {
			initializeThresholds();
			handleScroll();
		}, 0);

		return () => {
			if (mainElement) {
				mainElement.removeEventListener("scroll", handleScroll);
			} else {
				window.removeEventListener("scroll", handleScroll);
			}
			window.removeEventListener("resize", handleResize);
			clearTimeout(scrollTimeout);
			clearTimeout(resizeTimeout);

			// Cleanup responsive headers
			if (cleanupResponsiveHeaders) {
				cleanupResponsiveHeaders();
			}

			// Cleanup animation state manager
			animationStateManager.cleanup();
		};
	});

</script>

<!-- Placeholder to prevent content jump when header becomes sticky -->
{#if isHeaderSticky}
	<div style="height: {headerHeight}px"></div>
{/if}

<!-- Header Controls Wrapper -->
<div class="relative {elevateZIndex ? 'z-50' : ''}">
	<div bind:this={headerElement} class={headerClassName} style={headerStyle}>
		<div class="flex justify-between items-center gap-x-2 transition-all duration-300 ease-out {isHeaderSticky ? stickyContentClasses : normalContentClasses} {contentClasses}">
			{@render children?.()}
		</div>
	</div>
</div>