export type TrelloConnectionStatus = 'unconfigured' | 'testing' | 'connected' | 'disconnected';

export interface TrelloCredentials {
	key: string;
	token: string;
}

export interface TrelloUserData {
	id: string;
	username: string;
	fullName: string;
	avatarUrl?: string;
	bio?: string;
	dateLastActive?: string;
}

export interface TrelloBoard {
	id: string;
	name: string;
	memberships?: TrelloMembership[];
}

export interface TrelloMembership {
	id: string;
	idMember: string;
	memberType: 'admin' | 'normal' | 'observer';
}

export interface TrelloOrganization {
	id: string;
	name: string;
	displayName: string;
}

export interface TrelloUserStatistics {
	fullName: string;
	username: string;
	avatarUrl: string | null;
	boardCount: number;
	organizationCount: number;
	adminBoardCount: number;
	bio?: string | undefined;
	memberSince?: string | undefined;
}

export interface TrelloApiError {
	status: number;
	statusText: string;
	message: string;
}

export interface TrelloConnectionResult {
	success: boolean;
	user?: TrelloUserData;
	statistics?: TrelloUserStatistics;
	error?: TrelloApiError;
}

// Search-related interfaces
export interface TrelloCard {
	id: string;
	name: string;
	desc: string;
	url: string;
	board: { id: string; name: string };
	list: { id: string; name: string };
	members: TrelloMember[];
	labels: TrelloLabel[];
	due: string | null;
	dateLastActivity: string;
}

export interface TrelloMember {
	id: string;
	username: string;
	fullName: string;
	avatarUrl?: string;
	avatarHash?: string;
}

export interface TrelloLabel {
	id: string;
	name: string;
	color: string;
}

export interface TrelloList {
	id: string;
	name: string;
	pos: number;
}

export interface SearchFilters {
	timeRange?: 'today' | 'week' | 'month' | 'custom';
	customDateRange?: { start: Date; end: Date };
	contentSearch: 'name' | 'description' | 'both';
	boardIds?: string[];
	listIds?: string[];
	memberFilter: 'me' | 'created-by-me' | 'all';
	includeArchived: boolean;
}

export interface TrelloSearchResult {
	cards: TrelloCard[];
	totalCount: number;
	hasMore: boolean;
	query: string;
	timestamp: number;
}

export interface CachedResult {
	data: any;
	timestamp: number;
	ttl: number;
}

// Detailed card data interfaces
export interface TrelloCardDetails extends TrelloCard {
	closed: boolean;
	pos: number;
	shortLink: string;
	attachments: TrelloAttachment[];
	checklists: TrelloChecklist[];
	actions: TrelloAction[];
	customFieldItems?: TrelloCustomFieldItem[];
	badges: TrelloBadges;
	cover?: TrelloCover;
}

export interface TrelloAttachment {
	id: string;
	name: string;
	url: string;
	date: string;
	mimeType?: string;
	bytes?: number;
	previews?: TrelloAttachmentPreview[];
}

export interface TrelloAttachmentPreview {
	url: string;
	width: number;
	height: number;
}

export interface TrelloChecklist {
	id: string;
	name: string;
	pos: number;
	checkItems: TrelloCheckItem[];
}

export interface TrelloCheckItem {
	id: string;
	name: string;
	state: 'complete' | 'incomplete';
	pos: number;
	due?: string | null;
}

export interface TrelloAction {
	id: string;
	type: string;
	date: string;
	memberCreator: TrelloMember;
	data: {
		text?: string;
		card?: { id: string; name: string };
		board?: { id: string; name: string };
		list?: { id: string; name: string };
		attachment?: { id: string; name: string };
		checklist?: { id: string; name: string };
		checkItem?: { id: string; name: string; state: string };
	};
}

export interface TrelloCustomFieldItem {
	id: string;
	idCustomField: string;
	value?: {
		text?: string;
		number?: string;
		date?: string;
		checked?: string;
		option?: string;
	};
}

export interface TrelloBadges {
	attachments: number;
	comments: number;
	votes: number;
	viewingMemberVoted: boolean;
	subscribed: boolean;
	fogbugz: string;
	checkItems: number;
	checkItemsChecked: number;
	description: boolean;
	due: string | null;
	dueComplete: boolean;
}

export interface TrelloCover {
	idAttachment?: string;
	color?: string;
	brightness?: 'light' | 'dark';
	size?: 'normal' | 'full';
}