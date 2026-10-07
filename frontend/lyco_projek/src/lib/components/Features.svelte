<script lang="ts">
	import { ClipboardList, LayoutGrid, Wallet, Zap } from '@lucide/svelte';

	const features = [
		{
			icon: ClipboardList,
			title: 'Pesan dengan Mudah',
			description: 'Pilih makanan dan minuman favoritmu dengan cepat tanpa antre.'
		},
		{
			icon: LayoutGrid,
			title: 'Menu Favorit',
			description: 'Berbagai pilihan kopi dan makanan tersedia dalam satu tempat.'
		},
		{
			icon: Zap,
			title: 'Proses Cepat',
			description: 'Pemesanan dibuat sederhana, praktis, dan siap dalam menit.'
		},
		{
			icon: Wallet,
			title: 'Pilihan Pembayaran',
			description: 'Pengalaman pembayaran yang mudah, aman, dan fleksibel.'
		}
	];
</script>

<section aria-labelledby="features-heading" class="bg-[#1E2330] py-16 md:py-24">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-2xl text-center">
			<p class="text-[13px] font-bold tracking-[0.18em] text-white/70 uppercase">
				Kenapa Lyco?
			</p>
			<h2
				id="features-heading"
				class="mt-3 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl"
			>
				Ngopi Jadi Lebih Praktis
			</h2>
			<p class="mt-4 text-[15px] leading-relaxed text-white/70 sm:text-base">
				Kami merancang pengalaman pesan yang sederhana agar kamu bisa fokus menikmati momen.
			</p>
		</div>

		<div class="mt-12 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
			{#each features as feature (feature.title)}
				<article
					class="card-lyco group p-7 transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/10"
				>
					<span
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1E2330] transition-colors duration-300"
					>
						<feature.icon size={22} strokeWidth={1.8} />
					</span>
					<h3 class="mt-5 text-[17px] font-bold text-white">
						{feature.title}
					</h3>
					<p class="mt-2 text-sm leading-relaxed text-white/70">
						{feature.description}
					</p>
				</article>
			{/each}
		</div>
	</div>
</section>
