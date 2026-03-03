<script lang="ts">
	import Card from './Card.svelte';
	import type { Card as CardType } from '$lib/types';

	export let hand: CardType[];
	export let onCardClick: ((card: CardType) => void) | undefined = undefined;
	export let selectedCardId: string | null = null;
	export let isCurrentTurn: boolean = false;
</script>

<div class="player-hand">
	<div class="hand-header">
		<h3>Your Hand ({hand.length} cards)</h3>
		{#if !isCurrentTurn}
			<span class="wait-indicator">Waiting for your turn...</span>
		{/if}
	</div>

	<div class="cards-container">
		{#if hand.length === 0}
			<p class="empty-hand">No cards in hand</p>
		{:else}
			{#each hand as card (card.id)}
				<div class="card-wrapper">
					<Card
						{card}
						selectable={isCurrentTurn && !!onCardClick}
						selected={selectedCardId === card.id}
						onClick={() => onCardClick?.(card)}
					/>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.player-hand {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 1rem;
		padding: 1rem;
		width: 100%;
	}

	.hand-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.hand-header h3 {
		margin: 0;
		color: white;
		font-size: 1.2rem;
	}

	.wait-indicator {
		color: #f39c12;
		font-size: 0.9rem;
		font-style: italic;
	}

	.cards-container {
		display: flex;
		gap: 0.5rem;
		overflow-x: auto;
		padding: 0.5rem 0;
		scrollbar-width: thin;
		scrollbar-color: #666 #333;
	}

	.cards-container::-webkit-scrollbar {
		height: 8px;
	}

	.cards-container::-webkit-scrollbar-track {
		background: #333;
		border-radius: 4px;
	}

	.cards-container::-webkit-scrollbar-thumb {
		background: #666;
		border-radius: 4px;
	}

	.cards-container::-webkit-scrollbar-thumb:hover {
		background: #888;
	}

	.card-wrapper {
		flex-shrink: 0;
		transition: all 0.3s ease-out;
	}

	.empty-hand {
		text-align: center;
		color: #999;
		padding: 2rem;
		font-style: italic;
	}

	@media (max-width: 768px) {
		.player-hand {
			padding: 0.75rem;
		}

		.hand-header h3 {
			font-size: 1rem;
		}

		.wait-indicator {
			font-size: 0.8rem;
		}

		.cards-container {
			gap: 0.25rem;
		}
	}
</style>
