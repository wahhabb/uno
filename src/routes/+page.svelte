<script lang="ts">
	import { goto } from '$app/navigation';
	import { playerStore } from '$lib/stores/player';
	import { onMount } from 'svelte';

	let email = '';
	let displayName = '';
	let loading = false;
	let error = '';
	let hasExistingSession = false;
	let existingEmail = '';
	let existingGameId = '';

	onMount(() => {
		// Check if player has an existing session
		const stored = localStorage.getItem('playerState');
		if (stored) {
			const state = JSON.parse(stored);
			
			// Pre-fill email and display name if available
			if (state.email) {
				email = state.email;
			}
			if (state.displayName) {
				displayName = state.displayName;
			}
			
			// Check if they have an active game
			if (state.email && state.gameId) {
				hasExistingSession = true;
				existingEmail = state.email;
				existingGameId = state.gameId;
			}
		}
	});

	async function handleSubmit() {
		loading = true;
		error = '';

		try {
			// Use display name if provided, otherwise use email prefix
			const finalDisplayName = displayName || email.split('@')[0];

			// Check if player has pending invitations
			const response = await fetch('/api/check-invitation', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.toLowerCase().trim() })
			});

			const result = await response.json();

			if (!result.success) {
				error = result.error || 'Failed to check invitations';
				loading = false;
				return;
			}

			// Store player info
			playerStore.setPlayer(email, finalDisplayName);

			// If player has an invitation, take them to that game's lobby
			if (result.data.has_invitation && result.data.game_id) {
				playerStore.setGameId(result.data.game_id);
				goto(`/lobby?join=${result.data.game_id}`);
			} else {
				// No invitation - take them to create/invite screen
				goto('/lobby');
			}
		} catch (err) {
			console.error('Error:', err);
			error = 'Failed to connect. Please try again.';
			loading = false;
		}
	}

	function resumeSession() {
		goto(`/game/${existingGameId}`);
	}

	function startFresh() {
		playerStore.clear();
		hasExistingSession = false;
		existingEmail = '';
		existingGameId = '';
	}
</script>

<main>
	<div class="container">
		<h1>🎮 UNO Online</h1>
		<p class="subtitle">Start or Join a Game</p>

		{#if hasExistingSession}
			<div class="existing-session">
				<h3>Continue Previous Game?</h3>
				<p>You have an active game as <strong>{existingEmail}</strong></p>

				<div class="button-group">
					<button class="primary-button" on:click={resumeSession}>
						Resume Game
					</button>
					<button class="secondary-button" on:click={startFresh}>
						Start Fresh
					</button>
				</div>
			</div>
		{:else}
			<form on:submit|preventDefault={handleSubmit}>
				{#if error}
					<div class="error-message">{error}</div>
				{/if}

				<div class="form-group">
					<label for="email">Email Address</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder="your.email@example.com"
						required
						disabled={loading}
					/>
				</div>

				<div class="form-group">
					<label for="displayName">Display Name (optional)</label>
					<input
						id="displayName"
						type="text"
						bind:value={displayName}
						placeholder="Your Name"
						disabled={loading}
					/>
				</div>

				<button type="submit" class="primary-button" disabled={loading}>
					{loading ? 'Loading...' : 'Continue'}
				</button>

				<p class="info-text">
					Enter your email to join an existing game or create a new one
				</p>
			</form>
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
		max-width: 400px;
		width: 100%;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
	}

	h1 {
		text-align: center;
		margin-bottom: 0.5rem;
		font-size: 2.5rem;
	}

	.subtitle {
		text-align: center;
		color: #999;
		margin-bottom: 2rem;
	}

	.existing-session {
		text-align: center;
	}

	.existing-session h3 {
		color: white;
		margin-bottom: 1rem;
	}

	.existing-session p {
		color: #ccc;
		margin-bottom: 1.5rem;
	}

	.button-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: #ccc;
		font-size: 0.9rem;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #444;
		border-radius: 0.5rem;
		background: #1a1a1a;
		color: white;
		font-size: 1rem;
	}

	input:focus {
		outline: none;
		border-color: #4a90e2;
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
		transition: transform 0.2s;
		cursor: pointer;
	}

	.primary-button:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	.primary-button:active {
		transform: translateY(0);
	}

	.primary-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.secondary-button {
		width: 100%;
		padding: 0.75rem;
		background: #666;
		color: white;
		border: 1px solid #888;
		border-radius: 0.5rem;
		font-size: 1rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.secondary-button:hover {
		background: #777;
	}

	.error-message {
		background: #ff4444;
		color: white;
		padding: 0.75rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		text-align: center;
		font-size: 0.9rem;
	}

	.info-text {
		text-align: center;
		color: #999;
		font-size: 0.85rem;
		margin-top: 1rem;
		font-style: italic;
	}
</style>
