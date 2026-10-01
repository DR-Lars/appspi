<script lang="ts">
	import { enhance } from '$app/forms';
	import Flash from '$lib/components/Flash.svelte';
	import { datum, statusLabel } from '$lib/format';
	let { data, form } = $props();
</script>

<div class="spread" style="margin-bottom:0.5rem">
	<h1 style="margin:0">Cluedo — spelleiding</h1>
	<a class="btn secondary" href="/admin/cluedo/kaarten">🃏 Kaartenset beheren</a>
</div>
<p class="muted">
	Een nieuw mysterie krijgt alle leden + de actieve kaarten als verdachten, voorwerpen en locaties.
	De oplossing wordt willekeurig en geheim getrokken — ook admins zien ze niet, dus iedereen kan meespelen.
</p>

<div class="grid-2">
	<form method="POST" action="?/aanmaken" class="card stack" use:enhance>
		<h2>Nieuw mysterie</h2>
		<Flash {form} />
		<p class="deck small">
			<span class="chip">👤 {data.deck.members} leden + {data.deck.persoon} personages</span>
			<span class="chip">🔪 {data.deck.voorwerp} voorwerpen</span>
			<span class="chip">📍 {data.deck.locatie} locaties</span>
		</p>
		<label>Titel <input name="titel" placeholder="bv. Moord in de strandbar" required /></label>
		<label>Verhaal <textarea name="verhaal" placeholder="Het verhaal dat de leden te zien krijgen bij de start…"></textarea></label>
		<label>Beschuldigingen per lid <input name="gokken" type="number" min="1" max="20" value="3" required /></label>
		<button type="submit">Aanmaken & oplossing trekken</button>
	</form>

	<div class="card">
		<h2>Mysteries</h2>
		{#if data.mysteries.length === 0}
			<p class="empty">Nog geen mysteries.</p>
		{:else}
			<ul class="list">
				{#each data.mysteries as m (m.id)}
					<li>
						<a href="/admin/cluedo/{m.id}" class="spread">
							<span>
								<strong>{m.title}</strong>
								<span class="muted small">· {m.releasedCount}/{m.totalHints} hints · {m.guessCount} beschuldigingen</span>
							</span>
							<span class="row">
								<span class="badge {m.status}">{statusLabel[m.status]}</span>
								{#if m.endedAt}<span class="muted small">{datum(m.endedAt)}</span>{/if}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.deck { margin: 0; }
	.list { list-style: none; padding: 0; margin: 0; }
	.list a { display: flex; padding: 0.7rem 0.5rem; border-bottom: 1px solid var(--line); color: var(--text); text-decoration: none; border-radius: 8px; }
	.list a:hover { background: var(--bg); }
</style>
