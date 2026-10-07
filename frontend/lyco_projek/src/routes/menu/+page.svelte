<script lang="ts">
	import { ArrowLeft, Plus } from '@lucide/svelte';
	import Footer from '#lib/components/Footer.svelte';
	import Navbar from '#lib/components/Navbar.svelte';
	import { formatRupiah } from '#lib/data/products.js';
	import { categoriesState } from '#lib/data/categoriesStore.svelte.js';
	import { catalog } from '#lib/data/productsStore.svelte.js';

	let selected = $state<string>('Semua');

	const products = $derived(catalog.items);

	// Urutan mengikuti pengaturan admin. Kategori yatim (dari produk lama)
	// tetap ditampilkan agar tidak ada produk yang hilang dari filter.
	const categories = $derived([
		'Semua',
		...categoriesState.items,
		...products
			.map((p) => p.category)
			.filter((c) => !categoriesState.items.includes(c))
			.filter((c, i, arr) => arr.indexOf(c) === i)
	]);

	const filtered = $derived(
		selected === 'Semua' ? products : products.filter((p) => p.category === selected)
	);
</script>

<svelte:head>
	<title>Menu — Lyco</title>
	<meta name="description" content="Jelajahi menu kopi dan makanan favorit di Lyco." />
</svelte:head>

<Navbar />

<main class="bg-[#1E2330] pt-16 md:pt-20">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
		<a
			href="/"
			class="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white"
		>
			<ArrowLeft size={16} />
			Kembali ke Beranda
		</a>
		<h1 class="mt-4 font-sans text-3xl font-semibold text-white sm:text-4xl">
			Menu Lyco
		</h1>
		<p class="mt-3 max-w-xl text-[15px] text-white/70">
			Menu asli Lyco — {products.length} item dari PDF: signature, frappe, oatside, coffee,
			flavour, mixology, matcha, tea, donat, food & BBQ. Foto memakai foto menu asli Lyco.
		</p>

		<div class="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter kategori menu">
			{#each categories as cat (cat)}
				{@const count =
					cat === 'Semua' ? products.length : products.filter((p) => p.category === cat).length}
				<button
					type="button"
					role="tab"
					aria-selected={selected === cat}
					onclick={() => (selected = cat)}
					class="inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-all {selected ===
					cat
						? 'border-white bg-white text-[#1E2330]'
						: 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}"
				>
					{cat}
					<span class="text-xs opacity-70">({count})</span>
				</button>
			{/each}
		</div>

		<div class="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
			{#each filtered as product (product.id)}
				<article
					class="card-lyco flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:bg-white/10"
				>
					<div class="relative overflow-hidden">
						<img
							src={product.image}
							alt="Foto {product.name}"
							width="600"
							height="450"
							loading="lazy"
							class="aspect-[4/3] w-full object-cover"
						/>
						<span
							class="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#1E2330] backdrop-blur"
						>
							{product.category}
						</span>
					</div>
					<div class="flex flex-1 flex-col p-5">
						<h2 class="font-bold text-white">{product.name}</h2>
						<p class="mt-1 line-clamp-2 text-sm text-white/70">{product.description}</p>
						<p class="mt-3 font-extrabold text-white">{formatRupiah(product.price)}</p>
						<button
							type="button"
							aria-label="Tambah {product.name} ke keranjang"
							class="btn-lyco-solid mt-4 inline-flex h-10 items-center justify-center gap-1.5 text-sm font-semibold"
						>
							<Plus size={16} strokeWidth={2.5} />
							Tambah
						</button>
					</div>
				</article>
			{/each}
		</div>
	</div>
</main>

<Footer />
