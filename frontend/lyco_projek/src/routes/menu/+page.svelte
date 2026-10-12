<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Search, X } from '@lucide/svelte';
	import Footer from '#lib/components/Footer.svelte';
	import Navbar from '#lib/components/Navbar.svelte';
	import { page as route } from '$app/state';
	import { getProducts, resolveImage } from '#lib/api.js';
	import { addToCart } from '#lib/data/cartStore.svelte.js';
	import { clearTableChoice, dineIn, setTableChoice } from '#lib/data/tablesStore.svelte.js';
	import { formatRupiah, type Product } from '#lib/data/products.js';
	import { categoriesState } from '#lib/data/categoriesStore.svelte.js';
	import { catalog } from '#lib/data/productsStore.svelte.js';
	import { backendState } from '#lib/data/sync.svelte.js';

	const PER_PAGE = 12;

	let selected = $state<string>('Semua');
	let query = $state('');
	let debounced = $state('');
	let page = $state(1);

	let serverItems = $state<Product[]>([]);
	let serverTotal = $state<number | null>(null);
	let loading = $state(false);
	let reqId = 0;
	let gridEl = $state<HTMLElement | null>(null);

	// Urutan mengikuti pengaturan admin. Kategori yatim (dari produk lama)
	// tetap ditampilkan agar tidak ada produk yang hilang dari filter.
	const categories = $derived([
		'Semua',
		...categoriesState.items,
		...catalog.items
			.map((p) => p.category)
			.filter((c) => !categoriesState.items.includes(c))
			.filter((c, i, arr) => arr.indexOf(c) === i)
	]);

	// Debounce ketikan + reset ke halaman 1 setiap kata kunci final berubah.
	// Update dibatch agar effect fetch di bawah jalan sekali saja.
	$effect(() => {
		const q = query;
		const t = setTimeout(() => {
			debounced = q;
			page = 1;
		}, 350);
		return () => clearTimeout(t);
	});

	function pickCategory(cat: string): void {
		selected = cat;
		page = 1;
	}

	function clearQuery(): void {
		query = '';
		// debounced + page ikut ke-reset lewat effect debounce di atas
	}

	// Filter lokal: dipakai saat backend mati (fallback) dan saat SSR.
	const localFiltered = $derived(
		catalog.items.filter((p) => {
			const matchCat = selected === 'Semua' || p.category === selected;
			const q = debounced.trim().toLowerCase();
			const matchQ =
				!q ||
				p.name.toLowerCase().includes(q) ||
				(p.description ?? '').toLowerCase().includes(q);
			return matchCat && matchQ;
		})
	);

	const usingServer = $derived(serverTotal !== null);
	const total = $derived(serverTotal ?? localFiltered.length);
	const totalPages = $derived(Math.max(1, Math.ceil(total / PER_PAGE)));
	const safePage = $derived(Math.min(Math.max(page, 1), totalPages));

	const visible = $derived(
		usingServer
			? serverItems
			: localFiltered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)
	);

	const rangeFrom = $derived(total === 0 ? 0 : (safePage - 1) * PER_PAGE + 1);
	const rangeTo = $derived(Math.min(safePage * PER_PAGE, total));

	const pageNumbers = $derived.by(() => {
		const arr: number[] = [];
		const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
		const end = Math.min(totalPages, start + 4);
		for (let i = start; i <= end; i++) arr.push(i);
		return arr;
	});

	// Koreksi kalau halaman aktif melewati total (mis. data menyusut).
	$effect(() => {
		if (page > totalPages) page = totalPages;
	});

	// Ambil halaman dari backend (server-side search + pagination).
	// Gagal = fallback ke data lokal. Response basi diabaikan via reqId.
	$effect(() => {
		const cat = selected;
		const q = debounced;
		const p = page;
		if (backendState.checked && !backendState.ok) {
			serverTotal = null;
			return;
		}
		const id = ++reqId;
		loading = true;
		getProducts({
			category: cat === 'Semua' ? undefined : cat,
			search: q.trim() || undefined,
			limit: PER_PAGE,
			offset: (p - 1) * PER_PAGE
		})
			.then((res) => {
				if (id !== reqId) return;
				serverItems = res.items;
				serverTotal = res.total;
			})
			.catch(() => {
				if (id !== reqId) return;
				serverTotal = null;
			})
			.finally(() => {
				if (id !== reqId) return;
				loading = false;
			});
	});

	function gotoPage(n: number): void {
		page = Math.min(Math.max(n, 1), totalPages);
		gridEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	onMount(() => {
		// Hasil scan QR meja: /menu?meja=5 → ingat mejanya untuk checkout.
		const m = route.url.searchParams.get('meja')?.trim() ?? '';
		if (m && /^[A-Za-z0-9-]{1,10}$/.test(m)) setTableChoice(m);
	});
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
			Menu asli Lyco — {total} item: signature, frappe, oatside, coffee,
			flavour, mixology, matcha, tea, donat, food & BBQ. Foto memakai foto menu asli Lyco.
		</p>

		<div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
			<label class="relative block sm:max-w-sm sm:flex-1">
				<span class="sr-only">Cari menu</span>
				<Search
					size={16}
					class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-white/40"
				/>
				<input
					type="search"
					bind:value={query}
					placeholder="Cari menu… (cth. frappe, mandhi)"
					aria-label="Cari menu"
					class="h-11 w-full rounded-full border border-white/20 bg-white/5 pr-10 pl-10 text-sm text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none"
				/>
				{#if query}
					<button
						type="button"
						onclick={clearQuery}
						aria-label="Hapus pencarian"
						class="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
					>
						<X size={15} />
					</button>
				{/if}
			</label>
			<p class="text-sm text-white/50" role="status">
				Menampilkan <span class="font-semibold text-white">{rangeFrom}–{rangeTo}</span>
				dari <span class="font-semibold text-white">{total}</span> menu
				{#if !usingServer}
					<span class="ml-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-200">lokal</span>
				{/if}
			</p>
			{#if dineIn.code}
				<p class="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-200">
					Dine-in • Meja {dineIn.code}
					<button
						type="button"
						onclick={clearTableChoice}
						aria-label="Lupakan meja {dineIn.code}"
						class="rounded-full p-0.5 hover:bg-white/10"
					>
						<X size={13} />
					</button>
				</p>
			{/if}
		</div>

		<div class="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter kategori menu">
			{#each categories as cat (cat)}
				{@const count =
					cat === 'Semua'
						? catalog.items.length
						: catalog.items.filter((p) => p.category === cat).length}
				<button
					type="button"
					role="tab"
					aria-selected={selected === cat}
					onclick={() => pickCategory(cat)}
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

		<div bind:this={gridEl} class="scroll-mt-24">
			{#if loading && visible.length === 0}
				<div class="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
					{#each Array(PER_PAGE) as _, i (i)}
						<div class="card-lyco animate-pulse overflow-hidden">
							<div class="aspect-[4/3] w-full bg-white/10"></div>
							<div class="space-y-2 p-5">
								<div class="h-4 w-3/4 rounded bg-white/10"></div>
								<div class="h-3 w-1/2 rounded bg-white/10"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else if visible.length === 0}
				<div class="card-lyco mt-10 p-10 text-center">
					<p class="text-lg font-semibold text-white">Tidak ada menu yang cocok</p>
					<p class="mt-1 text-sm text-white/60">
						Coba kata kunci lain{#if selected !== 'Semua'} atau kategori “Semua”{/if}.
					</p>
					<button
						type="button"
						onclick={() => {
							clearQuery();
							pickCategory('Semua');
						}}
						class="btn-lyco-solid mt-5 inline-flex h-10 items-center px-5 text-sm font-semibold"
					>
						Reset pencarian
					</button>
				</div>
			{:else}
				<div class="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 {loading ? 'opacity-60' : ''}">
					{#each visible as product (product.id)}
						<article
							class="card-lyco flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:bg-white/10"
						>
							<div class="relative overflow-hidden">
								<img
									src={resolveImage(product.image)}
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
								<div class="mt-4 flex items-center gap-2">
									<button
										type="button"
										onclick={() => addToCart(product)}
										aria-label="Tambah {product.name} ke keranjang"
										class="btn-lyco-solid inline-flex h-10 flex-1 items-center justify-center gap-1.5 text-sm font-semibold"
									>
										<Plus size={16} strokeWidth={2.5} />
										Tambah
									</button>
									<a
										href="/menu/{product.id}"
										aria-label="Lihat detail {product.name}"
										class="btn-lyco inline-flex h-10 items-center justify-center px-4 text-sm font-semibold"
									>
										Detail
									</a>
								</div>
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</div>

		{#if totalPages > 1}
			<nav aria-label="Navigasi halaman menu" class="mt-10 flex items-center justify-center gap-1.5">
				<button
					type="button"
					onclick={() => gotoPage(safePage - 1)}
					disabled={safePage <= 1}
					aria-label="Halaman sebelumnya"
					class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:opacity-30"
				>
					<ChevronLeft size={17} />
				</button>
				{#each pageNumbers as n (n)}
					<button
						type="button"
						onclick={() => gotoPage(n)}
						aria-label="Halaman {n}"
						aria-current={n === safePage ? 'page' : undefined}
						class="inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-2 text-sm font-semibold transition-all {n ===
						safePage
							? 'border-white bg-white text-[#1E2330]'
							: 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}"
					>
						{n}
					</button>
				{/each}
				<button
					type="button"
					onclick={() => gotoPage(safePage + 1)}
					disabled={safePage >= totalPages}
					aria-label="Halaman berikutnya"
					class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:opacity-30"
				>
					<ChevronRight size={17} />
				</button>
			</nav>
			<p class="mt-3 text-center text-xs text-white/40">Halaman {safePage} dari {totalPages}</p>
		{/if}
	</div>
</main>

<Footer />
