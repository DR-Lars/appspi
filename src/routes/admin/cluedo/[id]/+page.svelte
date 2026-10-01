<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Flash from '$lib/components/Flash.svelte';
	import { kindLabels, statusLabel, tijdstip } from '$lib/format';
	import { onMount } from 'svelte';
	let { data, form } = $props();
	const m = $derived(data.mystery);
	const kinds = ['persoon', 'voorwerp', 'locatie'] as const;
	const editable = $derived(m.status === 'concept' || m.status === 'actief');
	const remaining = (kind: (typeof kinds)[number]) => m.cards.filter((c) => c.kind === kind && !c.eliminatedAt).length;

	onMount(() => {
		const t = setInterval(() => {
			if (data.mystery.status === 'actief' && document.visibilityState === 'visible') invalidateAll();
		}, 10000);
		return () => clearInterval(t);
	});

	const confirmSubmit = (msg: string) => ({ cancel }: { cancel: () => void }) => {
		if (!confirm(msg)) cancel();
	};
	const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
</script>

<a href="/admin/cluedo" class="small">← Alle mysteries</a>
<div class="spread" style="margin:0.5rem 0 1rem">
	<h1 style="margin:0">{m.title}</h1>
	<span class="badge {m.status}">{statusLabel[m.status]}</span>
</div>
<Flash {form} />

