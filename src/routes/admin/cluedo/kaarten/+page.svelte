<script lang="ts">
	import { enhance } from '$app/forms';
	import Flash from '$lib/components/Flash.svelte';
	import { kindLabels } from '$lib/format';
	let { data, form } = $props();
	const kinds = ['persoon', 'voorwerp', 'locatie'] as const;
</script>

<a href="/admin/cluedo" class="small">← Spelleiding</a>
<h1 style="margin-top:0.5rem">Kaartenset</h1>
<p class="muted">
	Deze kaarten worden gekopieerd in elk nieuw mysterie. Uitgeschakelde kaarten doen niet mee.
	Wijzigingen hebben geen invloed op mysteries die al bestaan.
</p>
<Flash {form} />

<div class="grid kinds">
	{#each kinds as kind (kind)}
		<section class="card">
			<h2>{kindLabels[kind].plural}</h2>
			{#if kind === 'persoon'}
				<p class="muted small">Alle leden doen automatisch mee: {data.members.join(', ')}.</p>
			{/if}
			<ul>
				{#each data.cards.filter((c) => c.kind === kind) as c (c.id)}
					<li class:off={!c.active}>
						<span>{c.name}</span>
						<span class="row">
							<form method="POST" action="?/wissel" use:enhance>
								<input type="hidden" name="id" value={c.id} />
								<button class="secondary small">{c.active ? 'Uitschakelen' : 'Inschakelen'}</button>
							</form>
							<form method="POST" action="?/verwijderen" use:enhance={({ cancel }) => { if (!confirm(`"${c.name}" verwijderen?`)) cancel(); }}>
								<input type="hidden" name="id" value={c.id} />
								<button class="danger small" title="Verwijderen">✕</button>
							</form>
						</span>
					</li>
				{/each}
			</ul>
			<form method="POST" action="?/toevoegen" class="row add" use:enhance={() => async ({ update }) => update({ reset: true })}>
				<input type="hidden" name="type" value={kind} />
				<input name="naam" placeholder="{kindLabels[kind].single} toevoegen…" required maxlength="60" />
				<button>+</button>
			</form>
		</section>
	{/each}
</div>

<style>
	.kinds { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
	ul { list-style: none; padding: 0; margin: 0 0 0.75rem; }
	li { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; padding: 0.4rem 0; border-bottom: 1px solid var(--line); }
	li.off span:first-child { color: var(--muted); text-decoration: line-through; }
	.add { flex-wrap: nowrap; }
</style>
