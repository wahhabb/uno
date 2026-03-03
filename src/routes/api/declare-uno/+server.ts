// API endpoint to declare UNO

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/services/supabase';
import type { DeclareUnoRequest } from '$lib/types';
import { canDeclareUno } from '$lib/utils/gameLogic';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: DeclareUnoRequest = await request.json();
		const { game_id, player_email } = body;

		// Validation
		if (!game_id || !player_email) {
			return json({ success: false, error: 'Missing required fields' }, { status: 400 });
		}

		const normalizedEmail = player_email.toLowerCase().trim();

		// Step 1: Get game
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

		// Step 2: Find player
		const { data: player, error: playerError } = await supabase
			.from('game_players')
			.select('*')
			.eq('game_id', game_id)
			.eq('player_email', normalizedEmail)
			.single();

		if (playerError || !player) {
			return json({ success: false, error: 'Player not in game' }, { status: 403 });
		}

		// Step 3: Check if player can declare UNO (must have exactly 1 card)
		if (!canDeclareUno(player.hand.length)) {
			return json(
				{ success: false, error: 'Can only declare UNO with exactly 1 card' },
				{ status: 400 }
			);
		}

		// Step 4: Mark UNO as declared
		await supabase.from('game_players').update({ uno_declared: true }).eq('id', player.id);

		// Step 5: Log the action
		await supabase.from('game_actions').insert({
			game_id,
			player_email: normalizedEmail,
			action_type: 'declare_uno',
			action_data: { card_count: player.hand.length }
		});

		return json({
			success: true,
			data: {
				game_id,
				message: 'UNO declared successfully!'
			}
		});
	} catch (err) {
		console.error('Error in declare-uno:', err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
