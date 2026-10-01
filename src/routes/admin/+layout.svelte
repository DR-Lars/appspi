<script lang="ts">
	import { page } from '$app/state';
	let { children } = $props();
	const tabs = [
		{ href: '/admin', label: 'Overzicht' },
		{ href: '/admin/opbrengsten', label: 'Opbrengsten' },
		{ href: '/admin/leden', label: 'Leden' },
		{ href: '/admin/cluedo', label: 'Cluedo' },
		{ href: '/admin/instellingen', label: 'Instellingen' }
	];
	const active = (href: string) =>
		href === '/admin' ? page.url.pathname === '/admin' : page.url.pathname.startsWith(href);
</script>

<nav class="tabs">
	{#each tabs as t (t.href)}<a href={t.href} class:active={active(t.href)}>{t.label}</a>{/each}
</nav>
{@render children()}

<style>
	.tabs { display: flex; gap: 0.25rem; overflow-x: auto; border-bottom: 1px solid var(--line); margin-bottom: 1.25rem; }
	.tabs a { padding: 0.55rem 0.85rem; text-decoration: none; color: var(--muted); font-weight: 600; border-bottom: 3px solid transparent; white-space: nowrap; }
	.tabs a.active { color: var(--sea); border-color: var(--sea); }
</style>
