<script lang="ts">
	import { onMount } from "svelte";
	import { getAppConfig } from "./stores/app.svelte.ts";
	import Icon from "./components/Icon.svelte";
	import Button from "./components/Button.svelte";
	import FloatingHeader from "./components/FloatingHeader.svelte";
	import Radio from "./components/Radio.svelte";
	import Checkbox from "./components/Checkbox.svelte";
	import TrelloCardModal from "./components/TrelloCardModal.svelte";
	import { showError, showSuccess } from "./stores/toast.svelte.ts";
	import { TrelloAPI } from "./utils/TrelloAPI";
	import { storage } from "./lib/persistence";
	import type {
		TrelloConnectionStatus,
		TrelloUserStatistics,
		TrelloCard,
		SearchFilters
	} from "./utils/TrelloTypes";

	// Constants
	const CARD = "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6";

	// Stable credentials type
	type Credentials = { key: string; token: string } | null;

	// Core local state - stable and memoized
	let credentials = $state<Credentials>(null);
	let connectionStatus = $state<TrelloConnectionStatus>('unconfigured');
	let connectionError = $state<string>('');
	let isTesting = $state<boolean>(false);
	let lastTestTime = $state<Date | null>(null);

	// User statistics state
	let userStats = $state<TrelloUserStatistics | null>(null);

	// Trello API instance
	let trelloApi = $state<TrelloAPI | null>(null);

	// Search state
	let searchQuery = $state('');
	let searchResults = $state<TrelloCard[]>([]);
	let isSearching = $state(false);
	let searchError = $state('');
	let hasSearched = $state(false);
	let searchFilters = $state<SearchFilters>({
		contentSearch: 'both',
		memberFilter: 'all',
		includeArchived: false
	});

	// Search debouncing
	let searchTimeout: number | null = null;

	// Card modal state
	let selectedCard = $state<TrelloCard | null>(null);
	let isCardModalVisible = $state(false);

	// Trello label color mapping
	const trelloColors: Record<string, string> = {
		green: '#61bd4f',
		yellow: '#f2d600',
		orange: '#ff9f1a',
		red: '#eb5a46',
		purple: '#c377e0',
		blue: '#0079bf',
		sky: '#00c2e0',
		lime: '#51e898',
		pink: '#ff78cb',
		black: '#344563'
	};

	// Get label background and text colors
	function getLabelColors(color: string) {
		const bgColor = trelloColors[color] || '#b3bac5'; // default gray
		// Determine text color based on background brightness
		const needsLightText = ['green', 'red', 'purple', 'blue', 'black'].includes(color);
		const textColor = needsLightText ? 'text-white' : 'text-gray-900';
		return { bgColor, textColor };
	}

	// Mounted flag
	let hasMounted = $state(false);

	// Derived values that are pure and only depend on local state
	const hasTrelloCredentials = $derived(credentials !== null);

	// PURE config reader: update credentials only when value actually changes
	$effect(() => {
		const cfg = getAppConfig();

		// Safe guards: if cfg is absent/unconfigured, reset once.
		if (!cfg || !cfg.hasTrelloCredentials?.()) {
			if (credentials !== null) credentials = null;
			if (trelloApi) trelloApi = null;
			if (connectionStatus !== 'unconfigured') connectionStatus = 'unconfigured';
			userStats = null;
			return;
		}

		const integration = cfg.getTrelloIntegration?.();
		const next: Credentials = integration ? { key: integration.key, token: integration.token } : null;

		// Only write when key/token identity changes
		if (
			(next === null && credentials !== null) ||
			(next !== null &&
				(!credentials || credentials.key !== next.key || credentials.token !== next.token))
		) {
			credentials = next;
			// Recreate API only when credentials changed
			trelloApi = next ? new TrelloAPI({ key: next.key, token: next.token }) : null;
			// Do NOT call testConnection here - separate effect handles that
		}
	});

	// Side-effect runner: test connection when credentials exist & component mounted
	// This effect depends only on hasMounted and the string signature of credentials
	const credentialsSignature = $derived(() => (credentials ? `${credentials.key}:${credentials.token}` : ''));
	$effect(() => {
		if (!hasMounted) return;
		if (!credentialsSignature) return;
		// Fire & forget; internal writes won't touch credentialsSignature/hasMounted, so no loop
		testConnection();
	});


	// Connection testing functionality
	async function testConnection() {
		if (!trelloApi || !credentials) {
			connectionStatus = 'unconfigured';
			return;
		}

		isTesting = true;
		connectionStatus = 'testing';
		connectionError = '';
		userStats = null;

		try {
			const result = await trelloApi.testConnectionWithStats();

			if (result.success && result.user) {
				connectionStatus = 'connected';
				lastTestTime = new Date();
				showSuccess(`Trello connection successful. Welcome, ${result.user.fullName || result.user.username}!`);

				if (result.statistics) {
					userStats = result.statistics;
				}
			} else if (result.error) {
				connectionStatus = 'disconnected';
				connectionError = result.error.message;
				showError(`Trello connection failed: ${result.error.message}`);
			} else {
				connectionStatus = 'disconnected';
				connectionError = 'Unknown error occurred';
				showError('Trello connection failed: Unknown error occurred');
			}
		} catch (error) {
			connectionStatus = 'disconnected';
			connectionError = error instanceof Error ? error.message : 'Unknown error';
			showError(`Trello connection failed: ${connectionError}`);
		} finally {
			isTesting = false;
		}
	}

	// Status indicator configuration
	const statusConfig = $derived.by(() => {
		switch (connectionStatus) {
			case 'connected':
				return {
					text: 'Connected',
					iconColor: 'text-green-600 dark:text-green-400',
					textColor: 'text-gray-600 dark:text-gray-300'
				};
			case 'testing':
				return {
					text: 'Testing...',
					iconColor: 'text-yellow-600 dark:text-yellow-400 animate-pulse',
					textColor: 'text-gray-600 dark:text-gray-300'
				};
			case 'disconnected':
				return {
					text: 'Disconnected',
					iconColor: 'text-red-600 dark:text-red-400',
					textColor: 'text-gray-600 dark:text-gray-300'
				};
			default:
				return {
					text: 'Not configured',
					iconColor: 'text-gray-600 dark:text-gray-400',
					textColor: 'text-gray-600 dark:text-gray-400'
				};
		}
	});

	// Pure search functions
	function performSearchNow() {
		if (!trelloApi || !searchQuery.trim()) {
			if (hasSearched) hasSearched = false;
			searchResults = [];
			return;
		}
		(async () => {
			try {
				isSearching = true;
				searchError = '';
				const result = await trelloApi.searchCards(searchQuery.trim(), searchFilters);
				searchResults = result.cards;
				hasSearched = true;
			} catch (error) {
				searchError = error instanceof Error ? error.message : 'Search failed';
				searchResults = [];
				showError(`Trello search failed: ${searchError}`);
			} finally {
				isSearching = false;
			}
		})();
	}

	function debouncedSearch() {
		if (searchTimeout) clearTimeout(searchTimeout);
		// Guard: do not queue if query is empty
		if (!searchQuery.trim()) return;
		searchTimeout = window.setTimeout(performSearchNow, 300);
	}

	function clearSearch() {
		if (searchQuery !== '') searchQuery = '';
		searchResults = [];
		hasSearched = false;
		searchError = '';
		if (searchTimeout) {
			clearTimeout(searchTimeout);
			searchTimeout = null;
		}
		trelloApi?.cancelSearch?.();
	}

	// Only reacts to query text, connectionStatus & searchFilters; won't mutate them in a way that
	// retriggers itself unnecessarily
	$effect(() => {
		const query = searchQuery.trim();
		// Access filter properties to ensure reactivity tracking
		searchFilters.contentSearch;
		searchFilters.memberFilter;
		searchFilters.includeArchived;

		if (connectionStatus === 'connected' && query.length > 0) {
			debouncedSearch();
		} else if (query.length === 0) {
			// Avoid redundant writes
			if (hasSearched || searchResults.length || searchError) clearSearch();
		}
	});

	// Persist search query
	$effect(() => {
		if (hasMounted) {
			storage.setItem('trello:searchQuery', searchQuery);
		}
	});

	// Persist search filters
	$effect(() => {
		if (hasMounted) {
			// Access properties to track changes
			const filters = {
				contentSearch: searchFilters.contentSearch,
				memberFilter: searchFilters.memberFilter,
				includeArchived: searchFilters.includeArchived
			};
			storage.setItem('trello:searchFilters', filters);
		}
	});

	// onMount: mark mounted; do not also call testConnection here (the effect will)
	onMount(() => {
		// Load persisted search query and filters
		const persistedQuery = storage.getItem<string>('trello:searchQuery');
		const persistedFilters = storage.getItem<SearchFilters>('trello:searchFilters');

		if (persistedQuery !== null) {
			searchQuery = persistedQuery;
		}

		if (persistedFilters !== null) {
			searchFilters = { ...searchFilters, ...persistedFilters };
		}

		hasMounted = true;
	});

	// Card modal functions
	function openCardModal(card: TrelloCard) {
		selectedCard = card;
		isCardModalVisible = true;
	}

	function closeCardModal() {
		isCardModalVisible = false;
		selectedCard = null;
	}
