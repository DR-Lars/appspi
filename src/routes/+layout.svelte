<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	let { data, children } = $props();

	const links = $derived([
		{ href: '/', label: 'Overzicht' },
		{ href: '/cluedo', label: 'Cluedo', dot: data.clueActive },
		{ href: '/profiel', label: 'Profiel' },
		...(data.user?.isAdmin ? [{ href: '/admin', label: 'Beheer' }] : [])
	]);

	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<svelte:head>
	<title>Appspi · Op naar {data.settings.tripName}</title>
</svelte:head>

{#if data.user}
	<header class="topbar">
		<div class="inner">
			<a class="brand" href="/">
				<img src="/favicon.svg" alt="" width="30" height="30" />
				<span>Appspi <small>→ {data.settings.tripName}</small></span>
			</a>
			<nav>
				{#each links as l (l.href)}
					<a href={l.href} class:active={isActive(l.href)}>
						{l.label}{#if l.dot}<span class="dot" title="Er loopt een mysterie"></span>{/if}
					</a>
				{/each}
			</nav>
			<form method="POST" action="/logout" class="logout">
				<span class="who" title={data.user.username}>{data.user.initials}</span>
				<button class="secondary small" type="submit">Afmelden</button>
			</form>
		</div>
	</header>
{/if}

<main class="container">
	{@render children()}
</main>

<style>
	.topbar { background: var(--card); border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 10; }
	.inner { max-width: 1040px; margin: 0 auto; padding: 0.6rem 1rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
	.brand { display: flex; align-items: center; gap: 0.5rem; font-weight: 800; color: var(--text); text-decoration: none; font-size: 1.1rem; }
	.brand small { font-weight: 500; color: var(--muted); }
	nav { display: flex; gap: 0.25rem; flex: 1; overflow-x: auto; }
	nav a { padding: 0.4rem 0.75rem; border-radius: 8px; text-decoration: none; color: var(--muted); font-weight: 600; white-space: nowrap; position: relative; }
	nav a.active { background: var(--track); color: var(--text); }
	.dot { display: inline-block; width: 8px; height: 8px; background: var(--sun); border-radius: 50%; margin-left: 0.35rem; vertical-align: middle; }
	.logout { display: flex; align-items: center; gap: 0.5rem; }
	.who { width: 32px; height: 32px; border-radius: 50%; background: var(--sea); color: white; display: grid; place-items: center; font-size: 0.8rem; font-weight: 700; }
	@media (max-width: 640px) {
		nav { order: 3; flex-basis: 100%; }
		.brand small { display: none; }
		.logout { margin-left: auto; }
	}
</style>
