import type {
	TrelloCredentials,
	TrelloUserData,
	TrelloBoard,
	TrelloOrganization,
	TrelloUserStatistics,
	TrelloApiError,
	TrelloConnectionResult,
	TrelloCard,
	TrelloList,
	SearchFilters,
	TrelloSearchResult,
	CachedResult,
	TrelloCardDetails
} from './TrelloTypes';

export class TrelloAPI {
	private readonly baseUrl = 'https://api.trello.com/1';
	
	// Caching system
	private searchCache = new Map<string, CachedResult>();
	private boardCache = new Map<string, CachedResult>();
	private listCache = new Map<string, CachedResult>();
	private cardDetailsCache = new Map<string, CachedResult>();
	private readonly maxCacheSize = 50;
	private readonly searchCacheTTL = 5 * 60 * 1000; // 5 minutes
	private readonly structuralCacheTTL = 15 * 60 * 1000; // 15 minutes
	private readonly cardDetailsCacheTTL = 10 * 60 * 1000; // 10 minutes
	
	// Request management
	private currentSearchRequest: AbortController | null = null;
	
	constructor(private credentials: TrelloCredentials) {}

	private buildUrl(endpoint: string): string {
		const url = new URL(`${this.baseUrl}${endpoint}`);
		url.searchParams.set('key', this.credentials.key);
		url.searchParams.set('token', this.credentials.token);
		return url.toString();
	}

	private async makeRequest<T>(endpoint: string): Promise<T> {
		const response = await fetch(this.buildUrl(endpoint), {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
			},
		});

		if (!response.ok) {
			const error: TrelloApiError = {
				status: response.status,
				statusText: response.statusText,
				message: this.getErrorMessage(response.status)
			};
			throw error;
		}

