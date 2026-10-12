<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		ArrowLeft,
		CheckCircle2,
		MessageCircle,
		Minus,
		Plus,
		ShoppingBasket,
		Trash2,
		X
	} from '@lucide/svelte';
	import { ApiError, createOrder, resolveImage, type Order } from '#lib/api.js';
	import { formatRupiah } from '#lib/data/products.js';
	import {
		cart,
		cartToast,
		cartUi,
		clearCart,
		closeCart,
		getCartCount,
		getCartTotal,
		removeLine,
		setQty
	} from '#lib/data/cartStore.svelte.js';
	import {
		getBuyerName,
		getBuyerSession,
		loadMyOrders,
		setBuyerName
	} from '#lib/data/orderStore.svelte.js';
	import { dineIn } from '#lib/data/tablesStore.svelte.js';
	import { site } from '#lib/data/settingsStore.svelte.js';

	type Step = 'cart' | 'form' | 'done';
	let step = $state<Step>('cart');
	let buyerName = $state('');
	let tableNo = $state('');
	let note = $state('');
	let formError = $state('');
	let submitting = $state(false);
	let lastOrder = $state<Order | null>(null);

	const inputCls =
		'h-10 w-full rounded-xl border border-white/15 bg-[#0F1319] px-3 text-sm text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none';

	function startCheckout(): void {
		buyerName = getBuyerName();
		tableNo = dineIn.code;
		note = '';
		formError = '';
		lastOrder = null;
		step = 'form';
	}

	function waNumber(): string {
		const fromHref = (site.current.phoneHref ?? '').replace(/\D/g, '');
		const raw = fromHref || (site.current.phoneDisplay ?? '').replace(/\D/g, '');
		if (!raw) return '62274123456';
		return raw.startsWith('0') ? `62${raw.slice(1)}` : raw;
	}

	/** Fallback lama: kirim rincian langsung via WhatsApp tanpa simpan pesanan. */
	function checkoutWA(code?: string): void {
		if (cart.lines.length === 0 && !code) return;
		const lines = cart.lines.map(
			(l, i) => `${i + 1}. ${l.qty}x ${l.name} — ${formatRupiah(l.qty * l.price)}`
		);
		const msg = [
			'Halo Lyco! Saya mau pesan:',
			...(code ? [`Kode pesanan: ${code}`] : []),
			...lines,
			`Total: ${formatRupiah(getCartTotal())}`,
			'Terima kasih.'
		].join('\n');
		window.open(`https://wa.me/${waNumber()}?text=${encodeURIComponent(msg)}`, '_blank');
	}

	function waForOrder(order: Order): void {
		const lines = order.items.map(
			(l, i) => `${i + 1}. ${l.qty}x ${l.name} — ${formatRupiah(l.qty * l.price)}`
		);
		const msg = [
			`Halo Lyco! Saya ${order.buyer_name} (kode ${order.code}):`,
			...lines,
			`Total: ${formatRupiah(order.total)}`,
			order.table_no ? `Meja: ${order.table_no}` : '',
			'Terima kasih.'
		]
			.filter(Boolean)
			.join('\n');
		window.open(`https://wa.me/${waNumber()}?text=${encodeURIComponent(msg)}`, '_blank');
	}

	/** Buat pesanan ke backend, terikat sesi pembeli perangkat ini. */
	async function submitOrder(): Promise<void> {
		if (!buyerName.trim()) {
			formError = 'Nama pemesan wajib diisi.';
			return;
		}
		if (cart.lines.length === 0) {
			formError = 'Keranjang masih kosong.';
			return;
		}
		formError = '';
		submitting = true;
		try {
			const order = await createOrder({
				buyer_name: buyerName.trim(),
				buyer_session: getBuyerSession(),
				table_no: tableNo.trim(),
				note: note.trim(),
				items: cart.lines.map((l) => ({
					id: l.id,
					name: l.name,
					price: l.price,
					qty: l.qty,
					image: l.image,
					category: l.category
				}))
			});
			setBuyerName(buyerName.trim());
			clearCart();
			lastOrder = order;
			step = 'done';
			void loadMyOrders();
		} catch (e) {
			if (e instanceof ApiError && e.status === 0) {
				// Backend mati: tetap bisa pesan langsung via WhatsApp.
				checkoutWA();
			} else {
				formError = e instanceof ApiError ? e.message : 'Gagal membuat pesanan.';
			}
		} finally {
			submitting = false;
		}
	}

	function closeAndReset(): void {
		closeCart();
		step = 'cart';
		lastOrder = null;
	}
