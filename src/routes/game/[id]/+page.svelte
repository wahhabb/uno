<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { playerStore } from '$lib/stores/player';
	import Card from '$lib/components/Card.svelte';
	import PlayerHand from '$lib/components/PlayerHand.svelte';
	import PlayArea from '$lib/components/PlayArea.svelte';
	import OpponentInfo from '$lib/components/OpponentInfo.svelte';
	import type { Card as CardType, CardColor } from '$lib/types';
	import { subscribeToGame, unsubscribeFromGame } from '$lib/services/realtime';
	import type { RealtimeChannel } from '@supabase/supabase-js';
	import { canPlayCard } from '$lib/utils/gameLogic';

	let gameId = $page.params.id;
	let email = '';
	let displayName = '';

	let game: any = null;
	let players: any[] = [];
	let myHand: CardType[] = [];
	let topCard: CardType | null = null;
	let currentColor: CardColor | null = null;
	let drawPileCount = 0;
	let loading = true;
	let error = '';
	let selectedCardId: string | null = null;
	let showColorPicker = false;
	let realtimeChannel: RealtimeChannel | null = null;
	let refreshInterval: any = null;
	let skipNotification = false;
	let recentActions: any[] = [];
	let lastSkipActionId: string | null = null; // Track which skip we've already shown
	let lastPenaltyActionId: string | null = null; // Track which penalty we've already animated

	// Animation states
	let animationMessage = '';
	let showAnimationMessage = false;
	let isAnimating = false;
	let flyingCards: Array<{
		id: string;
		startX: number;
		startY: number;
		endX: number;
		endY: number;
		isPlayingCard?: boolean;
		cardData?: CardType; // For showing actual card when playing
	}> = [];
	let hasSeenInitialHand = false;
	let visibleHandSize = 0; // Track how many cards to show during initial animation



	$: normalizedEmail = email.toLowerCase().trim();
	$: isMyTurn =
		game && players.length > 0 && players[game.current_player_index]?.email === normalizedEmail;
	$: myPlayer = players.find((p) => p.email === normalizedEmail);
	$: opponents = players.filter((p) => p.email !== normalizedEmail);
	$: gameOver = game?.status === 'completed';
	$: winner = gameOver ? players.find((p) => p.email === game.winner_email) : null;


	onMount(async () => {
		playerStore.subscribe((state) => {
			email = state.email;
			displayName = state.displayName;
		});

		if (!email) {
			goto('/');
			return;
		}

		// Initialize audio context on first user interaction
		initAudioContext();

		await loadGameState();

		// Set up realtime subscriptions
		setupRealtime();

		// Poll every 1 second for fast updates
		refreshInterval = setInterval(() => {
			if (!gameOver) {
				loadGameState();
			}
		}, 1000);
	});

	onDestroy(() => {
		if (realtimeChannel) {
			unsubscribeFromGame(realtimeChannel);
		}
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});

	function setupRealtime() {
		realtimeChannel = subscribeToGame(gameId, {
			onGameUpdate: () => {
				loadGameState();
			},
			onPlayersUpdate: () => {
				loadGameState();
			},
			onStateUpdate: () => {
				loadGameState();
			},
			onActionCreated: () => {
				loadGameState();
			}
		});
	}

	async function loadGameState() {
		// Don't poll while animating
		if (isAnimating) {
			return;
		}

		try {
			const response = await fetch(`/api/game/${gameId}?player_email=${normalizedEmail}`);
			const result = await response.json();

			if (!result.success) {
				error = 'Failed to load game';
				return;
			}

			game = result.data.game;
			players = result.data.players;
			recentActions = result.data.recent_actions || [];

			// Find my hand
			const me = players.find((p) => p.email === normalizedEmail);
			if (me) {
				// Check if this is the initial deal (hand went from 0 to multiple cards)
				if (!hasSeenInitialHand && myHand.length === 0 && me.hand.length > 0) {
					hasSeenInitialHand = true;
					myHand = me.hand;

					// Animate cards in one by one
					animateInitialDeal(me.hand.length);
				} else {
					myHand = me.hand;
					// visibleHandSize updated after penalty check below
				}
			}

			// Get top card and color
			if (result.data.game_state) {
				topCard = result.data.game_state.top_card;
				currentColor = result.data.game_state.current_color;
				drawPileCount = result.data.game_state.draw_pile_count;
			}

			// Check recent actions for penalties and skips
			if (recentActions.length > 0) {
				const lastAction = recentActions[0];

				// Check if penalty cards were just given to me
				if (lastAction.action_data?.cards_drawn_by_next_player > 0 &&
				    lastAction.id !== lastPenaltyActionId) {

					// Figure out who received the penalty cards
					// DEBUG: Check penalty

					const penaltyRecipient = lastAction.action_data?.penalty_recipient;

					// Show animation if I received penalty cards
					if (penaltyRecipient === normalizedEmail) {
						lastPenaltyActionId = lastAction.id;

						// Show penalty animation (don't await, let it run async)
						setTimeout(async () => {
							await animatePenaltyCardsForMe(lastAction.action_data.cards_drawn_by_next_player);

							// After animation, show skip notification
							skipNotification = true;
							setTimeout(() => {
								skipNotification = false;
							}, 3000);
						}, 100);
					}
				}

				// Check if I was just skipped (but no penalty animation)
				else if (lastAction.action_data?.skipped_player === normalizedEmail &&
				    lastAction.id !== lastSkipActionId) {
					lastSkipActionId = lastAction.id;
					skipNotification = true;
					setTimeout(() => {
						skipNotification = false;
					}, 3000);
				}
			}

			// Update visibleHandSize after penalty checks (allows animations to show correctly)
			if (me && !isAnimating) {
				visibleHandSize = me.hand.length;
			}

			loading = false;
		} catch (err) {
			console.error('Error loading game:', err);
			error = 'Failed to load game';
			loading = false;
		}
	}

	// Helper functions for positioning
	function getDrawPilePosition(): { x: number; y: number } {
		const drawPile = document.querySelector('.draw-pile');
		if (drawPile) {
			const rect = drawPile.getBoundingClientRect();
			return {
				x: rect.left + rect.width / 2,
				y: rect.top + rect.height / 2
			};
		}
		// Fallback
		return { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 };
	}

	function getDiscardPilePosition(): { x: number; y: number } {
		// Target the actual card element, not the pile container (which includes the label)
		const discardCard = document.querySelector('.discard-pile .card');
		if (discardCard) {
			const rect = discardCard.getBoundingClientRect();
			return {
				x: rect.left + rect.width / 2,
				y: rect.top + rect.height / 2
			};
		}
		// Fallback to pile container if card not found
		const discardPile = document.querySelector('.discard-pile');
		if (discardPile) {
			const rect = discardPile.getBoundingClientRect();
			return {
				x: rect.left + rect.width / 2,
				y: rect.top + rect.height / 2
			};
		}
		// Final fallback
		return { x: window.innerWidth / 2 + 100, y: window.innerHeight / 2 };
	}

	function getHandCardPosition(cardIndex: number): { x: number; y: number } {
		// Try to find the actual card element in the hand
		const cardElements = document.querySelectorAll('#player-hand .card-wrapper');

		// If the card already exists in DOM, use its position
		if (cardElements[cardIndex]) {
			const rect = cardElements[cardIndex].getBoundingClientRect();
			const pos = {
				x: rect.left + rect.width / 2,
				y: rect.top + rect.height / 2
			};
			return pos;
		}

		// For new cards, calculate where they should go (after the last visible card)
		const handArea = document.querySelector('#player-hand .cards-container');
		if (!handArea) {
			console.warn('⚠️ Hand area not found, using fallback position');
			return { x: window.innerWidth / 2, y: window.innerHeight - 120 };
		}

		const rect = handArea.getBoundingClientRect();

		// If there are existing cards, position after the last one
		if (cardElements.length > 0) {
			const lastCard = cardElements[cardElements.length - 1];
			const lastCardRect = lastCard.getBoundingClientRect();
			const gap = 8; // 0.5rem gap
			const cardWidth = lastCardRect.width;

			let x = lastCardRect.right + gap + cardWidth / 2;
			const y = lastCardRect.top + lastCardRect.height / 2;

			// Bounds checking - prevent going off-screen
			const maxX = window.innerWidth - cardWidth / 2 - 20; // 20px margin
			const containerMaxX = rect.right - cardWidth / 2 - 8;

			if (x > maxX || x > containerMaxX) {
				console.warn(`⚠️ Card ${cardIndex} would go off-screen! x=${x}, maxX=${maxX}, containerMaxX=${containerMaxX}`);
				// Position within visible area
				x = Math.min(x, maxX, containerMaxX);
			}

			const pos = { x, y };

			return pos;
		}

		// No cards yet, position at start of hand area
		const cardWidth = 80;
		const pos = {
			x: rect.left + cardWidth / 2 + 8,
			y: rect.top + 60
		};
		return pos;
	}

	// Create persistent audio context for sounds
	let audioContext: AudioContext | null = null;

	function initAudioContext() {
		if (!audioContext) {
			try {
				audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
			} catch (err) {
				console.warn('Audio not supported');
			}
		}
	}

	function playCardFlipSound() {
		try {
			initAudioContext();
			if (!audioContext) return;

			// Create a short "flip" sound
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);

			// Higher pitch for card flip
			oscillator.frequency.value = 1000;
			oscillator.type = 'square';

			// Quick fade out
			gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);

			oscillator.start(audioContext.currentTime);
			oscillator.stop(audioContext.currentTime + 0.05);

		} catch (err) {
			console.warn('Sound playback failed:', err);
		}
	}

	async function handleCardClick(card: CardType) {
		if (!isMyTurn) return;

		// Validate card can be played before animating
		if (!canPlayCard(card, topCard, currentColor)) {
			error = 'Cannot play that card';
			setTimeout(() => {
				error = '';
			}, 2000);
			return;
		}

		selectedCardId = card.id;

		// Check if it's a wild card that needs color selection
		if (card.type === 'wild' || card.type === 'wild_draw_four') {
			showColorPicker = true;
		} else {
			await playCard(card, null);
		}
	}

	async function animatePlayCard(card: CardType): Promise<void> {
		return new Promise<void>((resolve) => {
			// Find card position in hand
			const cardIndex = myHand.slice(0, visibleHandSize).findIndex(c => c.id === card.id);
			if (cardIndex === -1) {
				resolve();
				return;
			}

			// Get positions BEFORE removing card
			const handPos = getHandCardPosition(cardIndex);
			const discardPos = getDiscardPilePosition();

			// Play sound
			playCardFlipSound();

			// Create flying card from hand to discard
			const cardId = `flying-play-${Date.now()}`;
			flyingCards = [{
				id: cardId,
				startX: handPos.x,
				startY: handPos.y,
				endX: discardPos.x,
				endY: discardPos.y,
				isPlayingCard: true,
				cardData: card // Pass the actual card to render
			}];

			// Wait a moment, then remove card from visible hand (other cards will slide left)
			setTimeout(() => {
				visibleHandSize = Math.max(0, visibleHandSize - 1);
			}, 2500); // Halfway through 5s animation

			// Remove flying card after animation completes
			setTimeout(() => {
				flyingCards = [];
				resolve();
			}, 5000);
		});
	}

	async function playCard(card: CardType, chosenColor: CardColor | null) {
		loading = true;
		error = '';

		try {
			// Start animation (non-blocking)
			const animationPromise = animatePlayCard(card);

			// Send request to server while animation plays
			const response = await fetch('/api/play-card', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					game_id: gameId,
					player_email: email.toLowerCase().trim(),
					card,
					chosen_color: chosenColor
				})
			});

			const result = await response.json();

			if (!result.success) {
				error = result.error || 'Invalid move';
				setTimeout(() => {
					error = '';
				}, 3000);
				loading = false;
				return;
			}

			selectedCardId = null;
			showColorPicker = false;

			// Wait for animation to complete before continuing
			await animationPromise;

			// Check if penalty cards were given to ME (rare case where I draw my own penalties)
			if (result.data.penalty_cards &&
			    result.data.penalty_cards.player_email === normalizedEmail) {
				// I received my own penalty cards - show animation
				await animatePenaltyCardsForMe(result.data.penalty_cards.count);

			}

			// Check if I got UNO penalty cards for forgetting to declare UNO
			if (result.data.uno_penalty) {
				// Show animation for UNO penalty cards
				await animatePenaltyCardsForMe(result.data.uno_penalty.count);
			}

			// Reload game state
			// (The other player will see their penalty animation when they poll)
			await loadGameState();
		} catch (err) {
			console.error('Error playing card:', err);
			error = 'Failed to play card';
			setTimeout(() => {
				error = '';
			}, 3000);
		}

		loading = false;
	}


	async function handleDrawCard() {
		if (!isMyTurn) {
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await fetch('/api/draw-card', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					game_id: gameId,
					player_email: email.toLowerCase().trim()
				})
			});

			const result = await response.json();

			if (!result.success) {
				error = result.error || 'Failed to draw card';
				setTimeout(() => {
					error = '';
				}, 3000);
				loading = false;
				return;
			}

			// Show a brief animation for drawing
			await animateCardDraw();

			await loadGameState();
		} catch (err) {
			console.error('Error drawing card:', err);
			error = 'Failed to draw card';
			setTimeout(() => {
				error = '';
			}, 3000);
		}

		loading = false;
	}

	async function animateCardDraw() {
		return new Promise<void>((resolve) => {
			isAnimating = true;
			animationMessage = 'Drawing card...';
			showAnimationMessage = true;


			// Wait a frame for DOM to update
			requestAnimationFrame(() => {
				// Get positions
				const drawPos = getDrawPilePosition();
				const handPos = getHandCardPosition(visibleHandSize);


				// Play sound
				playCardFlipSound();

				// Create flying card with real positions
				const cardId = `flying-${Date.now()}`;
				flyingCards = [{
					id: cardId,
					startX: drawPos.x,
					startY: drawPos.y,
					endX: handPos.x,
					endY: handPos.y
				}];

				// At end of animation: reveal real card and remove flying card simultaneously
				setTimeout(() => {
					visibleHandSize++;
					flyingCards = [];
					showAnimationMessage = false;
					isAnimating = false;
					resolve();
				}, 400);
			});
		});
	}

	async function animatePenaltyCardsForMe(cardCount: number) {
		return new Promise<void>((resolve) => {
			isAnimating = true;
			animationMessage = `Drawing ${cardCount} penalty card${cardCount > 1 ? 's' : ''}...`;
			showAnimationMessage = true;


			// Animate each card with 500ms delay
			let cardIndex = 0;
			const animateNextCard = () => {
				if (cardIndex < cardCount) {
					// Wait for DOM update
					requestAnimationFrame(() => {
						// Get positions
						const drawPos = getDrawPilePosition();
						const handPos = getHandCardPosition(visibleHandSize);


						// Play sound
						playCardFlipSound();

						// Add a flying card with real positions
						const cardId = `flying-${Date.now()}-${cardIndex}`;
						flyingCards = [...flyingCards, {
							id: cardId,
							startX: drawPos.x,
							startY: drawPos.y,
							endX: handPos.x,
							endY: handPos.y
						}];

						// At end of animation: reveal card and remove flying card simultaneously
						setTimeout(() => {
							visibleHandSize++;
							flyingCards = flyingCards.filter(c => c.id !== cardId);
						}, 5000);
					});

					cardIndex++;
					setTimeout(animateNextCard, 500);
				} else {
					// Animation complete
					setTimeout(() => {
						showAnimationMessage = false;
						isAnimating = false;
						resolve();
					}, 5000);
				}
			};

			// Start animating
			animateNextCard();
		});
	}

	function animateInitialDeal(cardCount: number) {
		isAnimating = true;
		animationMessage = 'Dealing cards...';
		showAnimationMessage = true;
		visibleHandSize = 0;

		// Animate each card with 300ms delay
		let cardIndex = 0;
		const animateNextCard = () => {
			if (cardIndex < cardCount) {
				// Wait for DOM update
				requestAnimationFrame(() => {
					// Get positions
					const drawPos = getDrawPilePosition();
					const handPos = getHandCardPosition(visibleHandSize);

					// Play sound
					playCardFlipSound();

					// Add a flying card with real positions
					const cardId = `flying-initial-${cardIndex}`;
					flyingCards = [...flyingCards, {
						id: cardId,
						startX: drawPos.x,
						startY: drawPos.y,
						endX: handPos.x,
						endY: handPos.y
					}];

					// At end of animation: reveal card, then deal next
					setTimeout(() => {
						visibleHandSize++;
						flyingCards = flyingCards.filter(c => c.id !== cardId);
						// Start next card after this one is revealed
						setTimeout(animateNextCard, 100);
					}, 400);
				});

				cardIndex++;
				// Next card starts after current one finishes (in the setTimeout below)
			} else {
				// Animation complete
				setTimeout(() => {
					showAnimationMessage = false;
					isAnimating = false;
				}, 5000);
			}
		};

		// Start animating
		animateNextCard(); // Start first card immediately
	}

	async function declareUno() {
		try {
			const response = await fetch('/api/declare-uno', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					game_id: gameId,
					player_email: email.toLowerCase().trim()
				})
			});

			const result = await response.json();

			if (result.success) {
				await loadGameState();
			}
		} catch (err) {
			console.error('Error declaring UNO:', err);
		}
	}

	function selectColor(color: CardColor) {
		const card = myHand.find((c) => c.id === selectedCardId);
		if (card) {
			playCard(card, color);
		}
	}

	function cancelColorPicker() {
		showColorPicker = false;
		selectedCardId = null;
	}
