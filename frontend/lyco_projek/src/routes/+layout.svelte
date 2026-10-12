<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import type { Snippet } from 'svelte';
	import CartDrawer from '#lib/components/CartDrawer.svelte';
	import { refreshAllFromBackend } from '#lib/data/sync.svelte.js';

	let { children }: { children: Snippet } = $props();

	onMount(() => {
		// Sinkronisasi awal: backend -> store. Gagal = tetap pakai data lokal.
		refreshAllFromBackend();
	});
</script>

{@render children()}
<CartDrawer />
