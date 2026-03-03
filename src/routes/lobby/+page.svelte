<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { playerStore } from '$lib/stores/player';

	let email = '';
	let displayName = '';
	let gameId = '';
	let isHost = false;
	let loading = true;
	let error = '';
	let inviteEmails = [''];
	let players: any[] = [];
	let game: any = null;
	let refreshInterval: any = null;
	let expectedPlayerCount = 0; // Total expected: host + invitees

	// Check if joining existing game
	$: joinGameId = $page.url.searchParams.get('join');

	onMount(async () => {
		playerStore.subscribe((state) => {
			email = state.email;
			displayName = state.displayName;
			gameId = state.gameId || '';
		});

		if (!email) {
			// No player info, redirect to home
			goto('/');
			return;
		}

		if (joinGameId) {
			// Join existing game
			await joinGame(joinGameId);
		}

		loading = false;

		// Auto-refresh every 3 seconds when in lobby
		refreshInterval = setInterval(() => {
			if (gameId) {
				loadGameState();
			}
		}, 3000);
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});

	async function joinGame(gid: string) {
		try {
			const response = await fetch('/api/join-game', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					game_id: gid,
					player_email: email.toLowerCase().trim(),
					display_name: displayName
				})
			});

			const result = await response.json();

			if (!result.success) {
				error = result.error || 'Failed to join game';
				return;
			}

			gameId = gid;
			playerStore.setGameId(gid);
			await loadGameState();
		} catch (err) {
			console.error('Error joining game:', err);
			error = 'Failed to join game';
		}
	}

	async function createGame() {
		if (inviteEmails.filter((e) => e.trim()).length === 0) {
			error = 'Please enter at least one email to invite';
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await fetch('/api/create-game', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					host_email: email.toLowerCase().trim(),
					host_display_name: displayName,
					invitee_emails: inviteEmails.filter((e) => e.trim())
				})
			});

			const result = await response.json();

			if (!result.success) {
				error = result.error || 'Failed to create game';
				loading = false;
				return;
			}

			gameId = result.data.game_id;
			playerStore.setGameId(gameId);
			isHost = true;
			// Store expected player count: host + invitees
			expectedPlayerCount = 1 + inviteEmails.filter((e) => e.trim()).length;
			await loadGameState();
		} catch (err) {
			console.error('Error creating game:', err);
			error = 'Failed to create game';
		}

		loading = false;
	}

	async function loadGameState() {
		try {
			const response = await fetch(`/api/game/${gameId}?player_email=${email.toLowerCase().trim()}`);
			const result = await response.json();

			if (!result.success) {
				error = 'Failed to load game state';
				return;
			}

			game = result.data.game;
			players = result.data.players;
			isHost = game.host_email === email.toLowerCase().trim();

			// If game started, redirect to game board
			if (game.status === 'in_progress') {
				goto(`/game/${gameId}`);
				return;
			}

			// Get invitation count to determine expected players
			if (expectedPlayerCount === 0) {
				const inviteResponse = await fetch(`/api/game/${gameId}/invitations`);
				if (inviteResponse.ok) {
					const inviteResult = await inviteResponse.json();
					if (inviteResult.success) {
						// Expected = invitations + host
						expectedPlayerCount = inviteResult.data.length + 1;
					}
				}
			}

			// Auto-start game if all players have joined
			if (isHost && expectedPlayerCount > 0 && players.length >= expectedPlayerCount && players.length >= 2) {
				console.log('All players joined! Auto-starting game...', {
					expected: expectedPlayerCount,
					actual: players.length
				});
				await startGame();
			}
		} catch (err) {
			console.error('Error loading game state:', err);
			error = 'Failed to load game state';
		}
	}

	async function startGame() {
		if (players.length < 2) {
			error = 'Need at least 2 players to start';
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await fetch('/api/start-game', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					game_id: gameId,
					host_email: email.toLowerCase().trim()
				})
			});

			const result = await response.json();

			if (!result.success) {
				error = result.error || 'Failed to start game';
				loading = false;
				return;
			}

			// Redirect to game board
			goto(`/game/${gameId}`);
		} catch (err) {
			console.error('Error starting game:', err);
			error = 'Failed to start game';
			loading = false;
		}
	}

	function addEmailField() {
		if (inviteEmails.length < 6) {
			inviteEmails = [...inviteEmails, ''];
		}
	}

	function removeEmailField(index: number) {
		inviteEmails = inviteEmails.filter((_, i) => i !== index);
	}
</script>

