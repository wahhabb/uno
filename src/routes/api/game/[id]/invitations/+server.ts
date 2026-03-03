// API endpoint to get invitations for a game

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/services/supabase';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const gameId = params.id;

		if (!gameId) {
			return json({ success: false, error: 'Game ID is required' }, { status: 400 });
		}

		// Get all invitations for this game
		const { data: invitations, error } = await supabase
			.from('game_invitations')
			.select('*')
			.eq('game_id', gameId);

		if (error) {
			console.error('Error loading invitations:', error);
			return json({ success: false, error: 'Failed to load invitations' }, { status: 500 });
		}

		return json({ success: true, data: invitations || [] });
	} catch (err) {
		console.error('Error in get invitations:', err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
