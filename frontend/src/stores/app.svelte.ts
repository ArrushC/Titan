import type { AppConfig } from "src/utils/AppConfig.ts";
import { BranchConfig } from "src/utils/BranchConfig.ts";
import type { ScriptConfig } from "src/utils/ScriptConfig.ts";

/**
 * Application Store - Centralized state management using Svelte 5 runes
 * Provides reactive state with proper getter/setter methods
 */
class ApplicationStore {
	private _state = $state({
		// Configuration instances
		appConfig: null as AppConfig | null,
		branchConfig: null as BranchConfig | null,
		scriptConfig: null as ScriptConfig | null,

		// WebSocket connection state
		webSocket: null as WebSocket | null,
		isWebSocketConnected: false,

		// WebSocket reconnection state
		reconnectionAttempts: 0,
		maxReconnectionAttempts: 10,
		reconnectionDelay: 1000, // Base delay in milliseconds
		isReconnecting: false,
		lastConnectionError: null as string | null,

		// Application metadata
		applicationVersion: "3.0.0b3",

		// UI state
		scrollPosition: 0,
		isCommitMode: false,
		isLogMode: false,

		// Commit process tracking
		isCommitInProgress: false,
		commitPhase: "selection" as "loading" | "selection" | "committing" | "completed",

		// Session-only commit variable values (never persisted to disk)
		// Structure: branchFolder -> variableName -> value
		commitVariableValues: {} as Record<string, Record<string, string>>,

		// Theme state
		currentTheme: "light" as "light" | "dark",
	});

	// Configuration getters/setters
	get appConfig(): AppConfig | null {
		return this._state.appConfig;
	}

	set appConfig(config: AppConfig | null) {
		this._state.appConfig = config;
	}

	get branchConfig(): BranchConfig | null {
		return this._state.branchConfig;
	}

	set branchConfig(config: BranchConfig | null) {
		this._state.branchConfig = config;
	}

	get scriptConfig(): ScriptConfig | null {
		return this._state.scriptConfig;
	}

	set scriptConfig(config: ScriptConfig | null) {
		this._state.scriptConfig = config;
	}

	// WebSocket getters/setters
	get webSocket(): WebSocket | null {
		return this._state.webSocket;
	}

	set webSocket(ws: WebSocket | null) {
		this._state.webSocket = ws;
	}

	get isWebSocketConnected(): boolean {
		return this._state.isWebSocketConnected;
	}

	set isWebSocketConnected(connected: boolean) {
		this._state.isWebSocketConnected = connected;
	}

	// WebSocket reconnection getters/setters
	get reconnectionAttempts(): number {
		return this._state.reconnectionAttempts;
	}

	set reconnectionAttempts(attempts: number) {
		this._state.reconnectionAttempts = attempts;
	}

	get maxReconnectionAttempts(): number {
		return this._state.maxReconnectionAttempts;
	}

	set maxReconnectionAttempts(max: number) {
		this._state.maxReconnectionAttempts = max;
	}

	get reconnectionDelay(): number {
		return this._state.reconnectionDelay;
	}

	set reconnectionDelay(delay: number) {
		this._state.reconnectionDelay = delay;
	}

	get isReconnecting(): boolean {
		return this._state.isReconnecting;
	}

	set isReconnecting(reconnecting: boolean) {
		this._state.isReconnecting = reconnecting;
	}

	get lastConnectionError(): string | null {
		return this._state.lastConnectionError;
	}

	set lastConnectionError(error: string | null) {
		this._state.lastConnectionError = error;
	}

	// Application metadata getters/setters
	get applicationVersion(): string {
		return this._state.applicationVersion;
	}

	set applicationVersion(version: string) {
		this._state.applicationVersion = version;
	}

	// UI state getters/setters
	get scrollPosition(): number {
		return this._state.scrollPosition;
	}

	set scrollPosition(position: number) {
		this._state.scrollPosition = position;
	}

