// Game logic utilities for UNO rules

import type { Card, CardColor, GameDirection, GamePlayer } from '$lib/types';

/**
 * Checks if a card can be played on top of another card
 * Rules:
 * - Match by color
 * - Match by number/type
 * - Wild cards can always be played
 * - Wild Draw Four can be played (honor system for "only if no other cards" rule)
 */
export function canPlayCard(
	cardToPlay: Card,
	topCard: Card,
	currentColor: CardColor | null
): boolean {
	// Wild cards can always be played
	if (cardToPlay.type === 'wild' || cardToPlay.type === 'wild_draw_four') {
		return true;
	}

	// If a wild was played, match against the chosen color
	if (currentColor && topCard.color === null) {
		return cardToPlay.color === currentColor;
	}

	// Match by color
	if (cardToPlay.color === topCard.color) {
		return true;
	}

	// Match by type (for action cards)
	if (cardToPlay.type === topCard.type && cardToPlay.type !== 'number') {
		return true;
	}

	// Match by number value
	if (
		cardToPlay.type === 'number' &&
		topCard.type === 'number' &&
		cardToPlay.value === topCard.value
	) {
		return true;
	}

	return false;
}

/**
 * Checks if a player has any playable cards in their hand
 */
export function hasPlayableCard(
	hand: Card[],
	topCard: Card,
	currentColor: CardColor | null
): boolean {
	return hand.some((card) => canPlayCard(card, topCard, currentColor));
}

/**
 * Applies the effect of a card being played
 * Returns updated game state parameters
 */
export function applyCardEffect(
	card: Card,
	currentPlayerIndex: number,
	direction: GameDirection,
	playerCount: number,
	chosenColor?: CardColor
): {
	newPlayerIndex: number;
	newDirection: GameDirection;
	newColor: CardColor | null;
	skipNextPlayer: boolean;
	cardsToDrawForNextPlayer: number;
} {
	let newPlayerIndex = currentPlayerIndex;
	let newDirection = direction;
	let newColor: CardColor | null = card.color;
	let skipNextPlayer = false;
	let cardsToDrawForNextPlayer = 0;

	switch (card.type) {
		case 'skip':
			// Skip the next player
			skipNextPlayer = true;
			newPlayerIndex = getNextPlayerIndex(currentPlayerIndex, direction, playerCount, true);
			break;

		case 'reverse':
			// Reverse the direction
			newDirection = (direction * -1) as GameDirection;
			// In 2-player games, reverse acts like skip
			if (playerCount === 2) {
				skipNextPlayer = true;
			}
			newPlayerIndex = getNextPlayerIndex(currentPlayerIndex, newDirection, playerCount, false);
			break;

		case 'draw_two':
			// Next player draws 2 cards and loses their turn
			cardsToDrawForNextPlayer = 2;
			skipNextPlayer = true;
			newPlayerIndex = getNextPlayerIndex(currentPlayerIndex, direction, playerCount, true);
			break;

		case 'wild':
			// Player chooses a color
			newColor = chosenColor || null;
			newPlayerIndex = getNextPlayerIndex(currentPlayerIndex, direction, playerCount, false);
			break;

		case 'wild_draw_four':
			// Player chooses a color, next player draws 4 and loses their turn
			newColor = chosenColor || null;
			cardsToDrawForNextPlayer = 4;
			skipNextPlayer = true;
			newPlayerIndex = getNextPlayerIndex(currentPlayerIndex, direction, playerCount, true);
			break;

		case 'number':
		default:
			// Regular number card, just advance to next player
			newPlayerIndex = getNextPlayerIndex(currentPlayerIndex, direction, playerCount, false);
			break;
	}

	return {
		newPlayerIndex,
		newDirection,
		newColor,
		skipNextPlayer,
		cardsToDrawForNextPlayer
	};
}

/**
 * Gets the index of the next player
 */
