<script lang="ts">
	import Icon from "./Icon.svelte";
	import Button from "./Button.svelte";
	import { showError } from "../stores/toast.svelte.ts";
	import { tooltip } from "../utils/tooltip";
	import type { TrelloCardDetails, TrelloCard } from "../utils/TrelloTypes";
	import type { TrelloAPI } from "../utils/TrelloAPI";

	interface Props {
		isVisible: boolean;
		card: TrelloCard | null;
		trelloApi: TrelloAPI | null;
		onClose: () => void;
	}

	let { isVisible, card, trelloApi, onClose }: Props = $props();

	let cardDetails = $state<TrelloCardDetails | null>(null);
	let isLoading = $state(false);
	let loadError = $state<string>("");
	let closeButtonRef = $state<any>();

	// Avatar caching - 3 month lifespan
	const AVATAR_CACHE_KEY = 'trello:avatars';
	const AVATAR_CACHE_TTL = 3 * 30 * 24 * 60 * 60 * 1000; // 3 months in milliseconds

	interface AvatarCacheEntry {
		url: string;
		timestamp: number;
		avatar: string; // base64 or blob URL
	}

	function getCachedAvatar(url: string): string | null {
		try {
			const cache = JSON.parse(localStorage.getItem(AVATAR_CACHE_KEY) || '{}');
			const entry: AvatarCacheEntry = cache[url];
			if (entry && (Date.now() - entry.timestamp < AVATAR_CACHE_TTL)) {
				return entry.avatar;
			}
		} catch (e) {
			console.warn('Failed to read avatar cache:', e);
		}
		return null;
	}

	function setCachedAvatar(url: string, avatar: string) {
		try {
			const cache = JSON.parse(localStorage.getItem(AVATAR_CACHE_KEY) || '{}');
			cache[url] = {
				url,
				timestamp: Date.now(),
				avatar
			};
			// Clean old entries to prevent unbounded growth
			const keys = Object.keys(cache);
			if (keys.length > 100) { // Keep max 100 avatars
				const sortedEntries = keys.map(k => cache[k]).sort((a, b) => a.timestamp - b.timestamp);
				const toRemove = sortedEntries.slice(0, keys.length - 50); // Remove oldest 50
				toRemove.forEach(entry => delete cache[entry.url]);
			}
			localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(cache));
		} catch (e) {
			console.warn('Failed to cache avatar:', e);
		}
	}

	// Get member avatar URL
	function getMemberAvatar(member: any): string {
		if (!member) return '';

		// Prefer the URL Trello returns. It's already the correct base path.
		if (member.avatarUrl) {
			// If it's already sized, use it; otherwise append a size.
			if (/\/(30|50|170|original)\.png$/i.test(member.avatarUrl)) return member.avatarUrl;
			return `${member.avatarUrl}/170.png`;
		}

		// Legacy fallback: only if you have BOTH id and avatarHash.
		if (member.id && member.avatarHash) {
			return `https://trello-members.s3.amazonaws.com/${member.id}/${member.avatarHash}/170.png`;
		}

		return '';
	}

	// Trello label color mapping (same as in parent)
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
		const needsLightText = ['green', 'red', 'purple', 'blue', 'black'].includes(color);
		const textColor = needsLightText ? 'text-white' : 'text-gray-900';
		return { bgColor, textColor };
	}


	// Format relative time
	function formatRelativeTime(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'just now';
		if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
		if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
		if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
		return date.toLocaleDateString();
	}

	// Format file size
	function formatFileSize(bytes: number | undefined): string {
		if (!bytes) return '';
		const units = ['B', 'KB', 'MB', 'GB'];
		let size = bytes;
		let unitIndex = 0;
		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex++;
		}
		return `${size.toFixed(1)} ${units[unitIndex]}`;
	}

	// Get action description
	function getActionDescription(action: any): string {
		switch (action.type) {
			case 'commentCard':
				return action.data.text || '';
			case 'createCard':
				return 'created this card';
			case 'updateCard':
				// Handle specific card updates
				if (action.data.card?.closed !== undefined) {
					return action.data.card.closed ? 'archived this card' : 'sent this card to the board';
				}
				if (action.data.listAfter && action.data.listBefore) {
					return `moved this card from ${action.data.listBefore.name} to ${action.data.listAfter.name}`;
				}
				if (action.data.old?.name !== undefined && action.data.card?.name) {
					return `renamed this card (from "${action.data.old.name}")`;
				}
				if (action.data.old?.desc !== undefined) {
					return action.data.card?.desc ? 'changed the description of this card' : 'removed the description from this card';
				}
				return `updated this card [${action.type}]`;
			case 'updateCard:closed':
				return action.data.card?.closed ? 'archived this card' : 'sent this card to the board';
			case 'updateCard:idList':
				if (action.data.listAfter && action.data.listBefore) {
					return `moved this card from ${action.data.listBefore.name} to ${action.data.listAfter.name}`;
				}
				return 'moved this card';
			case 'updateCard:name':
				return `renamed this card (from "${action.data.old?.name || 'previous name'}")`;
			case 'updateCard:desc':
				return action.data.card?.desc ? 'changed the description of this card' : 'removed the description from this card';
			case 'addMemberToCard':
				// In Trello, when someone joins a card, it shows as "joined this card"
				return 'joined this card';
			case 'removeMemberFromCard':
				const removedMember = action.data.member?.fullName || action.data.member?.username || 'a member';
				return `removed ${removedMember} from this card`;
			case 'moveCardFromBoard':
				const fromBoard = action.data.boardSource?.name || 'another board';
				return `transferred this card from ${fromBoard}`;
			case 'moveCardToBoard':
				const toBoard = action.data.board?.name || 'another board';
				return `transferred this card to ${toBoard}`;
			case 'addAttachmentToCard':
				return `attached ${action.data.attachment?.name || 'a file'} to this card`;
			case 'deleteAttachmentFromCard':
				return `deleted the ${action.data.attachment?.name || 'attachment'} attachment from this card`;
			case 'updateCheckItemStateOnCard':
				const state = action.data.checkItem?.state === 'complete' ? 'completed' : 'marked incomplete';
				return `${state} ${action.data.checkItem?.name || 'checklist item'} on this card`;
			case 'addChecklistToCard':
				return `added ${action.data.checklist?.name || 'a checklist'} to this card`;
			case 'removeChecklistFromCard':
				return `removed ${action.data.checklist?.name || 'a checklist'} from this card`;
			case 'updateChecklist':
				return `renamed ${action.data.checklist?.name || 'a checklist'}`;
			case 'createChecklist':
				return `added ${action.data.checklist?.name || 'a checklist'} to this card`;
			case 'deleteChecklist':
				return `removed ${action.data.checklist?.name || 'a checklist'} from this card`;
			case 'copyCard':
				const sourceList = action.data.listSource?.name || 'another list';
				const sourceCard = action.data.cardSource?.name || action.data.card?.name || 'a card';
				return `copied this card from ${sourceCard} in list ${sourceList}`;
			case 'copyCommentCard':
				return 'copied a comment to this card';
			default:
				return action.type
					? action.type.replace(/([A-Z])/g, ' $1').toLowerCase()
					: 'activity';
		}
	}

	// Load card details when card changes
	$effect(() => {
		if (isVisible && card && trelloApi) {
			loadCardDetails();
		}
	});

	// Focus management
	$effect(() => {
		if (isVisible && closeButtonRef) {
			closeButtonRef.focus?.();
		}
	});

	async function loadCardDetails() {
		if (!card || !trelloApi) return;

		isLoading = true;
		loadError = "";

		try {
			cardDetails = await trelloApi.getCardDetails(card.id);
		} catch (error) {
			loadError = error instanceof Error ? error.message : "Failed to load card details";
			showError(`Failed to load card details: ${loadError}`);
		} finally {
			isLoading = false;
		}
	}

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

	// Calculate checklist progress
	function getChecklistProgress(checklist: any) {
		if (!checklist.checkItems || checklist.checkItems.length === 0) return 0;
		const completed = checklist.checkItems.filter((item: any) => item.state === 'complete').length;
		return Math.round((completed / checklist.checkItems.length) * 100);
	}

	// Filter only comment actions
	let comments = $derived(
		cardDetails?.actions?.filter(action => action.type === 'commentCard') || []
	);

	// Activity section collapsible state
	let isActivityCollapsed = $state(false);

	// Filter and process activity actions to match Trello's behavior
	let filteredActivity = $derived(
		!cardDetails?.actions ? [] :
		cardDetails.actions
			.filter(action => {
				switch (action.type) {
					case 'commentCard':
						return false; // Comments shown separately
					case 'updateCard':
						return true; // Include all updateCard for now - will refine based on behavior
					case 'updateCheckItemStateOnCard':
						return true; // Checklist completions
					case 'addMemberToCard':
						return true; // Member joins
					case 'removeMemberFromCard':
						return true; // Member removals
					case 'addAttachmentToCard':
						return true; // Attachments
					case 'deleteAttachmentFromCard':
						return true; // Attachment removals
					case 'copyCard':
						return true; // Card copying
					case 'createChecklist':
					case 'deleteChecklist':
					case 'addChecklistToCard':
					case 'removeChecklistFromCard':
						return true; // Checklist operations
					default:
						// Keep it — the description builder will render a reasonable fallback.
						return Boolean(action.type);
				}
			})
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
			.slice(0, 15) // Show up to 15 recent actions like Trello
	);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isVisible}
	<div
		class="fixed inset-0 bg-gray-900/20 dark:bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="card-modal-title"
		tabindex="-1"
	>
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
			<!-- Header -->
			<div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
				<div class="flex items-center space-x-3 min-w-0 flex-1">
					<Icon name="trello" size={20} class="text-blue-600 dark:text-blue-400 flex-shrink-0" />
					<h2 id="card-modal-title" class="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
						{card?.name || "Card Details"}
					</h2>
				</div>
				<Button
					bind:this={closeButtonRef}
					variant="ghost"
					iconOnly="close"
					iconSize={20}
					class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
					onclick={onClose}
					title="Close"
					aria-label="Close modal"
				/>
			</div>

			<!-- Breadcrumb -->
			{#if cardDetails}
				<div class="px-6 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
					<div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
						<span class="font-medium">{cardDetails.board.name}</span>
						<Icon name="chevronRight" size={16} class="mx-2" />
						<span>{cardDetails.list.name}</span>
					</div>
				</div>
			{/if}

			<!-- Content -->
			<div class="flex-1 overflow-y-auto">
				{#if isLoading}
					<div class="flex items-center justify-center h-64">
						<div class="text-center">
							<div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
							<p class="text-gray-600 dark:text-gray-300">Loading card details...</p>
						</div>
					</div>
				{:else if loadError}
					<div class="flex items-center justify-center h-64">
						<div class="text-center">
							<Icon name="triangleAlert" size={48} class="text-red-500 mx-auto mb-3" />
							<p class="text-red-600 dark:text-red-400">{loadError}</p>
						</div>
					</div>
				{:else if cardDetails}
					<div class="p-6 space-y-6">
						<!-- Labels -->
						{#if cardDetails.labels.length > 0}
							<div class="flex flex-wrap gap-2">
								{#each cardDetails.labels as label}
									{@const { bgColor, textColor } = getLabelColors(label.color)}
									<span
										class="inline-flex items-center px-3 py-1 rounded text-sm font-medium {textColor}"
										style="background-color: {bgColor}"
									>
										{label.name || label.color}
									</span>
								{/each}
							</div>
						{/if}

						<!-- Members and Due Date -->
						<div class="flex flex-wrap gap-4 items-center">
							<!-- Members -->
							{#if cardDetails.members.length > 0}
								<div class="flex items-center gap-3">
									<Icon name="users" size={16} class="text-gray-500 dark:text-gray-400" />
									<div class="flex gap-2">
										{#each cardDetails.members as member}
											{@const avatarUrl = getMemberAvatar(member)}
											<div class="relative">
												{#if avatarUrl}
													<img
														src={avatarUrl}
														alt={member.fullName || member.username}
														class="w-8 h-8 rounded-full ring-2 ring-white dark:ring-gray-800 object-cover"
														use:tooltip={member.fullName ? `${member.fullName} (@${member.username})` : `@${member.username}`}
														loading="lazy"
														onerror={(e) => {
															// Fallback to initials on error
															const img = e.target;
															img.style.display = 'none';
															if (img.nextElementSibling) {
																img.nextElementSibling.style.display = 'flex';
															}
														}}
													/>
													<div
														class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-200 ring-2 ring-white dark:ring-gray-800"
														style="display: none;"
														use:tooltip={member.fullName ? `${member.fullName} (@${member.username})` : `@${member.username}`}
													>
														{(member.fullName || member.username).charAt(0).toUpperCase()}
													</div>
												{:else}
													<div
														class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-200 ring-2 ring-white dark:ring-gray-800"
														use:tooltip={member.fullName ? `${member.fullName} (@${member.username})` : `@${member.username}`}
													>
														{(member.fullName || member.username).charAt(0).toUpperCase()}
													</div>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Due Date -->
							{#if cardDetails.due}
								<div class="flex items-center gap-2 text-sm">
									<Icon name="clock" size={16} class="{cardDetails.badges.dueComplete ? 'text-green-600' : new Date(cardDetails.due) < new Date() ? 'text-red-600' : 'text-gray-500'}" />
									<span class="{cardDetails.badges.dueComplete ? 'text-green-600 line-through' : new Date(cardDetails.due) < new Date() ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}">
										Due {new Date(cardDetails.due).toLocaleDateString()}
									</span>
								</div>
							{/if}
						</div>

						<!-- Description -->
						{#if cardDetails.desc}
							<div>
								<h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Description</h3>
								<div class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
									{cardDetails.desc}
								</div>
							</div>
						{/if}

						<!-- Checklists -->
						{#if cardDetails.checklists && cardDetails.checklists.length > 0}
							<div>
								<h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
									<Icon name="listChecks" size={16} />
									Checklists
								</h3>
								<div class="space-y-4">
									{#each cardDetails.checklists as checklist}
										{@const progress = getChecklistProgress(checklist)}
										<div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
											<div class="flex items-center justify-between mb-3">
												<h4 class="font-medium text-gray-900 dark:text-gray-100">{checklist.name}</h4>
												<span class="text-sm text-gray-600 dark:text-gray-400">{progress}%</span>
											</div>
											<div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-3">
												<div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: {progress}%"></div>
											</div>
											<div class="space-y-2">
												{#each checklist.checkItems as item}
													<div class="flex items-start gap-2">
														<div class="mt-0.5">
															{#if item.state === 'complete'}
																<Icon name="success" size={16} class="text-green-600 dark:text-green-400" />
															{:else}
																<div class="w-4 h-4 border-2 border-gray-300 dark:border-gray-500 rounded"></div>
															{/if}
														</div>
														<span class="{item.state === 'complete' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}">
															{item.name}
														</span>
													</div>
												{/each}
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Attachments -->
						{#if cardDetails.attachments && cardDetails.attachments.length > 0}
							<div>
								<h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
									<Icon name="paperclip" size={16} />
									Attachments
								</h3>
								<div class="space-y-2">
									{#each cardDetails.attachments as attachment}
										<a
											href={attachment.url}
											target="_blank"
											rel="noopener noreferrer"
											class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
										>
											<Icon name="file" size={20} class="text-gray-500 dark:text-gray-400 flex-shrink-0" />
											<div class="flex-1 min-w-0">
												<div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
													{attachment.name}
												</div>
												<div class="text-xs text-gray-500 dark:text-gray-400">
													{formatFileSize(attachment.bytes)} • Added {formatRelativeTime(attachment.date)}
												</div>
											</div>
											<Icon name="link" size={16} class="text-gray-400 dark:text-gray-500 flex-shrink-0" />
										</a>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Comments -->
						{#if comments.length > 0}
							<div>
								<h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
									<Icon name="messageCircle" size={16} />
									Comments
								</h3>
								<div class="space-y-3">
									{#each comments as comment}
										{@const avatarUrl = getMemberAvatar(comment.memberCreator)}
										<div class="flex gap-3">
											<div class="relative">
												{#if avatarUrl}
													<img
														src={avatarUrl}
														alt={comment.memberCreator.fullName || comment.memberCreator.username}
														class="w-8 h-8 rounded-full ring-2 ring-white dark:ring-gray-800 object-cover"
														use:tooltip={comment.memberCreator.fullName ? `${comment.memberCreator.fullName} (@${comment.memberCreator.username})` : `@${comment.memberCreator.username}`}
														loading="lazy"
														onerror={(e) => {
															// Fallback to initials on error
															const img = e.target;
															img.style.display = 'none';
															img.nextElementSibling.style.display = 'flex';
														}}
													/>
													<div
														class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-200 ring-2 ring-white dark:ring-gray-800"
														style="display: none;"
														use:tooltip={comment.memberCreator.fullName ? `${comment.memberCreator.fullName} (@${comment.memberCreator.username})` : `@${comment.memberCreator.username}`}
													>
														{(comment.memberCreator.fullName || comment.memberCreator.username).charAt(0).toUpperCase()}
													</div>
												{:else}
													<div
														class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-200 ring-2 ring-white dark:ring-gray-800"
														use:tooltip={comment.memberCreator.fullName ? `${comment.memberCreator.fullName} (@${comment.memberCreator.username})` : `@${comment.memberCreator.username}`}
													>
														{(comment.memberCreator.fullName || comment.memberCreator.username).charAt(0).toUpperCase()}
													</div>
												{/if}
											</div>
											<div class="flex-1">
												<div class="flex items-baseline gap-2 mb-1">
													<span class="text-sm font-medium text-gray-900 dark:text-gray-100">
														{comment.memberCreator.fullName}
													</span>
													<span class="text-xs text-gray-500 dark:text-gray-400">
														{formatRelativeTime(comment.date)}
													</span>
												</div>
												<div class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
													{comment.data.text}
												</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Activity (excluding comments) -->
						<div>
								<button
									class="w-full flex items-center justify-between text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
									onclick={() => isActivityCollapsed = !isActivityCollapsed}
								>
									<span>Activity {filteredActivity.length > 0 ? `(${filteredActivity.length})` : '(DEBUG)'}</span>
									<Icon
										name="chevronDown"
										size={16}
										class="transform transition-transform {isActivityCollapsed ? '-rotate-90' : 'rotate-0'}"
									/>
								</button>

								<!-- Debug Panel (temporary) -->
								{#if filteredActivity.length === 0}
									<div class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs">
										<div class="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Debug Information:</div>
										<div class="space-y-1 text-yellow-800 dark:text-yellow-200">
											<div>Card Details Loaded: {cardDetails ? '✅ Yes' : '❌ No'}</div>
											<div>Actions Array: {cardDetails?.actions ? `✅ Yes (${cardDetails.actions.length} total)` : '❌ No'}</div>
											<div>Filtered Activity Count: {filteredActivity.length}</div>
											<div class="text-xs mt-2">All actions filtered out - check console for action types</div>
										</div>
									</div>
								{/if}
								{#if !isActivityCollapsed}
									<div class="space-y-2">
										{#if filteredActivity.length > 0}
											{#each filteredActivity as action}
											{@const avatarUrl = getMemberAvatar(action.memberCreator)}
											<div class="flex items-center gap-3 text-sm">
												<div class="relative">
													{#if avatarUrl}
														<img
															src={avatarUrl}
															alt={action.memberCreator.fullName || action.memberCreator.username}
															class="w-8 h-8 rounded-full ring-2 ring-white dark:ring-gray-800 object-cover"
															use:tooltip={action.memberCreator.fullName ? `${action.memberCreator.fullName} (@${action.memberCreator.username})` : `@${action.memberCreator.username}`}
															loading="lazy"
															onerror={(e) => {
																// Fallback to initials on error
																const img = e.target;
																img.style.display = 'none';
																img.nextElementSibling.style.display = 'flex';
															}}
														/>
														<div
															class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-200 ring-2 ring-white dark:ring-gray-800"
															style="display: none;"
															use:tooltip={action.memberCreator.fullName ? `${action.memberCreator.fullName} (@${action.memberCreator.username})` : `@${action.memberCreator.username}`}
														>
															{(action.memberCreator.fullName || action.memberCreator.username).charAt(0).toUpperCase()}
														</div>
													{:else}
														<div
															class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-200 ring-2 ring-white dark:ring-gray-800"
															use:tooltip={action.memberCreator.fullName ? `${action.memberCreator.fullName} (@${action.memberCreator.username})` : `@${action.memberCreator.username}`}
														>
															{(action.memberCreator.fullName || action.memberCreator.username).charAt(0).toUpperCase()}
														</div>
													{/if}
												</div>
												<div class="flex-1 flex items-center justify-between">
													<div>
														<span class="font-medium text-gray-900 dark:text-gray-100">
															{action.memberCreator.fullName}
														</span>
														<span class="text-gray-600 dark:text-gray-400 ml-1">
															{getActionDescription(action)}
														</span>
													</div>
													<span class="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
														{formatRelativeTime(action.date)}
													</span>
												</div>
											</div>
										{/each}
									{:else}
										<div class="p-4 text-center text-gray-500 dark:text-gray-400">
											<div class="text-sm">No activity found</div>
											<div class="text-xs mt-1">Check console for debug information</div>
										</div>
									{/if}
									</div>
								{/if}
							</div>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
				<Button
					variant="secondary"
					leftIcon="link"
					onclick={() => window.open(card?.url, '_blank')}
					disabled={!card?.url}
				>
					View in Trello
				</Button>
				<Button variant="primary" onclick={onClose}>
					Close
				</Button>
			</div>
		</div>
	</div>
{/if}