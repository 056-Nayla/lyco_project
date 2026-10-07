<script lang="ts">
	import { Menu, ShoppingBasket, X } from '@lucide/svelte';

	let scrolled = $state(false);
	let mobileOpen = $state(false);

	const navLinks = [
		{ label: 'Home', href: '/#home' },
		{ label: 'Menu', href: '/menu' },
		{ label: 'Tentang Kami', href: '/#tentang' },
		{ label: 'Cara Pesan', href: '/#cara-pesan' },
		{ label: 'Kontak', href: '/#kontak' }
	];

	function handleScroll() {
		scrolled = window.scrollY > 12;
	}

	$effect(() => {
		handleScroll();
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	});

	function closeMobile() {
		mobileOpen = false;
	}
</script>

<header
	class="fixed inset-x-0 top-0 z-50 transition-all duration-300 {scrolled || mobileOpen
		? 'bg-[#1E2330]/95 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md'
		: 'bg-transparent'}"
>
	<nav aria-label="Navigasi utama" class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:h-20 lg:px-8">
		<a href="/" aria-label="Lyco - ke beranda" class="flex items-center gap-2.5">
			<span
				class="flex h-10 w-10 items-center justify-center rounded-full bg-white font-sans text-xl font-bold text-[#1E2330]"
				aria-hidden="true"
			>
				L
			</span>
			<span class="font-sans text-xl font-semibold tracking-tight text-white">
				LYCO
			</span>
		</a>

		<!-- Desktop nav -->
		<ul class="hidden items-center gap-8 lg:flex">
			{#each navLinks as link (link.label)}
				<li>
					<a
						href={link.href}
						class="text-[15px] font-medium text-white/80 transition-colors hover:text-white hover:underline hover:underline-offset-8 hover:decoration-white hover:decoration-2"
					>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>

		<div class="hidden items-center gap-3 lg:flex">
			<a
				href="/menu"
				aria-label="Lihat keranjang belanja"
				class="btn-lyco relative flex h-11 w-11 items-center justify-center rounded-full"
			>
				<ShoppingBasket size={20} strokeWidth={1.8} />
				<span
					class="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-[#1E2330]"
				>
					2
				</span>
			</a>
			<a
				href="/menu"
				class="btn-lyco-solid inline-flex h-11 items-center justify-center px-6 text-[15px] font-semibold"
			>
				Pesan Sekarang
			</a>
		</div>

		<!-- Mobile actions -->
		<div class="flex items-center gap-2 lg:hidden">
			<a
				href="/menu"
				aria-label="Lihat keranjang belanja"
				class="btn-lyco relative flex h-10 w-10 items-center justify-center rounded-full"
			>
				<ShoppingBasket size={19} strokeWidth={1.8} />
				<span
					class="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-[#1E2330]"
				>
					2
				</span>
			</a>
			<button
				type="button"
				onclick={() => (mobileOpen = !mobileOpen)}
				aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
				aria-expanded={mobileOpen}
				class="btn-lyco-solid flex h-10 w-10 items-center justify-center"
			>
				{#if mobileOpen}
					<X size={20} />
				{:else}
					<Menu size={20} />
				{/if}
			</button>
		</div>
	</nav>

	<!-- Mobile navigation -->
	{#if mobileOpen}
		<div class="border-t border-white/15 bg-[#1E2330]/95 backdrop-blur-md lg:hidden">
			<ul class="space-y-1 px-4 py-4 sm:px-6">
				{#each navLinks as link (link.label)}
					<li>
						<a
							href={link.href}
							onclick={closeMobile}
							class="block rounded-[14px] px-4 py-3 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
						>
							{link.label}
						</a>
					</li>
				{/each}
				<li class="pt-3">
					<a
						href="/menu"
						onclick={closeMobile}
						class="btn-lyco-solid flex h-12 items-center justify-center text-[15px] font-semibold"
					>
						Pesan Sekarang
					</a>
				</li>
			</ul>
		</div>
	{/if}
</header>
