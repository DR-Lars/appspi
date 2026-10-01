<script lang="ts">
	import { enhance } from '$app/forms';
	import Flash from '$lib/components/Flash.svelte';
	let { data, form } = $props();
</script>

<h1>Profiel</h1>
<div class="grid-2">
	<div class="card">
		<h2>{data.user?.displayName}</h2>
		<p class="muted">Gebruikersnaam: <strong>{data.user?.username}</strong></p>
		<p>Rol: <span class="badge" class:admin={data.user?.isAdmin}>{data.user?.isAdmin ? 'Admin' : 'Lid'}</span></p>
	</div>
	<form method="POST" action="?/wachtwoord" class="card stack" use:enhance>
		<h2>Wachtwoord wijzigen</h2>
		<Flash {form} />
		<label>Huidig wachtwoord <input type="password" name="huidig" autocomplete="current-password" required /></label>
		<label>Nieuw wachtwoord <input type="password" name="nieuw" autocomplete="new-password" minlength="8" required /></label>
		<label>Bevestig nieuw wachtwoord <input type="password" name="bevestig" autocomplete="new-password" minlength="8" required /></label>
		<button type="submit">Wijzigen</button>
	</form>
</div>