</script>

{#if cartToast.msg}
	{#key cartToast.key}
		<div
			role="status"
			class="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-white/20 bg-[#12151D]/95 px-5 py-2.5 text-sm font-medium text-white shadow-xl backdrop-blur"
		>
			{cartToast.msg}
		</div>
	{/key}
{/if}

{#if cartUi.open}
	<div
		class="fixed inset-0 z-[60]"
		role="dialog"
		aria-modal="true"
		aria-label="Keranjang belanja"
	>
		<button
			type="button"
			aria-label="Tutup keranjang"
			onclick={closeAndReset}
			class="absolute inset-0 bg-black/60"
		></button>
		<aside
			class="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-[#141922] shadow-2xl"
		>
			<div class="flex items-center justify-between border-b border-white/10 px-5 py-4">
				<h2 class="flex items-center gap-2 font-heading text-lg font-semibold text-white">
					<ShoppingBasket size={19} />
					Keranjang
					{#if getCartCount() > 0}
						<span class="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#12151D]">
							{getCartCount()}
						</span>
					{/if}
				</h2>
				<button
					type="button"
					onclick={closeAndReset}
					aria-label="Tutup keranjang"
					class="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
				>
					<X size={19} />
				</button>
			</div>

			{#if step === 'done' && lastOrder}
				<div class="flex flex-1 flex-col items-center justify-center gap-2 overflow-y-auto p-8 text-center">
					<CheckCircle2 size={48} class="text-emerald-300" />
					<p class="font-heading text-lg font-semibold text-white">Pesanan diterima!</p>
					<p class="text-sm text-white/60">
						Tunjukkan kode ini ke kasir atau lacak statusnya di halaman Pesanan Saya.
					</p>
					<p class="mt-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-mono text-2xl font-bold tracking-widest text-white">
						{lastOrder.code}
					</p>
					<p class="text-sm text-white/60">
						{lastOrder.items.reduce((n, l) => n + l.qty, 0)} item • {formatRupiah(lastOrder.total)}
					</p>
					<button
						type="button"
						onclick={() => {
							closeAndReset();
							void goto('/pesanan');
						}}
						class="btn-lyco-solid mt-4 inline-flex h-11 w-full items-center justify-center text-sm font-semibold"
					>
						Lacak Pesanan Saya
					</button>
					<button
						type="button"
						onclick={() => lastOrder && waForOrder(lastOrder)}
						class="btn-lyco mt-2 inline-flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold"
					>
						<MessageCircle size={17} />
						Kirim juga via WhatsApp
					</button>
					<button
						type="button"
						onclick={closeAndReset}
						class="mt-1 inline-flex h-10 w-full items-center justify-center text-sm font-medium text-white/50 hover:text-white"
					>
						Kembali belanja
					</button>
				</div>
			{:else if cart.lines.length === 0}
				<div class="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
					<ShoppingBasket size={40} class="text-white/25" />
					<p class="font-semibold text-white">Keranjang masih kosong</p>
					<p class="text-sm text-white/60">Yuk tambah menu favoritmu dulu.</p>
					<button
						type="button"
						onclick={closeAndReset}
						class="btn-lyco-solid mt-3 inline-flex h-10 items-center px-5 text-sm font-semibold"
					>
						Lihat Menu
					</button>
				</div>
			{:else if step === 'form'}
				<div class="flex-1 overflow-y-auto px-5 py-4">
					<button
						type="button"
						onclick={() => (step = 'cart')}
						class="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white"
					>
						<ArrowLeft size={15} />
						Kembali ke keranjang
					</button>
					<h3 class="mt-3 font-heading text-base font-semibold text-white">Data Pemesan</h3>
					<p class="mt-1 text-sm text-white/60">
						Pesanan terikat ke perangkat ini — lacak di halaman Pesanan Saya.
					</p>
					<div class="mt-4 flex flex-col gap-3.5">
						<div>
							<label for="co-name" class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">Nama pemesan</label>
							<input
								id="co-name"
								bind:value={buyerName}
								placeholder="cth. Nayla"
								autocomplete="name"
								class={inputCls}
							/>
						</div>
						<div>
							<label for="co-table" class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">No. meja <span class="normal-case text-white/30">(opsional)</span></label>
							<input id="co-table" bind:value={tableNo} placeholder="cth. 5" class={inputCls} />
						</div>
						<div>
							<label for="co-note" class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">Catatan <span class="normal-case text-white/30">(opsional)</span></label>
							<textarea
								id="co-note"
								rows="2"
								bind:value={note}
								placeholder="cth. es sedikit, sambal dipisah"
								class="w-full rounded-xl border border-white/15 bg-[#0F1319] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none"
							></textarea>
						</div>
						{#if formError}
							<p class="text-sm text-red-300">{formError}</p>
						{/if}
						<button
							type="button"
							onclick={submitOrder}
							disabled={submitting}
							class="btn-lyco-solid inline-flex h-11 w-full items-center justify-center text-sm font-semibold disabled:opacity-50"
						>
							{submitting ? 'Membuat pesanan…' : `Buat Pesanan — ${formatRupiah(getCartTotal())}`}
						</button>
						<button
							type="button"
							onclick={() => checkoutWA()}
							class="inline-flex h-10 w-full items-center justify-center gap-2 text-sm font-medium text-white/50 hover:text-white"
						>
							<MessageCircle size={15} />
							atau pesan langsung via WhatsApp
						</button>
					</div>
				</div>
			{:else}
				<ul class="flex-1 space-y-3 overflow-y-auto px-5 py-4">
					{#each cart.lines as line (line.id)}
						<li class="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
							<img
								src={resolveImage(line.image)}
								alt="Foto {line.name}"
								width="72"
								height="72"
								loading="lazy"
								class="h-[72px] w-[72px] shrink-0 rounded-xl object-cover"
							/>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-semibold text-white">{line.name}</p>
								<p class="text-xs text-white/50">{line.category}</p>
								<p class="mt-1 text-sm font-bold text-white">
									{formatRupiah(line.price * line.qty)}
								</p>
								<div class="mt-2 flex items-center gap-2">
									<button
										type="button"
										onclick={() => setQty(line.id, line.qty - 1)}
										aria-label="Kurangi {line.name}"
										class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white/70 hover:bg-white/10 hover:text-white"
									>
										<Minus size={14} />
									</button>
									<span aria-label="Jumlah {line.name}" class="w-6 text-center text-sm font-bold text-white">
										{line.qty}
									</span>
									<button
										type="button"
										onclick={() => setQty(line.id, line.qty + 1)}
										aria-label="Tambah {line.name}"
										class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white/70 hover:bg-white/10 hover:text-white"
									>
										<Plus size={14} />
									</button>
									<button
										type="button"
										onclick={() => removeLine(line.id)}
										aria-label="Hapus {line.name} dari keranjang"
										class="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/30 text-red-300 hover:bg-red-500/20"
									>
										<Trash2 size={14} />
									</button>
								</div>
							</div>
						</li>
					{/each}
				</ul>
				<div class="border-t border-white/10 px-5 py-4">
					<div class="flex items-center justify-between text-sm">
						<span class="text-white/60">Total ({getCartCount()} item)</span>
						<span class="text-base font-extrabold text-white">{formatRupiah(getCartTotal())}</span>
					</div>
					<button
						type="button"
						onclick={startCheckout}
						class="btn-lyco-solid mt-3 inline-flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold"
					>
						Checkout — {formatRupiah(getCartTotal())}
					</button>
					<button
						type="button"
						onclick={() => {
							if (confirm('Kosongkan seluruh keranjang?')) clearCart();
						}}
						class="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-white/50 hover:bg-white/5 hover:text-red-300"
					>
						<Trash2 size={14} />
						Kosongkan keranjang
					</button>
				</div>
			{/if}
		</aside>
	</div>
{/if}
