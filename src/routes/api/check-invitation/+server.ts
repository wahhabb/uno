// API endpoint to check if an email has pending game invitations

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/services/supabase';
import type { CheckInvitationResponse } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email } = await request.json();

		if (!email || typeof email !== 'string') {
			return json({ success: false, error: 'Email is required' }, { status: 400 });
		}

		// Look for pending invitations for this email
		const { data: invitations, error } = await supabase
			.from('game_invitations')
			.select(
				`
				id,
				game_id,
				invitee_email,
				status,
				created_at,
				games:game_id (
					id,
					status,
					host_email
				)
			`
			)
			.eq('invitee_email', email.toLowerCase())
			.eq('status', 'pending')
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error checking invitations:', error);
			return json({ success: false, error: 'Failed to check invitations' }, { status: 500 });
		}

		// Filter for invitations to games that are still waiting
		const validInvitations = invitations?.filter((inv: any) => {
			return inv.games && inv.games.status === 'waiting';
		});

		const hasInvitation = validInvitations && validInvitations.length > 0;
		const gameId = hasInvitation ? validInvitations[0].game_id : undefined;

		const response: CheckInvitationResponse = {
			has_invitation: hasInvitation,
			game_id: gameId,
			invitations: validInvitations
		};

		return json({ success: true, data: response });
	} catch (err) {
		console.error('Error in check-invitation:', err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
