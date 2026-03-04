// API endpoint to play a card

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/services/supabase';
import type { PlayCardRequest, CardColor } from '$lib/types';
import {
	canPlayCard,
	applyCardEffect,
	removeCardFromHand,
	findCardInHand,
	isPlayersTurn,
	checkWinCondition,
	getNextPlayerIndex
} from '$lib/utils/gameLogic';
import { drawCard } from '$lib/utils/deck';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: PlayCardRequest = await request.json();
		const { game_id, player_email, card, chosen_color } = body;

		// Validation
		if (!game_id || !player_email || !card) {
			return json({ success: false, error: 'Missing required fields' }, { status: 400 });
		}

		const normalizedEmail = player_email.toLowerCase().trim();

		// Step 1: Get game state
		const { data: game, error: gameError } = await supabase
			.from('games')
			.select('*')
			.eq('id', game_id)
			.single();

		if (gameError || !game) {
			return json({ success: false, error: 'Game not found' }, { status: 404 });
		}

		if (game.status !== 'in_progress') {
			return json({ success: false, error: 'Game is not in progress' }, { status: 400 });
		}

		// Step 2: Get all players
		const { data: players, error: playersError } = await supabase
			.from('game_players')
			.select('*')
			.eq('game_id', game_id)
			.order('player_order', { ascending: true });

		if (playersError || !players) {
			return json({ success: false, error: 'Failed to load players' }, { status: 500 });
		}

		// Step 3: Find current player
		const currentPlayer = players.find((p) => p.player_email === normalizedEmail);
		if (!currentPlayer) {
			return json({ success: false, error: 'Player not in game' }, { status: 403 });
		}

		// Step 4: Verify it's the player's turn
		if (!isPlayersTurn(currentPlayer.player_order, game.current_player_index)) {
			return json({ success: false, error: 'Not your turn' }, { status: 400 });
		}

		// Step 5: Get game state (draw pile, discard pile, current color)
		const { data: gameState, error: stateError } = await supabase
			.from('game_state')
			.select('*')
			.eq('game_id', game_id)
			.single();

		if (stateError || !gameState) {
			return json({ success: false, error: 'Game state not found' }, { status: 500 });
		}

		const discardPile = gameState.discard_pile as any[];
		const topCard = discardPile[discardPile.length - 1];

		// Step 6: Verify player has the card
		const cardInHand = findCardInHand(currentPlayer.hand, card.id);
		if (!cardInHand) {
			return json({ success: false, error: 'Card not in your hand' }, { status: 400 });
		}

		// Step 7: Validate if card can be played
		if (!canPlayCard(cardInHand, topCard, gameState.current_color)) {
			return json({ success: false, error: 'Invalid card play' }, { status: 400 });
		}

		// Step 8: Validate wild card color choice
		if ((card.type === 'wild' || card.type === 'wild_draw_four') && !chosen_color) {
			return json(
				{ success: false, error: 'Must choose a color for wild cards' },
				{ status: 400 }
			);
		}

		// Step 9: Remove card from player's hand
		let newHand = removeCardFromHand(currentPlayer.hand, card.id);

	// Initialize draw and discard piles for potential UNO penalty
	let updatedDrawPile = gameState.draw_pile as any[];
	let updatedDiscardPile = [...discardPile, cardInHand];
	let unoPenaltyCards: any[] = [];

		// Step 10: Check if player won
		// Player can only win if they declared UNO before playing their last card
		const playerWon = newHand.length === 0 && currentPlayer.uno_declared;

		// Prevent winning if UNO wasn't declared
		if (newHand.length === 0 && !currentPlayer.uno_declared) {
tt// TODO: This case should give penalty cards but currently just prevents play
t}
		// Give penalty cards for forgetting to declare UNO

		// Determine which player was skipped (if any)
		let skippedPlayerEmail: string | null = null;
		if (cardEffect.skipNextPlayer && !playerWon) {
			// Calculate who would have been next without the skip
			const wouldBeNextIndex = (game.current_player_index + game.direction + players.length) % players.length;
			skippedPlayerEmail = players[wouldBeNextIndex].player_email;
		}

		// Step 12: Handle draw cards for next player
		// (updatedDrawPile and updatedDiscardPile already initialized above)

		// Handle penalty cards BEFORE updating game state
		let penaltyCardsGiven: { player_email: string; cards: any[]; count: number } | null = null;


		if (cardEffect.cardsToDrawForNextPlayer > 0 && !playerWon) {
			// Calculate the FIRST next player (without skip) who receives the penalty cards
			const victimPlayerIndex = getNextPlayerIndex(
				game.current_player_index,
				game.direction,
				players.length,
				false // Don't skip - this is the player who draws cards
			);
			const victimPlayer = players[victimPlayerIndex];


			// Draw cards for victim player
			const cardsDrawn = [];
			for (let i = 0; i < cardEffect.cardsToDrawForNextPlayer; i++) {
				const { drawnCard, newDrawPile, newDiscardPile } = drawCard(
					updatedDrawPile,
					updatedDiscardPile
				);
				cardsDrawn.push(drawnCard);
				updatedDrawPile = newDrawPile;
				updatedDiscardPile = newDiscardPile;
			}


			const { data: updateData, error: updateError } = await supabase
				.from('game_players')
				.update({ hand: victimPlayerNewHand })
				.eq('id', victimPlayer.id)
				.select();

			if (updateError) {
				console.error('❌ Error updating victim player hand:', updateError);
				return json({ success: false, error: 'Failed to give penalty cards' }, { status: 500 });
			}

		}

		// Step 13: Update current player's hand
		// Only reset uno_declared if player has more than 1 card (got penalties) or won
		const shouldResetUno = newHand.length !== 1;
		await supabase
			.from('game_players')
			.update({
				hand: newHand,
				uno_declared: shouldResetUno ? false : currentPlayer.uno_declared
			})
			.eq('id', currentPlayer.id);

		// Step 14: Update game state
		await supabase
			.from('game_state')
			.update({
				draw_pile: updatedDrawPile,
				discard_pile: updatedDiscardPile,
				current_color: cardEffect.newColor,
				updated_at: new Date().toISOString()
			})
			.eq('game_id', game_id);

		// Step 15: Update game record
		const gameUpdate: any = {
			current_player_index: cardEffect.newPlayerIndex,
			direction: cardEffect.newDirection,
			last_activity: new Date().toISOString()
		};

		if (playerWon) {
			gameUpdate.status = 'completed';
			gameUpdate.winner_email = normalizedEmail;
		}

		await supabase.from('games').update(gameUpdate).eq('id', game_id);

		// Step 16: Log the action
		await supabase.from('game_actions').insert({
			game_id,
			player_email: normalizedEmail,
			action_type: 'play_card',
			action_data: {
				card: cardInHand,
				chosen_color,
				cards_drawn_by_next_player: cardEffect.cardsToDrawForNextPlayer,
				penalty_recipient: penaltyCardsGiven?.player_email || null,
				uno_penalty_count: unoPenaltyCards.length > 0 ? unoPenaltyCards.length : null,
				skipped_player: skippedPlayerEmail
			}
		});

		return json({
			success: true,
			data: {
				game_id,
				card_played: cardInHand,
				player_won: playerWon,
				new_hand_size: newHand.length,
				next_player_index: cardEffect.newPlayerIndex,
				penalty_cards: penaltyCardsGiven, // Include penalty card info for animation
				uno_penalty: unoPenaltyCards.length > 0 ? { count: unoPenaltyCards.length, cards: unoPenaltyCards } : null,
				skipped_player: skippedPlayerEmail,
				message: playerWon ? 'You won!' : 'Card played successfully'
			}
		});
	} catch (err) {
		console.error('Error in play-card:', err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