</script>

<svelte:head>
	<title>UNO Game - {gameId.slice(0, 8)}</title>
</svelte:head>

<main>
	{#if loading && !game}
		<div class="loading">Loading game...</div>
	{:else if gameOver}
		<div class="game-over-screen">
			<h1>🎉 {winner?.display_name || 'Someone'} Won!!!</h1>
			<div class="confetti">🎊 🎉 🎊 🎉 🎊</div>
			<p>Game Over!</p>
			<button class="primary-button" on:click={() => {
				playerStore.clearGameOnly();
				goto('/');
			}}>
				New Game
			</button>
		</div>
	{:else}
		<div class="game-board">
			<!-- Big Turn Indicator - always present to prevent layout shift -->
			<div class="your-turn-banner" class:visible={isMyTurn}>
				{#if isMyTurn}
					🎯 YOUR TURN! Play a card or draw 🎯
				{:else}
					&nbsp;
				{/if}
			</div>

			<!-- Error banner - always present to prevent layout shift -->
			<div class="error-banner" class:visible={error}>
				{#if error}
					{error}
				{:else}
					&nbsp;
				{/if}
			</div>


			<!-- Skip banner - always present to prevent layout shift -->
			<div class="skip-banner" class:visible={skipNotification}>
				{#if skipNotification}
					⏭️ Your turn was skipped! ⏭️
				{:else}
					&nbsp;
				{/if}
			</div>

			<!-- Animation banner - always present to prevent layout shift -->
			<div class="animation-banner" class:visible={showAnimationMessage}>
				{#if showAnimationMessage}
					🎴 {animationMessage}
				{:else}
					&nbsp;
				{/if}
			</div>

			<!-- Color Picker Banner at top -->
			{#if showColorPicker}
				<div class="color-picker-banner">
					<h3>Choose a color:</h3>
					<div class="color-options-horizontal">
						<button class="color-btn red" on:click={() => selectColor('red')}>
							Red
						</button>
						<button class="color-btn blue" on:click={() => selectColor('blue')}>
							Blue
						</button>
						<button class="color-btn green" on:click={() => selectColor('green')}>
							Green
						</button>
						<button class="color-btn yellow" on:click={() => selectColor('yellow')}>
							Yellow
						</button>
						<button class="cancel-btn" on:click={cancelColorPicker}>Cancel</button>
					</div>
				</div>
			{/if}

			<!-- Flying cards that animate with real positions -->
			{#each flyingCards as flyingCard (flyingCard.id)}
				<div
					class="flying-card"
					class:playing-card={flyingCard.isPlayingCard}
					style="
						left: {flyingCard.startX}px;
						top: {flyingCard.startY}px;
						--end-x: {flyingCard.endX}px;
						--end-y: {flyingCard.endY}px;
					"
				>
					{#if flyingCard.isPlayingCard && flyingCard.cardData}
						<!-- Show actual card face when playing -->
						<Card card={flyingCard.cardData} />
					{:else}
						<!-- Show card back when drawing -->
						<div class="card-back"></div>
					{/if}
				</div>
			{/each}

			<!-- Opponents -->
			<div class="opponents-area">
				{#each opponents as opponent}
					<OpponentInfo
						displayName={opponent.display_name}
						cardCount={opponent.card_count}
						isCurrentTurn={opponent.is_current_turn}
						unoDeclared={opponent.uno_declared}
					/>
				{/each}
			</div>

			<!-- Play Area -->
			<div class="center-area" id="play-area">
				<PlayArea
					{topCard}
					{currentColor}
					direction={game?.direction || 1}
					{drawPileCount}
					onDrawCard={isMyTurn ? handleDrawCard : undefined}
				/>

				<!-- UNO Button area - always present to prevent layout shift -->
				<div class="uno-button-container">
			<button
				class="uno-button"
				class:uno-declared={myPlayer?.uno_declared}
				on:click={declareUno}
				disabled={myPlayer?.uno_declared}
			>
				{myPlayer?.uno_declared ? '✓ UNO!' : 'UNO!'}
			</button>
			</div>

			<!-- UNO Declaration Banner -->
			<div class="uno-banner" class:visible={myPlayer?.uno_declared}>
				{#if myPlayer?.uno_declared}
					✓ You declared UNO!
				{:else}
					&nbsp;
				{/if}
			</div>
			</div>

			<!-- Player Hand -->
			<div class="player-area" id="player-hand">
				<PlayerHand
					hand={myHand.slice(0, visibleHandSize)}
					onCardClick={handleCardClick}
					{selectedCardId}
					isCurrentTurn={isMyTurn}
				/>
			</div>

			<!-- Leave Game Button -->
			<div class="game-controls">
				<button class="leave-button" on:click={() => {
					if (confirm('Are you sure you want to leave the game?')) {
						playerStore.clearGameOnly();
						goto('/');
					}
				}}>
					Leave Game
				</button>
			</div>
		</div>
	{/if}
</main>

<style>
	main {
		height: 100vh;
		max-height: 100vh;
		overflow: hidden;
		background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
	}

	.loading {
		color: white;
		font-size: 1.5rem;
		text-align: center;
	}

	.game-over-screen {
		background: rgba(0, 0, 0, 0.9);
		padding: 1.5rem;
		border-radius: 1rem;
		text-align: center;
		color: white;
	}

	.game-over-screen h1 {
		font-size: 3rem;
		margin-bottom: 1rem;
		animation: bounce 1s ease-in-out;
	}

	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-20px); }
	}

	.confetti {
		font-size: 2rem;
		margin: 1rem 0;
	}

	.game-over-screen p {
		font-size: 1.5rem;
		margin: 1.5rem 0;
		color: #ecf0f1;
		font-weight: bold;
	}

	.game-board {
		width: 100%;
		max-width: 1400px;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		position: relative;
	}

	.your-turn-banner {
		background: transparent;
		color: transparent;
		padding: 1rem;
		border-radius: 0.5rem;
		text-align: center;
		font-weight: bold;
		font-size: 1.5rem;
		box-shadow: none;
		border: 3px solid transparent;
		min-height: 3rem;
		transition: all 0.3s ease-in-out;
	}

	.your-turn-banner.visible {
		background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
		color: white;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
		border-color: white;
		animation: pulse-banner 2s ease-in-out infinite;
	}

	@keyframes pulse-banner {
		0%,
		100% {
			transform: scale(1);
			box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
		}
		50% {
			transform: scale(1.02);
			box-shadow: 0 8px 16px rgba(243, 156, 18, 0.6);
		}
	}

	.error-banner {
		background: transparent;
		color: transparent;
		padding: 0.75rem;
		border-radius: 0.5rem;
		text-align: center;
		font-weight: bold;
		border: 2px solid transparent;
		min-height: 3rem;
		transition: all 0.3s ease-in-out;
	}

	.error-banner.visible {
		background: #e74c3c;
		color: white;
		border-color: white;
	}

	.skip-banner {
		background: transparent;
		color: transparent;
		padding: 0.75rem;
		border-radius: 0.5rem;
		text-align: center;
		font-weight: bold;
		font-size: 1.2rem;
		border: 2px solid transparent;
		min-height: 3rem;
		transition: all 0.3s ease-in-out;
	}

	.skip-banner.visible {
		background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
		color: white;
		border-color: white;
	}


	.animation-banner {
		background: transparent;
		color: transparent;
		padding: 0.75rem;
		border-radius: 0.5rem;
		text-align: center;
		font-weight: bold;
		font-size: 1.2rem;
		border: 2px solid transparent;
		transition: all 0.3s ease-in-out;
		min-height: 3rem; /* Prevent layout shift */
	}

	.animation-banner.visible {
		background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
		color: white;
		border-color: white;
	}

	.debug-controls {
		background: rgba(100, 100, 100, 0.3);
		padding: 1rem;
		border-radius: 0.5rem;
		display: flex;
		gap: 0.75rem;
		align-items: center;
		justify-content: center;
		border: 2px solid #666;
		flex-wrap: wrap;
		min-height: 3rem; /* Prevent layout shift */
	}

	.debug-button {
		background: #666;
		color: #ccc;
		border: 2px solid #888;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: bold;
		cursor: pointer;
		font-size: 1rem;
		transition: all 0.2s;
	}

	.debug-button.active {
		background: #ff6b00;
		color: white;
		border-color: white;
	}

	.debug-button:hover {
		transform: scale(1.05);
	}

	.debug-button.active:hover {
		background: #ff8c00;
	}

	.debug-info {
		color: white;
		font-weight: bold;
		font-size: 1rem;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Flying card animation - full sized cards */
	.flying-card {
		position: fixed;
		z-index: 1500;
		pointer-events: none;
		width: 80px;
		height: 120px;
		transform: translate(-50%, -50%);
		animation: fly-card-flip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}

	/* Playing cards don't flip, just move */
	.flying-card.playing-card {
		animation: fly-card-no-flip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}

	.card-back {
		width: 100%;
		height: 100%;
		position: relative;
		transform-style: preserve-3d;
	}

	/* Back face of card */
	.card-back::before {
		content: '🎴';
		position: absolute;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 8px;
		border: 2px solid white;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		backface-visibility: hidden;
	}

	/* Front face of card (when flipped) */
	.card-back::after {
		content: '?';
		position: absolute;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
		border-radius: 8px;
		border: 2px solid white;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
		color: white;
		font-weight: bold;
		transform: rotateY(180deg);
		backface-visibility: hidden;
	}

	/* Animation with flip (for drawing cards) - flip on draw pile first, then move */
	@keyframes fly-card-flip {
		0% {
			/* Start on draw pile, face down (back showing) */
			transform: translate(-50%, -50%) rotateY(0deg);
			opacity: 1;
		}
		15% {
			/* Flip to face up while still on draw pile */
			transform: translate(-50%, -50%) rotateY(180deg);
			opacity: 1;
		}
		20%, 100% {
			/* Stay face up (rotateY 180deg shows the front) and move to hand */
			left: var(--end-x);
			top: var(--end-y);
			transform: translate(-50%, -50%) rotateY(180deg);
			opacity: 1;
		}
	}

	/* Animation without flip (for playing cards - stays face up) */
	@keyframes fly-card-no-flip {
		0% {
			transform: translate(-50%, -50%);
			opacity: 1;
		}
		100% {
			left: var(--end-x);
			top: var(--end-y);
			transform: translate(-50%, -50%);
			opacity: 1;
		}
	}

	.opponents-area {
		display: flex;
		justify-content: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.center-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		position: relative;
	}

	.uno-button-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 3rem;
		margin: 0.5rem 0;
	}

	.uno-button {
		font-size: 1.2rem;
		padding: 0.5rem 1.5rem;
		background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
		color: white;
		border: 3px solid white;
		border-radius: 1rem;
		font-weight: bold;
		text-transform: uppercase;
		cursor: pointer;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
		transition: all 0.2s ease;
	}

	.uno-button:hover:not(:disabled) {
		transform: scale(1.05);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
	}

	.uno-button:active:not(:disabled) {
		transform: scale(0.95);
		background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
	}

	.uno-button.uno-declared {
		background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
		cursor: not-allowed;
		opacity: 0.8;
	}

	.uno-banner {
		background: transparent;
		color: transparent;
		padding: 0.5rem;
		border-radius: 0.5rem;
		text-align: center;
		font-weight: bold;
		font-size: 1rem;
		min-height: 2rem;
		transition: all 0.3s ease;
	}

	.uno-banner.visible {
		background: #27ae60;
		color: white;
	}

	/* Color Picker */
	.color-picker-banner {
		position: absolute;
		top: 1rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
		background: rgba(0, 0, 0, 0.9);
		padding: 1.5rem 2rem;
		border-radius: 1rem;
		border: 3px solid white;
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
	}

	.color-picker-banner h3 {
		margin: 0 0 1rem 0;
		color: white;
		text-align: center;
		font-size: 1.5rem;
	}

	.color-options-horizontal {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.color-btn {
		padding: 0.75rem 1.5rem;
		border: 3px solid white;
		border-radius: 0.5rem;
		font-size: 1.2rem;
		font-weight: bold;
		color: white;
		cursor: pointer;
		transition: transform 0.2s;
		min-width: 100px;
	}

	.color-btn:hover {
		transform: scale(1.1);
	}

	.color-btn:active {
		transform: scale(0.95);
	}

	.color-btn.red {
		background: #e74c3c;
	}

	.color-btn.blue {
		background: #3498db;
	}

	.color-btn.green {
		background: #2ecc71;
	}

	.color-btn.yellow {
		background: #f1c40f;
	}

	.cancel-btn {
		padding: 0.75rem 1.5rem;
		background: #7f8c8d;
		color: white;
		border: 3px solid white;
		border-radius: 0.5rem;
		font-size: 1.2rem;
		font-weight: bold;
		cursor: pointer;
		transition: transform 0.2s;
		min-width: 100px;
	}

	.cancel-btn:hover {
		transform: scale(1.1);
		background: #95a5a6;
	}

	.cancel-btn:active {
		transform: scale(0.95);
	}

	/* Leave Game Button */
	.game-controls {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		z-index: 100;
	}

	.leave-button {
		padding: 0.5rem 1rem;
		background: #e74c3c;
		color: white;
		border: 2px solid white;
		border-radius: 0.5rem;
		font-size: 0.9rem;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.leave-button:hover {
		background: #c0392b;
		transform: scale(1.05);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
	}

	.leave-button:active {
		transform: scale(0.95);
	}

	/* Primary Button (New Game, etc.) */
	.primary-button {
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
		color: white;
		border: 3px solid white;
		border-radius: 0.75rem;
		font-size: 1.2rem;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
		text-transform: uppercase;
	}

	.primary-button:hover {
		background: linear-gradient(135deg, #2980b9 0%, #21618c 100%);
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
	}

	.primary-button:active {
		transform: translateY(0);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

</style>
