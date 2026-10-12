<script lang="ts">
	import { MessageCircle, Minus, Plus, ShoppingBasket, Trash2, X } from '@lucide/svelte';
	import { resolveImage } from '#lib/api.js';
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
	import { site } from '#lib/data/settingsStore.svelte.js';

	function waNumber(): string {
		const fromHref = (site.current.phoneHref ?? '').replace(/\D/g, '');
		const raw = fromHref || (site.current.phoneDisplay ?? '').replace(/\D/g, '');
		if (!raw) return '62274123456';
		return raw.startsWith('0') ? `62${raw.slice(1)}` : raw;
	}

	function checkoutWA(): void {
		if (cart.lines.length === 0) return;
		const lines = cart.lines.map(
			(l, i) => `${i + 1}. ${l.qty}x ${l.name} — ${formatRupiah(l.qty * l.price)}`
		);
		const msg = [
			'Halo Lyco! Saya mau pesan:',
			...lines,
			`Total: ${formatRupiah(getCartTotal())}`,
			'Terima kasih.'
		].join('\n');
		window.open(`https://wa.me/${waNumber()}?text=${encodeURIComponent(msg)}`, '_blank');
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
			onclick={closeCart}
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
					onclick={closeCart}
					aria-label="Tutup keranjang"
					class="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
				>
					<X size={19} />
				</button>
			</div>

			{#if cart.lines.length === 0}
				<div class="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
					<ShoppingBasket size={40} class="text-white/25" />
					<p class="font-semibold text-white">Keranjang masih kosong</p>
					<p class="text-sm text-white/60">Yuk tambah menu favoritmu dulu.</p>
					<button
						type="button"
						onclick={closeCart}
						class="btn-lyco-solid mt-3 inline-flex h-10 items-center px-5 text-sm font-semibold"
					>
						Lihat Menu
					</button>
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
						onclick={checkoutWA}
						class="btn-lyco-solid mt-3 inline-flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold"
					>
						<MessageCircle size={17} />
						Pesan via WhatsApp
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
