<script lang="ts">
	import Icon from "./Icon.svelte";
	import Button from "./Button.svelte";
	import Select from "./Select.svelte";
	import ToggleSlider from "./ToggleSlider.svelte";
	import { diffLines, diffChars, createTwoFilesPatch, type Change } from "diff";
	import { storage } from "../lib/persistence";
	import { tooltip } from "../utils/tooltip";

	// Diff modal settings
	interface DiffModalSettings {
		viewMode: 'side-by-side' | 'unified';
		wrapLines: boolean;
		ignoreSpaces: boolean;
		ignoreBlankLines: boolean;
		ignoreLeadingWS: boolean;
		ignoreTrailingWS: boolean;
		ignoreCase: boolean;
		showWhitespace: boolean;
	}

	const DEFAULT_DIFF_SETTINGS: DiffModalSettings = {
		viewMode: 'side-by-side',
		wrapLines: true,
		ignoreSpaces: false,
		ignoreBlankLines: false,
		ignoreLeadingWS: false,
		ignoreTrailingWS: false,
		ignoreCase: false,
		showWhitespace: false,
	};

	const STORAGE_PREFIX = 'diff-modal-';

	function getDiffSetting<K extends keyof DiffModalSettings>(key: K): DiffModalSettings[K] {
		return storage.getItem<DiffModalSettings[K]>(STORAGE_PREFIX + key) ?? DEFAULT_DIFF_SETTINGS[key];
	}

	function saveDiffSetting<K extends keyof DiffModalSettings>(key: K, value: DiffModalSettings[K]): void {
		storage.setItem(STORAGE_PREFIX + key, value);
	}

	function loadDiffSettings(): DiffModalSettings {
		return {
			viewMode: getDiffSetting('viewMode'),
			wrapLines: getDiffSetting('wrapLines'),
			ignoreSpaces: getDiffSetting('ignoreSpaces'),
			ignoreBlankLines: getDiffSetting('ignoreBlankLines'),
			ignoreLeadingWS: getDiffSetting('ignoreLeadingWS'),
			ignoreTrailingWS: getDiffSetting('ignoreTrailingWS'),
			ignoreCase: getDiffSetting('ignoreCase'),
			showWhitespace: getDiffSetting('showWhitespace'),
		};
	}

	interface Props {
		isVisible: boolean;
		filePath: string;
		diffOldContent: string;
		diffNewContent: string;
		isLoading: boolean;
		branchFolder: string;
		branchVersion: string;
		lastPathSegment: string;
		folderColor: string;
		onClose: () => void;
	}

	let { isVisible, filePath, diffOldContent, diffNewContent, isLoading, branchFolder, branchVersion, lastPathSegment, folderColor, onClose }: Props = $props();

	// Close modal on Escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Escape" && isVisible) {
			onClose();
		}
	}

	// Close modal when clicking outside
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	// Handle keyboard events on backdrop
	function handleBackdropKeydown(event: KeyboardEvent) {
		// Only close on Escape and only if the event originated from the backdrop itself
		if (event.target !== event.currentTarget) return;
		if (event.key === "Escape") {
			event.preventDefault();
			onClose();
		}
	}

	function copyToClipboard() {
		// Create a proper unified diff using the library's patch API
		const patch = createTwoFilesPatch(
			`${filePath} (BASE)`,
			`${filePath} (WORKING)`,
			normalizeEOL(diffOldContent ?? ""),
			normalizeEOL(diffNewContent ?? ""),
			"", // old header
			"", // new header
			{
				context: 3,
				ignoreWhitespace: ignoreSpaces,
			}
		);

		navigator.clipboard.writeText(patch).catch((err) => {
			console.error("Failed to copy diff to clipboard:", err);
		});
	}

	const pathComponentsCache = new Map<string, PathComponents>();
	const displayResultCache = new Map<string, { displayPath: string; fullPath: string }>();

	interface PathComponents {
		parts: string[];
		filename: string;
		extension: string;
		nameWithoutExt: string;
		parentDir: string;
		grandParentDir: string;
		contextPath2: string;
		contextPath3: string;
	}

	function parsePathComponents(path: string): PathComponents {
		if (pathComponentsCache.has(path)) {
			return pathComponentsCache.get(path)!;
		}

		const parts = path.split(/[\/\\]/);
		const filename = parts[parts.length - 1] || "";
		const extension = filename.includes(".") ? filename.substring(filename.lastIndexOf(".")) : "";
		const nameWithoutExt = extension ? filename.substring(0, filename.lastIndexOf(".")) : filename;
		const parentDir = parts.length > 1 ? parts[parts.length - 2] || "" : "";
		const grandParentDir = parts.length > 2 ? parts[parts.length - 3] || "" : "";

		const contextPath2 = parentDir ? `${parentDir}/${filename}` : filename;
		const contextPath3 = grandParentDir && parentDir ? `${grandParentDir}/${parentDir}/${filename}` : contextPath2;

		const components: PathComponents = {
			parts,
			filename,
			extension,
			nameWithoutExt,
			parentDir,
			grandParentDir,
			contextPath2,
			contextPath3,
		};

		if (pathComponentsCache.size > 100) {
			const firstKey = pathComponentsCache.keys().next().value;
			if (firstKey) pathComponentsCache.delete(firstKey);
		}
		pathComponentsCache.set(path, components);

		return components;
	}

	type BreakpointKey = "xl" | "lg" | "md" | "sm";

	function getBreakpoint(screenWidth: number): BreakpointKey {
		if (screenWidth > 1600) return "xl";
		if (screenWidth > 1200) return "lg";
		if (screenWidth > 800) return "md";
		return "sm";
	}

	function truncateMiddle(text: string, maxLength: number): string {
		if (text.length <= maxLength) return text;
		const start = Math.floor((maxLength - 3) / 2);
		const end = text.length - (maxLength - 3 - start);
		return text.substring(0, start) + "..." + text.substring(end);
	}

	function truncateFilename(nameWithoutExt: string, extension: string, maxLength: number): string {
		const totalExtLength = extension.length;
		const availableForName = maxLength - totalExtLength - 3;

		if (availableForName <= 0) return extension;
		if (nameWithoutExt.length <= availableForName) return nameWithoutExt + extension;

		return nameWithoutExt.substring(0, availableForName) + "..." + extension;
	}

	const displayStrategies = {
		xl: (components: PathComponents): string => {
			const display = components.contextPath3;
			return display.length > 80 ? truncateMiddle(display, 80) : display;
		},
		lg: (components: PathComponents): string => {
			const display = components.contextPath2;
			return display.length > 60 ? `.../${components.filename}` : display;
		},
		md: (components: PathComponents): string => {
			const { filename, nameWithoutExt, extension } = components;
			return filename.length > 45 ? truncateFilename(nameWithoutExt, extension, 45) : filename;
		},
		sm: (components: PathComponents): string => {
			const { filename, nameWithoutExt, extension } = components;
			return filename.length > 25 ? truncateFilename(nameWithoutExt, extension, 25) : filename;
		},
	};

	function formatFilePath(path: string, screenWidth: number = 1200): { displayPath: string; fullPath: string } {
		const effectiveWidth = screenWidth || 1200;
		const cacheKey = `${path}:${effectiveWidth}`;

		if (displayResultCache.has(cacheKey)) {
			return displayResultCache.get(cacheKey)!;
		}

		const components = parsePathComponents(path);
		const breakpoint = getBreakpoint(effectiveWidth);
		const displayPath = displayStrategies[breakpoint](components);
		const result = { displayPath, fullPath: path };

		if (displayResultCache.size > 200) {
			const firstKey = displayResultCache.keys().next().value;
			if (firstKey) displayResultCache.delete(firstKey);
		}
		displayResultCache.set(cacheKey, result);

		return result;
	}

	let screenWidth = $state(0);
	let resizeTimeoutId: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (typeof window !== "undefined") {
			screenWidth = window.innerWidth;

			const handleResize = () => {
				if (resizeTimeoutId) {
					clearTimeout(resizeTimeoutId);
				}
				resizeTimeoutId = setTimeout(() => {
					requestAnimationFrame(() => {
						screenWidth = window.innerWidth;
					});
				}, 150);
			};

			window.addEventListener("resize", handleResize, { passive: true });

			return () => {
				if (resizeTimeoutId) {
					clearTimeout(resizeTimeoutId);
				}
				window.removeEventListener("resize", handleResize);
			};
		}
		return () => {};
	});

	let formattedPath = $derived.by(() => {
		if (!filePath) {
			return { displayPath: "", fullPath: "" };
		}
		return formatFilePath(filePath, screenWidth);
	});

	$effect(() => {
		return () => {
			pathComponentsCache.clear();
			displayResultCache.clear();
		};
	});

	let modalClasses = $derived.by(() => {
		if (screenWidth > 1600) {
			return "w-full max-w-[90vw] h-full max-h-[92vh] min-w-[85vw] min-h-[85vh]";
		} else if (screenWidth > 1200) {
			return "w-full max-w-[95vw] h-full max-h-[95vh] min-w-[80vw] min-h-[80vh]";
		} else if (screenWidth > 800) {
			return "w-full max-w-[98vw] h-full max-h-[96vh] min-w-[75vw] min-h-[75vh]";
		} else {
			return "w-full max-w-[100vw] h-full max-h-[100vh] min-w-[95vw] min-h-[90vh]";
		}
	});

	// Load initial settings from localStorage
	const initialSettings = loadDiffSettings();

	let viewMode = $state<"side-by-side" | "unified">(initialSettings.viewMode);
	let wrapLines = $state(initialSettings.wrapLines);
	let ignoreSpaces = $state(initialSettings.ignoreSpaces);
	let ignoreBlankLines = $state(initialSettings.ignoreBlankLines);
	let ignoreLeadingWS = $state(initialSettings.ignoreLeadingWS);
	let ignoreTrailingWS = $state(initialSettings.ignoreTrailingWS);
	let ignoreCase = $state(initialSettings.ignoreCase);
	let showWhitespace = $state(initialSettings.showWhitespace);

	// Folding controls
	let foldUnchanged = $state(true);
	let contextLinesAroundChange = $state(3); // local context around hunks
	const MIN_FOLD_SIZE = 6; // don't fold tiny gaps

	// Per-view expansion state so SxS / Unified don't fight
	let expandedSbs = $state<Set<number>>(new Set());
	let expandedUnified = $state<Set<number>>(new Set());

	// Save settings to localStorage when they change
	$effect(() => {
		saveDiffSetting("viewMode", viewMode);
	});

	$effect(() => {
		saveDiffSetting("wrapLines", wrapLines);
	});

	$effect(() => {
		saveDiffSetting("ignoreSpaces", ignoreSpaces);
	});

	$effect(() => {
		saveDiffSetting("ignoreBlankLines", ignoreBlankLines);
	});

	$effect(() => {
		saveDiffSetting("ignoreLeadingWS", ignoreLeadingWS);
	});

	$effect(() => {
		saveDiffSetting("ignoreTrailingWS", ignoreTrailingWS);
	});

	$effect(() => {
		saveDiffSetting("ignoreCase", ignoreCase);
	});

	$effect(() => {
		saveDiffSetting("showWhitespace", showWhitespace);
	});

	// Reset expansions when knobs change
	$effect(() => {
		expandedSbs = new Set();
		expandedUnified = new Set();
	});

	let leftPaneRef = $state<HTMLDivElement>();
	let rightPaneRef = $state<HTMLDivElement>();
	let closeButtonRef = $state<any>();

	// Focus management for modal accessibility
	$effect(() => {
		if (isVisible && closeButtonRef) {
			// Focus the close button when modal opens for better accessibility
			closeButtonRef.focus?.();
		}
	});

	// Improved scroll synchronization with RAF and better state tracking
	let scrollSyncRAF: number | null = null;
	let activeScrollSource: 'left' | 'right' | null = null;
	let scrollSyncTimeout: ReturnType<typeof setTimeout> | null = null;

	function syncScroll(source: HTMLDivElement, target: HTMLDivElement, sourceSide: 'left' | 'right') {
		// Don't cancel existing RAF - let it complete for smoother sync
		if (scrollSyncRAF !== null) {
			return; // Skip if sync is already scheduled
		}

		// Clear any existing timeout
		if (scrollSyncTimeout !== null) {
			clearTimeout(scrollSyncTimeout);
		}

		// Set the active source to prevent feedback loops
		activeScrollSource = sourceSide;

		// Use RAF for smooth synchronization
		scrollSyncRAF = requestAnimationFrame(() => {
			if (!source || !target) {
				scrollSyncRAF = null;
				return;
			}

			// Sync both vertical and horizontal scroll positions atomically
			const targetTop = source.scrollTop;
			const targetLeft = source.scrollLeft;

			// Update both positions together to ensure consistent sync
			if (target.scrollTop !== targetTop) {
				target.scrollTop = targetTop;
			}
			if (target.scrollLeft !== targetLeft) {
				target.scrollLeft = targetLeft;
			}

			scrollSyncRAF = null;

			// Reset active source after a short delay to allow for momentum scrolling
			scrollSyncTimeout = setTimeout(() => {
				activeScrollSource = null;
			}, 100);
		});
	}

	// Improved scroll handlers with source tracking
	function handleLeftPaneScroll() {
		// Only sync if this pane initiated the scroll
		if (activeScrollSource === 'right') return;
		if (leftPaneRef && rightPaneRef) {
			syncScroll(leftPaneRef, rightPaneRef, 'left');
		}
	}

	function handleRightPaneScroll() {
		// Only sync if this pane initiated the scroll
		if (activeScrollSource === 'left') return;
		if (rightPaneRef && leftPaneRef) {
			syncScroll(rightPaneRef, leftPaneRef, 'right');
		}
	}

	// Cleanup on unmount
	$effect(() => {
		return () => {
			if (scrollSyncRAF !== null) {
				cancelAnimationFrame(scrollSyncRAF);
			}
			if (scrollSyncTimeout !== null) {
				clearTimeout(scrollSyncTimeout);
			}
		};
	});

	// Check if any filters are currently active
	function hasActiveFilters(): boolean {
		return ignoreSpaces || ignoreBlankLines || ignoreLeadingWS || ignoreTrailingWS || ignoreCase;
	}

	// Apply normalization to text for comparison purposes only (does not modify display)
	function normalizeForComparison(text: string): string {
		if (!text) return text;

		let result = text;

		// Apply case normalization
		if (ignoreCase) {
			result = result.toLowerCase();
		}

		// Apply leading whitespace normalization
		if (ignoreLeadingWS) {
			result = result
				.split("\n")
				.map((line) => line.replace(/^\s+/, ""))
				.join("\n");
		}

		// Apply trailing whitespace normalization
		if (ignoreTrailingWS) {
			result = result
				.split("\n")
				.map((line) => line.replace(/\s+$/, ""))
				.join("\n");
		}

		// Apply internal space normalization
		if (ignoreSpaces) {
			result = result
				.split("\n")
				.map((line) => line.replace(/\s+/g, " "))
				.join("\n");
		}

		// Apply blank line filtering
		if (ignoreBlankLines && result.trim() === "") {
			return ""; // Treat blank lines as empty for comparison
		}

		return result;
	}

	// Determine if a difference should be ignored based on active filters
	function shouldIgnoreDifference(oldText: string, newText: string): boolean {
		if (!hasActiveFilters()) return false;

		// Special case for blank lines
		if (ignoreBlankLines) {
			const oldIsBlank = oldText.trim() === "";
			const newIsBlank = newText.trim() === "";
			// If one is blank and we're ignoring blank lines, consider them the same
			if (oldIsBlank || newIsBlank) {
				return true;
			}
		}

		// Apply filters to copies for comparison only
		const normalizedOld = normalizeForComparison(oldText);
		const normalizedNew = normalizeForComparison(newText);

		// If normalized versions are identical, ignore the difference
		return normalizedOld === normalizedNew;
	}

	// Determine if a single-sided change (pure add or remove) should be ignored
	function isIgnorableSingleSide(line: string): boolean {
		if (!hasActiveFilters()) return false;

		if (ignoreBlankLines && line.trim() === "") return true;
		if (ignoreSpaces || ignoreLeadingWS || ignoreTrailingWS || ignoreCase) {
			return normalizeForComparison(line) === ""; // whitespace-only after normalization
		}
		return false;
	}

	// Normalize line endings to prevent fake diffs across platforms
	const normalizeEOL = (s: string) => (s ?? "").replace(/\r\n/g, "\n");

	function escapeHtml(text: string): string {
		const div = document.createElement("div");
		div.textContent = text;
		return div.innerHTML;
	}

	function visualizeWhitespace(text: string): string {
		if (!showWhitespace) return text;

		return text
			.replace(/ /g, '<span class="text-gray-400 dark:text-gray-500">·</span>') // Replace spaces with middle dot
			.replace(/\t/g, '<span class="text-gray-400 dark:text-gray-500">→</span>') // Replace tabs with right arrow
			.replace(/\r?\n/g, '<span class="text-gray-400 dark:text-gray-500">¶</span>\n'); // Replace line endings with pilcrow
	}

	function processTextForDisplay(text: string): string {
		// First escape HTML to prevent injection
		const escaped = escapeHtml(text);
		// Then apply whitespace visualization if enabled
		return visualizeWhitespace(escaped);
	}

	type Segment = { start: number; end: number; type: "expanded" | "fold" };

	/** Merge overlapping [start,end] windows */
	function mergeWindows(windows: Segment[]): Segment[] {
		if (!windows.length) return [];
		windows.sort((a, b) => a.start - b.start);
		const out: Segment[] = [];
		const firstWindow = windows[0];
		if (!firstWindow) return [];
		let cur: Segment = { start: firstWindow.start, end: firstWindow.end, type: firstWindow.type };
		for (let i = 1; i < windows.length; i++) {
			const w = windows[i];
			if (!w) continue;
			if (w.start <= cur.end + 1) {
				cur = { ...cur, end: Math.max(cur.end, w.end) };
			} else {
				out.push(cur);
				cur = { start: w.start, end: w.end, type: w.type };
			}
		}
		out.push(cur);
		return out;
	}

	/** Compute expanded/fold segments for a file of N rows, given change indices */
	function computeSegments(totalRows: number, changeIdxs: number[]): Segment[] {
		if (!foldUnchanged || totalRows === 0) return [{ start: 0, end: totalRows - 1, type: "expanded" }];
		if (changeIdxs.length === 0) return [{ start: 0, end: totalRows - 1, type: "expanded" }];

		const win = changeIdxs.map((i) => ({
			start: Math.max(0, i - contextLinesAroundChange),
			end: Math.min(totalRows - 1, i + contextLinesAroundChange),
			type: "expanded" as const,
		}));
		const merged = mergeWindows(win);

		const segs: Segment[] = [];
		let cur = 0;
		for (const w of merged) {
			if (cur < w.start) segs.push({ start: cur, end: w.start - 1, type: "fold" });
			segs.push({ start: w.start, end: w.end, type: "expanded" });
			cur = w.end + 1;
		}
		if (cur <= totalRows - 1) segs.push({ start: cur, end: totalRows - 1, type: "fold" });

		// Don't bother folding tiny gaps
		for (const s of segs) {
			if (s.type === "fold" && s.end - s.start + 1 < MIN_FOLD_SIZE) s.type = "expanded";
		}
		return segs;
	}

	type FoldRow = {
		type: "fold";
		segIndex: number;
		// Useful metadata for the banner
		count: number;
		leftStart?: number | null;
		leftEnd?: number | null;
		rightStart?: number | null;
		rightEnd?: number | null;
		oldStart?: number | null;
		oldEnd?: number | null;
		newStart?: number | null;
		newEnd?: number | null;
	};

	// Build "visible" rows for side-by-side, preserving alignment
	function buildVisibleSbs(left: any[], right: any[], expanded: Set<number>) {
		const n = Math.max(left.length, right.length);
		const changeIdxs: number[] = [];
		for (let i = 0; i < n; i++) {
			const L = left[i];
			const R = right[i];
			if (!L || !R) {
				changeIdxs.push(i);
				continue;
			}
			if (L.type !== "context" || R.type !== "context") changeIdxs.push(i);
		}
		const segs = computeSegments(n, changeIdxs);

		const leftVisible: (any | FoldRow)[] = [];
		const rightVisible: (any | FoldRow)[] = [];

		segs.forEach((seg, segIndex) => {
			const isExpanded = seg.type === "expanded" || expanded.has(segIndex);
			if (isExpanded) {
				for (let i = seg.start; i <= seg.end; i++) {
					leftVisible.push(left[i] ?? { content: "", lineNum: null, type: "context" });
					rightVisible.push(right[i] ?? { content: "", lineNum: null, type: "context" });
				}
			} else {
				const lStart = left[seg.start]?.lineNum ?? null;
				const lEnd = left[seg.end]?.lineNum ?? null;
				const rStart = right[seg.start]?.lineNum ?? null;
				const rEnd = right[seg.end]?.lineNum ?? null;
				const foldRow: FoldRow = {
					type: "fold",
					segIndex,
					count: seg.end - seg.start + 1,
					leftStart: lStart,
					leftEnd: lEnd,
					rightStart: rStart,
					rightEnd: rEnd,
				};
				leftVisible.push(foldRow);
				rightVisible.push(foldRow);
			}
		});

		return { leftVisible, rightVisible, segments: segs };
	}

	// Build "visible" rows for unified
	function buildVisibleUnified(lines: any[], expanded: Set<number>) {
		const n = lines.length;
		const changeIdxs: number[] = [];
		for (let i = 0; i < n; i++) {
			const t = lines[i]?.type;
			// treat added/removed as changes; always keep headers/files visible
			if (t === "added" || t === "removed" || t === "file" || t === "header") changeIdxs.push(i);
		}
		const segs = computeSegments(n, changeIdxs);
		const visible: (any | FoldRow)[] = [];

		segs.forEach((seg, segIndex) => {
			const isExpanded = seg.type === "expanded" || expanded.has(segIndex);
			if (isExpanded) {
				for (let i = seg.start; i <= seg.end; i++) visible.push(lines[i]);
			} else {
				const oldStart = lines[seg.start]?.oldLineNum ?? null;
				const oldEnd = lines[seg.end]?.oldLineNum ?? null;
				const newStart = lines[seg.start]?.newLineNum ?? null;
				const newEnd = lines[seg.end]?.newLineNum ?? null;
				visible.push({
					type: "fold",
					segIndex,
					count: seg.end - seg.start + 1,
					oldStart,
					oldEnd,
					newStart,
					newEnd,
				} as FoldRow);
			}
		});

		return { visible, segments: segs };
	}

	// Check if this is a new file (no old content) or deleted file (no new content)
	let isNewFile = $derived.by(() => {
		return diffOldContent === "" && diffNewContent !== "";
	});

	let parsedDiff = $derived.by(() => {
		if (!diffOldContent && !diffNewContent) return { leftLines: [], rightLines: [], fileName: "", stats: { leftTotalLines: 0, rightTotalLines: 0, additions: 0, deletions: 0, modifications: 0 } };

		// Use jsdiff with built-in options where available
		const lineDiffOptions = {
			ignoreWhitespace: ignoreSpaces,
			// Note: ignoreCase is not supported by diffLines, we'll handle it in post-processing
		};

		const lineDiffs = diffLines(normalizeEOL(diffOldContent || ""), normalizeEOL(diffNewContent || ""), lineDiffOptions);

		const leftLines: Array<{ content: string; lineNum: number | null; type: "normal" | "removed" | "context"; highlightedContent?: string }> = [];
		const rightLines: Array<{ content: string; lineNum: number | null; type: "normal" | "added" | "context"; highlightedContent?: string }> = [];

		let leftLineNum = 1;
		let rightLineNum = 1;
		let additions = 0;
		let deletions = 0;
		let modifications = 0;

		// Process diffs with proper pairing of removed/added blocks
		for (let i = 0; i < lineDiffs.length; i++) {
			const change = lineDiffs[i];
			if (!change) continue;
			const lines = change.value.split("\n");
			// Remove last empty line if it exists (from split)
			if (lines[lines.length - 1] === "") {
				lines.pop();
			}

			// Check if this is a removal followed by an addition (modification)
			if (change.removed && i + 1 < lineDiffs.length && lineDiffs[i + 1]?.added) {
				const addedChange = lineDiffs[i + 1];
				if (!addedChange) continue;
				const addedLines = addedChange.value.split("\n");
				if (addedLines[addedLines.length - 1] === "") {
					addedLines.pop();
				}

				// Pair the lines from both sides
				const maxLines = Math.max(lines.length, addedLines.length);
				for (let j = 0; j < maxLines; j++) {
					const removedLine = lines[j] ?? "";
					const addedLine = addedLines[j] ?? "";

					// Check if we should ignore this difference
					const shouldIgnore = hasActiveFilters() && shouldIgnoreDifference(removedLine, addedLine);

					if (removedLine) {
						leftLines.push({
							content: removedLine,
							lineNum: leftLineNum++,
							type: shouldIgnore ? "context" : "removed",
						});
					} else {
						leftLines.push({
							content: "",
							lineNum: null,
							type: "context",
						});
					}

					if (addedLine) {
						rightLines.push({
							content: addedLine,
							lineNum: rightLineNum++,
							type: shouldIgnore ? "context" : "added",
						});
					} else {
						rightLines.push({
							content: "",
							lineNum: null,
							type: "context",
						});
					}

					if (!shouldIgnore) {
						if (removedLine && addedLine) {
							modifications++;
						} else if (removedLine) {
							deletions++;
						} else if (addedLine) {
							additions++;
						}
					}
				}

				// Skip the next change since we've already processed it
				i++;
			} else if (change.removed) {
				// Pure removal
				lines.forEach((line) => {
					const ign = isIgnorableSingleSide(line);
					leftLines.push({
						content: line,
						lineNum: leftLineNum++,
						type: ign ? "context" : "removed",
					});
					rightLines.push({
						content: "",
						lineNum: null,
						type: "context",
					});
					if (!ign) deletions++;
				});
			} else if (change.added) {
				// Pure addition
				lines.forEach((line) => {
					const ign = isIgnorableSingleSide(line);
					leftLines.push({
						content: "",
						lineNum: null,
						type: "context",
					});
					rightLines.push({
						content: line,
						lineNum: rightLineNum++,
						type: ign ? "context" : "added",
					});
					if (!ign) additions++;
				});
			} else {
				// Unchanged lines
				lines.forEach((line) => {
					leftLines.push({
						content: line,
						lineNum: leftLineNum++,
						type: "context",
					});
					rightLines.push({
						content: line,
						lineNum: rightLineNum++,
						type: "context",
					});
				});
			}
		}

		// Character-level highlighting for paired modified lines
		for (let i = 0; i < leftLines.length; i++) {
			const leftLine = leftLines[i];
			const rightLine = rightLines[i];

			if (leftLine && rightLine && leftLine.type === "removed" && rightLine.type === "added" && leftLine.content && rightLine.content) {
				// Apply character-level diff on original content
				const charOptions = { ignoreCase: ignoreCase };
				const charDiff = diffChars(leftLine.content, rightLine.content, charOptions);

				leftLine.highlightedContent = applyCharDiffHighlights(charDiff, "removed");
				rightLine.highlightedContent = applyCharDiffHighlights(charDiff, "added");
			}
		}

		const leftTotalLines = Math.max(0, leftLineNum - 1);
		const rightTotalLines = Math.max(0, rightLineNum - 1);

		// Add end-of-file markers
		if (leftTotalLines > 0 || rightTotalLines > 0) {
			leftLines.push({
				content: `End of file (${leftTotalLines} lines)`,
				lineNum: null,
				type: "context",
			});
			rightLines.push({
				content: `End of file (${rightTotalLines} lines)`,
				lineNum: null,
				type: "context",
			});
		}

		// Ensure both sides have the same number of rows
		const maxRows = Math.max(leftLines.length, rightLines.length);
		while (leftLines.length < maxRows) {
			leftLines.push({ content: "", lineNum: null, type: "context" });
		}
		while (rightLines.length < maxRows) {
			rightLines.push({ content: "", lineNum: null, type: "context" });
		}

		const stats = {
			leftTotalLines,
			rightTotalLines,
			additions,
			deletions,
			modifications,
		};

		return { leftLines, rightLines, fileName: filePath, stats };
	});

	// Helper function to apply character-level highlighting on original content
	function applyCharDiffHighlights(charDiff: Change[], mode: "removed" | "added"): string {
		let result = "";

		charDiff.forEach((change: Change) => {
			const content = processTextForDisplay(change.value);

			if (change.removed && mode === "removed") {
				result += `<span class="bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200">${content}</span>`;
			} else if (change.added && mode === "added") {
				result += `<span class="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200">${content}</span>`;
			} else if (!change.removed && !change.added) {
				result += content;
			}
		});

		return result;
	}

	let unifiedDiff = $derived.by(() => {
		if (!diffOldContent && !diffNewContent) return { lines: [], maxOldLineNumWidth: 0, maxNewLineNumWidth: 0 };

		// Use jsdiff with built-in options for unified view
		const lineDiffOptions = {
			ignoreWhitespace: ignoreSpaces,
		};

		const lineDiffs = diffLines(normalizeEOL(diffOldContent || ""), normalizeEOL(diffNewContent || ""), lineDiffOptions);
		const processedLines: Array<{ content: string; type: string; highlightedContent?: string; oldLineNum: number | null; newLineNum: number | null }> = [];

		let oldLineNum = 1;
		let newLineNum = 1;

		// Add file headers
		processedLines.push({
			content: `--- ${filePath} (BASE)`,
			type: "file",
			oldLineNum: null,
			newLineNum: null,
		});
		processedLines.push({
			content: `+++ ${filePath} (WORKING)`,
			type: "file",
			oldLineNum: null,
			newLineNum: null,
		});

		// Process diffs - unified view shows removals then additions (not paired)
		for (let i = 0; i < lineDiffs.length; i++) {
			const change = lineDiffs[i];
			if (!change) continue;
			const lines = change.value.split("\n");
			// Remove last empty line if it exists (from split)
			if (lines[lines.length - 1] === "") {
				lines.pop();
			}

			lines.forEach((line) => {
				if (change.removed) {
					// Line was removed
					processedLines.push({
						content: `-${line}`,
						type: "removed",
						oldLineNum: oldLineNum++,
						newLineNum: null,
					});
				} else if (change.added) {
					// Line was added
					processedLines.push({
						content: `+${line}`,
						type: "added",
						oldLineNum: null,
						newLineNum: newLineNum++,
					});
				} else {
					// Unchanged line
					processedLines.push({
						content: ` ${line}`,
						type: "context",
						oldLineNum: oldLineNum++,
						newLineNum: newLineNum++,
					});
				}
			});
		}

		// Add end-of-file marker
		if (parsedDiff.stats && (parsedDiff.stats.leftTotalLines > 0 || parsedDiff.stats.rightTotalLines > 0)) {
			processedLines.push({
				content: `End of file (${parsedDiff.stats.leftTotalLines} → ${parsedDiff.stats.rightTotalLines} lines)`,
				type: "normal",
				oldLineNum: null,
				newLineNum: null,
			});
		}

		// Calculate maximum line number widths for consistent alignment
		let maxOldLineNum = Math.max(0, oldLineNum - 1);
		let maxNewLineNum = Math.max(0, newLineNum - 1);

		const maxOldLineNumWidth = maxOldLineNum > 0 ? maxOldLineNum.toString().length : 1;
		const maxNewLineNumWidth = maxNewLineNum > 0 ? maxNewLineNum.toString().length : 1;

		return {
			lines: processedLines,
			maxOldLineNumWidth,
			maxNewLineNumWidth,
		};
	});

	// Side-by-side, fold-aware rows
	let sbsView = $derived.by(() => {
		const v = buildVisibleSbs(parsedDiff.leftLines ?? [], parsedDiff.rightLines ?? [], expandedSbs);
		return v;
	});

	// Unified, fold-aware rows
	let unifiedView = $derived.by(() => {
		const v = buildVisibleUnified(unifiedDiff.lines ?? [], expandedUnified);
		return v;
	});

	// Expand/collapse helpers
	function expandSbsSegment(i: number) {
		const s = new Set(expandedSbs);
		s.add(i);
		expandedSbs = s;
	}
	function collapseAllSbs() {
		expandedSbs = new Set();
	}
	function expandAllSbs() {
		expandedSbs = new Set(sbsView.segments.map((_, i) => i));
	}

	function expandUnifiedSegment(i: number) {
		const s = new Set(expandedUnified);
		s.add(i);
		expandedUnified = s;
	}
	function collapseAllUnified() {
		expandedUnified = new Set();
	}
	function expandAllUnified() {
		expandedUnified = new Set(unifiedView.segments.map((_, i) => i));
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isVisible}
	<div class="fixed inset-0 bg-gray-900/20 dark:bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50" onclick={handleBackdropClick} onkeydown={handleBackdropKeydown} role="dialog" aria-modal="true" aria-labelledby="diff-modal-title" tabindex="-1">
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl {modalClasses} flex flex-col max-h-[92vh] overflow-hidden">
			<!-- Header - Main Row -->
			<div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
				<!-- Left Section: Title + Branch + File -->
				<div class="flex items-center space-x-5 min-w-0 flex-1">
					<!-- Title -->
					<div class="flex items-center space-x-3 flex-shrink-0">
						<Icon name={isNewFile ? "plus" : "diff"} size={20} class="text-blue-600 dark:text-blue-400" />
						<h2 id="diff-modal-title" class="text-base font-medium text-gray-900 dark:text-gray-100" aria-label={isNewFile ? "Viewing new file content" : "Viewing file differences"}>{isNewFile ? "New File" : "File Diff"}</h2>
					</div>

					<!-- Branch Info -->
					<div class="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
						<div class="w-2 h-2 rounded-full" style="background-color: {folderColor}"></div>
						<span class="font-medium text-gray-900 dark:text-gray-100">{branchFolder}</span>
						<span class="text-gray-600 dark:text-gray-300">{branchVersion}</span>
						<span class="text-gray-400 dark:text-gray-500 text-xs">{lastPathSegment}</span>
					</div>

					<!-- File Info -->
					<div class="flex items-center space-x-2 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg px-3 py-2 text-sm min-w-0 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors" title={formattedPath.fullPath}>
						<Icon name="file" size={16} class="text-gray-500 dark:text-gray-400 flex-shrink-0" />
						<span class="font-mono text-gray-700 dark:text-gray-200 truncate">{formattedPath.displayPath}</span>
					</div>
				</div>

				<!-- Right Section: Controls -->
				<div class="flex items-center space-x-3 flex-shrink-0">
					{#if diffOldContent || diffNewContent}
						<!-- View mode toggle -->
						<ToggleSlider
							value={viewMode}
							options={[
								{ value: "side-by-side", label: "Side by Side" },
								{ value: "unified", label: "Unified" },
							]}
							onchange={(value) => (viewMode = value as "side-by-side" | "unified")}
						/>
						<Button variant="secondary" class="text-sm bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500" onclick={copyToClipboard} tooltip="Copy diff to clipboard">Copy</Button>
					{/if}
					<Button bind:this={closeButtonRef} variant="ghost" iconOnly="close" iconSize={20} class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onclick={onClose} title="Close diff viewer" aria-label="Close diff viewer" />
				</div>
			</div>

			<!-- Header - Options Rows -->
			<div class="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
				<!-- Row 1: Display Options + Statistics -->
				<div class="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-600">
					<div class="flex items-center space-x-6">
						<div class="flex items-center space-x-4">
							<span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Display</span>
							<label class="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
								<input type="checkbox" bind:checked={wrapLines} class="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
								<span>Wrap lines</span>
							</label>
							<label class="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
								<input type="checkbox" bind:checked={showWhitespace} class="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
								<span>Show whitespace</span>
							</label>
							<label class="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
								<input type="checkbox" bind:checked={foldUnchanged} class="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
								<span>Fold unchanged</span>
							</label>
							<div class="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
								<span use:tooltip={"Number of unchanged lines to show around changes"}>Context</span>
								<Select
									bind:value={contextLinesAroundChange}
									options={[
										{ value: 2, label: "2 lines" },
										{ value: 3, label: "3 lines" },
										{ value: 5, label: "5 lines" },
										{ value: 10, label: "10 lines" },
									]}
									class="text-xs w-24"
								/>
							</div>
							{#if foldUnchanged}
								<Button variant="minimal" leftIcon="chevronDoubleDown" class="text-xs" onclick={viewMode === "side-by-side" ? expandAllSbs : expandAllUnified}>Expand all</Button>
								<Button variant="minimal" leftIcon="chevronDoubleUp" class="text-xs" onclick={viewMode === "side-by-side" ? collapseAllSbs : collapseAllUnified}>Collapse all</Button>
							{/if}
						</div>
					</div>

					{#if (diffOldContent || diffNewContent) && parsedDiff.stats}
						<div class="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
							<!-- File statistics -->
							<div class="flex items-center space-x-2">
								<span class="font-medium">Lines:</span>
								<span>{parsedDiff.stats.leftTotalLines} → {parsedDiff.stats.rightTotalLines}</span>
							</div>

							{#if parsedDiff.stats.additions > 0 || parsedDiff.stats.deletions > 0}
								<div class="flex items-center space-x-2">
									{#if parsedDiff.stats.additions > 0}
										<span class="text-green-600 dark:text-green-400 font-medium">+{parsedDiff.stats.additions}</span>
									{/if}
									{#if parsedDiff.stats.deletions > 0}
										<span class="text-red-600 dark:text-red-400 font-medium">-{parsedDiff.stats.deletions}</span>
									{/if}
								</div>
							{/if}

							{#if parsedDiff.stats.modifications > 0}
								<div class="text-blue-600 dark:text-blue-400 font-medium">
									~{parsedDiff.stats.modifications} modified
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Row 2: Filter Options -->
				<div class="flex items-center px-6 py-3">
					<div class="flex items-center space-x-6 w-full">
						<span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex-shrink-0">Ignore</span>
						<div class="flex items-center flex-wrap gap-x-4 gap-y-2">
							<label class="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
								<input type="checkbox" bind:checked={ignoreSpaces} class="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
								<span>Spaces</span>
							</label>
							<label class="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
								<input type="checkbox" bind:checked={ignoreBlankLines} class="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
								<span>Blank lines</span>
							</label>
							<label class="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
								<input type="checkbox" bind:checked={ignoreLeadingWS} class="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
								<span class="hidden sm:inline">Leading whitespace</span>
								<span class="sm:hidden">Leading WS</span>
							</label>
							<label class="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
								<input type="checkbox" bind:checked={ignoreTrailingWS} class="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
								<span class="hidden sm:inline">Trailing whitespace</span>
								<span class="sm:hidden">Trailing WS</span>
							</label>
							<label class="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
								<input type="checkbox" bind:checked={ignoreCase} class="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
								<span>Case</span>
							</label>
						</div>
					</div>
				</div>
			</div>

			<!-- Content -->
			<div class="flex-1 flex flex-col min-h-0 overflow-hidden">
				{#if isLoading}
					<div class="flex items-center justify-center h-full">
						<div class="text-center">
							<div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
							<p class="text-gray-600 dark:text-gray-300">Loading diff...</p>
						</div>
					</div>
				{:else if diffOldContent || diffNewContent}
					{#if viewMode === "side-by-side"}
						<!-- Side-by-side view -->
						<!-- Fixed Headers -->
						<div class="flex border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
							<!-- Left header -->
							<div class="w-1/2 border-r border-gray-300 dark:border-gray-600">
								<div class="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-3">
									<h3 class="text-sm font-semibold text-red-800 dark:text-red-200 flex items-center" aria-label={isNewFile ? "File does not exist in repository" : "Original version to be removed"}>
										{#if isNewFile}
											<Icon name="file" size={16} class="mr-2" />
											<span title="This file is not yet in the repository">Nonexistent</span>
										{:else}
											<Icon name="x" size={16} class="mr-2" />
											Original (Removed)
										{/if}
									</h3>
								</div>
							</div>
							<!-- Right header -->
							<div class="w-1/2">
								<div class="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-4 py-3">
									<h3 class="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center" aria-label={isNewFile ? "New file content to be added" : "Modified content to be added"}>
										{#if isNewFile}
											<Icon name="plus" size={16} class="mr-2" />
											<span title="This is a new file being added to the repository">New File</span>
										{:else}
											<Icon name="plus" size={16} class="mr-2" />
											Modified (Added)
										{/if}
									</h3>
								</div>
							</div>
						</div>

						<!-- Scrollable Content -->
						<div class="flex flex-1 min-h-0 max-h-full overflow-hidden">
							<!-- Left content -->
							<div bind:this={leftPaneRef} class="diff-pane-left w-1/2 border-r border-gray-300 dark:border-gray-600 overflow-y-scroll {wrapLines ? 'overflow-x-hidden' : 'overflow-x-scroll'} max-h-full" onscroll={handleLeftPaneScroll}>
								<table class="w-full {wrapLines ? '' : 'min-w-max'}">
									<tbody class="text-sm font-mono">
										{#each sbsView.leftVisible as line}
											{#if (line as any).type === "fold"}
												<tr class="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
													<td class="w-12 px-2 py-0.5 text-xs text-gray-400 dark:text-gray-500 border-r border-gray-300 dark:border-gray-600 text-right select-none font-mono bg-gray-50 dark:bg-gray-800">…</td>
													<td class="px-3 py-1 text-gray-600 dark:text-gray-300 italic relative">
														<div class="flex items-center">
															<span class="pr-24">⟪ {(line as any).leftStart ?? "…"}–{(line as any).leftEnd ?? "…"} ⟫ · {(line as any).count} unchanged lines hidden</span>
															<div class="sticky-expand-button">
																<Button variant="minimal" leftIcon="chevronDown" class="text-xs" onclick={() => expandSbsSegment((line as any).segIndex)}>Expand</Button>
															</div>
														</div>
													</td>
												</tr>
											{:else}
												<tr
													class={line.type === "removed" ? "bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500" : line.content?.startsWith("End of file") ? "bg-gray-100 dark:bg-gray-700 border-t border-gray-300 dark:border-gray-600" : "hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"}
												>
													<td class="w-12 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 text-right select-none font-mono bg-gray-50 dark:bg-gray-800">
														{#if line.lineNum !== null}
															{line.lineNum}
														{/if}
													</td>
													<td
														class="px-3 py-0.5 {wrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'} {line.type === 'removed'
															? 'text-red-900 dark:text-red-100 bg-red-50 dark:bg-red-900/20'
															: line.content?.startsWith('End of file')
																? `text-gray-500 dark:text-gray-400 italic ${wrapLines ? 'text-center' : 'text-left'} bg-gray-100 dark:bg-gray-700`
																: 'text-gray-900 dark:text-gray-100'}"
													>
														{#if line.highlightedContent}
															{@html line.highlightedContent || "\u00A0"}
														{:else}
															{@html processTextForDisplay(line.content) || "\u00A0"}
														{/if}
													</td>
												</tr>
											{/if}
										{/each}
									</tbody>
								</table>
							</div>

							<!-- Right content -->
							<div bind:this={rightPaneRef} class="diff-pane-right w-1/2 overflow-y-scroll {wrapLines ? 'overflow-x-hidden' : 'overflow-x-scroll'} max-h-full" onscroll={handleRightPaneScroll}>
								<table class="w-full {wrapLines ? '' : 'min-w-max'}">
									<tbody class="text-sm font-mono">
										{#each sbsView.rightVisible as line}
											{#if (line as any).type === "fold"}
												<tr class="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
													<td class="w-12 px-2 py-0.5 text-xs text-gray-400 dark:text-gray-500 border-r border-gray-300 dark:border-gray-600 text-right select-none font-mono bg-gray-50 dark:bg-gray-800">…</td>
													<td class="px-3 py-1 text-gray-600 dark:text-gray-300 italic relative">
														<div class="flex items-center">
															<span class="pr-24">⟪ {(line as any).rightStart ?? "…"}–{(line as any).rightEnd ?? "…"} ⟫ · {(line as any).count} unchanged lines hidden</span>
															<div class="sticky-expand-button">
																<Button variant="minimal" leftIcon="chevronDown" class="text-xs" onclick={() => expandSbsSegment((line as any).segIndex)}>Expand</Button>
															</div>
														</div>
													</td>
												</tr>
											{:else}
												<tr
													class={line.type === "added"
														? "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500"
														: line.content?.startsWith("End of file")
															? "bg-gray-100 dark:bg-gray-700 border-t border-gray-300 dark:border-gray-600"
															: "hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"}
												>
													<td class="w-12 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 text-right select-none font-mono bg-gray-50 dark:bg-gray-800">
														{#if line.lineNum !== null}
															{line.lineNum}
														{/if}
													</td>
													<td
														class="px-3 py-0.5 {wrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'} {line.type === 'added'
															? 'text-green-900 dark:text-green-100 bg-green-50 dark:bg-green-900/20'
															: line.content?.startsWith('End of file')
																? `text-gray-500 dark:text-gray-400 italic ${wrapLines ? 'text-center' : 'text-left'} bg-gray-100 dark:bg-gray-700`
																: 'text-gray-900 dark:text-gray-100'}"
													>
														{#if line.highlightedContent}
															{@html line.highlightedContent || "\u00A0"}
														{:else}
															{@html processTextForDisplay(line.content) || "\u00A0"}
														{/if}
													</td>
												</tr>
											{/if}
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{:else}
						<!-- Unified view -->
						<div class="flex-1 overflow-y-scroll {wrapLines ? 'overflow-x-hidden' : 'overflow-x-scroll'} max-h-full">
							<div class="text-sm font-mono {wrapLines ? 'whitespace-pre-wrap' : 'whitespace-pre'}">
								{#each unifiedView.visible as line}
									{#if (line as any).type === "fold"}
										<div class="flex bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors relative">
											<div class="px-2 py-1 text-xs text-gray-400 dark:text-gray-500 border-r border-gray-300 dark:border-gray-600 select-none font-mono bg-gray-50 dark:bg-gray-800" style="width: {2.5 + unifiedDiff.maxOldLineNumWidth * 0.6 + unifiedDiff.maxNewLineNumWidth * 0.6}rem;">…</div>
											<div class="px-3 py-1 flex-1 text-gray-600 dark:text-gray-300 italic flex items-center">
												<span class="pr-24">⟪ {(line as any).oldStart ?? "…"}–{(line as any).oldEnd ?? "…"} | {(line as any).newStart ?? "…"}–{(line as any).newEnd ?? "…"} ⟫ · {(line as any).count} unchanged lines hidden</span>
												<div class="sticky-expand-button">
													<Button variant="minimal" leftIcon="chevronDown" class="text-xs" onclick={() => expandUnifiedSegment((line as any).segIndex)}>Expand</Button>
												</div>
											</div>
										</div>
									{:else}
										<div class="flex hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
											<div
												class="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 select-none font-mono bg-gray-50 dark:bg-gray-800 flex-shrink-0"
												style="width: {2.5 + unifiedDiff.maxOldLineNumWidth * 0.6 + unifiedDiff.maxNewLineNumWidth * 0.6}rem;"
											>
												<div class="grid grid-cols-3 gap-0 h-full items-center" style="grid-template-columns: {unifiedDiff.maxOldLineNumWidth}ch 1ch {unifiedDiff.maxNewLineNumWidth}ch;">
													<!-- Old line number column -->
													<div class="text-center">
														{#if line.type === "context" && line.oldLineNum !== null}
															<span class="text-gray-400 dark:text-gray-500">{line.oldLineNum}</span>
														{:else if line.type === "removed" && line.oldLineNum !== null}
															<span class="text-red-500 dark:text-red-400">{line.oldLineNum}</span>
														{:else}
															<span class="text-gray-300 dark:text-gray-600">-</span>
														{/if}
													</div>
													<!-- Separator column -->
													<div class="text-center">
														<span class="text-gray-300 dark:text-gray-600">|</span>
													</div>
													<!-- New line number column -->
													<div class="text-center">
														{#if line.type === "context" && line.newLineNum !== null}
															<span class="text-gray-400 dark:text-gray-500">{line.newLineNum}</span>
														{:else if line.type === "added" && line.newLineNum !== null}
															<span class="text-green-500 dark:text-green-400">{line.newLineNum}</span>
														{:else}
															<span class="text-gray-300 dark:text-gray-600">-</span>
														{/if}
													</div>
												</div>
											</div>
											<div
												class="px-3 py-0.5 flex-1 {line.type === 'file'
													? 'text-blue-600 dark:text-blue-400 font-bold'
													: line.type === 'header'
														? 'text-blue-800 dark:text-blue-200 font-medium bg-blue-50 dark:bg-blue-900/20'
														: line.type === 'added'
															? 'text-green-900 dark:text-green-100 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
															: line.type === 'removed'
																? 'text-red-900 dark:text-red-100 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500'
																: line.content?.startsWith('End of file')
																	? `text-gray-500 dark:text-gray-400 italic ${wrapLines ? 'text-center' : 'text-left'} bg-gray-100 dark:bg-gray-700 border-t border-gray-300 dark:border-gray-600`
																	: 'text-gray-900 dark:text-gray-100'}"
											>
												{#if line.highlightedContent}
													{@html line.highlightedContent}
												{:else}
													{@html processTextForDisplay(line.content)}
												{/if}
											</div>
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{/if}
				{:else}
					<div class="flex items-center justify-center h-full">
						<div class="text-center">
							<Icon name="info" size={48} class="text-gray-400 mx-auto mb-3" />
							<p class="text-gray-600 dark:text-gray-300">No diff content available</p>
							<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">This file may not have any changes or may be a binary file</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* Custom scrollbar for diff content */
	.overflow-auto::-webkit-scrollbar,
	.overflow-x-scroll::-webkit-scrollbar,
	.overflow-y-auto::-webkit-scrollbar,
	.overflow-y-scroll::-webkit-scrollbar {
		width: 12px;
		height: 12px;
	}

	.overflow-auto::-webkit-scrollbar-track,
	.overflow-x-scroll::-webkit-scrollbar-track,
	.overflow-y-auto::-webkit-scrollbar-track,
	.overflow-y-scroll::-webkit-scrollbar-track {
		background: #f1f5f9;
		border-radius: 6px;
		border: 1px solid #e2e8f0;
	}

	.overflow-auto::-webkit-scrollbar-thumb,
	.overflow-x-scroll::-webkit-scrollbar-thumb,
	.overflow-y-auto::-webkit-scrollbar-thumb,
	.overflow-y-scroll::-webkit-scrollbar-thumb {
		background: #94a3b8; /* Changed from #cbd5e1 for better contrast */
		border-radius: 6px;
		border: 2px solid #f1f5f9;
		transition: background-color 0.2s ease;
	}

	.overflow-auto::-webkit-scrollbar-thumb:hover,
	.overflow-x-scroll::-webkit-scrollbar-thumb:hover,
	.overflow-y-auto::-webkit-scrollbar-thumb:hover,
	.overflow-y-scroll::-webkit-scrollbar-thumb:hover {
		background: #64748b; /* Changed from #94a3b8 for better contrast */
		cursor: grab;
	}

	.overflow-auto::-webkit-scrollbar-thumb:active,
	.overflow-x-scroll::-webkit-scrollbar-thumb:active,
	.overflow-y-auto::-webkit-scrollbar-thumb:active,
	.overflow-y-scroll::-webkit-scrollbar-thumb:active {
		background: #475569; /* Changed from #64748b for better contrast */
		cursor: grabbing;
	}

	.overflow-auto::-webkit-scrollbar-corner,
	.overflow-x-scroll::-webkit-scrollbar-corner,
	.overflow-y-auto::-webkit-scrollbar-corner,
	.overflow-y-scroll::-webkit-scrollbar-corner {
		background: #f1f5f9;
	}

	/* Diff-specific scrollbar theming with class-based selectors */
	.diff-pane-left::-webkit-scrollbar-thumb {
		background: #dc2626; /* Changed from #f87171 for better contrast */
		border: 2px solid #fef2f2;
	}

	.diff-pane-left::-webkit-scrollbar-thumb:hover {
		background: #b91c1c; /* Changed from #ef4444 for better contrast */
	}

	.diff-pane-left::-webkit-scrollbar-thumb:active {
		background: #991b1b; /* Changed from #dc2626 for better contrast */
	}

	.diff-pane-right::-webkit-scrollbar-thumb {
		background: #16a34a; /* Changed from #4ade80 for better contrast */
		border: 2px solid #f0fdf4;
	}

	.diff-pane-right::-webkit-scrollbar-thumb:hover {
		background: #15803d; /* Changed from #22c55e for better contrast */
	}

	.diff-pane-right::-webkit-scrollbar-thumb:active {
		background: #166534; /* Changed from #16a34a for better contrast */
	}

	/* Firefox scrollbar styling */
	.overflow-x-scroll,
	.overflow-y-scroll {
		scrollbar-width: thin;
		scrollbar-color: #94a3b8 #f1f5f9; /* Updated for better contrast */
	}

	.diff-pane-left {
		scrollbar-color: #dc2626 #fef2f2; /* Updated for better contrast */
	}

	.diff-pane-right {
		scrollbar-color: #16a34a #f0fdf4; /* Updated for better contrast */
	}

	/* Accessibility support */
	@media (prefers-contrast: high) {
		.overflow-auto::-webkit-scrollbar-thumb,
		.overflow-x-scroll::-webkit-scrollbar-thumb,
		.overflow-y-auto::-webkit-scrollbar-thumb,
		.overflow-y-scroll::-webkit-scrollbar-thumb {
			background: #000000;
			border: 1px solid #ffffff;
		}

		.diff-pane-left::-webkit-scrollbar-thumb {
			background: #991b1b;
		}

		.diff-pane-right::-webkit-scrollbar-thumb {
			background: #14532d;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.overflow-auto::-webkit-scrollbar-thumb,
		.overflow-x-scroll::-webkit-scrollbar-thumb,
		.overflow-y-auto::-webkit-scrollbar-thumb,
		.overflow-y-scroll::-webkit-scrollbar-thumb {
			transition: none;
		}
	}

	.min-w-max {
		min-width: max-content;
	}
	table tbody tr:hover {
		background-color: rgba(0, 0, 0, 0.02) !important;
	}

	/* Make line numbers monospace and consistent */
	.select-none {
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}

	/* Ensure proper text wrapping and spacing */
	.break-all {
		word-break: break-word;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	/* Sticky expand button */
	.sticky-expand-button {
		position: sticky;
		right: 0.5rem;
		margin-left: auto;
		background: inherit;
		padding-left: 1rem;
		z-index: 10;
	}

	/* Add gradient fade effect before the sticky button */
	.sticky-expand-button::before {
		content: '';
		position: absolute;
		left: -2rem;
		top: 0;
		bottom: 0;
		width: 2rem;
		background: linear-gradient(to right, transparent, rgb(249 250 251) 60%);
		pointer-events: none;
	}

	/* Dark mode gradient */
	:global(.dark) .sticky-expand-button::before {
		background: linear-gradient(to right, transparent, rgb(55 65 81) 60%);
	}

	/* Hover state gradient */
	tr:hover .sticky-expand-button::before {
		background: linear-gradient(to right, transparent, rgb(243 244 246) 60%);
	}

	:global(.dark) tr:hover .sticky-expand-button::before {
		background: linear-gradient(to right, transparent, rgb(75 85 99) 60%);
	}
</style>
