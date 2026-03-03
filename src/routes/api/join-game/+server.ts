// API endpoint for players to join an existing game

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/services/supabase';
import type { JoinGameRequest } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: JoinGameRequest = await request.json();
		const { game_id, player_email, display_name } = body;

		// Validation
		if (!game_id || typeof game_id !== 'string') {
			return json({ success: false, error: 'Game ID is required' }, { status: 400 });
		}

		if (!player_email || typeof player_email !== 'string') {
			return json({ success: false, error: 'Player email is required' }, { status: 400 });
		}

		if (!display_name || typeof display_name !== 'string') {
			return json({ success: false, error: 'Display name is required' }, { status: 400 });
		}

		const normalizedEmail = player_email.toLowerCase().trim();

		// Step 1: Check if game exists and is in waiting status
		const { data: game, error: gameError } = await supabase
			.from('games')
			.select('*')
			.eq('id', game_id)
			.single();

		if (gameError || !game) {
			return json({ success: false, error: 'Game not found' }, { status: 404 });
		}

		if (game.status !== 'waiting') {
			return json(
				{ success: false, error: 'Game has already started or ended' },
				{ status: 400 }
			);
		}

		// Step 2: Check if player has a pending invitation
		const { data: invitation, error: invitationError } = await supabase
			.from('game_invitations')
			.select('*')
			.eq('game_id', game_id)
			.eq('invitee_email', normalizedEmail)
			.eq('status', 'pending')
			.single();

		if (invitationError || !invitation) {
			return json({ success: false, error: 'No pending invitation found' }, { status: 403 });
		}

		// Step 3: Check current player count (max 7 players)
		const { count: playerCount, error: countError } = await supabase
			.from('game_players')
			.select('*', { count: 'exact', head: true })
			.eq('game_id', game_id);

		if (countError) {
			console.error('Error counting players:', countError);
			return json({ success: false, error: 'Failed to check player count' }, { status: 500 });
		}

		if (playerCount && playerCount >= 7) {
			return json({ success: false, error: 'Game is full (max 7 players)' }, { status: 400 });
		}

		// Step 4: Check if player is already in the game
		const { data: existingPlayer, error: existingError } = await supabase
			.from('game_players')
			.select('*')
			.eq('game_id', game_id)
			.eq('player_email', normalizedEmail)
			.maybeSingle();

		if (existingPlayer) {
			// Player already joined, just return success
			return json({
				success: true,
				data: {
					game_id,
					message: 'Already joined',
					player: existingPlayer
				}
			});
		}

		// Step 5: Create or update player record
		const { error: playerError } = await supabase
			.from('players')
			.upsert(
				{
					email: normalizedEmail,
					display_name,
					last_seen: new Date().toISOString()
				},
				{ onConflict: 'email' }
			);

		if (playerError) {
			console.error('Error creating player:', playerError);
			return json({ success: false, error: 'Failed to create player' }, { status: 500 });
		}

		// Step 6: Add player to game with next available player_order
		// playerCount is the number of existing players, which equals the next index
		const nextPlayerOrder = playerCount || 0;

		const { data: gamePlayer, error: gamePlayerError } = await supabase
			.from('game_players')
			.insert({
				game_id,
				player_email: normalizedEmail,
				player_order: nextPlayerOrder,
				hand: [],
				uno_declared: false
			})
			.select()
			.single();

		if (gamePlayerError || !gamePlayer) {
			console.error('Error adding player to game:', gamePlayerError);
			return json({ success: false, error: 'Failed to join game' }, { status: 500 });
		}

		// Step 7: Update invitation status to accepted
		const { error: updateInvitationError } = await supabase
			.from('game_invitations')
			.update({ status: 'accepted' })
			.eq('id', invitation.id);

		if (updateInvitationError) {
			console.error('Error updating invitation:', updateInvitationError);
			// Continue anyway - player has joined successfully
		}

		// Step 8: Update game last_activity
		await supabase
			.from('games')
			.update({ last_activity: new Date().toISOString() })
			.eq('id', game_id);

		return json({
			success: true,
			data: {
				game_id,
				player: gamePlayer,
				message: 'Successfully joined game'
			}
		});
	} catch (err) {
		console.error('Error in join-game:', err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
