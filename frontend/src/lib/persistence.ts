import { writable, type Writable } from "svelte/store";
import { LoadState, SaveState, DataPath } from "../../wailsjs/go/storage/StateStore";

// Only keys with this prefix are persisted
const PREFIX = "app:";

function entriesWithPrefix(): Record<string, string> {
	const out: Record<string, string> = {};
	for (let i = 0; i < localStorage.length; i++) {
		const k = localStorage.key(i)!;
		if (k.startsWith(PREFIX)) out[k] = localStorage.getItem(k)!;
	}
	return out;
}

export async function hydrateLocalStorage() {
	const raw = await LoadState().catch(() => "{}");
	if (!raw) return;
	try {
		const obj = JSON.parse(raw);
		Object.entries(obj).forEach(([k, v]) => {
			if (typeof k === "string" && k.startsWith(PREFIX)) {
				localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
			}
		});
	} catch {
		/* ignore bad file */
	}
}

let saveTimer: number | null = null;
function scheduleSave() {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = window.setTimeout(async () => {
		const snapshot = entriesWithPrefix();
		await SaveState(JSON.stringify(snapshot)).catch(console.error);
	}, 350);
}

// Centralized storage API
export const storage = {
	/**
	 * Get a value from localStorage
	 */
	getItem<T>(key: string): T | null {
		if (!key.startsWith(PREFIX)) {
			key = PREFIX + key;
		}
		try {
			const item = localStorage.getItem(key);
			return item ? JSON.parse(item) : null;
		} catch (e) {
			console.error(`Failed to get item ${key}:`, e);
			return null;
		}
	},

	/**
	 * Set a value in localStorage
	 */
	setItem<T>(key: string, value: T): void {
		if (!key.startsWith(PREFIX)) {
			key = PREFIX + key;
		}
		try {
			localStorage.setItem(key, JSON.stringify(value));
			scheduleSave();
		} catch (e) {
			console.error(`Failed to set item ${key}:`, e);
		}
	},

	/**
	 * Remove a value from localStorage
	 */
	removeItem(key: string): void {
		if (!key.startsWith(PREFIX)) {
			key = PREFIX + key;
		}
		try {
			localStorage.removeItem(key);
			scheduleSave();
		} catch (e) {
			console.error(`Failed to remove item ${key}:`, e);
		}
	},

	/**
	 * Clear all app-prefixed items from localStorage
	 */
	clear(): void {
		try {
			const keys = [];
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && key.startsWith(PREFIX)) {
					keys.push(key);
				}
			}
			keys.forEach((key) => localStorage.removeItem(key));
			scheduleSave();
		} catch (e) {
			console.error("Failed to clear storage:", e);
		}
	},

	/**
	 * Get all app-prefixed keys
	 */
	keys(): string[] {
		const keys: string[] = [];
		try {
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && key.startsWith(PREFIX)) {
					keys.push(key.substring(PREFIX.length));
				}
			}
		} catch (e) {
			console.error("Failed to get keys:", e);
		}
		return keys;
	},
};

export function persistent<T>(key: string, initial: T): Writable<T> {
	if (!key.startsWith(PREFIX)) {
		key = PREFIX + key;
	}
	const inLS = localStorage.getItem(key);
	const start: T = inLS ? (JSON.parse(inLS) as T) : initial;

	const store = writable<T>(start);
	store.subscribe((val) => {
		try {
			localStorage.setItem(key, JSON.stringify(val));
			scheduleSave();
		} catch (e) {
			console.error("persist set failed", e);
		}
	});
	return store;
}

export async function saveNow() {
	const snapshot = entriesWithPrefix();
	await SaveState(JSON.stringify(snapshot)).catch(console.error);
}

// Helpful for debugging where the file is.
export async function dataPath(): Promise<string> {
	return DataPath();
}

// Listen for any localStorage changes and trigger debounced save
// This catches changes made outside our centralized storage API
window.addEventListener("storage", (event) => {
	// Only react to changes in our own window and with our prefix
	if (event.storageArea === localStorage && event.key && event.key.startsWith(PREFIX)) {
		scheduleSave();
	}
});

// Also override localStorage methods to catch direct usage
// Store original methods
const originalSetItem = localStorage.setItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);
const originalClear = localStorage.clear.bind(localStorage);

// Override setItem to trigger saves for app: keys
localStorage.setItem = function (key: string, value: string) {
	originalSetItem(key, value);
	if (key.startsWith(PREFIX)) {
		scheduleSave();
	}
};

// Override removeItem to trigger saves for app: keys
localStorage.removeItem = function (key: string) {
	originalRemoveItem(key);
	if (key.startsWith(PREFIX)) {
		scheduleSave();
	}
};

// Override clear to trigger save (affects all keys including app: ones)
localStorage.clear = function () {
	// Check if we had any app: keys before clearing
	const hadAppKeys = entriesWithPrefix();
	originalClear();
	if (Object.keys(hadAppKeys).length > 0) {
		scheduleSave();
	}
};

// Try to save on tab hide/lose focus (fires earlier than beforeunload)
document.addEventListener("visibilitychange", () => {
	if (document.visibilityState === "hidden") {
		void saveNow();
	}
});
window.addEventListener("pagehide", () => {
	void saveNow();
});
// beforeunload is last resort (cannot await)
window.addEventListener("beforeunload", () => {
	void saveNow();
});
