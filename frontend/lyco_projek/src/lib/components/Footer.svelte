<script lang="ts">
	import { Clock, Mail, MapPin, Music2, Phone } from '@lucide/svelte';
	import { site } from '#lib/data/settingsStore.svelte.js';

	const nav = [
		{ label: 'Home', href: '/#home' },
		{ label: 'Menu', href: '/#menu' },
		{ label: 'Tentang Kami', href: '/#tentang' },
		{ label: 'Cara Pesan', href: '/#cara-pesan' },
		{ label: 'Kontak', href: '/#kontak' }
	];
</script>

<footer id="kontak" aria-label="Footer Lyco" class="border-t border-white/15 bg-[#12151D] text-white">
	<div class="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-16 lg:px-8">
		<div class="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
			<!-- Brand -->
			<div>
				<a href="/" class="flex items-center gap-2.5" aria-label="Lyco - ke beranda">
					<span
						class="flex h-10 w-10 items-center justify-center rounded-full bg-white font-sans text-xl font-bold text-[#1E2330]"
					>
						L
					</span>
					<span class="font-sans text-xl font-semibold text-white">LYCO</span>
				</a>
				<p class="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
					{site.current.footerAbout}
				</p>
				<div class="mt-5 flex items-center gap-2">
					<a
						href="https://instagram.com"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Instagram Lyco"
						class="btn-lyco flex h-10 w-10 items-center justify-center rounded-full"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
							<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
							<line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
						</svg>
					</a>
					<a
						href="https://facebook.com"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Facebook Lyco"
						class="btn-lyco flex h-10 w-10 items-center justify-center rounded-full"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
						</svg>
					</a>
					<a
						href="https://vt.tiktok.com/ZS8BjvSbL/"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="TikTok Lyco"
						class="btn-lyco flex h-10 w-10 items-center justify-center rounded-full"
					>
						<Music2 size={18} />
					</a>
				</div>
			</div>

			<!-- Nav -->
			<nav aria-label="Navigasi footer">
				<h3 class="text-sm font-bold tracking-wider text-white uppercase">Navigasi</h3>
				<ul class="mt-4 space-y-2.5">
					{#each nav as item (item.label)}
						<li>
							<a
								href={item.href}
								class="text-sm text-white/70 transition-colors hover:text-white hover:underline hover:underline-offset-4"
							>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>

			<!-- Contact -->
			<div>
				<h3 class="text-sm font-bold tracking-wider text-white uppercase">Kontak</h3>
				<ul class="mt-4 space-y-3 text-sm text-white/70">
					<li class="flex items-start gap-2.5">
						<MapPin size={16} class="mt-0.5 shrink-0 text-white" />
						<a
							href={site.current.mapsUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="hover:text-white hover:underline hover:underline-offset-4"
						>
							{site.current.addressName}
							<span class="block text-[13px] text-white/60">
								{site.current.addressLines}
							</span>
							<span class="block text-[13px] text-white/60">Lihat di Google Maps</span>
						</a>
					</li>
					<li class="flex items-center gap-2.5">
						<Phone size={16} class="shrink-0 text-white" />
						<a href={site.current.phoneHref} class="hover:text-white">{site.current.phoneDisplay}</a>
					</li>
					<li class="flex items-center gap-2.5">
						<Mail size={16} class="shrink-0 text-white" />
						<a href="mailto:{site.current.email}" class="hover:text-white">{site.current.email}</a>
					</li>
				</ul>
			</div>

			<!-- Hours -->
			<div>
				<h3 class="text-sm font-bold tracking-wider text-white uppercase">
					Jam Operasional
				</h3>
				<ul class="mt-4 space-y-3 text-sm text-white/70">
					<li class="flex items-start gap-2.5">
						<Clock size={16} class="mt-0.5 shrink-0 text-white" />
						<span>{site.current.hoursWeekdayLabel}<br />{site.current.hoursWeekdayTime}</span>
					</li>
					<li class="flex items-start gap-2.5">
						<Clock size={16} class="mt-0.5 shrink-0 text-white" />
						<span>{site.current.hoursWeekendLabel}<br />{site.current.hoursWeekendTime}</span>
					</li>
				</ul>
				<a
					href="/menu"
					class="btn-lyco-solid mt-5 inline-flex h-11 items-center justify-center px-6 text-sm font-bold"
				>
					Pesan Sekarang
				</a>
			</div>
		</div>

		<div
			class="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-6 text-[13px] text-white/60 sm:flex-row"
		>
			<p>&copy; 2026 Lyco. All rights reserved.</p>
			<p>
				Dibuat dengan cinta untuk pecinta kopi. <a href="/admin" class="hover:text-white hover:underline hover:underline-offset-4">Admin</a>
			</p>
		</div>
	</div>
</footer>
