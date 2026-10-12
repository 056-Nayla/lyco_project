<script lang="ts">
	import { onMount } from 'svelte';
	import {
		ArrowDown,
		ArrowLeft,
		ArrowUp,
		BarChart3,
		ChevronLeft,
		ChevronRight,
		Clock,
		LayoutDashboard,
		Link2,
		LogOut,
		Menu as MenuIcon,
		Pencil,
		Plus,
		QrCode,
		Receipt,
		RotateCcw,
		Search,
		Settings,
		Tags,
		Trash2,
		Upload,
		Users,
		UtensilsCrossed,
		X
	} from '@lucide/svelte';
	import { formatRupiah, type Product } from '#lib/data/products.js';
	import QRCode from 'qrcode';
	import {
		getQrBase,
		refreshTables,
		setQrBase,
		setTables,
		tableLink,
		tablesState
	} from '#lib/data/tablesStore.svelte.js';
	import {
		ApiError,
		clearToken,
		createCategoryApi,
		createTableApi,
		createProduct,
		deleteCategoryApi,
		deleteProductApi,
		deleteTableApi,
		getAllOrders,
		getToken,
		getUsername,
		login as apiLogin,
		reorderCategoriesApi,
		renameCategoryApi,
		resetCategoriesApi,
		resetProductsApi,
		resetSettingsApi,
		resetTablesApi,
		resolveImage,
		setOrderStatus,
		updateProductApi,
		updateSettingsApi,
		updateTableApi,
		uploadImageApi,
		type Order,
		type OrderStatus,
		type TableInfo
	} from '#lib/api.js';
	import {
		addCategory,
		categoriesState,
		deleteCategory,
		renameCategory,
		resetCategories,
		setCategories
	} from '#lib/data/categoriesStore.svelte.js';
	import {
		LOCAL_IMAGES,
		addProduct,
		catalog,
		countByCategory,
		deleteProduct,
		renameCategoryProducts,
		resetCatalog,
		setCatalog,
		updateProduct
	} from '#lib/data/productsStore.svelte.js';
	import {
		applySettings,
		defaultSettings,
		resetSettings,
		saveSettings,
		site,
		type SiteSettings
	} from '#lib/data/settingsStore.svelte.js';
	import { backendState, refreshAllFromBackend } from '#lib/data/sync.svelte.js';

	// Fallback lokal kalau backend mati: username/password bawaan.
	const FALLBACK_USER = 'admin';
	const FALLBACK_PASSWORD = 'lyco123';
	const AUTH_KEY = 'lyco:admin:auth';

	type Tab = 'dashboard' | 'menu' | 'kategori' | 'pesanan' | 'meja' | 'pengaturan';
	type DisabledKey = 'meja' | 'staf' | 'shift' | 'laporan';

	let authed = $state(false);
	let username = $state('admin');
	let password = $state('');
	let loginError = $state('');
	let busy = $state(false);
	let notice = $state('');
	// Desain sidebar ditiru dari https://rubys.trackbill.cloud/admin (default: dashboard)
	let tab = $state<Tab>('dashboard');
	let sidebarOpen = $state(false);

	const navItems = [
		{ icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
		{ icon: UtensilsCrossed, label: 'Menu', key: 'menu' },
		{ icon: Tags, label: 'Kategori', key: 'kategori' },
		{ icon: Receipt, label: 'Pesanan', key: 'pesanan' },
		{ icon: QrCode, label: 'Meja & QR', key: 'meja' },
		{ icon: Users, label: 'Staf', key: 'staf', disabled: true },
		{ icon: Clock, label: 'Shift', key: 'shift', disabled: true },
		{ icon: BarChart3, label: 'Laporan', key: 'laporan', disabled: true },
		{ icon: Settings, label: 'Pengaturan', key: 'pengaturan' }
	] as const;

	const subtitles: Record<Tab | DisabledKey, string> = {
		dashboard: 'Ringkasan hari ini',
		menu: 'Kelola menu cafe',
		kategori: 'Kelola kategori menu',
		pesanan: 'Pesanan masuk dari pembeli',
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

	// ── Meja & QR ────────────────────────────────────────────────
	let qrMap = $state<Record<string, string>>({});
	let qrBase = $state('');
	let qrLoading = $state(false);
	let mejaNotice = $state('');
	let showMejaModal = $state(false);
	let editingMeja = $state<string | null>(null);
	let mejaCode = $state('');
	let mejaName = $state('');
	let mejaError = $state('');

	async function genQrs(items: TableInfo[]): Promise<void> {
		const entries = await Promise.all(
			items.map(async (t) => {
				try {
					const url = tableLink(t.code, qrBase || undefined);
					const dataUrl = await QRCode.toDataURL(url, { width: 256, margin: 1 });
					return [t.code, dataUrl] as const;
				} catch {
					return [t.code, ''] as const;
				}
			})
		);
		qrMap = Object.fromEntries(entries);
	}

	async function loadMeja(): Promise<void> {
		if (!getToken()) {
			mejaNotice = 'Butuh login backend untuk mengelola meja.';
			return;
		}
		qrLoading = true;
		mejaNotice = '';
		try {
			const ok = await refreshTables();
			if (!ok) mejaNotice = 'Gagal memuat meja. Periksa koneksi backend.';
			else await genQrs(tablesState.items);
		} finally {
			qrLoading = false;
		}
	}

	async function applyQrBase(): Promise<void> {
		setQrBase(qrBase);
		qrLoading = true;
		try {
			await genQrs(tablesState.items);
			mejaNotice = `QR memakai basis ${qrBase || getQrBase()}.`;
		} finally {
			qrLoading = false;
		}
	}

	function openMejaAdd(): void {
		editingMeja = null;
		mejaCode = '';
		mejaName = '';
		mejaError = '';
		showMejaModal = true;
	}

	function openMejaEdit(t: TableInfo): void {
		editingMeja = t.code;
		mejaCode = t.code;
		mejaName = t.name;
		mejaError = '';
		showMejaModal = true;
	}

	async function saveMeja(): Promise<void> {
		if (!mejaCode.trim()) {
			mejaError = 'Kode meja wajib diisi.';
			return;
		}
		mejaError = '';
		try {
			busy = true;
			const res =
				editingMeja === null
					? await createTableApi(mejaCode.trim(), mejaName.trim())
					: await updateTableApi(editingMeja, { code: mejaCode.trim(), name: mejaName.trim() });
			setTables(res.items);
			await genQrs(res.items);
			showMejaModal = false;
		} catch (e) {
			mejaError = errMsg(e, 'Gagal menyimpan meja.');
		} finally {
			busy = false;
		}
	}

	async function removeMeja(code: string): Promise<void> {
		if (!confirm(`Hapus meja "${code}"? QR yang sudah dicetak tidak akan berfungsi.`)) return;
		try {
			busy = true;
			const res = await deleteTableApi(code);
			setTables(res.items);
			await genQrs(res.items);
		} catch (e) {
			alert(errMsg(e, 'Gagal menghapus meja.'));
		} finally {
			busy = false;
		}
	}

	async function toggleMeja(t: TableInfo): Promise<void> {
		try {
			const res = await updateTableApi(t.code, { active: !t.active });
			setTables(res.items);
		} catch (e) {
			alert(errMsg(e, 'Gagal mengubah status meja.'));
		}
	}

	async function resetMeja(): Promise<void> {
		if (!confirm('Kembalikan daftar meja ke bawaan (1–8)?')) return;
		try {
			busy = true;
			const res = await resetTablesApi();
			setTables(res.items);
			await genQrs(res.items);
		} catch (e) {
			alert(errMsg(e, 'Gagal reset meja.'));
		} finally {
			busy = false;
		}
	}

	function downloadQr(code: string): void {
		const url = qrMap[code];
		if (!url) return;
		const a = document.createElement('a');
		a.href = url;
		a.download = `qr-meja-${code}.png`;
		a.click();
	}

	async function copyMejaLink(code: string): Promise<void> {
		try {
			await navigator.clipboard.writeText(tableLink(code, qrBase || undefined));
			mejaNotice = `Link Meja ${code} disalin ke clipboard.`;
		} catch {
			mejaNotice = 'Gagal menyalin link.';
		}
	}

	// Muat meja + siapkan basis QR saat tab dibuka.
	$effect(() => {
		if (tab === 'meja' && authed) {
			qrBase = getQrBase();
			void loadMeja();
		}
	});

	// ── Pesanan masuk (sesi pembeli) ─────────────────────────────────
	type OrderFilter = 'semua' | OrderStatus;
	let orders = $state<Order[]>([]);
	let ordersLoading = $state(false);
	let ordersError = $state('');
	let ordersFilter = $state<OrderFilter>('semua');
	let expandedOrder = $state<number | null>(null);

	const ORDER_LABEL: Record<OrderStatus, string> = {
		baru: 'Baru',
		diproses: 'Diproses',
		selesai: 'Selesai',
		batal: 'Batal'
	};

	const ORDER_CLS: Record<OrderStatus, string> = {
		baru: 'bg-amber-400/15 text-amber-200',
		diproses: 'bg-sky-400/15 text-sky-200',
		selesai: 'bg-emerald-400/15 text-emerald-200',
		batal: 'bg-white/10 text-white/50'
	};

	const newOrderCount = $derived(orders.filter((o) => o.status === 'baru').length);

	const visibleOrders = $derived(
		ordersFilter === 'semua' ? orders : orders.filter((o) => o.status === ordersFilter)
	);

	function fmtOrderTime(iso: string): string {
		const d = new Date(iso.replace(' ', 'T') + 'Z');
		if (Number.isNaN(d.getTime())) return iso;
		return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
	}

	async function loadOrders(): Promise<void> {
		if (!getToken()) {
			ordersError = 'Butuh login backend untuk melihat pesanan.';
			return;
		}
		ordersLoading = true;
		ordersError = '';
		try {
			const res = await getAllOrders();
			orders = res.items;
		} catch (e) {
			ordersError = errMsg(e, 'Gagal memuat pesanan.');
		} finally {
			ordersLoading = false;
		}
	}

	async function changeOrderStatus(id: number, status: OrderStatus): Promise<void> {
		try {
			const updated = await setOrderStatus(id, status);
			orders = orders.map((o) => (o.id === id ? updated : o));
		} catch (e) {
			alert(errMsg(e, 'Gagal mengubah status pesanan.'));
		}
	}

	// Muat + pantau pesanan baru selama tab Pesanan dibuka.
	$effect(() => {
		if (tab === 'pesanan' && authed) {
			void loadOrders();
			const t = setInterval(() => void loadOrders(), 15000);
			return () => clearInterval(t);
		}
	});

	onMount(async () => {
		try {
			authed =
				sessionStorage.getItem(AUTH_KEY) === '1' || !!sessionStorage.getItem('lyco:admin:token');
			if (authed) {
				const savedUser = getUsername();
				if (savedUser) username = savedUser;
			}
		} catch {
			authed = false;
		}
		// Selalu coba sinkron dari backend (publik maupun admin) — gagal = pakai lokal.
		await refreshAllFromBackend();
	});

	async function login(): Promise<void> {
		loginError = '';
		notice = '';
		const u = username.trim() || FALLBACK_USER;
		if (!password) {
			loginError = 'Password wajib diisi.';
			return;
		}
		busy = true;
		try {
			const res = await apiLogin(u, password);
			const { setToken } = await import('#lib/api.js');
			setToken(res.token, res.username);
			authed = true;
			password = '';
			await refreshAllFromBackend();
			notice = backendState.ok ? `Terhubung ke backend sebagai ${res.username}.` : '';
		} catch (e) {
			// Fallback: backend mati (status 0) + kredensial bawaan → mode lokal.
			if (e instanceof ApiError && e.status === 0 && u === FALLBACK_USER && password === FALLBACK_PASSWORD) {
				authed = true;
				loginError = '';
				password = '';
				try {
					sessionStorage.setItem(AUTH_KEY, '1');
				} catch {
					// abaikan
				}
				notice = 'Backend tidak terjangkau — mode lokal (perubahan hanya di browser ini).';
			} else if (e instanceof ApiError) {
				loginError = e.status === 0 ? 'Backend tidak bisa dihubungi. Jalankan `npm run dev` di folder backend.' : e.message;
			} else {
				loginError = 'Login gagal. Coba lagi.';
			}
		} finally {
			busy = false;
		}
	}

	function logout(): void {
		authed = false;
		sidebarOpen = false;
		notice = '';
		clearToken();
	}

	function goTab(t: Tab): void {
		tab = t;
		sidebarOpen = false;
	}

	function errMsg(e: unknown, fallback: string): string {
		if (e instanceof ApiError) return e.message;
		return fallback;
	}

	// ── Cari + pagination tabel menu admin (client-side dari katalog) ──
	const MENU_PER_PAGE = 10;
	let menuQuery = $state('');
	let menuCat = $state('Semua');
	let menuPage = $state(1);

	const menuFiltered = $derived(
		catalog.items.filter((p) => {
			const okCat = menuCat === 'Semua' || p.category === menuCat;
			const q = menuQuery.trim().toLowerCase();
			const okQ =
				!q ||
				p.name.toLowerCase().includes(q) ||
				(p.description ?? '').toLowerCase().includes(q) ||
				p.category.toLowerCase().includes(q);
			return okCat && okQ;
		})
	);
	const menuTotalPages = $derived(Math.max(1, Math.ceil(menuFiltered.length / MENU_PER_PAGE)));
	const menuSafePage = $derived(Math.min(Math.max(menuPage, 1), menuTotalPages));
	const menuRows = $derived(
		menuFiltered.slice((menuSafePage - 1) * MENU_PER_PAGE, menuSafePage * MENU_PER_PAGE)
	);
	const menuCatOptions = $derived(['Semua', ...categoriesState.items]);

	// Kembali ke halaman 1 setiap filter berubah (tidak membaca menuPage → tidak loop).
	$effect(() => {
		void menuQuery;
		void menuCat;
		menuPage = 1;
	});

	function clampMenuPage(): void {
		if (menuPage > menuTotalPages) menuPage = menuTotalPages;
	}

	// ── Form produk (tambah / edit) ──────────────────────────────────
	let showModal = $state(false);
	let editingId = $state<number | null>(null);
	let imageMode = $state<'local' | 'url' | 'upload'>('local');
	let uploadFile = $state<File | null>(null);
	let previewUrl = $state<string | null>(null);
	let form = $state({ name: '', category: 'Coffee', price: 0, description: '', image: LOCAL_IMAGES[0], featured: false });
	let formError = $state('');

	function openAdd(): void {
		editingId = null;
		imageMode = 'local';
		uploadFile = null;
		clearUploadPreview();
		form = { name: '', category: categoriesState.items[0] ?? 'Coffee', price: 0, description: '', image: LOCAL_IMAGES[0], featured: false };
		formError = '';
		showModal = true;
	}

	function openEdit(p: Product): void {
		editingId = p.id;
		uploadFile = null;
		clearUploadPreview();
		imageMode = LOCAL_IMAGES.includes(p.image) ? 'local' : p.image.startsWith('/uploads/') ? 'upload' : 'url';
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

	function clearUploadPreview(): void {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
			previewUrl = null;
		}
	}

	function onFileChange(e: Event): void {
		const input = e.currentTarget as HTMLInputElement;
		const f = input.files?.[0] ?? null;
		clearUploadPreview();
		uploadFile = f;
		if (f) previewUrl = URL.createObjectURL(f);
	}

	function closeModal(): void {
		showModal = false;
		uploadFile = null;
		clearUploadPreview();
	}

	async function saveForm(): Promise<void> {
		if (!form.name.trim()) {
			formError = 'Nama produk wajib diisi.';
			return;
		}
		if (!form.price || form.price <= 0) {
			formError = 'Harga harus lebih dari 0.';
			return;
		}
		if (imageMode !== 'upload' && !form.image.trim()) {
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
		formError = '';
		busy = true;
		try {
			// Upload dulu kalau admin memilih file baru (butuh backend + token)
			if (imageMode === 'upload') {
				if (uploadFile) {
					if (!getToken()) throw new ApiError('Upload butuh login backend (bukan mode lokal).', 401);
					const up = await uploadImageApi(uploadFile);
					data.image = up.url;
					form.image = up.url;
				} else if (!data.image || data.image.startsWith('upload:')) {
					// Mode upload tanpa file baru dan tanpa foto /uploads/ lama → tolak,
					// jangan sampai placeholder "upload:..." tersimpan ke DB.
					formError = 'Pilih file foto dulu atau ganti ke Foto Lyco / URL.';
					return;
				}
				// Tanpa file baru tapi foto /uploads/ lama masih ada → pertahankan.
			}
			if (getToken() && backendState.ok) {
				if (editingId === null) {
					const created = await createProduct(data);
					setCatalog([...catalog.items, created]);
				} else {
					const updated = await updateProductApi(editingId, data);
					setCatalog(catalog.items.map((p) => (p.id === editingId ? updated : p)));
				}
			} else {
				// Mode lokal (backend mati): tetap jalan seperti dulu
				if (editingId === null) addProduct(data);
				else updateProduct(editingId, data);
			}
			closeModal();
		} catch (e) {
			formError = errMsg(e, 'Gagal menyimpan produk.');
		} finally {
			busy = false;
		}
	}

	async function remove(id: number, name: string): Promise<void> {
		if (!confirm(`Hapus "${name}" dari menu?`)) return;
		if (getToken() && backendState.ok) {
			try {
				busy = true;
				await deleteProductApi(id);
				setCatalog(catalog.items.filter((p) => p.id !== id));
				clampMenuPage();
			} catch (e) {
				alert(errMsg(e, 'Gagal menghapus produk.'));
			} finally {
				busy = false;
			}
		} else {
			deleteProduct(id);
			clampMenuPage();
		}
	}

	async function resetAll(): Promise<void> {
		if (!confirm('Kembalikan semua produk ke bawaan PDF? Perubahan admin akan hilang.')) return;
		if (getToken() && backendState.ok) {
			try {
				busy = true;
				await resetProductsApi();
				await refreshAllFromBackend();
			} catch (e) {
				alert(errMsg(e, 'Gagal reset produk.'));
			} finally {
				busy = false;
			}
		} else {
			resetCatalog();
		}
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

	function applyCategoryItems(items: { name: string }[]): void {
		setCategories(items.map((c) => c.name));
	}

	async function saveCat(): Promise<void> {
		if (!catName.trim()) {
			catError = 'Nama kategori wajib diisi.';
			return;
		}
		catError = '';
		if (getToken() && backendState.ok) {
			try {
				busy = true;
				const res =
					editingCat === null
						? await createCategoryApi(catName.trim())
						: await renameCategoryApi(editingCat, catName.trim());
				applyCategoryItems(res.items);
				if (editingCat !== null) {
					// Backend sudah memindahkan produk; samakan cache lokal
					renameCategoryProducts(editingCat, catName.trim());
					await refreshAllFromBackend();
				}
				showCatModal = false;
			} catch (e) {
				catError = errMsg(e, 'Gagal menyimpan kategori.');
			} finally {
				busy = false;
			}
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

	async function removeCat(name: string): Promise<void> {
		const used = countByCategory(name);
		if (used > 0) {
			alert(
				`Kategori "${name}" masih dipakai ${used} produk. Pindahkan/hapus produknya dulu atau rename kategorinya.`
			);
			return;
		}
		if (!confirm(`Hapus kategori "${name}"?`)) return;
		if (getToken() && backendState.ok) {
			try {
				busy = true;
				const res = await deleteCategoryApi(name);
				applyCategoryItems(res.items);
			} catch (e) {
				alert(errMsg(e, 'Gagal menghapus kategori.'));
			} finally {
				busy = false;
			}
		} else {
			deleteCategory(name);
		}
	}

	async function moveCategoryBackend(name: string, direction: -1 | 1): Promise<void> {
		const idx = categoriesState.items.findIndex((c) => c === name);
		const target = idx + direction;
		if (idx === -1 || target < 0 || target >= categoriesState.items.length) return;
		const next = [...categoriesState.items];
		const [moved] = next.splice(idx, 1);
		next.splice(target, 0, moved);
		if (getToken() && backendState.ok) {
			try {
				busy = true;
				const res = await reorderCategoriesApi(next);
				applyCategoryItems(res.items);
			} catch (e) {
				alert(errMsg(e, 'Gagal mengubah urutan kategori.'));
			} finally {
				busy = false;
			}
		} else {
			// Mode lokal: geser + simpan ke localStorage
			setCategories(next);
		}
	}

	async function resetCats(): Promise<void> {
		if (!confirm('Kembalikan daftar kategori ke bawaan? Produk tidak ikut berubah.')) return;
		if (getToken() && backendState.ok) {
			try {
				busy = true;
				const res = await resetCategoriesApi();
				applyCategoryItems(res.items);
				await refreshAllFromBackend();
			} catch (e) {
				alert(errMsg(e, 'Gagal reset kategori.'));
			} finally {
				busy = false;
			}
		} else {
			resetCategories();
		}
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

	async function saveSite(): Promise<void> {
		if (getToken() && backendState.ok) {
			try {
				busy = true;
				const updated = await updateSettingsApi({ ...draft });
				applySettings(updated);
				draft = { ...updated };
				savedMsg = 'Pengaturan tersimpan di backend dan langsung tampil di landing page.';
			} catch (e) {
				savedMsg = errMsg(e, 'Gagal menyimpan pengaturan.');
			} finally {
				busy = false;
			}
		} else {
			saveSettings(draft);
			savedMsg = 'Pengaturan tersimpan lokal (backend tidak terhubung).';
		}
	}

	async function resetSite(): Promise<void> {
		if (!confirm('Kembalikan semua teks & kontak ke bawaan?')) return;
		if (getToken() && backendState.ok) {
			try {
				busy = true;
				const updated = await resetSettingsApi();
				applySettings(updated);
				draft = { ...updated };
				savedMsg = 'Pengaturan dikembalikan ke bawaan (backend).';
			} catch (e) {
				savedMsg = errMsg(e, 'Gagal reset pengaturan.');
			} finally {
				busy = false;
			}
		} else {
			resetSettings();
			draft = { ...defaultSettings };
			savedMsg = 'Pengaturan dikembalikan ke bawaan (lokal).';
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
					<label for="admin-user" class={labelCls}>Username</label>
					<input
						id="admin-user"
						type="text"
						bind:value={username}
						placeholder="admin"
						autocomplete="username"
						aria-label="Username admin"
						class={inputCls}
					/>
				</div>
				<div class="flex flex-col gap-1.5 text-left">
					<label for="admin-pass" class={labelCls}>Password admin</label>
					<input
						id="admin-pass"
						type="password"
						bind:value={password}
						placeholder="Password admin"
						autocomplete="current-password"
						aria-label="Password admin"
						class={inputCls}
					/>
				</div>
				{#if loginError}
					<p class="text-sm text-red-300">{loginError}</p>
				{/if}
				<button type="submit" disabled={busy} class="h-10 w-full rounded-xl bg-white font-semibold text-[#12151D] hover:bg-white/85 disabled:opacity-50">
					{busy ? 'Menghubungkan…' : 'Masuk'}
				</button>
				<p class="text-xs text-white/40">Backend: http://localhost:3001 — kalau mati, pakai admin / lyco123 (mode lokal).</p>
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
							{:else if item.key === 'pesanan' && newOrderCount > 0}
								<span class="ml-auto rounded-md bg-amber-300 px-1.5 py-0.5 text-[10px] font-bold text-[#12151D]">
									{newOrderCount}
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
						<span
							title={backendState.ok ? 'Backend terhubung — data tersimpan permanen' : 'Backend tidak terjangkau — mode lokal'}
							class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold {backendState.ok ? 'bg-emerald-400/15 text-emerald-200' : 'bg-amber-400/15 text-amber-200'}"
						>
							<span class="size-1.5 rounded-full {backendState.ok ? 'bg-emerald-300' : 'bg-amber-300'}"></span>
							{backendState.ok ? 'Backend: Terhubung' : 'Backend: Lokal'}
						</span>
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
				{#if notice}
					<p class="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70">{notice}</p>
				{/if}
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

					<div class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
						<label class="relative block sm:max-w-xs sm:flex-1">
							<span class="sr-only">Cari menu</span>
							<Search
								size={15}
								class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/40"
							/>
							<input
								type="search"
								bind:value={menuQuery}
								placeholder="Cari nama / kategori…"
								aria-label="Cari menu"
								class="h-10 w-full rounded-xl border border-white/15 bg-[#0F1319] pr-3 pl-9 text-sm text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none"
							/>
						</label>
						<select
							bind:value={menuCat}
							aria-label="Filter kategori"
							class="h-10 rounded-xl border border-white/15 bg-[#0F1319] px-3 text-sm text-white focus:border-white/50 focus:outline-none sm:w-48"
						>
							{#each menuCatOptions as c (c)}
								<option value={c}>{c === 'Semua' ? 'Semua kategori' : c}</option>
							{/each}
						</select>
						<p class="text-sm text-white/50 sm:ml-auto" role="status">
							<span class="font-semibold text-white">{menuFiltered.length}</span> dari
							{catalog.items.length} produk
						</p>
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
									{#each menuRows as p (p.id)}
										<tr class="border-b border-white/10 last:border-0 hover:bg-white/10">
											<td class="px-4 py-3">
												<img
													src={resolveImage(p.image)}
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
						{#if menuFiltered.length === 0}
							<p class="px-4 py-8 text-center text-sm text-white/50">
								Tidak ada produk yang cocok dengan pencarian.
							</p>
						{/if}
					</div>
					{#if menuTotalPages > 1}
						<div class="mt-3 flex items-center justify-between gap-2">
							<p class="text-xs text-white/50">Halaman {menuSafePage} dari {menuTotalPages}</p>
							<div class="flex items-center gap-1.5">
								<button
									type="button"
									onclick={() => (menuPage = menuSafePage - 1)}
									disabled={menuSafePage <= 1}
									aria-label="Halaman sebelumnya"
									class={iconBtn}
								>
									<ChevronLeft size={15} />
								</button>
								<span class="px-2 text-sm font-semibold text-white">{menuSafePage} / {menuTotalPages}</span>
								<button
									type="button"
									onclick={() => (menuPage = menuSafePage + 1)}
									disabled={menuSafePage >= menuTotalPages}
									aria-label="Halaman berikutnya"
									class={iconBtn}
								>
									<ChevronRight size={15} />
								</button>
							</div>
						</div>
					{/if}

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
													uploadFile = null;
													clearUploadPreview();
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
													imageMode = 'upload';
													uploadFile = null;
													clearUploadPreview();
													if (!form.image.startsWith('/uploads/')) form.image = '';
												}}
												title="Upload ke backend (butuh login backend)"
												class="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border text-sm font-medium {imageMode ===
												'upload'
													? 'border-white bg-white text-[#12151D]'
													: 'border-white/10 text-white/60'}"
											>
												<Upload size={14} />
												Upload
											</button>
											<button
												type="button"
												onclick={() => {
													imageMode = 'url';
													form.image = '';
													uploadFile = null;
													clearUploadPreview();
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
												src={resolveImage(form.image)}
												alt="Pratinjau foto produk"
												width="240"
												height="180"
												class="mt-2.5 aspect-[4/3] w-60 rounded-xl object-cover"
											/>
										{:else if imageMode === 'upload'}
											<input
												type="file"
												accept="image/jpeg,image/png,image/webp"
												onchange={onFileChange}
												aria-label="Pilih file foto (JPG/PNG/WebP maks 2MB)"
												class="{inputCls} mt-2.5 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold"
											/>
											<p class="mt-1.5 text-xs text-white/50">JPG/PNG/WebP maks 2MB — tersimpan di backend <code>/uploads</code>. Butuh status “Backend: Terhubung”.</p>
											{#if uploadFile}
												<p class="mt-1.5 text-xs font-medium text-white">File baru: {uploadFile.name}</p>
											{/if}
											{#if previewUrl}
												<img
													src={previewUrl}
													alt="Pratinjau file baru"
													width="240"
													height="180"
													class="mt-2.5 aspect-[4/3] w-60 rounded-xl object-cover"
												/>
											{:else if form.image && form.image.startsWith('/uploads/')}
												<img
													src={resolveImage(form.image)}
													alt="Foto produk saat ini"
													width="240"
													height="180"
													class="mt-2.5 aspect-[4/3] w-60 rounded-xl object-cover"
												/>
											{/if}
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
										<button type="button" onclick={saveForm} disabled={busy} class="{btnPrimary} flex-1">
											{busy ? 'Menyimpan…' : 'Simpan'}
										</button>
										<button
											type="button"
											onclick={closeModal}
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
														onclick={() => moveCategoryBackend(cat, -1)}
														disabled={idx === 0 || busy}
														aria-label="Naikkan {cat}"
														class={iconBtn}
													>
														<ArrowUp size={15} />
													</button>
													<button
														type="button"
														onclick={() => moveCategoryBackend(cat, 1)}
														disabled={idx === categoriesState.items.length - 1 || busy}
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
				{:else if tab === 'meja'}
					<div class="flex flex-wrap gap-2">
						<button type="button" onclick={openMejaAdd} class={btnPrimary}>
							<Plus size={15} />
							Tambah Meja
						</button>
						<button type="button" onclick={resetMeja} class={btnOutline}>
							<RotateCcw size={15} />
							Reset ke Bawaan
						</button>
					</div>

					<div class="{cardCls} mt-4 p-5">
						<h2 class="font-heading text-base font-semibold text-white">Basis URL QR</h2>
						<p class="mt-1 text-sm text-white/60">
							QR mengarah ke <code class="text-white/80">{tableLink('1', qrBase || undefined)}</code>.
							Saat cetak untuk operasional, ganti dengan domain publik kafe lalu Terapkan.
						</p>
						<div class="mt-3 flex flex-col gap-2 sm:flex-row">
							<input
								bind:value={qrBase}
								placeholder="https://lyco.id"
								aria-label="Basis URL QR"
								class="{inputCls} sm:flex-1"
							/>
							<button type="button" onclick={() => void applyQrBase()} disabled={qrLoading} class={btnOutline}>
								Terapkan & Generate Ulang
							</button>
						</div>
					</div>

					{#if mejaNotice}
						<p class="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70">{mejaNotice}</p>
					{/if}

					<div class="{cardCls} mt-4 overflow-hidden">
						<div class="overflow-x-auto">
							<table class="w-full min-w-[760px] text-left text-sm">
								<thead>
									<tr class="border-b border-white/10 text-xs tracking-wider text-white/60 uppercase">
										<th class="px-4 py-3 font-medium">QR</th>
										<th class="px-4 py-3 font-medium">Kode</th>
										<th class="px-4 py-3 font-medium">Nama</th>
										<th class="px-4 py-3 font-medium">Status</th>
										<th class="px-4 py-3 text-right font-medium">Aksi</th>
									</tr>
								</thead>
								<tbody>
									{#each tablesState.items as t (t.code)}
										<tr class="border-b border-white/10 last:border-0 hover:bg-white/5">
											<td class="px-4 py-3">
												{#if qrMap[t.code]}
													<img src={qrMap[t.code]} alt="QR Meja {t.code}" width="72" height="72" loading="lazy" class="h-[72px] w-[72px] rounded-lg bg-white p-1" />
												{:else}
													<span class="inline-block h-[72px] w-[72px] animate-pulse rounded-lg bg-white/10"></span>
												{/if}
											</td>
											<td class="px-4 py-3 font-mono font-bold text-white">{t.code}</td>
											<td class="px-4 py-3 text-white/60">{t.name || '—'}</td>
											<td class="px-4 py-3">
												<button
													type="button"
													onclick={() => void toggleMeja(t)}
													title={t.active ? 'Nonaktifkan meja' : 'Aktifkan meja'}
													class="inline-flex rounded-lg px-2 py-1 text-xs font-semibold {t.active
														? 'bg-emerald-400/15 text-emerald-200'
														: 'bg-white/10 text-white/50'}"
												>
													{t.active ? 'Aktif' : 'Nonaktif'}
												</button>
											</td>
											<td class="px-4 py-3">
												<div class="flex justify-end gap-1.5">
													<button type="button" onclick={() => downloadQr(t.code)} aria-label="Unduh QR Meja {t.code}" title="Unduh QR PNG" class={iconBtn}>
														<QrCode size={15} />
													</button>
													<button type="button" onclick={() => void copyMejaLink(t.code)} aria-label="Salin link Meja {t.code}" title="Salin link" class={iconBtn}>
														<Link2 size={15} />
													</button>
													<button type="button" onclick={() => openMejaEdit(t)} aria-label="Edit Meja {t.code}" class={iconBtn}>
														<Pencil size={15} />
													</button>
													<button
														type="button"
														onclick={() => void removeMeja(t.code)}
														aria-label="Hapus Meja {t.code}"
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
						{#if tablesState.items.length === 0 && !qrLoading}
							<p class="px-4 py-8 text-center text-sm text-white/50">Belum ada meja. Tambah atau reset ke bawaan.</p>
						{/if}
					</div>
					<p class="mt-3 text-sm text-white/60">
						Cetak QR dan tempel di tiap meja — pengunjung scan, pilih menu, nomor meja otomatis terisi saat checkout.
					</p>

					{#if showMejaModal}
						<div
							class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
							role="dialog"
							aria-modal="true"
							aria-label={editingMeja === null ? 'Tambah meja' : 'Edit meja'}
						>
							<div class="{cardCls} w-full max-w-sm p-6">
								<h2 class="font-heading text-lg font-semibold text-white">
									{editingMeja === null ? 'Tambah Meja Baru' : 'Edit Meja'}
								</h2>
								<div class="mt-4 flex flex-col gap-4">
									<div class="flex flex-col gap-1.5">
										<label for="m-code" class={labelCls}>Kode meja (cth. 9)</label>
										<input id="m-code" bind:value={mejaCode} placeholder="9" class={inputCls} />
									</div>
									<div class="flex flex-col gap-1.5">
										<label for="m-name" class={labelCls}>Nama area (opsional)</label>
										<input id="m-name" bind:value={mejaName} placeholder="cth. Teras Depan" class={inputCls} />
									</div>
									{#if mejaError}
										<p class="text-sm text-red-300">{mejaError}</p>
									{/if}
									<button type="button" onclick={() => void saveMeja()} disabled={busy} class="{btnPrimary} h-10 w-full">
										{busy ? 'Menyimpan…' : editingMeja === null ? 'Tambah Meja' : 'Simpan Perubahan'}
									</button>
									<button
										type="button"
										onclick={() => (showMejaModal = false)}
										class="{btnOutline} w-full"
									>
										Batal
									</button>
								</div>
							</div>
						</div>
					{/if}
				{:else if tab === 'pesanan'}
					<div class="flex flex-wrap items-center gap-2">
						{#each [{ key: 'semua', label: 'Semua' }, { key: 'baru', label: 'Baru' }, { key: 'diproses', label: 'Diproses' }, { key: 'selesai', label: 'Selesai' }, { key: 'batal', label: 'Batal' }] as f (f.key)}
							<button
								type="button"
								onclick={() => (ordersFilter = f.key as OrderFilter)}
								class="inline-flex h-9 items-center rounded-full border px-3.5 text-xs font-semibold transition-all {ordersFilter === f.key
									? 'border-white bg-white text-[#12151D]'
									: 'border-white/15 text-white/60 hover:bg-white/10 hover:text-white'}"
							>
								{f.label}
							</button>
						{/each}
						<button type="button" onclick={() => void loadOrders()} disabled={ordersLoading} class="{btnOutline} ml-auto h-9">
							<RotateCcw size={14} class={ordersLoading ? 'animate-spin' : ''} />
							Muat ulang
						</button>
					</div>
					{#if ordersError}
						<p class="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">{ordersError}</p>
					{/if}
					{#if newOrderCount > 0}
						<p class="mt-3 rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-2.5 text-sm font-medium text-amber-200">
							Ada {newOrderCount} pesanan baru menunggu diproses.
						</p>
					{/if}

					<div class="{cardCls} mt-4 overflow-hidden">
						<div class="overflow-x-auto">
							<table class="w-full min-w-[820px] text-left text-sm">
								<thead>
									<tr class="border-b border-white/10 text-xs tracking-wider text-white/60 uppercase">
										<th class="px-4 py-3 font-medium">Kode / Waktu</th>
										<th class="px-4 py-3 font-medium">Pembeli</th>
										<th class="px-4 py-3 font-medium">Isi</th>
										<th class="px-4 py-3 font-medium">Total</th>
										<th class="px-4 py-3 font-medium">Status</th>
										<th class="px-4 py-3 text-right font-medium">Aksi</th>
									</tr>
								</thead>
								<tbody>
									{#each visibleOrders as o (o.id)}
										<tr class="border-b border-white/10 last:border-0 hover:bg-white/5">
											<td class="px-4 py-3">
												<p class="font-mono font-bold tracking-wider text-white">{o.code}</p>
												<p class="text-xs text-white/50">{fmtOrderTime(o.created_at)}</p>
											</td>
											<td class="px-4 py-3">
												<p class="font-medium text-white">{o.buyer_name}</p>
												<p class="text-xs text-white/50">{o.table_no ? `Meja ${o.table_no}` : 'Tanpa no. meja'}</p>
											</td>
											<td class="px-4 py-3 text-white/70">
												{o.items.reduce((n, l) => n + l.qty, 0)} item
												<button
													type="button"
													onclick={() => (expandedOrder = expandedOrder === o.id ? null : o.id)}
													class="ml-1 underline decoration-dotted underline-offset-2 hover:text-white"
												>
													{expandedOrder === o.id ? 'tutup' : 'rincian'}
												</button>
											</td>
											<td class="px-4 py-3 font-semibold text-white">{formatRupiah(o.total)}</td>
											<td class="px-4 py-3">
												<span class="inline-flex rounded-lg px-2 py-1 text-xs font-semibold {ORDER_CLS[o.status]}">
													{ORDER_LABEL[o.status]}
												</span>
											</td>
											<td class="px-4 py-3">
												<div class="flex justify-end gap-1.5">
													{#if o.status === 'baru'}
														<button type="button" onclick={() => void changeOrderStatus(o.id, 'diproses')} class="{btnOutline} h-8 px-3 text-xs">Proses</button>
														<button type="button" onclick={() => confirm(`Batalkan pesanan ${o.code}?`) && void changeOrderStatus(o.id, 'batal')} class="inline-flex h-8 items-center rounded-xl border border-red-400/30 bg-red-500/10 px-3 text-xs font-medium text-red-300 hover:bg-red-500/20">Batal</button>
													{:else if o.status === 'diproses'}
														<button type="button" onclick={() => void changeOrderStatus(o.id, 'selesai')} class="{btnPrimary} h-8 px-3 text-xs">Selesai</button>
														<button type="button" onclick={() => confirm(`Batalkan pesanan ${o.code}?`) && void changeOrderStatus(o.id, 'batal')} class="inline-flex h-8 items-center rounded-xl border border-red-400/30 bg-red-500/10 px-3 text-xs font-medium text-red-300 hover:bg-red-500/20">Batal</button>
													{:else}
														<span class="text-xs text-white/30">—</span>
													{/if}
												</div>
											</td>
										</tr>
										{#if expandedOrder === o.id}
											<tr class="border-b border-white/10 bg-white/5">
												<td colspan="6" class="px-4 py-3">
													<ul class="space-y-1.5">
														{#each o.items as item (item.id)}
															<li class="flex items-center gap-2.5 text-sm">
																<img src={resolveImage(item.image ?? '')} alt="" width="32" height="32" loading="lazy" class="h-8 w-8 rounded-lg object-cover" />
																<span class="flex-1 text-white/80"><span class="font-bold text-white">{item.qty}x</span> {item.name}</span>
																<span class="font-semibold text-white">{formatRupiah(item.qty * item.price)}</span>
															</li>
														{/each}
													</ul>
													{#if o.note}
														<p class="mt-2 text-xs text-white/50">Catatan: {o.note}</p>
													{/if}
												</td>
											</tr>
										{/if}
									{/each}
								</tbody>
							</table>
						</div>
						{#if visibleOrders.length === 0 && !ordersLoading}
							<p class="px-4 py-8 text-center text-sm text-white/50">
								{ordersFilter === 'semua' ? 'Belum ada pesanan masuk.' : 'Tidak ada pesanan pada filter ini.'}
							</p>
						{/if}
					</div>
					<p class="mt-3 text-sm text-white/60">
						Daftar terpantau otomatis tiap 15 detik. Status pesanan langsung terlihat pembeli di halaman Pesanan Saya.
					</p>
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
