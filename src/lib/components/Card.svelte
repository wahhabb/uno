<script lang="ts">
	import type { Card } from '$lib/types';

	export let card: Card;
	export let faceDown: boolean = false;
	export let selectable: boolean = false;
	export let selected: boolean = false;
	export let onClick: (() => void) | undefined = undefined;

	$: colorClass = card.color || 'wild';
	$: displayValue = getDisplayValue(card);

	function getDisplayValue(card: Card): string {
		if (card.type === 'number') return card.value?.toString() || '?';
		if (card.type === 'skip') return '⊘';
		if (card.type === 'reverse') return '⇄';
		if (card.type === 'draw_two') return '+2';
		if (card.type === 'wild') return '🌈';
		if (card.type === 'wild_draw_four') return '+4';
		return '?';
	}

	function handleClick() {
		if (selectable && onClick) {
			onClick();
		}
	}
</script>

<button
	class="card {colorClass}"
	class:face-down={faceDown}
	class:selectable
	class:selected
	on:click={handleClick}
	disabled={!selectable}
	type="button"
>
	{#if faceDown}
		<div class="card-back">
			<div class="card-pattern">UNO</div>
		</div>
	{:else}
		<div class="card-front">
			<div class="card-value">{displayValue}</div>
			<div class="card-icon-top">{displayValue}</div>
			<div class="card-icon-bottom">{displayValue}</div>
		</div>
	{/if}
</button>

<style>
	.card {
		width: 80px;
		height: 120px;
		border-radius: 8px;
		border: 3px solid rgba(0, 0, 0, 0.3);
		cursor: default;
		transition: all 0.2s ease;
		position: relative;
		font-family: Arial, sans-serif;
		font-weight: bold;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		padding: 0;
	}

	.card.selectable {
		cursor: pointer;
	}

	.card.selectable:hover {
		transform: translateY(-8px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
	}

	.card.selected {
		transform: translateY(-12px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
		border-color: #fff;
	}

	/* Card colors */
	.card.red {
		background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
		color: white;
	}

	.card.blue {
		background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
		color: white;
	}

	.card.green {
		background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
		color: white;
	}

	.card.yellow {
		background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%);
		color: #333;
	}

	.card.wild {
		background: linear-gradient(
			135deg,
			#e74c3c 0%,
			#3498db 25%,
			#2ecc71 50%,
			#f1c40f 75%,
			#e74c3c 100%
		);
		color: white;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
	}

	.card.face-down {
		background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
	}

	.card-back {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}

	.card-pattern {
		font-size: 24px;
		font-weight: bold;
		color: rgba(255, 255, 255, 0.3);
		transform: rotate(-20deg);
	}

	.card-front {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		padding: 8px;
	}

	.card-value {
		font-size: 48px;
		text-align: center;
	}

	.card-icon-top {
		position: absolute;
		top: 4px;
		left: 8px;
		font-size: 16px;
	}

	.card-icon-bottom {
		position: absolute;
		bottom: 4px;
		right: 8px;
		font-size: 16px;
		transform: rotate(180deg);
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.card {
			width: 60px;
			height: 90px;
		}

		.card-value {
			font-size: 36px;
		}

		.card-icon-top,
		.card-icon-bottom {
			font-size: 12px;
		}
	}
</style>
