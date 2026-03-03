// API endpoint to start a game (deal cards and initialize game state)

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/services/supabase';
import { createDeck, shuffleDeck, dealInitialHands, getStartingCard } from '$lib/utils/deck';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { game_id, host_email } = await request.json();

		// Validation
		if (!game_id || typeof game_id !== 'string') {
			return json({ success: false, error: 'Game ID is required' }, { status: 400 });
		}

		if (!host_email || typeof host_email !== 'string') {
			return json({ success: false, error: 'Host email is required' }, { status: 400 });
		}

		const normalizedHostEmail = host_email.toLowerCase().trim();

		// Step 1: Verify game exists and host is authorized
		const { data: game, error: gameError } = await supabase
			.from('games')
			.select('*')
			.eq('id', game_id)
			.single();

		if (gameError || !game) {
			return json({ success: false, error: 'Game not found' }, { status: 404 });
		}

		if (game.host_email !== normalizedHostEmail) {
			return json({ success: false, error: 'Only the host can start the game' }, { status: 403 });
		}

		if (game.status !== 'waiting') {
			return json(
				{ success: false, error: 'Game has already started or ended' },
				{ status: 400 }
			);
		}

		// Step 2: Get all players in the game
		const { data: players, error: playersError } = await supabase
			.from('game_players')
			.select('*')
			.eq('game_id', game_id)
			.order('player_order', { ascending: true });

		if (playersError || !players || players.length < 2) {
			return json(
				{ success: false, error: 'Need at least 2 players to start' },
				{ status: 400 }
			);
		}

		if (players.length > 7) {
			return json({ success: false, error: 'Too many players (max 7)' }, { status: 400 });
		}

		// Step 3: Create and shuffle deck
		const deck = createDeck();
		const shuffledDeck = shuffleDeck(deck);

		// Step 4: Deal 7 cards to each player
		const { hands, remainingDeck } = dealInitialHands(shuffledDeck, players.length, 7);

		// Step 5: Get starting card for discard pile
		const { startingCard, remainingDeck: finalDrawPile } = getStartingCard(remainingDeck);
		const discardPile = [startingCard];

		// Step 6: Update each player's hand in database
		for (let i = 0; i < players.length; i++) {
			const player = players[i];
			const hand = hands[i];

			const { error: updateError } = await supabase
				.from('game_players')
				.update({ hand, uno_declared: false })
				.eq('id', player.id);

			if (updateError) {
				console.error('Error updating player hand:', updateError);
				return json({ success: false, error: 'Failed to deal cards' }, { status: 500 });
			}
		}

		// Step 7: Create game_state record
		const { error: stateError } = await supabase.from('game_state').insert({
			game_id,
			draw_pile: finalDrawPile,
			discard_pile: discardPile,
			current_color: startingCard.color,
			updated_at: new Date().toISOString()
		});

		if (stateError) {
			console.error('Error creating game state:', stateError);
			return json({ success: false, error: 'Failed to initialize game state' }, { status: 500 });
		}

		// Step 8: Update game status to in_progress
		const { error: updateGameError } = await supabase
			.from('games')
			.update({
				status: 'in_progress',
				current_player_index: 0,
				direction: 1,
				last_activity: new Date().toISOString()
			})
			.eq('id', game_id);

		if (updateGameError) {
			console.error('Error updating game status:', updateGameError);
			return json({ success: false, error: 'Failed to start game' }, { status: 500 });
		}

		// Step 9: Log game start action
		await supabase.from('game_actions').insert({
			game_id,
			player_email: normalizedHostEmail,
			action_type: 'play_card',
			action_data: {
				action: 'game_started',
				player_count: players.length,
				starting_card: startingCard
			}
		});

		return json({
			success: true,
			data: {
				game_id,
				starting_card: startingCard,
				player_count: players.length,
				message: 'Game started successfully'
			}
		});
	} catch (err) {
		console.error('Error in start-game:', err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
