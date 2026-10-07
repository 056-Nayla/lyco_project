<script lang="ts">
	import { onMount } from 'svelte';
	import {
		ArrowDown,
		ArrowLeft,
		ArrowUp,
		BarChart3,
		Clock,
		LayoutDashboard,
		LogOut,
		Menu as MenuIcon,
		Pencil,
		Plus,
		QrCode,
		RotateCcw,
		Settings,
		Tags,
		Trash2,
		Users,
		UtensilsCrossed,
		X
	} from '@lucide/svelte';
	import { formatRupiah, type Product } from '#lib/data/products.js';
	import {
		addCategory,
		categoriesState,
		deleteCategory,
		moveCategory,
		renameCategory,
		resetCategories
	} from '#lib/data/categoriesStore.svelte.js';
	import {
		LOCAL_IMAGES,
		addProduct,
		catalog,
		countByCategory,
		deleteProduct,
		renameCategoryProducts,
		resetCatalog,
		updateProduct
	} from '#lib/data/productsStore.svelte.js';
	import {
		defaultSettings,
		resetSettings,
		saveSettings,
		site,
		type SiteSettings
	} from '#lib/data/settingsStore.svelte.js';

	// Ganti password ini sesuai kebutuhan (demo-grade: bukan keamanan server).
	const ADMIN_PASSWORD = 'lyco123';
	const AUTH_KEY = 'lyco:admin:auth';

	type Tab = 'dashboard' | 'menu' | 'kategori' | 'pengaturan';
	type DisabledKey = 'meja' | 'staf' | 'shift' | 'laporan';

	let authed = $state(false);
	let password = $state('');
	let loginError = $state('');
	// Desain sidebar ditiru dari https://rubys.trackbill.cloud/admin (default: dashboard)
	let tab = $state<Tab>('dashboard');
	let sidebarOpen = $state(false);

	const navItems = [
		{ icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
		{ icon: UtensilsCrossed, label: 'Menu', key: 'menu' },
		{ icon: Tags, label: 'Kategori', key: 'kategori' },
		{ icon: QrCode, label: 'Meja & QR', key: 'meja', disabled: true },
		{ icon: Users, label: 'Staf', key: 'staf', disabled: true },
		{ icon: Clock, label: 'Shift', key: 'shift', disabled: true },
		{ icon: BarChart3, label: 'Laporan', key: 'laporan', disabled: true },
		{ icon: Settings, label: 'Pengaturan', key: 'pengaturan' }
	] as const;

	const subtitles: Record<Tab | DisabledKey, string> = {
		dashboard: 'Ringkasan hari ini',
		menu: 'Kelola menu cafe',
		kategori: 'Kelola kategori menu',
		meja: 'Kelola meja dan QR code',
		staf: 'Manajemen staf',
		shift: 'Kelola jadwal shift staf',
		laporan: 'Laporan penjualan',
		pengaturan: 'Pengaturan sistem'
	};

	const stats = $derived({
		total: catalog.items.length,
		kategori: categoriesState.items.length,
		unggulan: catalog.items.filter((p) => p.featured).length,
		kosong: categoriesState.items.filter((c) => countByCategory(c) === 0).length
	});

	onMount(() => {
		try {
			authed = sessionStorage.getItem(AUTH_KEY) === '1';
		} catch {
			authed = false;
		}
	});

	function login(): void {
		if (password === ADMIN_PASSWORD) {
			authed = true;
			loginError = '';
			password = '';
			try {
				sessionStorage.setItem(AUTH_KEY, '1');
			} catch {
				// abaikan
			}
		} else {
			loginError = 'Password salah. Coba lagi.';
		}
	}

	function logout(): void {
		authed = false;
		sidebarOpen = false;
		try {
			sessionStorage.removeItem(AUTH_KEY);
		} catch {
			// abaikan
		}
	}

	function goTab(t: Tab): void {
		tab = t;
		sidebarOpen = false;
	}

	// ── Form produk (tambah / edit) ──────────────────────────────────
	let showModal = $state(false);
	let editingId = $state<number | null>(null);
	let imageMode = $state<'local' | 'url'>('local');
	let form = $state({ name: '', category: 'Coffee', price: 0, description: '', image: LOCAL_IMAGES[0], featured: false });
	let formError = $state('');

	function openAdd(): void {
		editingId = null;
		imageMode = 'local';
		form = { name: '', category: categoriesState.items[0] ?? 'Coffee', price: 0, description: '', image: LOCAL_IMAGES[0], featured: false };
		formError = '';
		showModal = true;
	}

	function openEdit(p: Product): void {
		editingId = p.id;
		imageMode = LOCAL_IMAGES.includes(p.image) ? 'local' : 'url';
		form = {
			name: p.name,
			category: p.category,
			price: p.price,
			description: p.description,
			image: p.image,
			featured: p.featured
		};
		formError = '';
		showModal = true;
	}

	function saveForm(): void {
		if (!form.name.trim()) {
			formError = 'Nama produk wajib diisi.';
			return;
		}
		if (!form.price || form.price <= 0) {
			formError = 'Harga harus lebih dari 0.';
			return;
		}
		if (!form.image.trim()) {
			formError = 'Foto produk wajib diisi.';
			return;
		}
		const data = {
			name: form.name.trim(),
			category: form.category,
			price: Math.round(form.price),
			description: form.description.trim(),
			image: form.image.trim(),
			featured: form.featured
		};
		if (editingId === null) addProduct(data);
		else updateProduct(editingId, data);
		showModal = false;
	}

	function remove(id: number, name: string): void {
		if (confirm(`Hapus "${name}" dari menu?`)) deleteProduct(id);
	}

	function resetAll(): void {
		if (confirm('Kembalikan semua produk ke bawaan PDF? Perubahan admin akan hilang.'))
			resetCatalog();
	}

	// ── CRUD kategori ──────────────────────────────────────────────
	let showCatModal = $state(false);
	let editingCat = $state<string | null>(null);
	let catName = $state('');
	let catError = $state('');

	function openCatAdd(): void {
		editingCat = null;
		catName = '';
		catError = '';
		showCatModal = true;
	}

	function openCatEdit(name: string): void {
		editingCat = name;
		catName = name;
		catError = '';
		showCatModal = true;
	}

	function saveCat(): void {
		if (!catName.trim()) {
			catError = 'Nama kategori wajib diisi.';
			return;
		}
		if (editingCat === null) {
			const res = addCategory(catName);
			if (!res.ok) {
				catError = res.message ?? 'Gagal menambah kategori.';
				return;
			}
		} else {
			const res = renameCategory(editingCat, catName);
			if (!res.ok) {
				catError = res.message ?? 'Gagal menyimpan kategori.';
				return;
			}
			// Produk yang memakai nama lama ikut pindah ke nama baru
			renameCategoryProducts(editingCat, catName.trim());
		}
		showCatModal = false;
	}

	function removeCat(name: string): void {
		const used = countByCategory(name);
		if (used > 0) {
			alert(
				`Kategori "${name}" masih dipakai ${used} produk. Pindahkan/hapus produknya dulu atau rename kategorinya.`
			);
			return;
		}
		if (confirm(`Hapus kategori "${name}"?`)) deleteCategory(name);
	}

	function resetCats(): void {
		if (confirm('Kembalikan daftar kategori ke bawaan? Produk tidak ikut berubah.'))
			resetCategories();
	}

	// ── Form pengaturan ──────────────────────────────────────────────
	let draft = $state<SiteSettings>({ ...defaultSettings });
	let savedMsg = $state('');

	$effect(() => {
		if (tab === 'pengaturan') {
			draft = { ...site.current };
			savedMsg = '';
		}
	});

	function saveSite(): void {
		saveSettings(draft);
		savedMsg = 'Pengaturan tersimpan dan langsung tampil di landing page.';
	}

	function resetSite(): void {
		if (confirm('Kembalikan semua teks & kontak ke bawaan?')) {
			resetSettings();
			draft = { ...defaultSettings };
			savedMsg = 'Pengaturan dikembalikan ke bawaan.';
		}
	}

	// ── Kelas gaya industrial hitam-abu (layout Rubys) ────────────────────────────────────
	const inputCls =
		'h-10 w-full rounded-xl border border-white/15 bg-[#0F1319] px-3 text-sm text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none';
	const inputAreaCls =
		'w-full rounded-xl border border-white/15 bg-[#0F1319] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none';
	const labelCls = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50';
	const cardCls = 'rounded-2xl border border-white/10 bg-[#141922]';
	const btnPrimary =
		'inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#12151D] transition-colors hover:bg-white/85 disabled:opacity-50';
	const btnOutline =
		'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50';
	const iconBtn =
		'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30';
	const navBtn =
		'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all';
</script>

<svelte:head>
	<title>Portal Admin — Lyco</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if !authed}
	<main class="flex min-h-dvh items-center justify-center bg-industrial p-4">
		<div class="{cardCls} w-full max-w-sm p-6 text-center">
			<img src="/logo-lyco.jpg" alt="Logo Lyco" width="72" height="72" class="mx-auto size-14 rounded-2xl border border-white/15 object-cover" />
			<h1 class="mt-4 font-heading text-lg font-semibold text-white">Portal Admin Lyco</h1>
			<p class="mt-1 text-sm text-white/60">Masuk untuk mengatur menu dan konten situs.</p>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					login();
				}}
				class="mt-5 flex flex-col gap-4"
			>
				<div class="flex flex-col gap-1.5 text-left">
					<label for="admin-pass" class={labelCls}>Password admin</label>
					<input
						id="admin-pass"
						type="password"
						bind:value={password}
						placeholder="Password admin"
						aria-label="Password admin"
						class={inputCls}
					/>
				</div>
				{#if loginError}
					<p class="text-sm text-red-300">{loginError}</p>
				{/if}
				<button type="submit" class="h-10 w-full rounded-xl bg-white font-semibold text-[#12151D] hover:bg-white/85">
					Masuk
				</button>
			</form>
			<a
				href="/"
				class="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white"
			>
				<ArrowLeft size={15} />
				Kembali ke situs
			</a>
		</div>
	</main>
{:else}
	<div class="flex min-h-dvh bg-industrial text-white">
		{#if sidebarOpen}
			<button
				type="button"
				aria-label="Tutup menu"
				onclick={() => (sidebarOpen = false)}
				class="fixed inset-0 z-40 bg-black/30 lg:hidden"
			></button>
		{/if}

		<!-- Sidebar desktop ala Rubys -->
		<aside
			class="hidden w-64 shrink-0 border-r border-white/10 bg-[#12151D] lg:flex lg:flex-col"
			aria-label="Navigasi admin"
		>
			<div class="flex items-center gap-3 border-b border-white/10 px-5 py-4">
				<img src="/logo-lyco.jpg" alt="Logo Lyco" width="36" height="36" class="size-9 rounded-xl border border-white/15 object-cover" />
				<div>
					<p class="font-heading text-base font-semibold uppercase tracking-[0.3em] text-white">LYCO</p>
					<p class="text-[10px] uppercase tracking-[0.18em] text-white/50">Admin Panel</p>
				</div>
			</div>

			<nav class="flex-1 overflow-y-auto p-3">
				<div class="flex flex-col gap-1">
					{#each navItems as item (item.key)}
						{@const Icon = item.icon}
						{@const active = tab === item.key}
						{@const disabled = 'disabled' in item && item.disabled}
						<button
							type="button"
							onclick={() => !disabled && goTab(item.key as Tab)}
							disabled={disabled}
							aria-current={active ? 'page' : undefined}
							title={disabled ? `${item.label} — segera hadir` : item.label}
							class="{navBtn} {active
								? 'bg-white text-[#12151D]'
								: 'text-white/60 hover:bg-white/10 hover:text-white'} {disabled
								? 'cursor-not-allowed opacity-50'
								: ''}"
						>
							<Icon class="size-4" />
							<span class="capitalize">{item.label}</span>
							{#if disabled}
								<span class="ml-auto rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#12151D]">
									Segera
								</span>
							{:else if item.key === 'menu'}
								<span class="ml-auto rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white">
									{stats.total}
								</span>
							{:else if item.key === 'kategori'}
								<span class="ml-auto rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white">
									{stats.kategori}
								</span>
							{/if}
						</button>
					{/each}
				</div>
			</nav>

			<div class="border-t border-white/10 p-3">
				<div class="flex items-center gap-3 rounded-xl px-3 py-2.5">
					<img src="/logo-lyco.jpg" alt="Logo Lyco" width="32" height="32" class="size-8 rounded-lg border border-white/15 object-cover" />
					<div class="flex-1">
						<p class="text-sm font-medium text-white">Admin</p>
						<p class="text-[10px] uppercase tracking-[0.18em] text-white/50">Shift: Pagi</p>
					</div>
					<button
						type="button"
						onclick={logout}
						aria-label="Keluar"
						title="Keluar"
						class="cursor-pointer text-white/60 hover:text-red-300"
					>
						<LogOut size={16} />
					</button>
				</div>
			</div>
		</aside>

		<!-- Drawer mobile (gaya sama, versi geser) -->
		<aside
			class="fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#12151D] transition-transform duration-300 lg:hidden {sidebarOpen
				? 'translate-x-0'
				: '-translate-x-full'}"
			aria-label="Navigasi admin mobile"
		>
			<div class="flex items-center gap-3 border-b border-white/10 px-5 py-4">
				<img src="/logo-lyco.jpg" alt="Logo Lyco" width="36" height="36" class="size-9 rounded-xl border border-white/15 object-cover" />
				<div>
					<p class="font-heading text-base font-semibold uppercase tracking-[0.3em] text-white">LYCO</p>
					<p class="text-[10px] uppercase tracking-[0.18em] text-white/50">Admin Panel</p>
				</div>
				<button
					type="button"
					aria-label="Tutup sidebar"
					onclick={() => (sidebarOpen = false)}
					class="ml-auto rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
				>
					<X size={18} />
				</button>
			</div>
			<nav class="flex-1 overflow-y-auto p-3">
				<div class="flex flex-col gap-1">
					{#each navItems as item (item.key)}
						{@const Icon = item.icon}
						{@const active = tab === item.key}
						{@const disabled = 'disabled' in item && item.disabled}
						<button
							type="button"
							onclick={() => !disabled && goTab(item.key as Tab)}
							disabled={disabled}
							class="{navBtn} {active
								? 'bg-white text-[#12151D]'
								: 'text-white/60 hover:bg-white/10 hover:text-white'} {disabled
								? 'cursor-not-allowed opacity-50'
								: ''}"
						>
							<Icon class="size-4" />
							<span class="capitalize">{item.label}</span>
						</button>
					{/each}
				</div>
			</nav>
			<div class="border-t border-white/10 p-3">
				<div class="flex items-center gap-3 rounded-xl px-3 py-2.5">
					<img src="/logo-lyco.jpg" alt="Logo Lyco" width="32" height="32" class="size-8 rounded-lg border border-white/15 object-cover" />
					<div class="flex-1">
						<p class="text-sm font-medium text-white">Admin</p>
						<p class="text-[10px] uppercase tracking-[0.18em] text-white/50">Shift: Pagi</p>
					</div>
					<button
						type="button"
						onclick={logout}
						aria-label="Keluar"
						class="text-white/60 hover:text-red-300"
					>
						<LogOut size={16} />
					</button>
				</div>
			</div>
		</aside>

		<!-- Kolom utama -->
		<div class="flex min-w-0 flex-1 flex-col">
			<header class="sticky top-0 z-30 border-b border-white/10 bg-[#12151D]/90 backdrop-blur-xl">
				<div class="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
					<div class="flex min-w-0 items-center gap-3">
						<button
							type="button"
							aria-label="Buka menu"
							onclick={() => (sidebarOpen = true)}
							class="rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 hover:text-white lg:hidden"
						>
							<MenuIcon size={18} />
						</button>
						<div class="min-w-0">
							<h1 class="truncate font-heading text-xl font-semibold uppercase tracking-wider text-white">
								{tab === 'menu' ? 'Menu' : tab}
							</h1>
							<p class="truncate text-sm text-white/60">{subtitles[tab]}</p>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<a
							href="/"
							class="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/60 hover:text-white sm:inline-flex"
						>
							Lihat Situs
						</a>
						<span class="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white">
							<span class="size-1.5 rounded-full bg-white"></span>
							Admin Aktif
						</span>
					</div>
				</div>
			</header>

			<main class="flex-1 p-4 sm:p-6">
				{#if tab === 'dashboard'}
					<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
						<div class="{cardCls} p-5">
							<p class="flex items-center gap-2 text-xs font-medium text-white/60">
								<UtensilsCrossed size={13} />
								Total Menu
							</p>
							<p class="mt-1 font-heading text-2xl font-bold text-white">{stats.total}</p>
						</div>
						<div class="{cardCls} p-5">
							<p class="flex items-center gap-2 text-xs font-medium text-white/60">
								<Tags size={13} />
								Kategori
							</p>
							<p class="mt-1 font-heading text-2xl font-bold text-white">{stats.kategori}</p>
						</div>
						<div class="{cardCls} p-5">
							<p class="flex items-center gap-2 text-xs font-medium text-white/60">
								<BarChart3 size={13} />
								Unggulan
							</p>
							<p class="mt-1 font-heading text-2xl font-bold text-white">{stats.unggulan}</p>
						</div>
						<div class="{cardCls} p-5">
							<p class="flex items-center gap-2 text-xs font-medium text-white/60">
								<Clock size={13} />
								Kategori Kosong
							</p>
							<p class="mt-1 font-heading text-2xl font-bold text-white">{stats.kosong}</p>
						</div>
					</div>

					<div class="mt-4 grid gap-4 lg:grid-cols-2">
						<div class="{cardCls} p-5">
							<h2 class="font-heading text-base font-semibold text-white">Kelola Cepat</h2>
							<p class="mt-1 text-sm text-white/60">Aksi yang paling sering dipakai.</p>
							<div class="mt-4 flex flex-wrap gap-2">
								<button type="button" onclick={() => goTab('menu')} class={btnPrimary}>
									<Plus size={15} />
									Tambah Menu
								</button>
								<button type="button" onclick={() => goTab('kategori')} class={btnOutline}>
									<Tags size={15} />
									Kelola Kategori
								</button>
							</div>
						</div>
						<div class="{cardCls} p-5">
							<h2 class="font-heading text-base font-semibold text-white">Menu Terlaris</h2>
							<p class="mt-1 text-sm text-white/60">Produk yang tampil di beranda.</p>
							<ul class="mt-3 space-y-2">
								{#each catalog.items.filter((p) => p.featured).slice(0, 4) as p (p.id)}
									<li class="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2 text-sm">
										<span class="truncate font-medium text-white">{p.name}</span>
										<span class="font-semibold text-white">{formatRupiah(p.price)}</span>
									</li>
								{/each}
							</ul>
						</div>
					</div>
				{:else if tab === 'menu'}
					<div class="flex flex-wrap gap-2">
						<button type="button" onclick={openAdd} class={btnPrimary}>
							<Plus size={15} />
							Tambah Menu
						</button>
						<button type="button" onclick={resetAll} class={btnOutline}>
							<RotateCcw size={15} />
							Reset ke Bawaan
						</button>
					</div>

					<div class="{cardCls} mt-4 overflow-hidden">
						<div class="overflow-x-auto">
							<table class="w-full min-w-[760px] text-left text-sm">
								<thead>
									<tr class="border-b border-white/10 text-xs tracking-wider text-white/60 uppercase">
										<th class="px-4 py-3 font-medium">Foto</th>
										<th class="px-4 py-3 font-medium">Nama</th>
										<th class="px-4 py-3 font-medium">Kategori</th>
										<th class="px-4 py-3 font-medium">Harga</th>
										<th class="px-4 py-3 font-medium">Unggulan</th>
										<th class="px-4 py-3 text-right font-medium">Aksi</th>
									</tr>
								</thead>
								<tbody>
									{#each catalog.items as p (p.id)}
										<tr class="border-b border-white/10 last:border-0 hover:bg-white/10">
											<td class="px-4 py-3">
												<img
													src={p.image}
													alt="Foto {p.name}"
													width="64"
													height="48"
													loading="lazy"
													class="h-12 w-16 rounded-xl object-cover"
												/>
											</td>
											<td class="px-4 py-3 font-medium text-white">{p.name}</td>
											<td class="px-4 py-3 text-white/60">{p.category}</td>
											<td class="px-4 py-3 font-semibold text-white">{formatRupiah(p.price)}</td>
											<td class="px-4 py-3">
												<span
													class="inline-flex rounded-lg px-2 py-1 text-xs font-semibold {p.featured
														? 'bg-white text-[#12151D]'
														: 'bg-white/10 text-white/60'}"
												>
													{p.featured ? 'Ya' : 'Tidak'}
												</span>
											</td>
											<td class="px-4 py-3">
												<div class="flex justify-end gap-2">
													<button
														type="button"
														onclick={() => openEdit(p)}
														aria-label="Edit {p.name}"
														class={iconBtn}
													>
														<Pencil size={15} />
													</button>
													<button
														type="button"
														onclick={() => remove(p.id, p.name)}
														aria-label="Hapus {p.name}"
														class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/10 text-red-300 transition-colors hover:bg-red-500/20"
													>
														<Trash2 size={15} />
													</button>
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>

					{#if showModal}
						<div
							class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
							role="dialog"
							aria-modal="true"
							aria-label={editingId === null ? 'Tambah menu' : 'Edit menu'}
						>
							<div class="{cardCls} max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
								<h2 class="font-heading text-lg font-semibold text-white">
									{editingId === null ? 'Tambah Menu' : 'Edit Menu'}
								</h2>
								<div class="mt-4 flex flex-col gap-4">
									<div>
										<label for="f-name" class={labelCls}>Nama menu</label>
										<input id="f-name" bind:value={form.name} placeholder="cth. Kopi Susu Gula Aren" class={inputCls} />
									</div>
									<div class="grid gap-4 sm:grid-cols-2">
										<div>
											<label for="f-cat" class={labelCls}>Kategori</label>
											<select id="f-cat" bind:value={form.category} class={inputCls}>
												{#each categoriesState.items as c (c)}
													<option value={c}>{c}</option>
												{/each}
											</select>
										</div>
										<div>
											<label for="f-price" class={labelCls}>Harga (Rp)</label>
											<input id="f-price" type="number" min="0" step="500" bind:value={form.price} class={inputCls} />
										</div>
									</div>
									<div>
										<label for="f-desc" class={labelCls}>Deskripsi</label>
										<textarea id="f-desc" rows="3" bind:value={form.description} placeholder="Deskripsi singkat produk" class={inputAreaCls}></textarea>
									</div>
									<div>
										<span class={labelCls}>Foto produk</span>
										<div class="flex gap-2">
											<button
												type="button"
												onclick={() => {
													imageMode = 'local';
													form.image = LOCAL_IMAGES[0];
												}}
												class="inline-flex h-10 flex-1 items-center justify-center rounded-xl border text-sm font-medium {imageMode ===
												'local'
													? 'border-white bg-white text-[#12151D]'
													: 'border-white/10 text-white/60'}"
											>
												Foto Lyco
											</button>
											<button
												type="button"
												onclick={() => {
													imageMode = 'url';
													form.image = '';
												}}
												class="inline-flex h-10 flex-1 items-center justify-center rounded-xl border text-sm font-medium {imageMode ===
												'url'
													? 'border-white bg-white text-[#12151D]'
													: 'border-white/10 text-white/60'}"
											>
												URL Kustom
											</button>
										</div>
										{#if imageMode === 'local'}
											<select bind:value={form.image} aria-label="Pilih foto Lyco" class="{inputCls} mt-2.5">
												{#each LOCAL_IMAGES as src (src)}
													<option value={src}>{src}</option>
												{/each}
											</select>
											<img
												src={form.image}
												alt="Pratinjau foto produk"
												width="240"
												height="180"
												class="mt-2.5 aspect-[4/3] w-60 rounded-xl object-cover"
											/>
										{:else}
											<input
												bind:value={form.image}
												placeholder="https://…"
												aria-label="URL foto kustom"
												class="{inputCls} mt-2.5"
											/>
										{/if}
									</div>
									<label class="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-white">
										<input type="checkbox" bind:checked={form.featured} class="h-4 w-4 accent-white" />
										Tampilkan di beranda (Unggulan)
									</label>
									{#if formError}
										<p class="text-sm text-red-300">{formError}</p>
									{/if}
									<div class="flex gap-2 pt-2">
										<button type="button" onclick={saveForm} class="{btnPrimary} flex-1">
											Simpan
										</button>
										<button
											type="button"
											onclick={() => (showModal = false)}
											class="{btnOutline} flex-1"
										>
											Batal
										</button>
									</div>
								</div>
							</div>
						</div>
					{/if}
				{:else if tab === 'kategori'}
					<div class="flex flex-wrap gap-2">
						<button type="button" onclick={openCatAdd} class={btnPrimary}>
							<Plus size={15} />
							Tambah Kategori
						</button>
						<button type="button" onclick={resetCats} class={btnOutline}>
							<RotateCcw size={15} />
							Reset ke Bawaan
						</button>
					</div>

					<div class="{cardCls} mt-4 overflow-hidden">
						<div class="overflow-x-auto">
							<table class="w-full min-w-[680px] text-left text-sm">
								<thead>
									<tr class="border-b border-white/10 text-xs tracking-wider text-white/60 uppercase">
										<th class="px-4 py-3 font-medium">Urutan</th>
										<th class="px-4 py-3 font-medium">Nama Kategori</th>
										<th class="px-4 py-3 font-medium">Jumlah Produk</th>
										<th class="px-4 py-3 text-right font-medium">Aksi</th>
									</tr>
								</thead>
								<tbody>
									{#each categoriesState.items as cat, idx (cat)}
										{@const count = countByCategory(cat)}
										<tr class="border-b border-white/10 last:border-0 hover:bg-white/10">
											<td class="px-4 py-3 text-white/60">#{idx + 1}</td>
											<td class="px-4 py-3 font-medium text-white">
												<span class="inline-flex items-center gap-2">
													<Tags size={15} class="text-white/70" />
													{cat}
												</span>
											</td>
											<td class="px-4 py-3">
												<span class="inline-flex rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-white">
													{count} produk
												</span>
											</td>
											<td class="px-4 py-3">
												<div class="flex justify-end gap-2">
													<button
														type="button"
														onclick={() => moveCategory(cat, -1)}
														disabled={idx === 0}
														aria-label="Naikkan {cat}"
														class={iconBtn}
													>
														<ArrowUp size={15} />
													</button>
													<button
														type="button"
														onclick={() => moveCategory(cat, 1)}
														disabled={idx === categoriesState.items.length - 1}
														aria-label="Turunkan {cat}"
														class={iconBtn}
													>
														<ArrowDown size={15} />
													</button>
													<button
														type="button"
														onclick={() => openCatEdit(cat)}
														aria-label="Edit {cat}"
														class={iconBtn}
													>
														<Pencil size={15} />
													</button>
													<button
														type="button"
														onclick={() => removeCat(cat)}
														aria-label="Hapus {cat}"
														class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/10 text-red-300 transition-colors hover:bg-red-500/20"
													>
														<Trash2 size={15} />
													</button>
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
					<p class="mt-3 text-sm text-white/60">
						Urutan di sini mengatur urutan filter di halaman Menu. Rename kategori otomatis
						memindahkan semua produknya. Kategori yang masih berisi produk tidak bisa dihapus.
					</p>

					{#if showCatModal}
						<div
							class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
							role="dialog"
							aria-modal="true"
							aria-label={editingCat === null ? 'Tambah kategori' : 'Edit kategori'}
						>
							<div class="{cardCls} w-full max-w-sm p-6">
								<h2 class="font-heading text-lg font-semibold text-white">
									{editingCat === null ? 'Tambah Kategori Baru' : 'Edit Kategori'}
								</h2>
								{#if editingCat !== null}
									<p class="mt-1 text-sm text-white/60">
										{countByCategory(editingCat)} produk akan ikut pindah nama.
									</p>
								{/if}
								<div class="mt-4 flex flex-col gap-4">
									<div class="flex flex-col gap-1.5">
										<label for="c-name" class={labelCls}>Nama Kategori</label>
										<input
											id="c-name"
											bind:value={catName}
											placeholder="Nama kategori"
											class={inputCls}
										/>
									</div>
									{#if catError}
										<p class="text-sm text-red-300">{catError}</p>
									{/if}
									<button type="button" onclick={saveCat} class="{btnPrimary} h-10 w-full">
										{editingCat === null ? 'Tambah Kategori' : 'Simpan Perubahan'}
									</button>
									<button
										type="button"
										onclick={() => (showCatModal = false)}
										class="{btnOutline} w-full"
									>
										Batal
									</button>
								</div>
							</div>
						</div>
					{/if}
				{:else}
					<div class="{cardCls} p-6">
						<h2 class="font-heading text-lg font-semibold text-white">Teks & Kontak Landing Page</h2>
						<p class="mt-1 text-sm text-white/60">
							Bagian Hero, Promo, dan Kontak footer. Simpan untuk langsung tampil di situs.
						</p>
						<div class="mt-4 grid gap-4 sm:grid-cols-2">
							<div>
								<label for="s-badge" class={labelCls}>Label kecil Hero</label>
								<input id="s-badge" bind:value={draft.heroBadge} class={inputCls} />
							</div>
							<div>
								<label for="s-title" class={labelCls}>Judul Hero</label>
								<input id="s-title" bind:value={draft.heroTitle} class={inputCls} />
							</div>
							<div class="sm:col-span-2">
								<label for="s-sub" class={labelCls}>Subjudul Hero</label>
								<textarea id="s-sub" rows="2" bind:value={draft.heroSubtitle} class={inputAreaCls}></textarea>
							</div>
							<div>
								<label for="s-promo" class={labelCls}>Judul Promo</label>
								<input id="s-promo" bind:value={draft.promoTitle} class={inputCls} />
							</div>
							<div>
								<label for="s-promosub" class={labelCls}>Subjudul Promo</label>
								<input id="s-promosub" bind:value={draft.promoSubtitle} class={inputCls} />
							</div>
							<div class="sm:col-span-2">
								<label for="s-about" class={labelCls}>Deskripsi footer</label>
								<textarea id="s-about" rows="2" bind:value={draft.footerAbout} class={inputAreaCls}></textarea>
							</div>
							<div>
								<label for="s-aname" class={labelCls}>Nama tempat</label>
								<input id="s-aname" bind:value={draft.addressName} class={inputCls} />
							</div>
							<div>
								<label for="s-maps" class={labelCls}>Link Google Maps</label>
								<input id="s-maps" bind:value={draft.mapsUrl} class={inputCls} />
							</div>
							<div class="sm:col-span-2">
								<label for="s-addr" class={labelCls}>Alamat lengkap</label>
								<textarea id="s-addr" rows="2" bind:value={draft.addressLines} class={inputAreaCls}></textarea>
							</div>
							<div>
								<label for="s-phone" class={labelCls}>Telepon (tampil)</label>
								<input id="s-phone" bind:value={draft.phoneDisplay} class={inputCls} />
							</div>
							<div>
								<label for="s-phonehref" class={labelCls}>Telepon (link, cth. tel:+62…)</label>
								<input id="s-phonehref" bind:value={draft.phoneHref} class={inputCls} />
							</div>
							<div>
								<label for="s-email" class={labelCls}>Email</label>
								<input id="s-email" bind:value={draft.email} class={inputCls} />
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label for="s-hwd" class={labelCls}>Hari weekday</label>
									<input id="s-hwd" bind:value={draft.hoursWeekdayLabel} class={inputCls} />
								</div>
								<div>
									<label for="s-hwdt" class={labelCls}>Jam weekday</label>
									<input id="s-hwdt" bind:value={draft.hoursWeekdayTime} class={inputCls} />
								</div>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label for="s-hwe" class={labelCls}>Hari weekend</label>
									<input id="s-hwe" bind:value={draft.hoursWeekendLabel} class={inputCls} />
								</div>
								<div>
									<label for="s-hwet" class={labelCls}>Jam weekend</label>
									<input id="s-hwet" bind:value={draft.hoursWeekendTime} class={inputCls} />
								</div>
							</div>
						</div>
						{#if savedMsg}
							<p class="mt-4 text-sm font-medium text-white">{savedMsg}</p>
						{/if}
						<div class="mt-4 flex flex-wrap gap-2">
							<button type="button" onclick={saveSite} class={btnPrimary}>
								Simpan Pengaturan
							</button>
							<button type="button" onclick={resetSite} class={btnOutline}>
								<RotateCcw size={15} />
								Reset ke Bawaan
							</button>
						</div>
					</div>
				{/if}
			</main>
		</div>
	</div>
{/if}
