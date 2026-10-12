<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowLeft, ReceiptText, RefreshCw } from '@lucide/svelte';
	import Footer from '#lib/components/Footer.svelte';
	import Navbar from '#lib/components/Navbar.svelte';
	import { resolveImage, type OrderStatus } from '#lib/api.js';
	import { formatRupiah } from '#lib/data/products.js';
	import { getBuyerSession, loadMyOrders, myOrders } from '#lib/data/orderStore.svelte.js';

	const STATUS_LABEL: Record<OrderStatus, string> = {
		baru: 'Baru',
		diproses: 'Diproses',
		selesai: 'Selesai',
		batal: 'Dibatalkan'
	};

	const STATUS_CLS: Record<OrderStatus, string> = {
		baru: 'bg-amber-400/15 text-amber-200',
		diproses: 'bg-sky-400/15 text-sky-200',
		selesai: 'bg-emerald-400/15 text-emerald-200',
		batal: 'bg-white/10 text-white/50'
	};

	function fmtTime(iso: string): string {
		const d = new Date(iso.replace(' ', 'T') + 'Z');
		if (Number.isNaN(d.getTime())) return iso;
		return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
	}

	onMount(() => {
		void loadMyOrders();
		const t = setInterval(() => void loadMyOrders(), 10000);
		return () => clearInterval(t);
	});
</script>

<svelte:head>
	<title>Pesanan Saya — Lyco</title>
	<meta name="description" content="Lacak status pesanan Lyco dari perangkat ini." />
</svelte:head>

<Navbar />

<main class="bg-[#1E2330] pt-16 md:pt-20">
	<div class="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
		<a
			href="/menu"
			class="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white"
		>
			<ArrowLeft size={16} />
			Kembali ke Menu
		</a>
		<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
			<div>
				<h1 class="font-sans text-3xl font-semibold text-white sm:text-4xl">Pesanan Saya</h1>
				<p class="mt-2 max-w-xl text-[15px] text-white/70">
					Pesanan dari perangkat ini terikat ke sesi <code class="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-white">{getBuyerSession().slice(0, 8)}…</code> dan terpantau otomatis.
				</p>
			</div>
			<button
				type="button"
				onclick={() => void loadMyOrders()}
				disabled={myOrders.loading}
				class="btn-lyco inline-flex h-10 items-center gap-2 px-4 text-sm font-semibold disabled:opacity-50"
			>
				<RefreshCw size={15} class={myOrders.loading ? 'animate-spin' : ''} />
				Muat ulang
			</button>
		</div>

		{#if myOrders.error}
			<p class="card-lyco mt-6 p-4 text-sm text-amber-200">{myOrders.error}</p>
		{/if}

		{#if myOrders.items.length === 0 && !myOrders.loading && !myOrders.error}
			<div class="card-lyco mt-6 p-10 text-center">
				<ReceiptText size={40} class="mx-auto text-white/25" />
				<p class="mt-3 text-lg font-semibold text-white">Belum ada pesanan</p>
				<p class="mt-1 text-sm text-white/60">Yuk pesan menu favoritmu dulu.</p>
				<a
					href="/menu"
					class="btn-lyco-solid mt-5 inline-flex h-10 items-center px-5 text-sm font-semibold"
				>
					Lihat Menu
				</a>
			</div>
		{:else}
			<ul class="mt-6 space-y-4">
				{#each myOrders.items as order (order.id)}
					<li class="card-lyco p-5">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<div>
								<p class="font-mono text-lg font-bold tracking-widest text-white">{order.code}</p>
								<p class="text-xs text-white/50">
									{fmtTime(order.created_at)} • {order.buyer_name}{order.table_no
										? ` • Meja ${order.table_no}`
										: ''}
								</p>
							</div>
							<span
								class="rounded-full px-3 py-1 text-xs font-bold {STATUS_CLS[order.status]}"
							>
								{STATUS_LABEL[order.status]}
							</span>
						</div>
						<ul class="mt-3 space-y-2 border-t border-white/10 pt-3">
							{#each order.items as item (item.id)}
								<li class="flex items-center gap-3 text-sm">
									<img
										src={resolveImage(item.image ?? '')}
										alt=""
										width="40"
										height="40"
										loading="lazy"
										class="h-10 w-10 rounded-lg object-cover"
									/>
									<span class="min-w-0 flex-1 truncate text-white/80">
										<span class="font-bold text-white">{item.qty}x</span>
										{item.name}
									</span>
									<span class="font-semibold text-white">{formatRupiah(item.qty * item.price)}</span>
								</li>
							{/each}
						</ul>
						{#if order.note}
							<p class="mt-2 text-xs text-white/50">Catatan: {order.note}</p>
						{/if}
						<div class="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-sm">
							<span class="text-white/60">Total</span>
							<span class="text-base font-extrabold text-white">{formatRupiah(order.total)}</span>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</main>

<Footer />
