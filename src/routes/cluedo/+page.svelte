<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { datum, kindLabels, statusLabel, tijdstip } from '$lib/format';
	import { onMount } from 'svelte';
	let { data, form } = $props();

	const kinds = ['persoon', 'voorwerp', 'locatie'] as const;

	let keuze = $state<Record<(typeof kinds)[number], string>>({ persoon: '', voorwerp: '', locatie: '' });

	// Persoonlijk detectiveblad: eigen aantekeningen, enkel in deze browser bewaard.
	let blad = $state<Record<number, boolean>>({});
	const bladKey = $derived(data.active ? `appspi-blad-${data.active.id}` : '');
	$effect(() => {
		if (!bladKey) return;
		try {
			blad = JSON.parse(localStorage.getItem(bladKey) ?? '{}');
		} catch {
			blad = {};
		}
	});
	const toggle = (id: number) => {
		blad = { ...blad, [id]: !blad[id] };
		try {
			localStorage.setItem(bladKey, JSON.stringify(blad));
		} catch {
			/* geen opslag beschikbaar */
		}
	};

	onMount(() => {
		const t = setInterval(() => {
			if (data.active && document.visibilityState === 'visible') invalidateAll();
		}, 15000);
		return () => clearInterval(t);
	});

	const isCorrect = $derived(!!form && 'correct' in form && form.correct);
</script>

<h1>🔎 Cluedo</h1>

