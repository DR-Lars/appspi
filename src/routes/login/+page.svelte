<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
	let busy = $state(false);
</script>

<div class="login">
	<div class="hero">
		<img src="/favicon.svg" alt="" width="64" height="64" />
		<h1>Appspi</h1>
		<p class="muted">Samen sparen voor {data.settings.tripName} ☀️</p>
	</div>
	<form
		method="POST"
		class="card stack"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update();
				busy = false;
			};
		}}
	>
		{#if form?.message}<p class="error">{form.message}</p>{/if}
		<label>Gebruikersnaam
			<input name="username" autocomplete="username" required value={form?.username ?? ''} />
		</label>
		<label>Wachtwoord
			<input name="password" type="password" autocomplete="current-password" required />
		</label>
		<button type="submit" disabled={busy}>{busy ? 'Bezig…' : 'Aanmelden'}</button>
		<p class="muted small" style="margin:0">Nog geen account? Vraag het aan een van de admins.</p>
	</form>
</div>

<style>
	.login { max-width: 380px; margin: 8vh auto 0; display: grid; gap: 1.5rem; }
	.hero { text-align: center; }
	.hero h1 { font-size: 2rem; margin: 0.5rem 0 0.25rem; }
	.hero p { margin: 0; }
	.error { background: var(--err-bg); color: var(--err); padding: 0.6rem 0.8rem; border-radius: 10px; margin: 0; }
</style>
