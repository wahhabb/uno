// Deck creation and shuffling utilities for UNO

import type { Card, CardColor, CardType } from '$lib/types';

/**
 * Creates a standard UNO deck with 108 cards
 * - Number cards (0-9): 1x zero per color, 2x each 1-9 per color = 76 cards
 * - Skip: 2 per color = 8 cards
 * - Reverse: 2 per color = 8 cards
 * - Draw Two: 2 per color = 8 cards
 * - Wild: 4 cards
 * - Wild Draw Four: 4 cards
 */
export function createDeck(): Card[] {
	const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];
	const deck: Card[] = [];
	let cardId = 0;

	// Create number cards for each color
	for (const color of colors) {
		// Zero: 1 per color
		deck.push({
			id: `card-${cardId++}`,
			type: 'number',
			color,
			value: 0
		});

		// 1-9: 2 per number per color
		for (let value = 1; value <= 9; value++) {
			deck.push({
				id: `card-${cardId++}`,
				type: 'number',
				color,
				value
			});
			deck.push({
				id: `card-${cardId++}`,
				type: 'number',
				color,
				value
			});
		}
	}

	// Create action cards for each color
	const actionTypes: CardType[] = ['skip', 'reverse', 'draw_two'];
	for (const color of colors) {
		for (const type of actionTypes) {
			// 2 of each action card per color
			deck.push({
				id: `card-${cardId++}`,
				type,
				color
			});
			deck.push({
				id: `card-${cardId++}`,
				type,
				color
			});
		}
	}

	// Create wild cards (no color)
	for (let i = 0; i < 4; i++) {
		deck.push({
			id: `card-${cardId++}`,
			type: 'wild',
			color: null
		});
	}

	// Create wild draw four cards (no color)
	for (let i = 0; i < 4; i++) {
		deck.push({
			id: `card-${cardId++}`,
			type: 'wild_draw_four',
			color: null
		});
	}

	return deck;
}

/**
 * Shuffles a deck using the Fisher-Yates algorithm
 * Creates a new shuffled array without mutating the original
 */
export function shuffleDeck(deck: Card[]): Card[] {
	const shuffled = [...deck];

	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	return shuffled;
}

/**
 * Deals cards from the deck
 * Returns an object with the dealt cards and the remaining deck
 */
export function dealCards(
	deck: Card[],
	count: number
): { dealtCards: Card[]; remainingDeck: Card[] } {
	if (count > deck.length) {
		throw new Error(`Cannot deal ${count} cards from a deck with only ${deck.length} cards`);
	}

	const dealtCards = deck.slice(0, count);
	const remainingDeck = deck.slice(count);

	return { dealtCards, remainingDeck };
}

/**
 * Deals initial hands to all players
 * Standard UNO rules: 7 cards per player
 * Returns hands for each player and the remaining deck
 */
export function dealInitialHands(
	deck: Card[],
	playerCount: number,
	cardsPerPlayer: number = 7
): { hands: Card[][]; remainingDeck: Card[] } {
	const totalCardsNeeded = playerCount * cardsPerPlayer;

	if (totalCardsNeeded > deck.length) {
		throw new Error(
			`Cannot deal ${cardsPerPlayer} cards to ${playerCount} players (need ${totalCardsNeeded}, have ${deck.length})`
		);
	}

	const hands: Card[][] = [];
	let currentDeck = [...deck];

	for (let i = 0; i < playerCount; i++) {
		const { dealtCards, remainingDeck } = dealCards(currentDeck, cardsPerPlayer);
		hands.push(dealtCards);
		currentDeck = remainingDeck;
	}

	return { hands, remainingDeck: currentDeck };
}

/**
 * Gets the first valid starting card from the deck
 * Starting card cannot be a wild or wild draw four
 * Returns the starting card and the remaining deck
 */
export function getStartingCard(deck: Card[]): { startingCard: Card; remainingDeck: Card[] } {
	for (let i = 0; i < deck.length; i++) {
		const card = deck[i];
		if (card.type !== 'wild' && card.type !== 'wild_draw_four') {
			const remainingDeck = [...deck.slice(0, i), ...deck.slice(i + 1)];
			return { startingCard: card, remainingDeck };
		}
	}

	throw new Error('No valid starting card found in deck');
}

/**
 * Draws a card from the deck
 * If deck is empty, reshuffles the discard pile (keeping the top card)
 */
export function drawCard(
	drawPile: Card[],
	discardPile: Card[]
): { drawnCard: Card; newDrawPile: Card[]; newDiscardPile: Card[] } {
	// If draw pile is empty, reshuffle discard pile
	if (drawPile.length === 0) {
		if (discardPile.length <= 1) {
			throw new Error('Not enough cards to continue the game');
		}

		// Keep the top card of discard pile, shuffle the rest into draw pile
		const topCard = discardPile[discardPile.length - 1];
		const cardsToShuffle = discardPile.slice(0, -1);
		const newDrawPile = shuffleDeck(cardsToShuffle);
		const newDiscardPile = [topCard];

		const drawnCard = newDrawPile[0];
		const finalDrawPile = newDrawPile.slice(1);

		return {
			drawnCard,
			newDrawPile: finalDrawPile,
			newDiscardPile
		};
	}

	// Normal draw from draw pile
	const drawnCard = drawPile[0];
	const newDrawPile = drawPile.slice(1);

	return {
		drawnCard,
		newDrawPile,
		newDiscardPile: discardPile
	};
}

/**
 * Utility to count cards in a deck (for debugging)
 */
export function countCards(deck: Card[]): {
	total: number;
	byType: Record<CardType, number>;
	byColor: Record<CardColor | 'wild', number>;
} {
	const byType: Record<CardType, number> = {
		number: 0,
		skip: 0,
		reverse: 0,
		draw_two: 0,
		wild: 0,
		wild_draw_four: 0
	};

	const byColor: Record<CardColor | 'wild', number> = {
		red: 0,
		blue: 0,
		green: 0,
		yellow: 0,
		wild: 0
	};

	for (const card of deck) {
		byType[card.type]++;
		if (card.color) {
			byColor[card.color]++;
		} else {
			byColor.wild++;
		}
	}

	return {
		total: deck.length,
		byType,
		byColor
	};
}
