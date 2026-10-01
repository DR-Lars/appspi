<script lang="ts">
	let { form }: { form: { success?: boolean; message?: string } | null | undefined } = $props();
</script>

{#if form?.message}
	<p class="flash" class:error={form.success === false} role="status">{form.message}</p>
{/if}

<style>
	.flash { padding: 0.7rem 1rem; border-radius: 10px; background: var(--ok-bg); color: var(--ok); margin: 0 0 1rem; font-weight: 500; }
	.flash.error { background: var(--err-bg); color: var(--err); }
</style>
