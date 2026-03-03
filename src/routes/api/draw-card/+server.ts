// API endpoint to draw a card from the deck

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/services/supabase';
import type { DrawCardRequest } from '$lib/types';
import { isPlayersTurn, advanceTurn } from '$lib/utils/gameLogic';
import { drawCard } from '$lib/utils/deck';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: DrawCardRequest = await request.json();
		const { game_id, player_email } = body;

		// Validation
		if (!game_id || !player_email) {
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

		// Step 5: Get game state
		const { data: gameState, error: stateError } = await supabase
			.from('game_state')
			.select('*')
			.eq('game_id', game_id)
			.single();

		if (stateError || !gameState) {
			return json({ success: false, error: 'Game state not found' }, { status: 500 });
		}

		// Step 6: Draw a card
		const { drawnCard, newDrawPile, newDiscardPile } = drawCard(
			gameState.draw_pile,
			gameState.discard_pile
		);

		// Step 7: Add card to player's hand
		const newHand = [...currentPlayer.hand, drawnCard];

		await supabase.from('game_players').update({ hand: newHand }).eq('id', currentPlayer.id);

		// Step 8: Update game state
		await supabase
			.from('game_state')
			.update({
				draw_pile: newDrawPile,
				discard_pile: newDiscardPile,
				updated_at: new Date().toISOString()
			})
			.eq('game_id', game_id);

		// Step 9: Advance turn to next player
		const nextPlayerIndex = advanceTurn(
			game.current_player_index,
			game.direction,
			players.length
		);

		await supabase
			.from('games')
			.update({
				current_player_index: nextPlayerIndex,
				last_activity: new Date().toISOString()
			})
			.eq('id', game_id);

		// Step 10: Log the action
		await supabase.from('game_actions').insert({
			game_id,
			player_email: normalizedEmail,
			action_type: 'draw_card',
			action_data: { card: drawnCard }
		});

		return json({
			success: true,
			data: {
				game_id,
				drawn_card: drawnCard,
				new_hand_size: newHand.length,
				next_player_index: nextPlayerIndex,
				message: 'Card drawn successfully'
			}
		});
	} catch (err) {
		console.error('Error in draw-card:', err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
