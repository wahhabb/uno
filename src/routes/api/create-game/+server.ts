// API endpoint to create a new game and invite players

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/services/supabase';
import type { CreateGameRequest } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: CreateGameRequest = await request.json();
		const { host_email, host_display_name, invitee_emails } = body;

		// Validation
		if (!host_email || typeof host_email !== 'string') {
			return json({ success: false, error: 'Host email is required' }, { status: 400 });
		}

		if (!host_display_name || typeof host_display_name !== 'string') {
			return json({ success: false, error: 'Host display name is required' }, { status: 400 });
		}

		if (!Array.isArray(invitee_emails) || invitee_emails.length === 0) {
			return json(
				{ success: false, error: 'At least one invitee email is required' },
				{ status: 400 }
			);
		}

		if (invitee_emails.length > 6) {
			return json(
				{ success: false, error: 'Maximum 6 invitees allowed (7 players total)' },
				{ status: 400 }
			);
		}

		// Normalize emails
		const normalizedHostEmail = host_email.toLowerCase().trim();
		const normalizedInviteeEmails = invitee_emails.map((email) => email.toLowerCase().trim());

		// Check for duplicate emails
		if (normalizedInviteeEmails.includes(normalizedHostEmail)) {
			return json({ success: false, error: 'Cannot invite yourself' }, { status: 400 });
		}

		const uniqueInvitees = [...new Set(normalizedInviteeEmails)];
		if (uniqueInvitees.length !== normalizedInviteeEmails.length) {
			return json({ success: false, error: 'Duplicate invitee emails found' }, { status: 400 });
		}

		// Step 1: Create or update host player record
		const { error: hostError } = await supabase
			.from('players')
			.upsert(
				{
					email: normalizedHostEmail,
					display_name: host_display_name,
					last_seen: new Date().toISOString()
				},
				{ onConflict: 'email' }
			);

		if (hostError) {
			console.error('Error creating host player:', hostError);
			return json({ success: false, error: 'Failed to create host player' }, { status: 500 });
		}

		// Step 2: Create game
		const { data: game, error: gameError } = await supabase
			.from('games')
			.insert({
				host_email: normalizedHostEmail,
				status: 'waiting',
				direction: 1,
				current_player_index: 0,
				last_activity: new Date().toISOString()
			})
			.select()
			.single();

		if (gameError || !game) {
			console.error('Error creating game:', gameError);
			return json({ success: false, error: 'Failed to create game' }, { status: 500 });
		}

		// Step 3: Add host as first player (player_order = 0)
		const { error: hostPlayerError } = await supabase.from('game_players').insert({
			game_id: game.id,
			player_email: normalizedHostEmail,
			player_order: 0,
			hand: [],
			uno_declared: false
		});

		if (hostPlayerError) {
			console.error('Error adding host to game:', hostPlayerError);
			// Rollback: delete the game
			await supabase.from('games').delete().eq('id', game.id);
			return json({ success: false, error: 'Failed to add host to game' }, { status: 500 });
		}

		// Step 4: Create invitations for other players
		const invitations = uniqueInvitees.map((email) => ({
			game_id: game.id,
			invitee_email: email,
			status: 'pending'
		}));

		const { error: invitationsError } = await supabase
			.from('game_invitations')
			.insert(invitations);

		if (invitationsError) {
			console.error('Error creating invitations:', invitationsError);
			// Continue anyway - host can manually invite later
		}

		// TODO: Send email notifications to invitees (future feature)

		return json({
			success: true,
			data: {
				game_id: game.id,
				game,
				invitations: uniqueInvitees
			}
		});
	} catch (err) {
		console.error('Error in create-game:', err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
