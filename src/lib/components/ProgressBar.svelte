<script lang="ts">
	import { euro } from '$lib/format';
	import type { ProgressDTO } from '$lib/server/domain/Progress';

	let { progress, label, variant = 'sea', compact = false }: {
		progress: ProgressDTO;
		label?: string;
		variant?: 'sea' | 'sun';
		compact?: boolean;
	} = $props();
</script>

<div class="progress" class:compact>
	{#if label}
		<div class="head">
			<span class="label">{label}</span>
			<span class="pct">{progress.percentage.toLocaleString('nl-BE')}%</span>
		</div>
	{/if}
	<div class="track" role="progressbar" aria-valuenow={progress.percentage} aria-valuemin="0" aria-valuemax="100">
		<div class="fill {variant}" class:done={progress.reached} style="width: {progress.percentage}%"></div>
	</div>
	{#if !compact}
		<div class="foot">
			<span><strong>{euro(progress.currentCents)}</strong> van {euro(progress.targetCents)}</span>
			<span>
				{#if progress.reached}Doel bereikt! 🎉{:else}nog {euro(progress.remainingCents)}{/if}
			</span>
		</div>
	{/if}
</div>

<style>
	.progress { display: grid; gap: 0.4rem; }
	.head, .foot { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.9rem; }
	.label { font-weight: 600; }
	.pct { font-variant-numeric: tabular-nums; color: var(--muted); }
	.foot { color: var(--muted); }
	.foot strong { color: var(--text); }
	.track { height: 14px; background: var(--track); border-radius: 999px; overflow: hidden; }
	.compact .track { height: 8px; }
	.fill { height: 100%; border-radius: inherit; transition: width 0.6s ease; }
	.fill.sea { background: linear-gradient(90deg, var(--sea-2), var(--sea)); }
	.fill.sun { background: linear-gradient(90deg, var(--sun-2), var(--sun)); }
	.fill.done { background: linear-gradient(90deg, #16a34a, #22c55e); }
</style>
