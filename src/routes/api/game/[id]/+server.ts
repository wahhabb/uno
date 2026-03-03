// API endpoint to get complete game state

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/services/supabase';

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const gameId = params.id;
		const playerEmail = url.searchParams.get('player_email');

		if (!gameId) {
			return json({ success: false, error: 'Game ID is required' }, { status: 400 });
		}

		// Step 1: Get game
		const { data: game, error: gameError } = await supabase
			.from('games')
			.select('*')
			.eq('id', gameId)
			.single();

		if (gameError || !game) {
			return json({ success: false, error: 'Game not found' }, { status: 404 });
		}

		// Step 2: Get all players with their info
		const { data: players, error: playersError } = await supabase
			.from('game_players')
			.select(
				`
				*,
				players:player_email (
					email,
					display_name
				)
			`
			)
			.eq('game_id', gameId)
			.order('player_order', { ascending: true });

		if (playersError) {
			console.error('Error loading players:', playersError);
			return json({ success: false, error: 'Failed to load players' }, { status: 500 });
		}

		// Step 3: Get game state
		const { data: gameState, error: stateError } = await supabase
			.from('game_state')
			.select('*')
			.eq('game_id', gameId)
			.maybeSingle();

		if (stateError) {
			console.error('Error loading game state:', stateError);
		}

		// Step 4: Format player data
		// Hide other players' cards - only show counts
		const formattedPlayers = players?.map((p: any) => {
			const isCurrentPlayer =
				playerEmail && p.player_email === playerEmail.toLowerCase().trim();

			return {
				email: p.player_email,
				display_name: p.players?.display_name || p.player_email,
				player_order: p.player_order,
				card_count: p.hand.length,
				hand: isCurrentPlayer ? p.hand : [], // Only show hand to the player themselves
				uno_declared: p.uno_declared,
				is_current_turn: p.player_order === game.current_player_index
			};
		});

		// Step 5: Get top card from discard pile
		const topCard = gameState?.discard_pile?.[gameState.discard_pile.length - 1] || null;

		// Step 6: Get recent actions (last 10)
		const { data: recentActions } = await supabase
			.from('game_actions')
			.select('*')
			.eq('game_id', gameId)
			.order('created_at', { ascending: false })
			.limit(10);

		// Step 7: Build response
		const response = {
			game: {
				id: game.id,
				status: game.status,
				host_email: game.host_email,
				current_player_index: game.current_player_index,
				direction: game.direction,
				created_at: game.created_at,
				last_activity: game.last_activity,
				winner_email: game.winner_email
			},
			players: formattedPlayers,
			game_state: gameState
				? {
						top_card: topCard,
						current_color: gameState.current_color,
						draw_pile_count: gameState.draw_pile?.length || 0,
						discard_pile_count: gameState.discard_pile?.length || 0
					}
				: null,
			recent_actions: recentActions || []
		};

		return json({ success: true, data: response });
	} catch (err) {
		console.error('Error in get game state:', err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
