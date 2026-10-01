<script lang="ts">
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import { dagenTot, datum, euro } from '$lib/format';
	let { data } = $props();

	const dagen = $derived(dagenTot(data.settings.tripDate));
	const firstName = $derived(data.user!.displayName.split(' ')[0]);
</script>

<section class="welcome">
	<div>
		<h1>Hallo {firstName} 👋</h1>
		<p class="muted">
			{#if dagen !== null && dagen > 0}
				Nog <strong>{dagen}</strong> {dagen === 1 ? 'dag' : 'dagen'} tot {data.settings.tripName} ({datum(data.settings.tripDate)}).
			{:else if dagen === 0}
				Vandaag vertrekken we naar {data.settings.tripName}! 🌴
			{:else}
				Samen op weg naar {data.settings.tripName}.
			{/if}
		</p>
	</div>
	{#if data.activeMystery}
		<a href="/cluedo" class="btn sun">🔎 Er loopt een mysterie!</a>
	{/if}
</section>

<div class="grid-2">
	<article class="card">
		<h2>Mijn budget</h2>
		<ProgressBar progress={data.personal} label="Persoonlijk" variant="sun" />
		<p class="muted small">Jouw aandeel in alle opbrengsten van activiteiten waaraan je meewerkte.</p>
	</article>
	<article class="card">
		<h2>Groepspot</h2>
		<ProgressBar progress={data.group} label="Groep" />
		<p class="muted small">Alles wat de groep samen al verdiend heeft.</p>
	</article>
</div>

<div class="grid-2" style="margin-top:1rem">
	<article class="card">
		<h2>Klassement</h2>
		{#if data.leaderboard.length === 0}
			<p class="empty">Nog geen leden.</p>
		{:else}
			<ol class="board">
				{#each data.leaderboard as m, i (m.id)}
					<li class:me={m.id === data.user?.id}>
						<span class="rank">{i + 1}</span>
						<span class="avatar">{m.initials}</span>
						<span class="name">
							{m.name}
							<small class="muted">{m.activities} {m.activities === 1 ? 'activiteit' : 'activiteiten'}</small>
							<ProgressBar progress={m.personal} variant="sun" compact />
						</span>
						<span class="num">{euro(m.personal.currentCents)}</span>
					</li>
				{/each}
			</ol>
		{/if}
	</article>

	<article class="card">
		<h2>Laatste opbrengsten</h2>
		{#if data.recentEarnings.length === 0}
			<p class="empty">Nog geen opbrengsten geregistreerd.</p>
		{:else}
			<ul class="list">
				{#each data.recentEarnings as e (e.id)}
					<li>
						<div class="spread">
							<strong>{e.title}</strong>
							<span class="num">{euro(e.amountCents)}</span>
						</div>
						<div class="muted small">
							{datum(e.date)} · {e.participants.length} deelnemer{e.participants.length === 1 ? '' : 's'}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</article>
</div>

<article class="card" style="margin-top:1rem">
	<h2>Waar ik aan meewerkte</h2>
	{#if data.myEarnings.length === 0}
		<p class="empty">Je hebt nog niet deelgenomen aan een activiteit.</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead><tr><th>Activiteit</th><th>Datum</th><th class="right">Totaal</th><th class="right">Deelnemers</th><th class="right">Mijn deel</th></tr></thead>
				<tbody>
					{#each data.myEarnings as e (e.id)}
						<tr>
							<td>{e.title}</td>
							<td class="num">{datum(e.date)}</td>
							<td class="right num">{euro(e.amountCents)}</td>
							<td class="right">{e.participants.length}</td>
							<td class="right num"><strong>{euro(e.myShareCents)}</strong></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</article>

<style>
	.welcome { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
	.welcome h1 { margin-bottom: 0.2rem; }
	.welcome p { margin: 0; }
	.board, .list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.25rem; }
	.board li { display: grid; grid-template-columns: 1.5rem 2rem 1fr auto; align-items: center; gap: 0.6rem; padding: 0.4rem 0.5rem; border-radius: 10px; }
	.board li.me { background: var(--track); }
	.rank { color: var(--muted); font-weight: 700; text-align: center; }
	.avatar { width: 2rem; height: 2rem; border-radius: 50%; background: var(--sea); color: #fff; display: grid; place-items: center; font-size: 0.75rem; font-weight: 700; }
	.name { display: grid; line-height: 1.2; gap: 0.2rem; }
	.list li { padding: 0.55rem 0; border-bottom: 1px solid var(--line); }
	.list li:last-child { border-bottom: 0; }
</style>
