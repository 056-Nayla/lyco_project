// Sesi pembeli antar pengguna: tiap browser dapat ID sesi unik yang awet di
// localStorage. Checkout mengikat pesanan ke sesi ini sehingga halaman
// "Pesanan Saya" hanya menampilkan pesanan milik pengguna tersebut.

import { ApiError, getMyOrders, type Order } from '#lib/api.js';

const SESSION_KEY = 'lyco:buyer:session';
const NAME_KEY = 'lyco:buyer:name';
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

function newSessionId(): string {
	try {
		if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
	} catch {
		// abaikan, pakai fallback
	}
	return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** ID sesi pembeli perangkat ini (dibuat sekali, dipakai terus). */
export function getBuyerSession(): string {
	if (!isBrowser) return 'ssr';
	try {
		let s = localStorage.getItem(SESSION_KEY);
		if (!s) {
			s = newSessionId();
			localStorage.setItem(SESSION_KEY, s);
		}
		return s;
	} catch {
		return newSessionId();
	}
}

/** Nama pembeli terakhir (prefill form checkout). */
export function getBuyerName(): string {
	if (!isBrowser) return '';
	try {
		return localStorage.getItem(NAME_KEY) ?? '';
	} catch {
		return '';
	}
}

export function setBuyerName(name: string): void {
	if (!isBrowser) return;
	try {
		localStorage.setItem(NAME_KEY, name);
	} catch {
		// abaikan
	}
}

export const myOrders = $state<{ items: Order[]; loading: boolean; error: string }>({
	items: [],
	loading: false,
	error: ''
});

/** Muat ulang daftar pesanan milik sesi ini. Gagal = pesan error, daftar lama dipertahankan. */
export async function loadMyOrders(): Promise<void> {
	if (!isBrowser) return;
	myOrders.loading = true;
	myOrders.error = '';
	try {
		const res = await getMyOrders(getBuyerSession());
		myOrders.items = res.items;
	} catch (e) {
		myOrders.error =
			e instanceof ApiError && e.status === 0
				? 'Backend tidak terjangkau — status pesanan belum bisa dimuat.'
				: 'Gagal memuat pesanan.';
	} finally {
		myOrders.loading = false;
	}
}
