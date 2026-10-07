<script lang="ts">
	import { ArrowRight, Plus } from '@lucide/svelte';
	import { formatRupiah } from '#lib/data/products.js';
	import { catalog } from '#lib/data/productsStore.svelte.js';

	const featured = $derived(catalog.items.filter((p) => p.featured));
</script>

<section id="menu" aria-labelledby="menu-heading" class="bg-[#1E2330] py-16 md:py-24">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
			<div class="max-w-xl">
				<p class="text-[13px] font-bold tracking-[0.18em] text-white/70 uppercase">
					Menu Unggulan
				</p>
				<h2
					id="menu-heading"
					class="mt-3 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl"
				>
					Favorit di Lyco
				</h2>
				<p class="mt-4 text-[15px] leading-relaxed text-white/70 sm:text-base">
					Pilihan paling disukai pelanggan — dari kopi klasik hingga camilan pendamping.
				</p>
			</div>
			<a
				href="/menu"
				class="btn-lyco inline-flex w-fit items-center gap-2 px-6 py-3 text-sm font-semibold"
			>
				Lihat Semua Menu
				<ArrowRight size={16} />
			</a>
		</div>

		<div class="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
			{#each featured as product (product.id)}
				<article
					class="card-lyco group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/10"
				>
					<div class="relative overflow-hidden">
						<img
							src={product.image}
							alt="Foto {product.name} — {product.description}"
							width="600"
							height="450"
							loading="lazy"
							class="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>
						<span
							class="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#1E2330] backdrop-blur"
						>
							{product.category}
						</span>
					</div>
					<div class="flex flex-1 flex-col p-5">
						<h3 class="text-[16px] font-bold text-white">
							{product.name}
						</h3>
						<p class="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-white/70">
							{product.description}
						</p>
						<p class="mt-3 text-[16px] font-extrabold text-white">
							{formatRupiah(product.price)}
						</p>
						<div class="mt-4 flex items-center gap-2">
							<a
								href="/menu"
								aria-label="Tambah {product.name} ke keranjang"
								class="btn-lyco-solid inline-flex h-10 flex-1 items-center justify-center gap-1.5 text-sm font-semibold"
							>
								<Plus size={16} strokeWidth={2.5} />
								Tambah
							</a>
							<a
								href="/menu"
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
	</div>
</section>