	get isCommitMode(): boolean {
		return this._state.isCommitMode;
	}
	set isCommitMode(mode: boolean) {
		// If exiting commit mode, clear all commit variable values and reset phase
		if (this._state.isCommitMode && !mode) {
			this.clearCommitVariableValues();
			this._state.commitPhase = "selection";
			this._state.isCommitInProgress = false;
		}
		this._state.isCommitMode = mode;
	}

	get isLogMode(): boolean {
		return this._state.isLogMode;
	}
	set isLogMode(mode: boolean) {
		this._state.isLogMode = mode;
	}

	get isCommitInProgress(): boolean {
		return this._state.isCommitInProgress;
	}
	set isCommitInProgress(inProgress: boolean) {
		this._state.isCommitInProgress = inProgress;
	}

	get commitPhase(): "loading" | "selection" | "committing" | "completed" {
		return this._state.commitPhase;
	}
	set commitPhase(phase: "loading" | "selection" | "committing" | "completed") {
		this._state.commitPhase = phase;
	}

	get commitVariableValues(): Record<string, Record<string, string>> {
		return this._state.commitVariableValues;
	}

	set commitVariableValues(values: Record<string, Record<string, string>>) {
		this._state.commitVariableValues = values;
	}

	// Computed properties (derived state)
	get isHeaderFixed(): boolean {
		return this._state.scrollPosition > 10;
	}

	get hasValidConfiguration(): boolean {
		return this._state.appConfig !== null && this._state.branchConfig !== null && this._state.scriptConfig !== null;
	}

	// Utility methods
	resetConfiguration(): void {
		this._state.appConfig = null;
		this._state.branchConfig = null;
		this._state.scriptConfig = null;
	}

	closeWebSocketConnection(): void {
		if (this._state.webSocket) {
			this._state.webSocket.close();
			this._state.webSocket = null;
			this._state.isWebSocketConnected = false;
		}
	}

	// Reconnection utility methods
	resetReconnectionState(): void {
		this._state.reconnectionAttempts = 0;
		this._state.isReconnecting = false;
		this._state.lastConnectionError = null;
	}

	incrementReconnectionAttempts(): number {
		return ++this._state.reconnectionAttempts;
	}

	shouldAttemptReconnection(): boolean {
		return this._state.reconnectionAttempts < this._state.maxReconnectionAttempts;
	}

	getExponentialBackoffDelay(): number {
		return Math.min(this._state.reconnectionDelay * Math.pow(2, this._state.reconnectionAttempts), 30000);
	}

	// Commit variable values utility methods
	getCommitVariableValue(branchFolder: string, variableName: string): string {
		return this._state.commitVariableValues[branchFolder]?.[variableName] || "";
	}

	setCommitVariableValue(branchFolder: string, variableName: string, value: string): void {
		if (!this._state.commitVariableValues[branchFolder]) {
			this._state.commitVariableValues[branchFolder] = {};
		}
		this._state.commitVariableValues[branchFolder][variableName] = value;
	}

	getCommitVariableValues(branchFolder: string): Record<string, string> {
		return this._state.commitVariableValues[branchFolder] || {};
	}

	setCommitVariableValues(branchFolder: string, values: Record<string, string>): void {
		this._state.commitVariableValues[branchFolder] = { ...values };
	}

	clearCommitVariableValues(branchFolder?: string): void {
		if (branchFolder) {
			delete this._state.commitVariableValues[branchFolder];
		} else {
			this._state.commitVariableValues = {};
		}
	}

	// Theme getters/setters
	get currentTheme(): "light" | "dark" {
		return this._state.currentTheme;
	}

	set currentTheme(theme: "light" | "dark") {
		this._state.currentTheme = theme;
	}

	get isDarkMode(): boolean {
		return this._state.currentTheme === "dark";
	}

	// Legacy compatibility - maintain existing function exports
	getState() {
		return this._state;
	}
}

// Create singleton instance
const applicationStore = new ApplicationStore();

// Export the store instance
export { applicationStore };

