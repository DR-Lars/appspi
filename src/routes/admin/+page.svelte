<script lang="ts">
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import { euro } from '$lib/format';
	let { data } = $props();

	const deelnemers = $derived(data.standings.filter((m) => m.activities > 0).length);
	const klaar = $derived(data.standings.filter((m) => m.personal.reached).length);
</script>

<div class="spread" style="margin-bottom:1rem">
	<h1 style="margin:0">Beheer</h1>
	<div class="row">
		<a class="btn" href="/admin/opbrengsten">+ Opbrengst</a>
	</div>
</div>

<div class="grid-2">
	<div class="card"><ProgressBar progress={data.group} label="Groepspot" /></div>
	<div class="card stats">
		<div><span class="muted small">Leden die al meewerkten</span><strong>{deelnemers} / {data.standings.length}</strong></div>
		<div><span class="muted small">Leden met volledig budget</span><strong>{klaar} / {data.standings.length}</strong></div>
	</div>
</div>

<div class="card" style="margin-top:1rem">
	<h2>Stand per lid</h2>
	<div class="table-wrap">
		<table>
			<thead><tr><th>Lid</th><th style="min-width:220px">Persoonlijk budget (verdiend)</th><th class="right">Activiteiten</th></tr></thead>
			<tbody>
				{#each data.standings as m (m.id)}
					<tr>
						<td>{m.name} {#if m.isAdmin}<span class="badge admin">admin</span>{/if}</td>
						<td>
							<ProgressBar progress={m.personal} variant="sun" compact />
							<span class="small muted num">{euro(m.personal.currentCents)} / {euro(m.personal.targetCents)}</span>
						</td>
						<td class="right">{m.activities}</td>
					</tr>
				{:else}
					<tr><td colspan="3" class="empty">Nog geen leden.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.stats { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
	.stats div { display: grid; }
	.stats strong { font-size: 1.5rem; }
</style>
