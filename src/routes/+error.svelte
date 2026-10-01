<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="card" style="max-width:480px;margin:3rem auto;text-align:center">
	<h1>Oeps — {page.status}</h1>
	<p class="muted">{page.error?.message ?? 'Er ging iets mis.'}</p>
	<a class="btn" href="/">Terug naar overzicht</a>
</div>