// Legacy compatibility exports - maintain existing API
export const getBranchConfig = () => applicationStore.branchConfig;
export const setBranchConfig = (config: BranchConfig | null) => {
	applicationStore.branchConfig = config;
};
export const getAppConfig = () => applicationStore.appConfig;
export const setAppConfig = (config: AppConfig | null) => {
	applicationStore.appConfig = config;
};
export const getWs = () => applicationStore.webSocket;
export const setWs = (ws: WebSocket | null) => {
	applicationStore.webSocket = ws;
};
export const getWsConnected = () => applicationStore.isWebSocketConnected;
export const setWsConnected = (connected: boolean) => {
	applicationStore.isWebSocketConnected = connected;
};
export const getAppVersion = () => applicationStore.applicationVersion;
export const setAppVersion = (version: string) => {
	applicationStore.applicationVersion = version;
};
export const getScrollY = () => applicationStore.scrollPosition;
export const setScrollY = (position: number) => {
	applicationStore.scrollPosition = position;
};
export const getHeaderFixed = () => applicationStore.isHeaderFixed;
export const getIsCommitMode = () => applicationStore.isCommitMode;
export const setIsCommitMode = (mode: boolean) => {
	applicationStore.isCommitMode = mode;
};
export const getIsLogMode = () => applicationStore.isLogMode;
export const setIsLogMode = (mode: boolean) => {
	applicationStore.isLogMode = mode;
};
export const getIsCommitInProgress = () => applicationStore.isCommitInProgress;
export const setIsCommitInProgress = (inProgress: boolean) => {
	applicationStore.isCommitInProgress = inProgress;
};
export const getCommitPhase = () => applicationStore.commitPhase;
export const setCommitPhase = (phase: "loading" | "selection" | "committing" | "completed") => {
	applicationStore.commitPhase = phase;
};

// WebSocket reconnection exports
export const getReconnectionAttempts = () => applicationStore.reconnectionAttempts;
export const setReconnectionAttempts = (attempts: number) => {
	applicationStore.reconnectionAttempts = attempts;
};
export const getMaxReconnectionAttempts = () => applicationStore.maxReconnectionAttempts;
export const setMaxReconnectionAttempts = (max: number) => {
	applicationStore.maxReconnectionAttempts = max;
};
export const getReconnectionDelay = () => applicationStore.reconnectionDelay;
export const setReconnectionDelay = (delay: number) => {
	applicationStore.reconnectionDelay = delay;
};
export const getIsReconnecting = () => applicationStore.isReconnecting;
export const setIsReconnecting = (reconnecting: boolean) => {
	applicationStore.isReconnecting = reconnecting;
};
export const getLastConnectionError = () => applicationStore.lastConnectionError;
export const setLastConnectionError = (error: string | null) => {
	applicationStore.lastConnectionError = error;
};

// Reconnection utility exports
export const resetReconnectionState = () => applicationStore.resetReconnectionState();
export const incrementReconnectionAttempts = () => applicationStore.incrementReconnectionAttempts();
export const shouldAttemptReconnection = () => applicationStore.shouldAttemptReconnection();
export const getExponentialBackoffDelay = () => applicationStore.getExponentialBackoffDelay();

// Commit variable values exports (session-only, never persisted)
export const getCommitVariableValue = (branchFolder: string, variableName: string) => applicationStore.getCommitVariableValue(branchFolder, variableName);
export const setCommitVariableValue = (branchFolder: string, variableName: string, value: string) => applicationStore.setCommitVariableValue(branchFolder, variableName, value);
export const getCommitVariableValues = (branchFolder: string) => applicationStore.getCommitVariableValues(branchFolder);
export const setCommitVariableValues = (branchFolder: string, values: Record<string, string>) => applicationStore.setCommitVariableValues(branchFolder, values);
export const clearCommitVariableValues = (branchFolder?: string) => applicationStore.clearCommitVariableValues(branchFolder);

// Theme exports
export const getCurrentTheme = () => applicationStore.currentTheme;
export const setCurrentTheme = (theme: "light" | "dark") => {
	applicationStore.currentTheme = theme;
};
export const getIsDarkMode = () => applicationStore.isDarkMode;

// Export state for direct access (legacy compatibility)
export const state = applicationStore.getState();
