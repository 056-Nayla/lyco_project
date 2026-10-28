<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import CartDrawer from '#lib/components/CartDrawer.svelte';
	import CustomerGate from '#lib/components/CustomerGate.svelte';
	import { customerAuth, loadCustomerAuth } from '#lib/data/customerAuth.svelte.js';
	import { refreshAllFromBackend } from '#lib/data/sync.svelte.js';

	let { children }: { children: Snippet } = $props();

	const isAdminRoute = $derived(page.url.pathname.startsWith('/admin'));
	// Default aman: tampilkan gerbang sampai status login terbaca (hindari konten mengintip).
	const needGate = $derived(!isAdminRoute && (!customerAuth.ready || !customerAuth.customer));

	onMount(() => {
		loadCustomerAuth();
		// Sinkronisasi awal: backend -> store. Gagal = tetap pakai data lokal.
		refreshAllFromBackend();
	});
</script>

{#if needGate}
	<CustomerGate />
{:else}
	{@render children()}
	{#if !isAdminRoute}
		<CartDrawer />
	{/if}
{/if}
