// Keranjang belanja (CRUD): tambah / lihat / ubah qty / hapus / kosongkan.
// Disimpan di localStorage agar awet saat pindah halaman.

import type { Product } from './products.js';

export type CartLine = {
	id: number;
	name: string;
	price: number;
	image: string;
	category: string;
	qty: number;
};

const STORAGE_KEY = 'lyco:cart:v1';
const MAX_QTY = 99;
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

/** Isi keranjang. Snapshot nama/harga/foto disimpan saat tambah agar awet. */
export const cart = $state<{ lines: CartLine[] }>({ lines: [] });

/** Status buka/tutup drawer keranjang (global, dipakai Navbar + tombol Tambah). */
export const cartUi = $state<{ open: boolean }>({ open: false });

/** Toast mini "masuk keranjang" — key dipakai untuk retrigger animasi. */
export const cartToast = $state<{ msg: string; key: number }>({ msg: '', key: 0 });

let toastTimer: ReturnType<typeof setTimeout> | null = null;

function persist(): void {
	if (!isBrowser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(cart.lines));
	} catch {
		// abaikan
	}
}

export function loadCart(): void {
	if (!isBrowser) return;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;
		const parsed = JSON.parse(raw) as CartLine[];
		if (Array.isArray(parsed)) {
			cart.lines = parsed.filter(
				(l) => typeof l?.id === 'number' && typeof l?.qty === 'number' && l.qty > 0
			);
		}
	} catch {
		// abaikan, mulai kosong
	}
}

if (isBrowser) loadCart();

function showToast(msg: string): void {
	cartToast.msg = msg;
	cartToast.key += 1;
	if (toastTimer) clearTimeout(toastTimer);
	toastTimer = setTimeout(() => {
		cartToast.msg = '';
	}, 2200);
}

export function openCart(): void {
	cartUi.open = true;
}

export function closeCart(): void {
	cartUi.open = false;
}

/** CREATE — tambah produk ke keranjang (qty nambah kalau sudah ada). */
export function addToCart(p: Product, qty = 1): void {
	const safeQty = Math.min(Math.max(Math.round(qty) || 1, 1), MAX_QTY);
	const line = cart.lines.find((l) => l.id === p.id);
	if (line) {
		line.qty = Math.min(line.qty + safeQty, MAX_QTY);
	} else {
		cart.lines = [
			...cart.lines,
			{ id: p.id, name: p.name, price: p.price, image: p.image, category: p.category, qty: safeQty }
		];
	}
	persist();
	showToast(`${p.name} masuk keranjang`);
}

/** UPDATE — ubah qty (0 = hapus baris). */
export function setQty(id: number, qty: number): void {
	const q = Math.round(qty);
	if (q <= 0) {
		removeLine(id);
		return;
	}
	const line = cart.lines.find((l) => l.id === id);
	if (!line) return;
	line.qty = Math.min(q, MAX_QTY);
	persist();
}

/** DELETE — hapus satu baris. */
export function removeLine(id: number): void {
	cart.lines = cart.lines.filter((l) => l.id !== id);
	persist();
}

/** DELETE — kosongkan semua. */
export function clearCart(): void {
	cart.lines = [];
	persist();
}

/** READ — total item & total harga (fungsi agar reaktif saat dipanggil di template). */
export function getCartCount(): number {
	return cart.lines.reduce((n, l) => n + l.qty, 0);
}
export function getCartTotal(): number {
	return cart.lines.reduce((n, l) => n + l.qty * l.price, 0);
}