		return response.json();
	}

	private getErrorMessage(status: number): string {
		switch (status) {
			case 401:
				return 'Invalid API credentials';
			case 403:
				return 'API access forbidden';
			case 429:
				return 'API rate limit exceeded';
			case 500:
				return 'Trello server error';
			default:
				return `API error: ${status}`;
		}
	}

	/**
	 * Get current user profile
	 */
	async getCurrentUser(): Promise<TrelloUserData> {
		return this.makeRequest<TrelloUserData>('/members/me');
	}

	/**
	 * Get user's boards
	 */
	async getUserBoards(): Promise<TrelloBoard[]> {
		return this.makeRequest<TrelloBoard[]>('/members/me/boards');
	}

	/**
	 * Get user's organizations
	 */
	async getUserOrganizations(): Promise<TrelloOrganization[]> {
		return this.makeRequest<TrelloOrganization[]>('/members/me/organizations');
	}

	/**
	 * Test connection and get basic user info
	 */
	async testConnection(): Promise<TrelloConnectionResult> {
		try {
			const user = await this.getCurrentUser();
			return {
				success: true,
				user
			};
		} catch (error) {
			if (error && typeof error === 'object' && 'status' in error) {
				return {
					success: false,
					error: error as TrelloApiError
				};
			}
			
			const apiError: TrelloApiError = {
				status: 0,
				statusText: 'Network Error',
				message: error instanceof Error ? error.message : 'Unknown error'
			};
			
			return {
				success: false,
				error: apiError
			};
		}
	}

	/**
	 * Get comprehensive user statistics
	 */
	async getUserStatistics(): Promise<TrelloUserStatistics> {
		const [user, boards, organizations] = await Promise.all([
			this.getCurrentUser(),
			this.getUserBoards(),
			this.getUserOrganizations()
		]);

		// Count admin boards
		const adminBoardCount = boards.filter(board => 
			board.memberships?.some(membership => 
				membership.memberType === 'admin' && membership.idMember === user.id
			)
		).length;

		return {
			fullName: user.fullName || user.username,
			username: user.username,
			avatarUrl: user.avatarUrl ? `${user.avatarUrl}/50.png` : null,
			boardCount: boards.length,
			organizationCount: organizations.length,
			adminBoardCount,
			bio: user.bio || undefined,
			memberSince: user.dateLastActive ? new Date(user.dateLastActive).toLocaleDateString() : undefined
		};
	}

	/**
	 * Test connection and get full statistics
	 */
	async testConnectionWithStats(): Promise<TrelloConnectionResult> {
		try {
			const [user, statistics] = await Promise.all([
				this.getCurrentUser(),
				this.getUserStatistics()
			]);

			return {
				success: true,
				user,
				statistics
			};
		} catch (error) {
			if (error && typeof error === 'object' && 'status' in error) {
				return {
					success: false,
					error: error as TrelloApiError
				};
			}
			
			const apiError: TrelloApiError = {
				status: 0,
				statusText: 'Network Error',
				message: error instanceof Error ? error.message : 'Unknown error'
			};
			
			return {
				success: false,
				error: apiError
			};
		}
	}

	/**
	 * Caching helper methods
	 */
	private setCache(cache: Map<string, CachedResult>, key: string, data: any, ttl: number): void {
		// Implement LRU by removing oldest entries if cache is full
		if (cache.size >= this.maxCacheSize) {
			const firstKey = cache.keys().next().value;
			if (firstKey) cache.delete(firstKey);
		}
		
		cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl
		});
	}

	private getCache(cache: Map<string, CachedResult>, key: string): any | null {
		const cached = cache.get(key);
		if (!cached) return null;
		
		// Check if expired
		if (Date.now() - cached.timestamp > cached.ttl) {
			cache.delete(key);
			return null;
		}
		
		// Move to end (LRU)
		cache.delete(key);
		cache.set(key, cached);
		
		return cached.data;
	}

	private clearExpiredCache(): void {
		const now = Date.now();
		const clearCache = (cache: Map<string, CachedResult>) => {
			for (const [key, value] of cache.entries()) {
				if (now - value.timestamp > value.ttl) {
					cache.delete(key);
				}
			}
		};
		
		clearCache(this.searchCache);
		clearCache(this.boardCache);
		clearCache(this.listCache);
		clearCache(this.cardDetailsCache);
	}

	/**
	 * Get board lists with caching
	 */
	async getBoardLists(boardId: string): Promise<TrelloList[]> {
		const cacheKey = `lists-${boardId}`;
		const cached = this.getCache(this.listCache, cacheKey);
		if (cached) return cached;

		const lists = await this.makeRequest<TrelloList[]>(`/boards/${boardId}/lists`);
		this.setCache(this.listCache, cacheKey, lists, this.structuralCacheTTL);
		return lists;
	}

	/**
	 * Build Trello search query from filters
	 */
	private buildSearchQuery(query: string, filters: SearchFilters = { contentSearch: 'both', memberFilter: 'all', includeArchived: false }): string {
		let searchQuery = query.trim();
		
		// Add time range filters
		if (filters.timeRange) {
			switch (filters.timeRange) {
				case 'today':
					searchQuery += ' edited:day';
					break;
				case 'week':
					searchQuery += ' edited:week';
					break;
				case 'month':
					searchQuery += ' edited:month';
					break;
			}
		}
		
		// Add content search filters
		if (filters.contentSearch === 'name') {
			searchQuery = `name:"${query}"`;
		} else if (filters.contentSearch === 'description') {
			searchQuery = `description:"${query}"`;
		}
		
		return searchQuery;
	}

	/**
	 * Search Trello cards with advanced filtering and caching
	 */
	async searchCards(query: string, filters: SearchFilters = { contentSearch: 'both', memberFilter: 'all', includeArchived: false }): Promise<TrelloSearchResult> {
		// Cancel previous search request
		if (this.currentSearchRequest) {
			this.currentSearchRequest.abort();
		}
		
		this.currentSearchRequest = new AbortController();
		
		// Build cache key
		const cacheKey = `search-${query}-${JSON.stringify(filters)}`;
		const cached = this.getCache(this.searchCache, cacheKey);
		if (cached) return cached;
		
		// Clean expired cache periodically
		this.clearExpiredCache();
		
		try {
			const searchQuery = this.buildSearchQuery(query, filters);
			const url = new URL(`${this.baseUrl}/search`);
			url.searchParams.set('key', this.credentials.key);
			url.searchParams.set('token', this.credentials.token);
			url.searchParams.set('query', searchQuery);
			url.searchParams.set('modelTypes', 'cards');
			url.searchParams.set('card_fields', 'name,desc,url,board,list,members,labels,due,dateLastActivity');
			url.searchParams.set('card_board', 'true');
			url.searchParams.set('card_list', 'true');
			url.searchParams.set('card_members', 'true');
			url.searchParams.set('card_labels', 'true');
			url.searchParams.set('cards_limit', '50');
			url.searchParams.set('partial', 'true');
			
			// Add board filters if specified
			if (filters.boardIds && filters.boardIds.length > 0) {
				url.searchParams.set('idBoards', filters.boardIds.join(','));
			}

			const response = await fetch(url.toString(), {
				method: 'GET',
				headers: {
					'Accept': 'application/json',
				},
				signal: this.currentSearchRequest.signal
			});

			if (!response.ok) {
				throw new Error(`Search failed: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			
			// Process and filter results
			let cards: TrelloCard[] = data.cards || [];
			
			// Apply member filter
			if (filters.memberFilter === 'me') {
				const currentUser = await this.getCurrentUser();
				cards = cards.filter(card => 
					card.members.some(member => member.id === currentUser.id)
				);
			} else if (filters.memberFilter === 'created-by-me') {
				// This would require additional API call or different approach
				// For now, we'll skip this filter
			}
			
			// Apply list filters if specified
			if (filters.listIds && filters.listIds.length > 0) {
				cards = cards.filter(card => 
					filters.listIds!.includes(card.list.id)
				);
			}
			
			const result: TrelloSearchResult = {
				cards,
				totalCount: cards.length,
				hasMore: cards.length >= 50, // API limit reached
				query,
				timestamp: Date.now()
			};
			
			// Cache the result
			this.setCache(this.searchCache, cacheKey, result, this.searchCacheTTL);
			
			return result;
			
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				// Request was cancelled, return empty result
				return {
					cards: [],
					totalCount: 0,
					hasMore: false,
					query,
					timestamp: Date.now()
				};
			}
			throw error;
		} finally {
			this.currentSearchRequest = null;
		}
	}

	/**
	 * Cancel current search request
	 */
	cancelSearch(): void {
		if (this.currentSearchRequest) {
			this.currentSearchRequest.abort();
			this.currentSearchRequest = null;
		}
	}

	/**
	 * Get detailed card information including attachments, checklists, and comments
	 */
	async getCardDetails(cardId: string): Promise<TrelloCardDetails> {
		const cacheKey = `card-${cardId}`;
		const cached = this.getCache(this.cardDetailsCache, cacheKey);
		if (cached) return cached;

		try {
			const url = new URL(`${this.baseUrl}/cards/${encodeURIComponent(cardId)}`);
			const p = url.searchParams;

			// auth
			p.set('key', this.credentials.key);
			p.set('token', this.credentials.token);

			// core card fields (card-level "fields" must only contain card fields)
			p.set(
				'fields',
				'name,desc,url,idBoard,idList,labels,due,dateLastActivity,closed,pos,shortLink,badges,cover,customFieldItems'
			);

			// include related entities
			p.set('board', 'true');
			p.set('list', 'true');
			p.set('members', 'true');
			p.set('member_fields', 'id,username,fullName,avatarUrl,avatarHash,initials');

			// attachments & checklists
			p.set('attachments', 'true');
			p.set('attachment_fields', 'id,name,bytes,date,url,isUpload');
			p.set('checklists', 'all');
			p.set('checkItems', 'all');
			p.set('checkItem_fields', 'id,name,state,pos,due,dueReminder');

			// ---- ACTIVITY / ACTIONS (this is the critical bit) ----
			// ask for all, filter in UI; guarantee the fields your UI uses
			p.set('actions', 'all');
			p.set('actions_limit', '200'); // up to 1000 is allowed; 200 is usually plenty
			p.set('action_fields', 'id,type,date,data,idMemberCreator');
			p.set('action_memberCreator', 'true');
			p.set('action_memberCreator_fields', 'id,username,fullName,avatarUrl,avatarHash,initials');
			p.set('actions_display', 'false'); // you generate your own strings

			const response = await fetch(url.toString(), { method: 'GET', headers: { Accept: 'application/json' } });
			if (!response.ok) throw new Error(`Failed to fetch card details: ${response.status} ${response.statusText}`);

			const cardDetails = (await response.json()) as TrelloCardDetails;

			// sort newest first
			if (cardDetails.actions) {
				cardDetails.actions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
			}

			// sort checklists & items
			if (cardDetails.checklists) {
				cardDetails.checklists.sort((a, b) => a.pos - b.pos);
				cardDetails.checklists.forEach(cl => cl.checkItems?.sort((a, b) => a.pos - b.pos));
			}

			this.setCache(this.cardDetailsCache, cacheKey, cardDetails, this.cardDetailsCacheTTL);
			return cardDetails;
		} catch (error) {
			console.error('Error fetching card details:', error);
			throw error;
		}
	}

	/**
	 * Clear all caches
	 */
	clearCache(): void {
		this.searchCache.clear();
		this.boardCache.clear();
		this.listCache.clear();
		this.cardDetailsCache.clear();
	}
}