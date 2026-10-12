<script lang="ts">
	import { ArrowLeft, Minus, Plus, ShoppingBasket } from '@lucide/svelte';
	import Footer from '#lib/components/Footer.svelte';
	import Navbar from '#lib/components/Navbar.svelte';
	import { page } from '$app/state';
	import { getProductById, resolveImage } from '#lib/api.js';
	import { formatRupiah, type Product } from '#lib/data/products.js';
	import { catalog } from '#lib/data/productsStore.svelte.js';
	import { addToCart, openCart } from '#lib/data/cartStore.svelte.js';

	let product = $state<Product | null>(null);
	let loading = $state(true);
	let notFound = $state(false);
	let qty = $state(1);
	let reqId = 0;

	const id = $derived(Number(page.params.id));

	const related = $derived(
		product
			? catalog.items.filter((p) => p.category === product?.category && p.id !== product?.id).slice(0, 4)
			: []
	);

	$effect(() => {
		const pid = id;
		qty = 1;
		if (!Number.isInteger(pid) || pid <= 0) {
			product = null;
			notFound = true;
			loading = false;
			return;
		}
		// Cat instan dari katalog lokal, lalu pastikan ke backend.
		const local = catalog.items.find((p) => p.id === pid) ?? null;
		if (local) product = local;
		notFound = false;
		const my = ++reqId;
		loading = true;
		getProductById(pid)
			.then((p) => {
				if (my !== reqId) return;
				product = p;
			})
			.catch(() => {
				if (my !== reqId) return;
				if (!local) notFound = true;
			})
			.finally(() => {
				if (my !== reqId) return;
				loading = false;
			});
	});

	function dec(): void {
		qty = Math.max(1, qty - 1);
	}

	function inc(): void {
		qty = Math.min(99, qty + 1);
	}

	function buy(): void {
		if (!product) return;
		addToCart(product, qty);
		openCart();
	}
</script>

<svelte:head>
	<title>{product ? `${product.name} — Lyco` : 'Detail Menu — Lyco'}</title>
	<meta
		name="description"
		content={product ? `${product.name} — ${product.description}` : 'Detail menu Lyco.'}
	/>
</svelte:head>

<Navbar />

<main class="bg-[#1E2330] pt-16 md:pt-20">
	<div class="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
		<div class="flex items-center gap-2 text-sm">
			<a href="/" class="font-semibold text-white/50 hover:text-white">Beranda</a>
			<span class="text-white/30">/</span>
			<a href="/menu" class="font-semibold text-white/50 hover:text-white">Menu</a>
			{#if product}
				<span class="text-white/30">/</span>
				<span class="truncate font-semibold text-white">{product.name}</span>
			{/if}
		</div>

		{#if loading && !product}
			<div class="mt-8 grid animate-pulse gap-8 lg:grid-cols-2" aria-hidden="true">
				<div class="aspect-[4/3] rounded-[28px] bg-white/10"></div>
				<div class="space-y-3">
					<div class="h-8 w-2/3 rounded bg-white/10"></div>
					<div class="h-4 w-1/3 rounded bg-white/10"></div>
					<div class="h-20 rounded bg-white/10"></div>
				</div>
			</div>
		{:else if notFound || !product}
			<div class="card-lyco mt-8 p-10 text-center">
				<p class="text-lg font-semibold text-white">Menu tidak ditemukan</p>
				<p class="mt-1 text-sm text-white/60">Mungkin sudah dihapus admin atau ID-nya salah.</p>
				<a
					href="/menu"
					class="btn-lyco-solid mt-5 inline-flex h-10 items-center gap-2 px-5 text-sm font-semibold"
				>
					<ArrowLeft size={16} />
					Kembali ke Menu
				</a>
			</div>
		{:else}
			<div class="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
				<div class="relative overflow-hidden rounded-[28px] border border-white/15">
					<img
						src={resolveImage(product.image)}
						alt="Foto {product.name}"
						width="900"
						height="675"
						class="aspect-[4/3] w-full object-cover"
					/>
					<span
						class="absolute top-4 left-4 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-bold text-[#1E2330] backdrop-blur"
					>
						{product.category}
					</span>
					{#if product.featured}
						<span
							class="absolute top-4 right-4 rounded-full bg-amber-300 px-3.5 py-1.5 text-xs font-bold text-[#1E2330]"
						>
							Unggulan
						</span>
					{/if}
				</div>
				<div>
					<h1 class="font-sans text-3xl font-semibold text-white sm:text-4xl">{product.name}</h1>
					<p class="mt-3 text-2xl font-extrabold text-white">{formatRupiah(product.price)}</p>
					<p class="mt-4 leading-relaxed text-white/70">{product.description}</p>

					<div class="mt-6 flex flex-wrap items-center gap-3">
						<div
							class="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 p-1"
							role="group"
							aria-label="Jumlah"
						>
							<button
								type="button"
								onclick={dec}
								disabled={qty <= 1}
								aria-label="Kurangi jumlah"
								class="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30"
							>
								<Minus size={16} />
							</button>
							<span aria-live="polite" class="w-8 text-center font-bold text-white">{qty}</span>
							<button
								type="button"
								onclick={inc}
								aria-label="Tambah jumlah"
								class="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
							>
								<Plus size={16} />
							</button>
						</div>
						<button
							type="button"
							onclick={buy}
							class="btn-lyco-solid inline-flex h-12 flex-1 items-center justify-center gap-2 px-6 text-[15px] font-semibold sm:flex-none"
						>
							<ShoppingBasket size={18} />
							Tambah — {formatRupiah(product.price * qty)}
						</button>
					</div>
					<a
						href="/menu"
						class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white"
					>
						<ArrowLeft size={15} />
						Kembali ke semua menu
					</a>
				</div>
			</div>

			{#if related.length > 0}
				<section aria-labelledby="related-heading" class="mt-16">
					<h2 id="related-heading" class="font-sans text-2xl font-semibold text-white">
						Menu {product.category} lainnya
					</h2>
					<div class="mt-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
						{#each related as rel (rel.id)}
							<a
								href="/menu/{rel.id}"
								class="card-lyco group flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:bg-white/10"
							>
								<div class="relative overflow-hidden">
									<img
										src={resolveImage(rel.image)}
										alt="Foto {rel.name}"
										width="600"
										height="450"
										loading="lazy"
										class="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
									/>
								</div>
								<div class="flex flex-1 flex-col p-5">
									<h3 class="font-bold text-white group-hover:underline">{rel.name}</h3>
									<p class="mt-2 font-extrabold text-white">{formatRupiah(rel.price)}</p>
								</div>
							</a>
						{/each}
					</div>
				</section>
			{/if}
		{/if}
	</div>
</main>

<Footer />
