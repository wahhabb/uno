// Real-time subscription helpers for Supabase

import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface GameSubscriptionCallbacks {
	onGameUpdate?: (payload: any) => void;
	onPlayersUpdate?: (payload: any) => void;
	onStateUpdate?: (payload: any) => void;
	onActionCreated?: (payload: any) => void;
}

/**
 * Subscribe to all real-time updates for a specific game
 */
export function subscribeToGame(
	gameId: string,
	callbacks: GameSubscriptionCallbacks
): RealtimeChannel {
	const channel = supabase.channel(`game:${gameId}`);

	// Subscribe to games table changes
	if (callbacks.onGameUpdate) {
		channel.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'games',
				filter: `id=eq.${gameId}`
			},
			callbacks.onGameUpdate
		);
	}

	// Subscribe to game_players table changes
	if (callbacks.onPlayersUpdate) {
		channel.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'game_players',
				filter: `game_id=eq.${gameId}`
			},
			callbacks.onPlayersUpdate
		);
	}

	// Subscribe to game_state table changes
	if (callbacks.onStateUpdate) {
		channel.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'game_state',
				filter: `game_id=eq.${gameId}`
			},
			callbacks.onStateUpdate
		);
	}

	// Subscribe to game_actions table inserts (for action history)
	if (callbacks.onActionCreated) {
		channel.on(
			'postgres_changes',
			{
				event: 'INSERT',
				schema: 'public',
				table: 'game_actions',
				filter: `game_id=eq.${gameId}`
			},
			callbacks.onActionCreated
		);
	}

	channel.subscribe();
	return channel;
}

/**
 * Unsubscribe from a game channel
 */
export async function unsubscribeFromGame(channel: RealtimeChannel): Promise<void> {
	await supabase.removeChannel(channel);
}
