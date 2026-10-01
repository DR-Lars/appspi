<script lang="ts">
	import { enhance } from '$app/forms';
	import Flash from '$lib/components/Flash.svelte';
	let { data, form } = $props();
	let bewerk = $state<number | null>(null);

	const randomWachtwoord = () => {
		const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
		return Array.from(crypto.getRandomValues(new Uint32Array(10)), (n) => chars[n % chars.length]).join('');
	};
	let nieuwWw = $state('');
</script>

<h1>Leden</h1>
<Flash {form} />

<div class="grid-2">
	<form method="POST" action="?/toevoegen" class="card stack" use:enhance={() => async ({ result, update }) => { await update({ reset: result.type === 'success' }); if (result.type === 'success') nieuwWw = ''; }}>
		<h2>Nieuw lid</h2>
		<label>Volledige naam <input name="naam" required maxlength="60" /></label>
		<label>Gebruikersnaam <input name="gebruikersnaam" required pattern={'[A-Za-z0-9._\\-]{3,32}'} autocapitalize="none" /></label>
		<label>Startwachtwoord
			<div class="row" style="flex-wrap:nowrap">
				<input name="wachtwoord" bind:value={nieuwWw} required minlength="8" />
				<button type="button" class="secondary" onclick={() => (nieuwWw = randomWachtwoord())}>Genereer</button>
			</div>
		</label>
		<p class="muted small" style="margin:0">Geef dit wachtwoord door; het lid kan het zelf wijzigen via Profiel.</p>
		<button type="submit">Aanmaken</button>
	</form>

	<div class="card">
		<h2>Alle accounts ({data.members.length})</h2>
		<ul class="list">
			{#each data.members as m (m.id)}
				<li>
					<div class="spread">
						<div>
							<strong>{m.displayName}</strong>
							{#if m.isAdmin}<span class="badge admin">admin</span>{/if}
							<div class="muted small">@{m.username}</div>
						</div>
						<button class="secondary small" onclick={() => (bewerk = bewerk === m.id ? null : m.id)}>
							{bewerk === m.id ? 'Sluiten' : 'Bewerken'}
						</button>
					</div>
					{#if bewerk === m.id}
						<div class="edit">
							<form method="POST" action="?/hernoemen" class="row" use:enhance>
								<input type="hidden" name="id" value={m.id} />
								<input name="naam" value={m.displayName} required style="flex:1" />
								<button class="small">Naam opslaan</button>
							</form>
							<form method="POST" action="?/wachtwoord" class="row" use:enhance={() => async ({ update }) => update({ reset: true })}>
								<input type="hidden" name="id" value={m.id} />
								<input name="wachtwoord" placeholder="Nieuw wachtwoord (min. 8)" minlength="8" required style="flex:1" />
								<button class="small">Reset wachtwoord</button>
							</form>
							{#if !m.isAdmin && m.id !== data.user?.id}
								<form method="POST" action="?/verwijderen" use:enhance={({ cancel }) => { if (!confirm(`${m.displayName} en alle bijhorende gegevens verwijderen?`)) cancel(); }}>
									<input type="hidden" name="id" value={m.id} />
									<button class="danger small">Lid verwijderen</button>
								</form>
							{/if}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
</div>

<style>
	.list { list-style: none; padding: 0; margin: 0; }
	.list li { padding: 0.7rem 0; border-bottom: 1px solid var(--line); }
	.edit { display: grid; gap: 0.5rem; margin-top: 0.6rem; padding: 0.75rem; background: var(--bg); border-radius: 10px; }
</style>
