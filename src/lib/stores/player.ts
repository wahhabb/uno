// Store for current player information with localStorage persistence
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface PlayerState {
	email: string;
	displayName: string;
	gameId: string | null;
}

// Load from localStorage if available
const storedValue = browser ? localStorage.getItem('playerState') : null;
const parsedValue = storedValue ? JSON.parse(storedValue) : null;
const initialValue: PlayerState = parsedValue
	? {
			email: parsedValue.email.toLowerCase().trim(), // Normalize on load
			displayName: parsedValue.displayName,
			gameId: parsedValue.gameId
		}
	: {
			email: '',
			displayName: '',
			gameId: null
		};

function createPlayerStore() {
	const { subscribe, set, update } = writable<PlayerState>(initialValue);

	return {
		subscribe,
		setPlayer: (email: string, displayName: string) => {
			// Normalize email to match backend normalization
			const normalizedEmail = email.toLowerCase().trim();
			const newState = { email: normalizedEmail, displayName, gameId: initialValue.gameId };
			if (browser) localStorage.setItem('playerState', JSON.stringify(newState));
			update((state) => ({ ...state, email: normalizedEmail, displayName }));
		},
		setGameId: (gameId: string) => {
			update((state) => {
				const newState = { ...state, gameId };
				if (browser) localStorage.setItem('playerState', JSON.stringify(newState));
				return newState;
			});
		},
		clear: () => {
			if (browser) localStorage.removeItem('playerState');
			set({ email: '', displayName: '', gameId: null });
		},
		clearGameOnly: () => {
			// Keep email and displayName, only clear gameId
			update((state) => {
				const newState = { ...state, gameId: null };
				if (browser) localStorage.setItem('playerState', JSON.stringify(newState));
				return newState;
			});
		}
	};
}

export const playerStore = createPlayerStore();
