<script lang="ts">
	import { ArrowRight, Coffee, Star } from '@lucide/svelte';
	import { site } from '#lib/data/settingsStore.svelte.js';
</script>

<section id="home" aria-labelledby="hero-heading" class="relative overflow-hidden bg-[#1E2330] pt-16 md:pt-20">
	<!-- Decorative elements -->
	<div aria-hidden="true" class="pointer-events-none absolute inset-0">
		<div class="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
		<div class="absolute top-1/2 -left-32 h-80 w-80 rounded-full bg-white/5 blur-3xl"></div>
		<div class="absolute top-24 left-[8%] hidden h-16 w-16 rounded-full border-[10px] border-white/10 lg:block"></div>
		<div class="absolute bottom-16 left-[45%] hidden h-8 w-8 rounded-full bg-white/10 lg:block"></div>
	</div>

	<div class="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-24">
		<!-- Text -->
		<div class="mx-auto w-full max-w-xl text-center lg:mx-0 lg:text-left">
			<img
				src="https://ugc.production.linktr.ee/e63288cb-ba96-4e67-82ce-e6a63f3aee3c_IMG-7525.jpeg?io=true&size=avatar-v3_0"
				alt="Logo LYCO"
				width="96"
				height="96"
				class="mx-auto h-24 w-24 rounded-full border-2 border-white/30 object-cover lg:mx-0"
				fetchpriority="high"
			/>
			<p
				class="mt-6 inline-flex items-center gap-2 rounded-full border border-white bg-transparent px-4 py-2 text-[13px] font-semibold tracking-wide text-white uppercase"
			>
				<Coffee size={15} />
				{site.current.heroBadge}
			</p>
			<h1
				id="hero-heading"
				class="mt-6 font-sans text-xl leading-[1.5] font-semibold tracking-tight text-white sm:text-[20px]"
			>
				{site.current.heroTitle}
			</h1>
			<p class="mt-2 text-base leading-relaxed text-white sm:text-[16px]">
				{site.current.heroSubtitle}
			</p>
			<div class="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
				<a
					href="/menu"
					class="btn-lyco-solid inline-flex items-center justify-center gap-2 px-8 py-3.5 text-[15px] font-semibold"
				>
					Pesan Sekarang
					<ArrowRight size={18} />
				</a>
				<a
					href="/#menu"
					class="btn-lyco inline-flex items-center justify-center px-8 py-3 text-[15px] font-semibold"
				>
					Lihat Menu
				</a>
			</div>

			<!-- Social proof -->
			<div class="mt-10 flex items-center justify-center gap-4 lg:justify-start">
				<div class="flex -space-x-3">
					<img
						src="https://i.pravatar.cc/80?img=32"
						alt="Foto pelanggan Lyco"
						width="40"
						height="40"
						class="h-10 w-10 rounded-full border-2 border-[#1E2330] object-cover"
						loading="lazy"
					/>
					<img
						src="https://i.pravatar.cc/80?img=47"
						alt="Foto pelanggan Lyco"
						width="40"
						height="40"
						class="h-10 w-10 rounded-full border-2 border-[#1E2330] object-cover"
						loading="lazy"
					/>
					<img
						src="https://i.pravatar.cc/80?img=12"
						alt="Foto pelanggan Lyco"
						width="40"
						height="40"
						class="h-10 w-10 rounded-full border-2 border-[#1E2330] object-cover"
						loading="lazy"
					/>
					<span
						class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1E2330] bg-white text-[11px] font-bold text-[#1E2330]"
					>
						10k+
					</span>
				</div>
				<div class="text-left">
					<div class="flex items-center gap-1 text-white" aria-label="Rating 4.9 dari 5">
						{#each Array(5) as _, i (i)}
							<Star size={15} fill="currentColor" strokeWidth={0} />
						{/each}
						<span class="ml-1 text-sm font-bold text-white">4.9</span>
					</div>
					<p class="mt-0.5 text-[13px] text-white/70">dari 10.000+ pelanggan puas</p>
				</div>
			</div>
		</div>

		<!-- Visual -->
		<div class="relative mx-auto w-full max-w-[520px] lg:max-w-none">
			<div
				aria-hidden="true"
				class="absolute inset-4 rotate-3 rounded-[28px] bg-white/10"
			></div>
			<div class="relative overflow-hidden rounded-[28px] border border-white/20 shadow-[0_32px_64px_-20px_rgba(0,0,0,0.6)]">
				<img
					src="/cafe/cafe-gate-siang.jpg"
					alt="Gerbang dan bangunan Lyco Coffee and Place dengan nuansa industrial"
					width="1000"
					height="800"
					class="aspect-[4/5] w-full object-cover sm:aspect-[5/5]"
					fetchpriority="high"
				/>
				<div
					aria-hidden="true"
					class="absolute inset-0 bg-gradient-to-t from-[#1E2330]/60 via-transparent to-transparent"
				></div>
			</div>

			<!-- Floating card: product -->
			<div
				class="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-[20px] border border-white/20 bg-[#1E2330]/90 p-3 pr-5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md sm:-left-6"
			>
				<img
					src="/menu/menu-lotus-frappe.jpg"
					alt="Lotus Biscoff Frappe Lyco"
					width="56"
					height="56"
					class="h-14 w-14 rounded-xl object-cover"
					loading="lazy"
				/>
				<div>
					<p class="text-sm font-bold text-white">Lotus Biscoff Frappe</p>
					<p class="text-[13px] text-white/70">Rp28.000 • ★ 4.9</p>
				</div>
			</div>

			<!-- Floating card: order -->
			<div
				class="absolute -top-4 -right-2 flex items-center gap-2.5 rounded-[20px] border border-white/20 bg-[#1E2330]/90 px-4 py-3 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md sm:-right-4"
			>
				<span class="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1E2330]">
					<Coffee size={18} />
				</span>
				<div>
					<p class="text-[13px] font-bold text-white">Pesanan Siap</p>
					<p class="text-xs text-white/70">± 8 menit</p>
				</div>
			</div>
		</div>
	</div>
</section>
