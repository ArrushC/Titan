<script lang="ts">
	import { createEventDispatcher, onDestroy } from "svelte";
	import Icon from "./Icon.svelte";
	import { storage } from "../lib/persistence";

	type Events = { input: string; change: string };
	const dispatch = createEventDispatcher<Events>();

	export let value: string = "#4F46E5";
	export let disabled: boolean = false;
	export let presets: string[] = ["#EF4444", "#F59E0B", "#FBBF24", "#84CC16", "#22C55E", "#10B981", "#06B6D4", "#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#EC4899", "#F43F5E", "#111827", "#374151", "#6B7280", "#9CA3AF", "#E5E7EB", "#FFFFFF"];

	let open = false;
	let rootEl: HTMLDivElement | null = null;

	// ---- Color math (hex <-> rgb <-> hsv) ----
	const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

	function normalizeHex(hex: string): string | null {
		let h = (hex || "").trim().replace(/^#/, "").toUpperCase();
		if (/^[0-9A-F]{3}$/.test(h)) {
			h = h
				.split("")
				.map((ch) => ch + ch)
				.join("");
		}
		if (!/^[0-9A-F]{6}$/.test(h)) return null;
		return "#" + h;
	}

	function hexToRgb(hex: string) {
		const n = normalizeHex(hex);
		if (!n) return { r: 79, g: 70, b: 229 };
		const v = parseInt(n.slice(1), 16);
		return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
	}
	function rgbToHex(r: number, g: number, b: number) {
		return (
			"#" +
			[r, g, b]
				.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
				.join("")
				.toUpperCase()
		);
	}
	function rgbToHsv(r: number, g: number, b: number) {
		r /= 255;
		g /= 255;
		b /= 255;
		const max = Math.max(r, g, b),
			min = Math.min(r, g, b);
		const d = max - min;
		let h = 0;
		if (d !== 0) {
			switch (max) {
				case r:
					h = (g - b) / d + (g < b ? 6 : 0);
					break;
				case g:
					h = (b - r) / d + 2;
					break;
				default:
					h = (r - g) / d + 4;
			}
			h *= 60;
		}
		const s = max === 0 ? 0 : d / max;
		const v = max;
		return { h, s, v };
	}
	function hsvToRgb(h: number, s: number, v: number) {
		const c = v * s;
		const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
		const m = v - c;
		let rr = 0,
			gg = 0,
			bb = 0;
		if (0 <= h && h < 60) {
			rr = c;
			gg = x;
			bb = 0;
		} else if (60 <= h && h < 120) {
			rr = x;
			gg = c;
			bb = 0;
		} else if (120 <= h && h < 180) {
			rr = 0;
			gg = c;
			bb = x;
		} else if (180 <= h && h < 240) {
			rr = 0;
			gg = x;
			bb = c;
		} else if (240 <= h && h < 300) {
			rr = x;
			gg = 0;
			bb = c;
		} else {
			rr = c;
			gg = 0;
			bb = x;
		}
		return { r: (rr + m) * 255, g: (gg + m) * 255, b: (bb + m) * 255 };
	}

	// ---- State derived from value ----
	let hex = normalizeHex(value) ?? "#4F46E5";
	let { r, g, b } = hexToRgb(hex);
	let { h, s, v } = rgbToHsv(r, g, b);

	function syncFromHSV(commit: "input" | "change" = "input") {
		const { r, g, b } = hsvToRgb(h, s, v);
		hex = rgbToHex(r, g, b);
		hexInput = hex; // Update hex input field
		value = hex;
		dispatch(commit, hex);
		if (commit === "change") {
			recordRecent(hex); // Only record on final commit, not during dragging
		}
	}

	// ---- SV area interactions ----
	let svEl: HTMLDivElement | null = null;
	function svPointer(e: PointerEvent) {
		if (!svEl) return;
		const rect = svEl.getBoundingClientRect();
		const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
		const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
		s = x;
		v = 1 - y;
		syncFromHSV("input");
	}

	function startSV(e: PointerEvent) {
		if (disabled) return;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		svPointer(e);
		const move = (ev: PointerEvent) => svPointer(ev);
		const up = (ev: PointerEvent) => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
			syncFromHSV("change");
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
	}

	// ---- Hue slider interactions ----
	let hueEl: HTMLDivElement | null = null;
	function huePointer(e: PointerEvent) {
		if (!hueEl) return;
		const rect = hueEl.getBoundingClientRect();
		const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
		h = x * 360;
		syncFromHSV("input");
	}
	function startHue(e: PointerEvent) {
		if (disabled) return;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		huePointer(e);
		const move = (ev: PointerEvent) => huePointer(ev);
		const up = (ev: PointerEvent) => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
			syncFromHSV("change");
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
	}

	// ---- Hex input ----
	let hexInput = hex;
	let hexValid = true;

	// Update hexInput when value prop changes
	$: {
		const newHex = normalizeHex(value) ?? "#4F46E5";
		if (newHex !== hex) {
			hex = newHex;
			hexInput = hex;
			const { r, g, b } = hexToRgb(hex);
			const hsv = rgbToHsv(r, g, b);
			h = hsv.h; s = hsv.s; v = hsv.v;
		}
	}

	function onHexInput(v: string) {
		hexInput = v;
		const n = normalizeHex(v);
		hexValid = !!n;
		if (!n) return;
		hex = n;
		const { r, g, b } = hexToRgb(n);
		const hsv = rgbToHsv(r, g, b);
		h = hsv.h;
		s = hsv.s;
		v = hsv.v;
		dispatch("input", n);
		// Don't record recent here - only on commitHex()
	}
	function commitHex() {
		const n = normalizeHex(hexInput);
		if (!n) return;
		hex = n;
		value = n;
		dispatch("change", n);
		recordRecent(n);
	}

	// ---- Open/close popover ----
	function onDocMouseDown(ev: MouseEvent) {
		if (!rootEl) return;
		if (open && !rootEl.contains(ev.target as Node)) open = false;
	}
	$: {
		if (open) window.addEventListener("mousedown", onDocMouseDown, true);
		else window.removeEventListener("mousedown", onDocMouseDown, true);
	}
	onDestroy(() => window.removeEventListener("mousedown", onDocMouseDown, true));

	// ---- Eyedropper (optional) ----
	async function pickWithEyedropper() {
		try {
			const Eyedropper = (window as any).EyeDropper;
			if (!Eyedropper) return;
			const ed = new Eyedropper();
			const res = await ed.open();
			const n = normalizeHex(res.sRGBHex);
			if (!n) return;
			onHexInput(n);
			commitHex();
		} catch {
			/* user canceled */
		}
	}

	// ---- Recents (localStorage) ----
	const RECENTS_KEY = "recent_colors"; // prefix will be added automatically
	function loadRecents(): string[] {
		return storage.getItem<string[]>(RECENTS_KEY) ?? [];
	}
	function recordRecent(c: string) {
		const list = [normalizeHex(c)!].concat(loadRecents().filter((x) => x !== normalizeHex(c))).slice(0, 12);
		storage.setItem(RECENTS_KEY, list);
	}
	$: hex; // keep hex reactive for displayed value
</script>

<!-- Trigger -->
<div class="relative inline-block" bind:this={rootEl}>
	<button
		type="button"
		class="flex items-center gap-2 px-2.5 py-2 rounded-md border text-sm transition
               bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700
               hover:border-gray-400 dark:hover:border-gray-600
               disabled:opacity-60 disabled:cursor-not-allowed"
		on:click={() => {
			if (!disabled) open = !open;
		}}
		{disabled}
		aria-haspopup="dialog"
		aria-expanded={open}
	>
		<span class="w-5 h-5 rounded-full ring-1 ring-gray-300 dark:ring-gray-600" style="background-color:{hex}"></span>
		<span class="font-mono text-xs text-gray-700 dark:text-gray-200">{hex}</span>
		<Icon name="chevronDown" size={16} class="text-gray-500 dark:text-gray-400" />
	</button>

	{#if open && !disabled}
		<!-- Popover -->
		<div
			class="absolute z-50 mt-2 right-0 w-80 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700
                    bg-white dark:bg-gray-800 p-4"
		>
			<!-- SV area -->
			<div
				class="relative h-40 rounded-lg overflow-hidden cursor-crosshair border border-gray-200 dark:border-gray-700"
				bind:this={svEl}
				on:pointerdown={startSV}
				style="
                    background:
                        linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0)),
                        linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0)),
                        hsl({h} 100% 50%);
                "
			>
				<!-- SV handle -->
				<div class="absolute w-4 h-4 -ml-2 -mt-2 rounded-full ring-2 ring-white dark:ring-gray-800 border border-black/20" style="left:{s * 100}%; top:{(1 - v) * 100}%"></div>
			</div>

			<!-- Hue slider -->
			<div
				class="relative mt-3 h-3 rounded-full cursor-pointer border border-gray-200 dark:border-gray-700"
				bind:this={hueEl}
				on:pointerdown={startHue}
				style="background: linear-gradient(to right,
                    #F00, #FF0, #0F0, #0FF, #00F, #F0F, #F00);"
			>
				<div class="absolute -top-1 w-5 h-5 -ml-2 rounded-full ring-2 ring-white dark:ring-gray-800 border border-black/20" style="left:{(h / 360) * 100}%"></div>
			</div>

			<!-- Hex + actions -->
			<div class="mt-4 flex items-center gap-2">
				<div class="relative flex-1">
					<input
						class="w-full px-3 py-2 rounded-md border bg-white dark:bg-gray-700
                               text-sm font-mono text-gray-900 dark:text-gray-100
                               border-gray-300 dark:border-gray-600
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               placeholder-gray-400 dark:placeholder-gray-400"
						bind:value={hexInput}
						on:input={(e) => onHexInput((e.currentTarget as HTMLInputElement).value)}
						on:keydown={(e) => {
							if (e.key === "Enter") commitHex();
							if (e.key === "Escape") open = false;
						}}
						placeholder="#RRGGBB"
						aria-invalid={!hexValid}
					/>
					{#if !hexValid}
						<div class="absolute -bottom-5 left-0 text-xs text-red-600 dark:text-red-400">Invalid hex</div>
					{/if}
				</div>
				<button
					type="button"
					class="px-2 py-2 rounded-md border border-gray-300 dark:border-gray-600
                           hover:bg-gray-50 dark:hover:bg-gray-700"
					on:click={async () => {
						try {
							await navigator.clipboard.writeText(hex);
						} catch {}
					}}
					title="Copy hex"
				>
					<Icon name="copy" size={16} class="text-gray-600 dark:text-gray-300" />
				</button>
				{#if (window as any).EyeDropper}
					<button
						type="button"
						class="px-2 py-2 rounded-md border border-gray-300 dark:border-gray-600
                               hover:bg-gray-50 dark:hover:bg-gray-700"
						on:click={pickWithEyedropper}
						title="Eyedropper"
					>
						<Icon name="eyedropper" size={16} class="text-gray-600 dark:text-gray-300" />
					</button>
				{/if}
			</div>

			<!-- Presets / Recents -->
			<div class="mt-4">
				<div class="text-xs text-gray-500 dark:text-gray-400 mb-2">Presets</div>
				<div class="grid grid-cols-10 gap-2">
					{#each presets as c}
						<button
							type="button"
							class="h-6 w-6 rounded-md border border-gray-300 dark:border-gray-600"
							style="background-color:{c}"
							on:click={() => {
								onHexInput(c);
								commitHex();
							}}
							title={c}
						/>
					{/each}
				</div>
			</div>
			{#if loadRecents().length}
				<div class="mt-4">
					<div class="text-xs text-gray-500 dark:text-gray-400 mb-2">Recent</div>
					<div class="grid grid-cols-10 gap-2">
						{#each loadRecents() as c}
							<button
								type="button"
								class="h-6 w-6 rounded-md border border-gray-300 dark:border-gray-600"
								style="background-color:{c}"
								on:click={() => {
									onHexInput(c);
									commitHex();
								}}
								title={c}
							/>
						{/each}
					</div>
				</div>
			{/if}

			<div class="mt-4 flex justify-end">
				<button type="button" class="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100" on:click={() => (open = false)}>Close</button>
			</div>
		</div>
	{/if}
</div>

<style>
	/* no custom colors; all styling via classes to match app theme */
</style>
