import { products as defaultProducts, type Product } from './products.js';

const STORAGE_KEY = 'lyco:products:v1';
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

/** Katalog reaktif: dipakai halaman landing & menu agar hasil edit admin langsung tampil. */
export const catalog = $state<{ items: Product[] }>({ items: defaultProducts });

function persist(): void {
	if (!isBrowser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog.items));
	} catch {
		// Penyimpanan penuh / diblokir: abaikan, data default tetap dipakai
	}
}

export function loadCatalog(): void {
	if (!isBrowser) return;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;
		const parsed = JSON.parse(raw) as Product[];
		if (Array.isArray(parsed) && parsed.length > 0) catalog.items = parsed;
	} catch {
		// Data rusak: abaikan, data default tetap dipakai
	}
}

if (isBrowser) loadCatalog();

export function addProduct(data: Omit<Product, 'id'>): Product {
	const id = catalog.items.reduce((max, p) => Math.max(max, p.id), 0) + 1;
	const item: Product = { ...data, id };
	catalog.items = [...catalog.items, item];
	persist();
	return item;
}

export function updateProduct(id: number, data: Omit<Product, 'id'>): void {
	catalog.items = catalog.items.map((p) => (p.id === id ? { ...data, id } : p));
	persist();
}

export function deleteProduct(id: number): void {
	catalog.items = catalog.items.filter((p) => p.id !== id);
	persist();
}

export function resetCatalog(): void {
	catalog.items = defaultProducts;
	if (isBrowser) {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			// abaikan
		}
	}
}

/** Dipakai saat kategori di-rename dari halaman admin: semua produk ikut pindah nama kategori. */
export function renameCategoryProducts(oldName: string, newName: string): void {
	if (oldName === newName) return;
	catalog.items = catalog.items.map((p) =>
		p.category === oldName ? { ...p, category: newName } : p
	);
	persist();
}

/** Jumlah produk dalam satu kategori. Dipakai tabel kategori admin. */
export function countByCategory(name: string): number {
	return catalog.items.filter((p) => p.category === name).length;
}

/** Daftar foto lokal yang bisa dipilih saat tambah/edit produk. */
export const LOCAL_IMAGES = [
	'/menu/menu-nineteen-frappe.jpg',
	'/menu/menu-lotus-frappe.jpg',
	'/menu/menu-vanilla-frappe.jpg',
	'/menu/menu-sharing-mandhi.jpg',
	'/menu/menu-chicken-blackpepper.jpg',
	'/menu/menu-mandhi-rice.jpg',
	'/menu/menu-chicken-sambal.jpg',
	'/menu/menu-chicken-honey.jpg',
	'/menu/menu-mie-grebek.jpg',
	'/menu/menu-mac-cheese.jpg',
	'/cafe/cafe-gate-siang.jpg',
	'/cafe/cafe-gate-industrial-pdf.jpg',
	'/cafe/cafe-outdoor-beton.jpg',
	'/cafe/cafe-night-ramai.jpg'
];
