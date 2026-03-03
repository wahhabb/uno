<script lang="ts">
	export let displayName: string;
	export let cardCount: number;
	export let isCurrentTurn: boolean;
	export let unoDeclared: boolean;
</script>

<div class="opponent" class:current-turn={isCurrentTurn}>
	<div class="opponent-header">
		<span class="opponent-name">{displayName}</span>
		{#if isCurrentTurn}
			<span class="turn-indicator">🎯</span>
		{/if}
	</div>

	<div class="opponent-cards">
		<div class="card-count-badge">
			{cardCount} {cardCount === 1 ? 'card' : 'cards'}
		</div>
		{#if unoDeclared}
			<div class="uno-badge">UNO!</div>
		{/if}
	</div>
</div>

<style>
	.opponent {
		background: rgba(0, 0, 0, 0.3);
		border: 2px solid transparent;
		border-radius: 0.75rem;
		padding: 0.75rem 1rem;
		min-width: 140px;
		transition: all 0.3s ease;
	}

	.opponent.current-turn {
		border-color: #f39c12;
		background: rgba(243, 156, 18, 0.2);
		box-shadow: 0 0 10px rgba(243, 156, 18, 0.5);
	}

	.opponent-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.opponent-name {
		color: white;
		font-weight: bold;
		font-size: 1rem;
	}

	.turn-indicator {
		font-size: 1.2rem;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.2);
		}
	}

	.opponent-cards {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.card-count-badge {
		background: #34495e;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.85rem;
		font-weight: bold;
	}

	.uno-badge {
		background: #e74c3c;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: bold;
		animation: blink 1s ease-in-out infinite;
	}

	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}

	@media (max-width: 768px) {
		.opponent {
			min-width: 120px;
			padding: 0.5rem 0.75rem;
		}

		.opponent-name {
			font-size: 0.9rem;
		}

		.card-count-badge {
			font-size: 0.75rem;
			padding: 0.2rem 0.6rem;
		}
	}
</style>
