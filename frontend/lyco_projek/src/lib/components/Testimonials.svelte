<script lang="ts">
	import { Quote, Star } from '@lucide/svelte';

	type Testimonial = {
		name: string;
		role: string;
		avatar: string;
		rating: number;
		comment: string;
	};

	const testimonials: Testimonial[] = [
		{
			name: 'Nadia Prameswari',
			role: 'Mahasiswa',
			avatar: 'https://i.pravatar.cc/100?img=47',
			rating: 5,
			comment: 'Pesannya gampang banget dan pilihan menunya lengkap. Kopinya juga enak.'
		},
		{
			name: 'Rizky Ramadhan',
			role: 'Pekerja Kantoran',
			avatar: 'https://i.pravatar.cc/100?img=12',
			rating: 5,
			comment: 'Prosesnya cepat, latte-nya konsisten enak. Langganan tiap pagi sebelum kerja.'
		},
		{
			name: 'Sinta Maharani',
			role: 'Freelancer',
			avatar: 'https://i.pravatar.cc/100?img=32',
			rating: 4,
			comment: 'Tempatnya nyaman buat nugas, croissant-nya wajib coba. Pelayanan ramah.'
		}
	];
</script>

<section aria-labelledby="testi-heading" class="bg-[#1E2330] py-16 md:py-24">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-2xl text-center">
			<p class="text-[13px] font-bold tracking-[0.18em] text-white/70 uppercase">
				Kata Mereka
			</p>
			<h2
				id="testi-heading"
				class="mt-3 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl"
			>
				Cerita Pelanggan
			</h2>
			<p class="mt-4 text-[15px] text-white/70 sm:text-base">
				Apa kata mereka yang sudah menikmati Lyco?
			</p>
		</div>

		<div class="mt-12 grid gap-3.5 md:grid-cols-3">
			{#each testimonials as t (t.name)}
				<figure
					class="card-lyco flex flex-col p-7 transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/10"
				>
					<Quote size={28} class="text-white/30" fill="currentColor" strokeWidth={0} />
					<div class="mt-4 flex items-center gap-1 text-white" aria-label="Rating {t.rating} dari 5">
						{#each Array(5) as _, i (i)}
							<Star
								size={16}
								fill={i < t.rating ? 'currentColor' : 'none'}
								strokeWidth={1.5}
								class={i < t.rating ? '' : 'text-white/20'}
							/>
						{/each}
					</div>
					<blockquote class="mt-3 flex-1 text-[15px] leading-relaxed text-white/85">
						&ldquo;{t.comment}&rdquo;
					</blockquote>
					<figcaption class="mt-6 flex items-center gap-3 border-t border-white/15 pt-5">
						<img
							src={t.avatar}
							alt="Foto profil {t.name}"
							width="48"
							height="48"
							loading="lazy"
							class="h-12 w-12 rounded-full border border-white/20 object-cover"
						/>
						<div>
							<p class="text-[15px] font-bold text-white">{t.name}</p>
							<p class="text-[13px] text-white/70">{t.role}</p>
						</div>
					</figcaption>
				</figure>
			{/each}
		</div>
	</div>
</section>
