<script lang="ts">
	import { CheckCheck, CupSoda, Heart, ShoppingCart } from '@lucide/svelte';

	const steps = [
		{
			icon: CupSoda,
			no: '01',
			title: 'Pilih Menu',
			description: 'Jelajahi menu dan temukan kopi serta makanan favoritmu.'
		},
		{
			icon: ShoppingCart,
			no: '02',
			title: 'Masukkan ke Keranjang',
			description: 'Tambahkan pilihanmu ke keranjang dengan satu ketukan.'
		},
		{
			icon: CheckCheck,
			no: '03',
			title: 'Konfirmasi Pesanan',
			description: 'Periksa pesanan dan pilih metode pembayaran yang mudah.'
		},
		{
			icon: Heart,
			no: '04',
			title: 'Nikmati Pesananmu',
			description: 'Pesanan disiapkan cepat, tinggal ambil atau tunggu diantar.'
		}
	];
</script>

<section
	id="cara-pesan"
	aria-labelledby="how-heading"
	class="bg-[#1E2330] py-16 md:py-24"
>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-2xl text-center">
			<p class="text-[13px] font-bold tracking-[0.18em] text-white/70 uppercase">
				Langkah Mudah
			</p>
			<h2
				id="how-heading"
				class="mt-3 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl"
			>
				Cara Pesan di Lyco
			</h2>
			<p class="mt-4 text-[15px] text-white/70 sm:text-base">
				Empat langkah sederhana menuju secangkir kebahagiaan.
			</p>
		</div>

		<ol class="relative mt-12 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
			<!-- connecting line desktop -->
			<div
				aria-hidden="true"
				class="absolute top-10 right-[12%] left-[12%] hidden border-t-2 border-dashed border-white/20 lg:block"
			></div>
			{#each steps as step (step.no)}
				<li
					class="card-lyco relative p-7 text-center transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/10"
				>
					<span
						class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#1E2330] ring-8 ring-white/10"
					>
						<step.icon size={30} strokeWidth={1.6} />
					</span>
					<p class="mt-4 text-xs font-extrabold tracking-[0.2em] text-white/70">
						STEP {step.no}
					</p>
					<h3 class="mt-2 text-[17px] font-bold text-white">
						{step.title}
					</h3>
					<p class="mt-2 text-sm leading-relaxed text-white/70">
						{step.description}
					</p>
				</li>
			{/each}
		</ol>

		<div class="mt-10 text-center">
			<a
				href="/menu"
				class="btn-lyco-solid inline-flex items-center justify-center px-8 py-3.5 text-[15px] font-semibold"
			>
				Mulai Pesan Sekarang
			</a>
		</div>
	</div>
</section>