<!-- Bediening -->
<div class="card controls">
	{#if m.status === 'concept'}
		<p style="margin:0">Het mysterie is nog verborgen voor de leden.</p>
		<form method="POST" action="?/starten" use:enhance={confirmSubmit('Het spel nu starten voor iedereen?')}>
			<button class="sun">▶ Spel starten</button>
		</form>
	{:else if m.status === 'actief'}
		<p style="margin:0">Live sinds {tijdstip(m.startedAt)} · {m.hints.filter((h) => h.releasedAt).length}/{m.hints.length} hints vrijgegeven</p>
		<div class="row">
			<form method="POST" action="?/hintVrijgeven" use:enhance>
				<button disabled={!m.hints.some((h) => !h.releasedAt)}>💡 Volgende hint vrijgeven</button>
			</form>
			<form method="POST" action="?/afsluiten" use:enhance={confirmSubmit('Mysterie afsluiten zonder winnaar? De oplossing wordt zichtbaar.')}>
				<button class="secondary">■ Afsluiten</button>
			</form>
		</div>
	{:else}
		<p style="margin:0">
			{#if m.winnerName}🏆 Opgelost door <strong>{m.winnerName}</strong> op {tijdstip(m.endedAt)}{:else}Afgesloten zonder winnaar op {tijdstip(m.endedAt)}{/if}
		</p>
		<form method="POST" action="?/verwijderen" use:enhance={confirmSubmit('Dit mysterie definitief verwijderen?')}>
			<button class="danger small">Verwijderen</button>
		</form>
	{/if}
</div>

<!-- Oplossing -->
<div class="card solution" style="margin-top:1rem">
	{#if m.solution}
		<h2 style="margin:0 0 0.4rem">🔓 Oplossing</h2>
		<p style="margin:0" class="big">
			<strong>{m.solution.person}</strong> met <strong>{m.solution.object}</strong> — <strong>{m.solution.location}</strong>
		</p>
	{:else}
		<div class="spread">
			<div>
				<h2 style="margin:0 0 0.2rem">🔒 De oplossing is geheim</h2>
				<p class="muted small" style="margin:0">
					Ook admins zien ze niet: jullie kunnen dus gewoon meespelen. Ze wordt onthuld zodra het mysterie afgelopen is.
				</p>
			</div>
			{#if m.status === 'concept'}
				<form method="POST" action="?/herloten" use:enhance={keep}>
					<button class="secondary small">🎲 Opnieuw loten</button>
				</form>
			{/if}
		</div>
	{/if}
</div>

{#if m.status === 'actief'}
	<div class="card auto" style="margin-top:1rem">
		<h2 style="margin:0 0 0.2rem">🎲 Automatische hint</h2>
		<p class="muted small" style="margin:0 0 0.75rem">
			Het systeem sluit een willekeurige kaart uit die zeker <em>niet</em> bij de oplossing hoort en geeft de hint meteen vrij.
		</p>
		<div class="row">
			{#each kinds as kind (kind)}
				<form method="POST" action="?/autoHint" use:enhance={keep}>
					<input type="hidden" name="type" value={kind} />
					<button class="sun small">Sluit een {kindLabels[kind].single.toLowerCase()} uit</button>
				</form>
			{/each}
			<form method="POST" action="?/autoHint" use:enhance={keep}>
				<button class="secondary small">Willekeurige kaart</button>
			</form>
		</div>
		<p class="muted small" style="margin:0.6rem 0 0">
			Nog in het spel: {kinds.map((k) => `${remaining(k)} ${kindLabels[k].plural.toLowerCase()}`).join(' · ')}
		</p>
	</div>
{/if}

<div class="grid-2" style="margin-top:1rem">
	<div class="stack">
		<div class="card">
			<h2>Hints</h2>
			<p class="muted small">Eigen teksthints (sfeer, verhaal…) geef je zelf vrij. Automatische hints verschijnen hier ook.</p>
			{#if m.hints.length === 0}<p class="empty">Nog geen hints.</p>{/if}
			<ol class="hints">
				{#each m.hints as h (h.id)}
					<li class:released={h.releasedAt}>
						<span class="n">{h.position}</span>
						<span class="t">
							{h.text}
							<small class="muted">
								{h.releasedAt ? `vrijgegeven ${tijdstip(h.releasedAt)}` : 'verborgen'}{#if h.cardName} · sluit <strong>{h.cardName}</strong> uit{/if}
							</small>
						</span>
						{#if !h.releasedAt}
							<span class="row">
								{#if m.status === 'actief'}
									<form method="POST" action="?/hintVrijgeven" use:enhance>
										<input type="hidden" name="hintId" value={h.id} />
										<button class="small">Vrijgeven</button>
									</form>
								{/if}
								<form method="POST" action="?/hintVerwijderen" use:enhance>
									<input type="hidden" name="hintId" value={h.id} />
									<button class="danger small" title="Verwijderen">✕</button>
								</form>
							</span>
						{/if}
					</li>
				{/each}
			</ol>
			{#if editable}
				<form method="POST" action="?/hintToevoegen" class="row addhint" style="flex-wrap:nowrap" use:enhance={() => async ({ update }) => update({ reset: true })}>
					<input name="hint" placeholder="Nieuwe teksthint…" required maxlength="300" />
					<button>Toevoegen</button>
				</form>
			{/if}
		</div>

		{#if editable}
			<form method="POST" action="?/bewerken" class="card stack" use:enhance={keep}>
				<h2>Gegevens</h2>
				<label>Titel <input name="titel" value={m.title} required /></label>
				<label>Verhaal <textarea name="verhaal">{m.story}</textarea></label>
				<label>Beschuldigingen per lid <input name="gokken" type="number" min="1" max="20" value={m.maxGuesses} required /></label>
				<button class="secondary">Opslaan</button>
			</form>
		{/if}
	</div>

	<div class="stack">
		<div class="card">
			<h2>Kaarten in dit spel</h2>
			<div class="deck">
				{#each kinds as kind (kind)}
					<div>
						<h3>{kindLabels[kind].plural}</h3>
						{#each m.cards.filter((c) => c.kind === kind) as c (c.id)}
							<span class="chip" class:gone={c.eliminatedAt}>{c.name}</span>
						{/each}
					</div>
				{/each}
			</div>
		</div>

		<div class="card">
			<h2>Beschuldigingen ({m.guesses.length})</h2>
			{#if m.guesses.length === 0}
				<p class="empty">Nog geen beschuldigingen.</p>
			{:else}
				<div class="table-wrap">
					<table>
						<thead><tr><th>Lid</th><th>Beschuldiging</th></tr></thead>
						<tbody>
							{#each m.guesses as g (g.id)}
								<tr class:correct={g.correct}>
									<td>{g.displayName}<br /><span class="muted small">{tijdstip(g.createdAt)}</span></td>
									<td>{g.correct ? '✅ ' : ''}{g.text}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.controls { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; border-left: 5px solid var(--sun); }
	.solution { border-left: 5px solid var(--sea); }
	.auto { border-left: 5px solid var(--sun); }
	.big { font-size: 1.1rem; }
	.hints { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
	.hints li { display: flex; gap: 0.75rem; align-items: center; padding: 0.55rem 0.7rem; border-radius: 10px; border: 1px dashed var(--line); }
	.hints li.released { border-style: solid; background: var(--bg); }
	.hints .n { flex: none; width: 1.6rem; height: 1.6rem; border-radius: 50%; background: var(--track); font-weight: 700; display: grid; place-items: center; font-size: 0.8rem; }
	.hints li.released .n { background: var(--sun); color: white; }
	.hints .t { flex: 1; display: grid; }
	.addhint { margin-top: 0.9rem; padding-top: 0.9rem; border-top: 1px solid var(--line); }
	.deck { display: grid; gap: 0.75rem; }
	.deck h3 { margin-bottom: 0.3rem; }
	.chip.gone { text-decoration: line-through; opacity: 0.55; }
	tr.correct td { background: var(--ok-bg); }
</style>
