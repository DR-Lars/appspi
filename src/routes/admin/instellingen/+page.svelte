<script lang="ts">
	import { enhance } from '$app/forms';
	import Flash from '$lib/components/Flash.svelte';
	let { data, form } = $props();
	const bedrag = (c: number) => (c / 100).toFixed(2).replace('.', ',');
</script>

<h1>Instellingen</h1>
<form method="POST" class="card stack" style="max-width:520px" use:enhance={() => async ({ update }) => update({ reset: false })}>
	<Flash {form} />
	<label>Bestemming <input name="bestemming" value={data.settings.tripName} required /></label>
	<label>Vertrekdatum <input type="date" name="vertrek" value={data.settings.tripDate ?? ''} /></label>
	<label>Persoonlijk doel per lid (€) <input name="persoonlijk" inputmode="decimal" value={bedrag(data.settings.personalTargetCents)} required /></label>
	<label>Doel groepspot (€) <input name="groep" inputmode="decimal" value={bedrag(data.settings.groupTargetCents)} required /></label>
	<button type="submit">Opslaan</button>
</form>