{#if data.active}
	{@const m = data.active}
	<section class="card case">
		<div class="spread">
			<h2>{m.title}</h2>
			<span class="badge actief">Bezig sinds {tijdstip(m.startedAt)}</span>
		</div>
		{#if m.story}<p class="story">{m.story}</p>{/if}

		<h3>Hints ({m.hints.length}/{m.totalHints})</h3>
		{#if m.hints.length === 0}
			<p class="muted">Nog geen hints vrijgegeven. Hou deze pagina in de gaten…</p>
		{:else}
			<ol class="hints">
				{#each m.hints as h (h.id)}
					<li><span class="n">{h.position}</span><span>{h.text}</span></li>
				{/each}
			</ol>
		{/if}
	</section>

	<section class="card" style="margin-top:1rem">
		<div class="spread">
			<h2 style="margin:0">Detectiveblad</h2>
			<span class="muted small">Tik op een kaart om ze voor jezelf af te strepen.</span>
		</div>
		<div class="sheet">
			{#each kinds as kind (kind)}
				<div>
					<h3>{kindLabels[kind].plural}</h3>
					<ul>
						{#each m.cards.filter((c) => c.kind === kind) as c (c.id)}
							<li>
								<button
									type="button"
									class="cardbtn"
									class:crossed={blad[c.id]}
									class:eliminated={c.eliminatedAt}
									disabled={!!c.eliminatedAt}
									onclick={() => toggle(c.id)}
									title={c.eliminatedAt ? 'Uitgesloten door een hint' : 'Afstrepen'}
								>
									<span class="mark">{c.eliminatedAt ? '✕' : blad[c.id] ? '✗' : ''}</span>
									<span class="nm">{c.name}</span>
									{#if c.isMember}<span class="tag">lid</span>{/if}
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</section>

	<div class="grid-2" style="margin-top:1rem">
		<form
			method="POST"
			action="?/beschuldig"
			class="card stack"
			use:enhance={({ cancel }) => {
				if (!confirm('Zeker? Een beschuldiging kost je één poging.')) return cancel();
				return async ({ update }) => {
					await update({ reset: false });
					keuze = { persoon: '', voorwerp: '', locatie: '' };
				};
			}}
		>
			<h2>Beschuldig</h2>
			{#if form?.message}
				<p class="flash" class:error={!isCorrect}>{form.message}</p>
			{/if}
			<input type="hidden" name="id" value={m.id} />
			{#each kinds as kind (kind)}
				<label>{kindLabels[kind].single}
					<select name={kind} bind:value={keuze[kind]} required disabled={m.remaining === 0}>
						<option value="">— kies —</option>
						{#each m.cards.filter((c) => c.kind === kind && !c.eliminatedAt) as c (c.id)}
							<option value={String(c.id)}>{c.name}{blad[c.id] ? ' (afgestreept)' : ''}</option>
						{/each}
					</select>
				</label>
			{/each}
			<button type="submit" class="sun" disabled={m.remaining === 0 || !keuze.persoon || !keuze.voorwerp || !keuze.locatie}>
				Beschuldigen
			</button>
			<p class="muted small" style="margin:0">
				Je hebt nog <strong>{m.remaining}</strong> van de {m.maxGuesses} beschuldigingen over.
			</p>
			{#if m.myGuesses.length}
				<div>
					<h3>Mijn beschuldigingen</h3>
					{#each m.myGuesses as g (g.id)}<div class="chip">✗ {g.text}</div>{/each}
				</div>
			{/if}
		</form>

		<div class="card">
			<h2>Recente beschuldigingen</h2>
			{#if m.feed.length === 0}
				<p class="empty">Nog niemand heeft iemand beschuldigd.</p>
			{:else}
				<ul class="feed">
					{#each m.feed as f (f.id)}
						<li><strong>{f.name}</strong> deed een beschuldiging <span class="muted small">· {tijdstip(f.createdAt)}</span></li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
{:else}
	<div class="card idle">
		<p class="big">🕵️</p>
		<h2>Er loopt momenteel geen mysterie</h2>
		<p class="muted">De admins starten een nieuw spel wanneer je het het minst verwacht…</p>
		{#if form?.message}<p class="flash">{form.message}</p>{/if}
	</div>
{/if}

{#if data.history.length}
	<h2 style="margin-top:2rem">Opgeloste zaken</h2>
	<div class="stack">
		{#each data.history as h (h.id)}
			<details class="card">
				<summary class="spread">
					<strong>{h.title}</strong>
					<span class="row">
						<span class="badge" class:opgelost={h.status === 'opgelost'}>{statusLabel[h.status]}</span>
						<span class="muted small">{datum(h.endedAt)}</span>
					</span>
				</summary>
				<div style="margin-top:0.75rem">
					{#if h.winnerName}<p>🏆 Opgelost door <strong>{h.winnerName}</strong></p>{:else}<p class="muted">Niemand vond de oplossing.</p>{/if}
					{#if h.solution}
						<p>Het was <strong>{h.solution.person}</strong> met <strong>{h.solution.object}</strong> — <strong>{h.solution.location}</strong>.</p>
					{/if}
				</div>
			</details>
		{/each}
	</div>
{/if}

<style>
	.case { border-left: 5px solid var(--sun); }
	.story { white-space: pre-line; background: var(--bg); padding: 0.9rem 1rem; border-radius: 10px; font-style: italic; }
	.hints { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
	.hints li { display: flex; gap: 0.75rem; align-items: flex-start; padding: 0.6rem 0.8rem; background: var(--bg); border-radius: 10px; animation: pop 0.4s ease; }
	.hints .n { flex: none; width: 1.6rem; height: 1.6rem; border-radius: 50%; background: var(--sun); color: #fff; font-weight: 700; display: grid; place-items: center; font-size: 0.8rem; }
	@keyframes pop { from { opacity: 0; transform: translateY(4px); } }
	.sheet { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 0.75rem; }
	.sheet ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.3rem; }
	.cardbtn { width: 100%; justify-content: flex-start; background: var(--bg); color: var(--text); border: 1px solid var(--line); font-weight: 500; padding: 0.45rem 0.6rem; }
	.cardbtn .mark { width: 1rem; color: var(--err); font-weight: 800; }
	.cardbtn .nm { flex: 1; text-align: left; }
	.cardbtn.crossed .nm { text-decoration: line-through; color: var(--muted); }
	.cardbtn.eliminated { opacity: 0.55; }
	.cardbtn.eliminated .nm { text-decoration: line-through; }
	.cardbtn:disabled { cursor: default; }
	.tag { font-size: 0.7rem; background: #cffafe; color: #155e75; padding: 0 0.4rem; border-radius: 999px; font-weight: 700; }
	.feed { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.4rem; }
	.idle { text-align: center; padding: 2.5rem 1rem; }
	.big { font-size: 3rem; margin: 0; }
	.flash { padding: 0.6rem 0.8rem; border-radius: 10px; margin: 0; background: var(--ok-bg); color: var(--ok); font-weight: 600; }
	.flash.error { background: var(--err-bg); color: var(--err); }
	summary { cursor: pointer; list-style: none; }
	summary::-webkit-details-marker { display: none; }
</style>