export function getNextPlayerIndex(
	currentIndex: number,
	direction: GameDirection,
	playerCount: number,
	skip: boolean = false
): number {
	const step = skip ? 2 : 1;
	const nextIndex = currentIndex + direction * step;

	// Handle wrap-around
	if (nextIndex >= playerCount) {
		return nextIndex % playerCount;
	}
	if (nextIndex < 0) {
		return ((nextIndex % playerCount) + playerCount) % playerCount;
	}

	return nextIndex;
}

/**
 * Advances the turn to the next player
 */
export function advanceTurn(
	currentPlayerIndex: number,
	direction: GameDirection,
	playerCount: number
): number {
	return getNextPlayerIndex(currentPlayerIndex, direction, playerCount, false);
}

/**
 * Checks if a player has won the game
 * Win condition: player has 0 cards left
 */
export function checkWinCondition(player: GamePlayer): boolean {
	return player.hand.length === 0;
}

/**
 * Checks if a player should have declared UNO
 * (when they have exactly 1 card left)
 */
export function shouldDeclareUno(cardCount: number): boolean {
	return cardCount === 1;
}

/**
 * Validates if a player can declare UNO
 * (must have exactly 1 card remaining)
 */
export function canDeclareUno(cardCount: number): boolean {
	return cardCount === 1;
}

/**
 * Removes a card from a player's hand
 * Returns the new hand without the card
 */
export function removeCardFromHand(hand: Card[], cardId: string): Card[] {
	return hand.filter((card) => card.id !== cardId);
}

/**
 * Adds cards to a player's hand
 * Returns the new hand with the cards added
 */
export function addCardsToHand(hand: Card[], cardsToAdd: Card[]): Card[] {
	return [...hand, ...cardsToAdd];
}

/**
 * Finds a card in a hand by ID
 */
export function findCardInHand(hand: Card[], cardId: string): Card | undefined {
	return hand.find((card) => card.id === cardId);
}

/**
 * Validates that it's a player's turn
 */
export function isPlayersTurn(playerIndex: number, currentPlayerIndex: number): boolean {
	return playerIndex === currentPlayerIndex;
}

/**
 * Gets the display info for the current game state
 */
export function getGameStateDisplay(
	topCard: Card,
	currentColor: CardColor | null,
	direction: GameDirection
): {
	displayColor: CardColor;
	displayDirection: string;
	isWildActive: boolean;
} {
	const displayColor = currentColor || topCard.color || 'red';
	const displayDirection = direction === 1 ? 'clockwise' : 'counter-clockwise';
	const isWildActive = topCard.type === 'wild' || topCard.type === 'wild_draw_four';

	return {
		displayColor,
		displayDirection,
		isWildActive
	};
}

/**
 * Calculates points for scoring (optional feature)
 * Number cards: face value
 * Action cards (Skip, Reverse, Draw Two): 20 points
 * Wild cards: 50 points
 */
export function calculateCardPoints(card: Card): number {
	if (card.type === 'number') {
		return card.value || 0;
	}
	if (card.type === 'skip' || card.type === 'reverse' || card.type === 'draw_two') {
		return 20;
	}
	if (card.type === 'wild' || card.type === 'wild_draw_four') {
		return 50;
	}
	return 0;
}

/**
 * Calculates total points in a hand
 */
export function calculateHandPoints(hand: Card[]): number {
	return hand.reduce((total, card) => total + calculateCardPoints(card), 0);
}

/**
 * Validates game state for consistency
 */
export function validateGameState(
	playerCount: number,
	currentPlayerIndex: number,
	drawPileSize: number,
	discardPileSize: number
): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (playerCount < 2 || playerCount > 7) {
		errors.push('Invalid player count: must be between 2 and 7');
	}

	if (currentPlayerIndex < 0 || currentPlayerIndex >= playerCount) {
		errors.push('Invalid current player index');
	}

	if (drawPileSize < 0) {
		errors.push('Draw pile cannot be negative');
	}

	if (discardPileSize < 1) {
		errors.push('Discard pile must have at least one card');
	}

	return {
		valid: errors.length === 0,
		errors
	};
}