<main>
	<div class="container">
		{#if loading}
			<div class="loading">Loading...</div>
		{:else if !gameId}
			<!-- Create game / invite players -->
			<h1>🎮 Create Game</h1>
			<p class="subtitle">Invite friends to play UNO with you!</p>

			{#if error}
				<div class="error-message">{error}</div>
			{/if}

			<div class="player-info">
				<strong>{displayName}</strong> ({email})
			</div>

			<form on:submit|preventDefault={createGame}>
				<h3>Invite Players</h3>

				{#each inviteEmails as inviteEmail, i}
					<div class="email-input-group">
						<input
							type="email"
							bind:value={inviteEmails[i]}
							placeholder="friend@example.com"
							required
						/>
						{#if inviteEmails.length > 1}
							<button
								type="button"
								class="remove-btn"
								on:click={() => removeEmailField(i)}
							>
								✕
							</button>
						{/if}
					</div>
				{/each}

				{#if inviteEmails.length < 6}
					<button type="button" class="add-btn" on:click={addEmailField}>
						+ Add Another Player
					</button>
				{/if}

				<button type="submit" class="primary-button">
					Create Game & Send Invites
				</button>
			</form>
		{:else}
			<!-- Game lobby - waiting for players -->
			<h1>🎮 Game Lobby</h1>
			<p class="subtitle">Waiting for players to join...</p>

			{#if error}
				<div class="error-message">{error}</div>
			{/if}

			<div class="players-list">
				<h3>Players ({players.length}/7)</h3>
				{#each players as player}
					<div class="player-item">
						<span class="player-name">{player.display_name}</span>
						{#if player.email === email}
							<span class="you-badge">You</span>
						{/if}
						{#if player.email === game?.host_email}
							<span class="host-badge">Host</span>
						{/if}
					</div>
				{/each}
			</div>

			{#if isHost}
				<button
					class="primary-button"
					on:click={startGame}
					disabled={loading || players.length < 2}
				>
					{loading ? 'Starting...' : 'Start Game'}
				</button>
				{#if players.length < 2}
					<p class="hint">Waiting for at least one more player...</p>
				{/if}
			{:else}
				<p class="hint">Waiting for host to start the game...</p>
			{/if}

			<button class="danger-button" on:click={() => {
				playerStore.clear();
				goto('/');
			}}>
				Leave Game
			</button>
		{/if}
	</div>
</main>

<style>
	main {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		padding: 1rem;
	}

	.container {
		background: #2a2a2a;
		border-radius: 1rem;
		padding: 2rem;
		max-width: 500px;
		width: 100%;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
	}

	h1 {
		text-align: center;
		margin-bottom: 0.5rem;
		font-size: 2rem;
	}

	h3 {
		margin: 1.5rem 0 1rem;
		color: #ccc;
	}

	.subtitle {
		text-align: center;
		color: #999;
		margin-bottom: 2rem;
	}

	.loading {
		text-align: center;
		padding: 2rem;
		color: #999;
	}

	.error-message {
		background: #ff4444;
		color: white;
		padding: 0.75rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		text-align: center;
	}

	.player-info {
		background: #1a1a1a;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.email-input-group {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.email-input-group input {
		flex: 1;
		padding: 0.75rem;
		border: 2px solid #444;
		border-radius: 0.5rem;
		background: #1a1a1a;
		color: white;
		font-size: 1rem;
	}

	.email-input-group input:focus {
		outline: none;
		border-color: #4a90e2;
	}

	.remove-btn {
		padding: 0.5rem 1rem;
		background: #ff4444;
		color: white;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 1.2rem;
	}

	.add-btn {
		width: 100%;
		padding: 0.75rem;
		background: #333;
		color: white;
		border: 2px dashed #666;
		border-radius: 0.5rem;
		cursor: pointer;
		margin-bottom: 1rem;
		transition: all 0.2s;
	}

	.add-btn:hover {
		background: #444;
		border-color: #888;
	}

	.primary-button {
		width: 100%;
		padding: 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 1.1rem;
		font-weight: bold;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.primary-button:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	.primary-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.secondary-button {
		width: 100%;
		padding: 0.75rem;
		background: #333;
		color: white;
		border: 1px solid #666;
		border-radius: 0.5rem;
		cursor: pointer;
		margin-top: 0.5rem;
	}

	.danger-button {
		width: 100%;
		padding: 0.75rem;
		background: #e74c3c;
		color: white;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		margin-top: 0.5rem;
		transition: background 0.2s;
	}

	.danger-button:hover {
		background: #c0392b;
	}

	.game-info {
		background: #1a1a1a;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.game-info p {
		margin: 0.5rem 0;
	}

	.players-list {
		background: #1a1a1a;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.player-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: #2a2a2a;
		border-radius: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.player-name {
		flex: 1;
	}

	.you-badge {
		background: #4a90e2;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.8rem;
	}

	.host-badge {
		background: #f39c12;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.8rem;
	}

	.hint {
		text-align: center;
		color: #999;
		font-size: 0.9rem;
		margin-top: 1rem;
	}
</style>
