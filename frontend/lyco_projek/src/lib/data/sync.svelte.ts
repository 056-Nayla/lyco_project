// Sinkronisasi satu arah: backend (SQLite) -> store Svelte -> localStorage cache.
// Dipakai halaman publik (landing/menu) dan admin setelah login.
// Kalau backend mati, data lokal (bawaan / cache) tetap dipakai — tidak throw.

import { getCategories, getProducts, getSettings } from '#lib/api.js';
import { setCategories } from './categoriesStore.svelte.js';
import { setCatalog } from './productsStore.svelte.js';
import { applySettings } from './settingsStore.svelte.js';

/** Status koneksi backend yang reaktif — dipakai untuk badge di admin/menu. */
export const backendState = $state<{ ok: boolean; checked: boolean; lastError: string }>({
	ok: false,
	checked: false,
	lastError: ''
});

let inFlight: Promise<boolean> | null = null;

async function tryStep(fn: () => Promise<void>): Promise<boolean> {
	try {
		await fn();
		return true;
	} catch {
		return false;
	}
}

/** Ambil produk + kategori + settings dari backend. Return true kalau backend hidup. */
export function refreshAllFromBackend(): Promise<boolean> {
	if (inFlight) return inFlight;
	inFlight = (async () => {
		const [okProducts, okCategories, okSettings] = await Promise.all([
			tryStep(async () => {
				const res = await getProducts({ limit: 200 });
				if (Array.isArray(res.items) && res.items.length > 0) setCatalog(res.items);
			}),
			tryStep(async () => {
				const res = await getCategories();
				const names = res.items.map((c) => c.name).filter(Boolean);
				if (names.length > 0) setCategories(names);
			}),
			tryStep(async () => {
				const settings = await getSettings();
				if (settings && typeof settings === 'object') applySettings(settings);
			})
		]);
		const ok = okProducts || okCategories || okSettings;
		backendState.ok = ok;
		backendState.checked = true;
		backendState.lastError = ok ? '' : 'Backend tidak terjangkau — memakai data lokal.';
		inFlight = null;
		return ok;
	})();
	return inFlight;
}
