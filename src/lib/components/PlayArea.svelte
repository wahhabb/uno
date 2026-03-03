<script lang="ts">
	import Card from './Card.svelte';
	import type { Card as CardType, CardColor, GameDirection } from '$lib/types';

	export let topCard: CardType | null;
	export let currentColor: CardColor | null;
	export let direction: GameDirection;
	export let drawPileCount: number;
	export let onDrawCard: (() => void) | undefined = undefined;

	$: directionSymbol = direction === 1 ? '→' : '←';
	$: colorName = currentColor || (topCard?.color as CardColor) || 'red';
</script>

<div class="play-area">
	<div class="area-header">
		<div class="game-info">
			<span class="direction">
				Direction: <strong>{directionSymbol}</strong>
			</span>
			<span class="current-color">
				Color: <span class="color-indicator {colorName}"></span>
			</span>
		</div>
	</div>

	<div class="cards-area">
		<!-- Draw Pile -->
		<div class="pile draw-pile">
			<button
				class="draw-button"
				on:click={onDrawCard}
				disabled={!onDrawCard}
				type="button"
				title={onDrawCard ? 'Click to draw a card' : 'Wait for your turn'}
			>
				{#if drawPileCount > 0}
					<div class="card-container">
						<Card card={{ id: 'back', type: 'number', color: null, value: 0 }} faceDown={true} />
					</div>
					<div class="pile-count">{drawPileCount}</div>
				{:else}
					<div class="empty-pile">Empty</div>
				{/if}
			</button>
			<p class="pile-label">Draw</p>
		</div>

		<!-- Discard Pile -->
		<div class="pile discard-pile">
			{#if topCard}
				<Card card={topCard} />
			{:else}
				<div class="empty-pile">No Card</div>
			{/if}
			<p class="pile-label">Discard</p>
		</div>
	</div>
</div>

<style>
	.play-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 1rem;
	}

	.area-header {
		width: 100%;
	}

	.game-info {
		display: flex;
		justify-content: center;
		gap: 2rem;
		flex-wrap: wrap;
		color: white;
		font-size: 1.1rem;
	}

	.direction {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.current-color {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.color-indicator {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 2px solid white;
		display: inline-block;
	}

	.color-indicator.red {
		background: #e74c3c;
	}

	.color-indicator.blue {
		background: #3498db;
	}

	.color-indicator.green {
		background: #2ecc71;
	}

	.color-indicator.yellow {
		background: #f1c40f;
	}

	.cards-area {
		display: flex;
		gap: 2rem;
		align-items: center;
	}

	.pile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.draw-button {
		position: relative;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		transition: transform 0.2s;
	}

	.draw-button:not(:disabled):hover {
		transform: scale(1.05);
	}

	.draw-button:not(:disabled):active {
		transform: scale(0.98);
	}

	.draw-button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.card-container {
		pointer-events: none;
	}

	.pile-count {
		position: absolute;
		top: -8px;
		right: -8px;
		background: #e74c3c;
		color: white;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		font-weight: bold;
		border: 2px solid white;
	}

	.pile-label {
		margin: 0;
		color: #ccc;
		font-size: 0.9rem;
		text-align: center;
	}

	.empty-pile {
		width: 80px;
		height: 120px;
		border: 2px dashed #666;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #666;
		font-size: 14px;
	}

	@media (max-width: 768px) {
		.cards-area {
			gap: 1rem;
		}

		.game-info {
			font-size: 0.9rem;
			gap: 1rem;
		}

		.empty-pile {
			width: 60px;
			height: 90px;
			font-size: 12px;
		}
	}
</style>
