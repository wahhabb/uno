// Core type definitions for the Uno game

export type CardColor = 'red' | 'blue' | 'green' | 'yellow';
export type CardType = 'number' | 'skip' | 'reverse' | 'draw_two' | 'wild' | 'wild_draw_four';
export type GameStatus = 'waiting' | 'in_progress' | 'completed' | 'abandoned';
export type InvitationStatus = 'pending' | 'accepted' | 'declined';
export type GameDirection = 1 | -1; // 1 for clockwise, -1 for counter-clockwise

export interface Card {
	id: string;
	type: CardType;
	color: CardColor | null; // null for wild cards
	value?: number; // 0-9 for number cards
}

export interface Player {
	email: string;
	display_name: string;
	created_at: string;
	last_seen: string;
}

export interface Game {
	id: string;
	host_email: string;
	status: GameStatus;
	direction: GameDirection;
	current_player_index: number;
	created_at: string;
	last_activity: string;
	winner_email: string | null;
}

export interface GamePlayer {
	id: string;
	game_id: string;
	player_email: string;
	player_order: number; // 0-6
	hand: Card[];
	uno_declared: boolean;
	joined_at: string;
	display_name?: string; // Joined from player table
}

export interface GameInvitation {
	id: string;
	game_id: string;
	invitee_email: string;
	status: InvitationStatus;
	created_at: string;
}

export interface GameState {
	game_id: string;
	draw_pile: Card[];
	discard_pile: Card[];
	current_color: CardColor | null; // Set by wild cards
	updated_at: string;
}

export interface GameAction {
	id: string;
	game_id: string;
	player_email: string;
	action_type: 'play_card' | 'draw_card' | 'declare_uno' | 'call_uno_fail' | 'choose_color';
	action_data: Record<string, any>;
	created_at: string;
}

// Extended types for UI

export interface GameView extends Game {
	players: GamePlayer[];
	state: GameState;
	current_player?: GamePlayer;
}

export interface PlayerView {
	email: string;
	display_name: string;
	card_count: number;
	is_current: boolean;
	uno_declared: boolean;
}

// API Response types

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
}

export interface CreateGameRequest {
	host_email: string;
	host_display_name: string;
	invitee_emails: string[];
}

export interface JoinGameRequest {
	game_id: string;
	player_email: string;
	display_name: string;
}

export interface PlayCardRequest {
	game_id: string;
	player_email: string;
	card: Card;
	chosen_color?: CardColor; // For wild cards
}

export interface DrawCardRequest {
	game_id: string;
	player_email: string;
}

export interface DeclareUnoRequest {
	game_id: string;
	player_email: string;
}

export interface CheckInvitationResponse {
	has_invitation: boolean;
	game_id?: string;
	invitations?: GameInvitation[];
}
