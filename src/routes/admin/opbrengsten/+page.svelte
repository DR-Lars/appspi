<script lang="ts">
	import { enhance } from '$app/forms';
	import Flash from '$lib/components/Flash.svelte';
	import { datum, euro, parseEuro, vandaag, verdeel } from '$lib/format';
	let { data, form } = $props();

	let titel = $state('');
	let bedrag = $state('');
	let dag = $state(vandaag());
	let geselecteerd = $state<number[]>([]);

	const cents = $derived(parseEuro(bedrag));
	// Zelfde volgorde als de server (minst verdiend eerst, dan id), zodat de voorbeeldverdeling exact klopt.
	const verdiend = (id: number) => data.members.find((m) => m.id === id)?.earnedCents ?? 0;
	const gesorteerd = $derived([...geselecteerd].sort((a, b) => verdiend(a) - verdiend(b) || a - b));
	const delen = $derived(verdeel(cents, gesorteerd.length));
	const naam = (id: number) => data.members.find((m) => m.id === id)?.displayName ?? '?';

	const alles = () => (geselecteerd = data.members.map((m) => m.id));
	const niets = () => (geselecteerd = []);
</script>

<h1>Opbrengsten</h1>
<p class="muted">Al het geld wordt verdiend met activiteiten. Het volledige bedrag gaat naar de groepspot en wordt automatisch gelijk verdeeld over de deelnemers; elk aandeel telt voor hun persoonlijk budget.</p>

<div class="grid-2">
	<form
		method="POST"
		action="?/toevoegen"
		class="card stack"
		use:enhance={() => async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'success') { titel = ''; bedrag = ''; geselecteerd = []; }
		}}
	>
		<h2>Nieuwe opbrengst</h2>
		<Flash {form} />
		<label>Omschrijving <input name="titel" bind:value={titel} placeholder="bv. Wafelverkoop" required /></label>
		<div class="grid-2" style="grid-template-columns:1fr 1fr">
			<label>Bedrag (€) <input name="bedrag" bind:value={bedrag} inputmode="decimal" placeholder="0,00" required /></label>
			<label>Datum <input type="date" name="datum" bind:value={dag} required /></label>
		</div>
		<fieldset>
			<legend class="spread">
				<span>Deelnemers ({geselecteerd.length})</span>
				<span class="row">
					<button type="button" class="secondary small" onclick={alles}>Iedereen</button>
					<button type="button" class="secondary small" onclick={niets}>Niemand</button>
				</span>
			</legend>
			<div class="people">
				{#each data.members as m (m.id)}
					<label class="person">
						<input type="checkbox" name="deelnemers" value={m.id} bind:group={geselecteerd} />
						<span>{m.displayName}</span>
					</label>
				{/each}
			</div>
		</fieldset>

		{#if delen.length}
			<div class="preview">
				<strong>Verdeling:</strong>
				{#each gesorteerd as id, i (id)}<span class="chip">{naam(id)}: {euro(delen[i]!)}</span>{/each}
			</div>
		{/if}
		<button type="submit" disabled={!geselecteerd.length || !(cents > 0)}>Opslaan</button>
	</form>

	<div class="card">
		<h2>Geschiedenis</h2>
		{#if data.earnings.length === 0}
			<p class="empty">Nog geen opbrengsten.</p>
		{:else}
			<ul class="list">
				{#each data.earnings as e (e.id)}
					<li>
						<div class="spread">
							<div>
								<strong>{e.title}</strong>
								<div class="muted small">{datum(e.date)} · door {e.createdByName}</div>
							</div>
							<div class="row">
								<strong class="num">{euro(e.amountCents)}</strong>
								<form method="POST" action="?/verwijderen" use:enhance={({ cancel }) => { if (!confirm(`"${e.title}" verwijderen?`)) cancel(); }}>
									<input type="hidden" name="id" value={e.id} />
									<button class="danger small" title="Verwijderen">✕</button>
								</form>
							</div>
						</div>
						<div>{#each e.participants as p (p.userId)}<span class="chip">{p.displayName} {euro(p.shareCents)}</span>{/each}</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	fieldset { border: 1px solid var(--line); border-radius: 12px; padding: 0.75rem; margin: 0; }
	legend { width: 100%; padding: 0 0.25rem; font-weight: 600; font-size: 0.92rem; }
	.people { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.35rem; margin-top: 0.5rem; }
	.person { display: flex; align-items: center; gap: 0.5rem; font-weight: 400; padding: 0.35rem 0.5rem; border-radius: 8px; cursor: pointer; }
	.person:hover { background: var(--bg); }
	.person input { width: auto; }
	.preview { background: var(--bg); padding: 0.75rem; border-radius: 10px; font-size: 0.9rem; }
	.list { list-style: none; margin: 0; padding: 0; }
	.list li { padding: 0.75rem 0; border-bottom: 1px solid var(--line); display: grid; gap: 0.35rem; }
</style>