</script>

{#if getAppConfig()}
<div class="container mx-auto p-4">
	<FloatingHeader>
		{#snippet children()}
			<!-- Left side: Actions -->
			<div class="flex gap-x-2 items-center">
				{#if hasTrelloCredentials}
					<Button
						variant="secondary"
						loading={isTesting}
						disabled={isTesting}
						onclick={testConnection}
						tooltip="Test Trello API connection"
						class="text-sm transition-all duration-300"
					>
						{isTesting ? "Testing..." : "Test Connection"}
					</Button>
				{/if}
			</div>

			<!-- Right side: Status -->
			<div class="flex items-center gap-3">
				{#if lastTestTime && connectionStatus === 'connected'}
					<div class="hidden md:flex items-center">
						<div class="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md">
							<Icon name="history" size={12} />
							<span>Tested {lastTestTime.toLocaleTimeString()}</span>
						</div>
					</div>
				{/if}

				<div class="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700">
					<Icon name="trello" size={12} class={statusConfig.iconColor} />
					<span class={statusConfig.textColor}>{statusConfig.text}</span>
				</div>
			</div>
		{/snippet}
	</FloatingHeader>

	<!-- Main Content - Single Column Layout -->
	<div class="space-y-6">
		<!-- Connection Status Card -->
		<div class={CARD}>
			<h3 class="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
				<Icon name="trello" size={20} class="text-blue-600 dark:text-blue-400" />
				Trello Info
			</h3>

			{#if !hasTrelloCredentials}
				<!-- Not configured state -->
				<div class="space-y-4">
					<div class="flex items-center gap-3">
						<Icon name="info" size={20} class="text-blue-600 dark:text-blue-400" />
						<h4 class="font-medium text-gray-900 dark:text-gray-100">Setup Required</h4>
					</div>
					<p class="text-gray-600 dark:text-gray-400 text-sm">
						To use Trello integration, you need to configure your API credentials in Settings.
					</p>
					<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
						<h5 class="font-medium text-blue-900 dark:text-blue-100 mb-2">How to get credentials:</h5>
						<ol class="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
							<li>Visit <a href="https://trello.com/app-key" target="_blank" class="underline hover:no-underline">Trello Developer API Keys</a></li>
							<li>Copy your API Key</li>
							<li>Generate a Token by clicking the "Token" link</li>
							<li>Configure both in Settings → Integrations</li>
						</ol>
					</div>
				</div>
			{:else}
				<!-- Configured state -->
				<div class="space-y-4">

					{#if connectionStatus === 'disconnected' && connectionError}
						<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
							<div class="flex items-start gap-2">
								<Icon name="triangleAlert" size={16} class="text-red-600 dark:text-red-400 mt-0.5" />
								<div>
									<h5 class="text-sm font-medium text-red-900 dark:text-red-100">Connection Error</h5>
									<p class="text-sm text-red-800 dark:text-red-200 mt-1">{connectionError}</p>
								</div>
							</div>
						</div>
					{/if}

					{#if connectionStatus === 'connected' && userStats}
						<!-- User Statistics Display - Compact Layout -->
						<div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
							<div class="flex items-center gap-6">
								<!-- User Info (Left side) -->
								<div class="flex items-center gap-4">
									{#if userStats.avatarUrl}
										<img src={userStats.avatarUrl} alt={userStats.fullName} class="w-10 h-10 rounded-full select-none" draggable="false" />
									{:else}
										<div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
											<Icon name="user" size={16} class="text-green-600 dark:text-green-400" />
										</div>
									{/if}
									<div>
										<h4 class="font-medium text-green-900 dark:text-green-100">{userStats.fullName}</h4>
										<p class="text-sm text-green-700 dark:text-green-300">@{userStats.username}</p>
									</div>
								</div>

								<!-- Statistics (Right side) -->
								<div class="flex gap-4 ml-auto flex-wrap">
									<div class="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/40 rounded-lg">
										<Icon name="folder" size={14} class="text-green-600 dark:text-green-400" />
										<span class="font-semibold text-green-900 dark:text-green-100">{userStats.boardCount}</span>
										<span class="text-xs text-green-600 dark:text-green-400">Boards</span>
									</div>

									<div class="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/40 rounded-lg">
										<Icon name="user" size={14} class="text-green-600 dark:text-green-400" />
										<span class="font-semibold text-green-900 dark:text-green-100">{userStats.organizationCount}</span>
										<span class="text-xs text-green-600 dark:text-green-400">Orgs</span>
									</div>

									<div class="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/40 rounded-lg">
										<Icon name="shield" size={14} class="text-green-600 dark:text-green-400" />
										<span class="font-semibold text-green-900 dark:text-green-100">{userStats.adminBoardCount}</span>
										<span class="text-xs text-green-600 dark:text-green-400">Admin</span>
									</div>
								</div>
							</div>
						</div>
					{:else if connectionStatus === 'connected'}
						<!-- Basic success state -->
						<div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
							<div class="flex items-center gap-2">
								<Icon name="success" size={16} class="text-green-600 dark:text-green-400" />
								<span class="text-sm font-medium text-green-900 dark:text-green-100">Connection verified successfully</span>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Search Panel Card -->
		{#if connectionStatus === 'connected'}
			<div class={CARD}>
				<h3 class="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
					<Icon name="search" size={20} class="text-gray-600 dark:text-gray-400" />
					Search Trello Cards
				</h3>

				<!-- Search Input -->
				<div class="space-y-4">
					<div class="relative">
						<input
							bind:value={searchQuery}
							class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors {searchQuery.trim()
								? 'border-blue-300'
								: ''}"
							placeholder="Search cards by name, description, or content..."
							aria-label="Search Trello cards"
						/>
						{#if isSearching}
							<div class="absolute right-8 top-1/2 -translate-y-1/2">
								<div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
							</div>
						{/if}
						{#if searchQuery.trim()}
							<Button
								variant="minimal"
								iconOnly="close"
								iconSize={14}
								onclick={clearSearch}
								tooltip="Clear search"
								aria-label="Clear search"
								class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
							/>
						{/if}
					</div>

					<!-- Quick Filters -->
					<div class="border-t border-gray-200 dark:border-gray-700 pt-4">
						<h4 class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">Filters</h4>
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
							<!-- Content Search Filter -->
							<div class="space-y-2">
								<div class="text-xs font-medium text-gray-600 dark:text-gray-400">Search In:</div>
								<div class="space-y-2">
									<label class="flex items-center text-sm gap-2 cursor-pointer">
										<Radio
											bind:group={searchFilters.contentSearch}
											value="both"
											size="small"
										/>
										<span class="text-gray-700 dark:text-gray-300">Name & Description</span>
									</label>
									<label class="flex items-center text-sm gap-2 cursor-pointer">
										<Radio
											bind:group={searchFilters.contentSearch}
											value="name"
											size="small"
										/>
										<span class="text-gray-700 dark:text-gray-300">Name Only</span>
									</label>
									<label class="flex items-center text-sm gap-2 cursor-pointer">
										<Radio
											bind:group={searchFilters.contentSearch}
											value="description"
											size="small"
										/>
										<span class="text-gray-700 dark:text-gray-300">Description Only</span>
									</label>
								</div>
							</div>

							<!-- Member Filter -->
							<div class="space-y-2">
								<div class="text-xs font-medium text-gray-600 dark:text-gray-400">Member Filter:</div>
								<div class="space-y-2">
									<label class="flex items-center text-sm gap-2 cursor-pointer">
										<Radio
											bind:group={searchFilters.memberFilter}
											value="all"
											size="small"
										/>
										<span class="text-gray-700 dark:text-gray-300">All Cards</span>
									</label>
									<label class="flex items-center text-sm gap-2 cursor-pointer">
										<Radio
											bind:group={searchFilters.memberFilter}
											value="me"
											size="small"
										/>
										<span class="text-gray-700 dark:text-gray-300">Assigned to Me</span>
									</label>
								</div>
							</div>

							<!-- Options -->
							<div class="space-y-2">
								<div class="text-xs font-medium text-gray-600 dark:text-gray-400">Options:</div>
								<div class="space-y-2">
									<label class="flex items-center text-sm gap-2 cursor-pointer">
										<Checkbox
											bind:checked={searchFilters.includeArchived}
											size="small"
										/>
										<span class="text-gray-700 dark:text-gray-300">Include Archived</span>
									</label>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Search Results Card -->
		<div class={CARD}>
			<h3 class="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
				{#if connectionStatus === 'connected'}
					<Icon name="search" size={20} class="text-gray-600 dark:text-gray-400" />
					Search Results
					{#if hasSearched}
						<span class="text-sm font-normal text-gray-500 dark:text-gray-400">
							({searchResults.length} found)
						</span>
					{/if}
				{:else}
					<Icon name="lightbulb" size={20} class="text-gray-600 dark:text-gray-400" />
					Available Features
				{/if}
			</h3>

			{#if connectionStatus === 'connected'}
				{#if hasSearched && searchResults.length > 0}
					<!-- Search Results -->
					<div class="max-h-96 overflow-y-auto">
						<div class="p-4 space-y-3">
							{#each searchResults as card}
							<div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
								<div class="flex items-start justify-between">
									<div class="flex-1 min-w-0">
										<h4 class="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate">
											{card.name}
										</h4>
										<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
											<span class="flex items-center gap-1">
												<Icon name="trello" size={12} />
												{card.board.name}
											</span>
											<span class="text-gray-400 dark:text-gray-500">•</span>
											<span>{card.list.name}</span>
											{#if card.members.length > 0}
												<span class="text-gray-400 dark:text-gray-500">•</span>
												<span>{card.members.length} member{card.members.length > 1 ? 's' : ''}</span>
											{/if}
										</div>
									</div>
									<div class="flex items-center gap-2 ml-4">
										{#if card.due}
											<div class="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded">
												Due {new Date(card.due).toLocaleDateString()}
											</div>
										{/if}
										<div class="flex flex-col gap-1">
											<Button
												variant="minimal"
												class="text-xs hover:bg-gray-100 dark:hover:bg-gray-600"
												leftIcon="link"
												iconSize={12}
												onclick={() => window.open(card.url, '_blank')}
												tooltip="Open in browser"
											>
												View in Browser
											</Button>
											<Button
												variant="minimal"
												class="text-xs hover:bg-gray-100 dark:hover:bg-gray-600"
												leftIcon="trello"
												iconSize={12}
												onclick={() => openCardModal(card)}
												tooltip="View card details"
											>
												Open Card
											</Button>
										</div>
									</div>
								</div>
								{#if card.labels.length > 0}
									<div class="flex gap-2 mt-2 items-center">
										{#each card.labels.slice(0, 3) as label}
											{@const { bgColor, textColor } = getLabelColors(label.color)}
											<span
												class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {textColor} ring-1 ring-black/10 dark:ring-white/10"
												style="background-color: {bgColor}"
											>
												{label.name || label.color}
											</span>
										{/each}
										{#if card.labels.length > 3}
											<span class="text-xs text-gray-500 dark:text-gray-400">
												+{card.labels.length - 3} more
											</span>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
						</div>
					</div>
				{:else if hasSearched && searchResults.length === 0}
					<!-- No Results -->
					<div class="flex-1 flex items-center justify-center py-8">
						<div class="text-center">
							<Icon name="search" size={48} class="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
							<p class="text-gray-500 dark:text-gray-400 text-sm mb-2">
								No cards found for "{searchQuery}"
							</p>
							<p class="text-xs text-gray-400 dark:text-gray-500">
								Try adjusting your search terms or filters
							</p>
						</div>
					</div>
				{:else if searchError}
					<!-- Search Error -->
					<div class="flex-1 flex items-center justify-center py-8">
						<div class="text-center">
							<Icon name="triangleAlert" size={48} class="text-red-300 dark:text-red-600 mx-auto mb-4" />
							<p class="text-red-600 dark:text-red-400 text-sm mb-2">
								Search Error
							</p>
							<p class="text-xs text-red-500 dark:text-red-400">
								{searchError}
							</p>
						</div>
					</div>
				{:else}
					<!-- Default State - No Search -->
					<div class="flex-1 flex items-center justify-center py-8">
						<div class="text-center">
							<Icon name="search" size={48} class="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
							<p class="text-gray-500 dark:text-gray-400 text-sm mb-2">
								Use the search above to find Trello cards
							</p>
							<p class="text-xs text-gray-400 dark:text-gray-500">
								Search by name, description, or apply filters to refine results
							</p>
						</div>
					</div>
				{/if}
			{:else}
				<!-- Not connected: Show placeholder -->
				<div class="flex-1 flex items-center justify-center py-8">
					<div class="text-center">
						<Icon name="trello" size={48} class="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
						<p class="text-gray-500 dark:text-gray-400 text-sm mb-2">
							{connectionStatus === 'unconfigured' ? 'Configure Trello credentials to unlock features' : 'Establish connection to see available features'}
						</p>
						{#if connectionStatus === 'disconnected'}
							<Button variant="primary" onclick={testConnection} loading={isTesting} class="text-sm">
								Retry Connection
							</Button>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
{:else}
<div class="container mx-auto p-4">
	<div class={CARD}>
		<div class="flex items-center gap-3">
			<div class="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
			<span class="text-gray-600 dark:text-gray-400">Loading configuration...</span>
		</div>
	</div>
</div>
{/if}

<!-- Card Detail Modal -->
<TrelloCardModal 
	isVisible={isCardModalVisible}
	card={selectedCard}
	trelloApi={trelloApi}
	onClose={closeCardModal}
/>