<script lang="ts">
	import { site } from '#lib/data/settingsStore.svelte.js';
</script>

<section aria-labelledby="promo-heading" class="bg-[#1E2330] px-4 py-6 sm:px-6 md:py-10 lg:px-8">
	<div
		class="card-lyco relative mx-auto max-w-7xl overflow-hidden px-6 py-14 sm:px-12 md:py-20 lg:px-20"
	>
		<!-- Decor -->
		<div aria-hidden="true" class="pointer-events-none absolute inset-0">
			<div
				class="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl"
			></div>
			<div
				class="absolute -bottom-28 -left-10 h-72 w-72 rounded-full bg-white/5 blur-3xl"
			></div>
			<div
				class="absolute top-10 left-[12%] hidden h-20 w-20 rounded-full border-[12px] border-white/10 lg:block"
			></div>
			<div
				class="absolute right-[18%] bottom-10 hidden h-10 w-10 rounded-full bg-white/10 lg:block"
			></div>
			<img
				src="/cafe/cafe-night-ramai.jpg"
				alt=""
				aria-hidden="true"
				loading="lazy"
				class="absolute inset-0 h-full w-full object-cover opacity-15"
			/>
		</div>

		<div class="relative mx-auto max-w-2xl text-center">
			<p class="text-[13px] font-bold tracking-[0.2em] text-white/70 uppercase">
				Promo Spesial
			</p>
			<h2
				id="promo-heading"
				class="mt-4 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl"
			>
				{site.current.promoTitle}
			</h2>
			<p class="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/70 sm:text-base">
				{site.current.promoSubtitle}
			</p>
			<div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
				<a
					href="/menu"
					class="btn-lyco-solid inline-flex items-center justify-center px-8 py-3.5 text-[15px] font-bold"
				>
					Pesan Sekarang
				</a>
				<p class="self-center text-[13px] text-white/60">
					*Syarat & ketentuan berlaku
				</p>
			</div>
		</div>
	</div>
</section>
