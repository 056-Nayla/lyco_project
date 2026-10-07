import { categoryOrder } from './products.js';

const STORAGE_KEY = 'lyco:categories:v1';
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export const defaultCategories: string[] = [...categoryOrder];

/** Daftar kategori reaktif: dipakai halaman menu & form produk agar hasil edit admin langsung tampil. */
export const categoriesState = $state<{ items: string[] }>({ items: [...defaultCategories] });

function persist(): void {
	if (!isBrowser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(categoriesState.items));
	} catch {
		// abaikan
	}
}

export function loadCategories(): void {
	if (!isBrowser) return;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;
		const parsed = JSON.parse(raw) as unknown;
		if (Array.isArray(parsed)) {
			const cleaned = parsed
				.filter((c): c is string => typeof c === 'string')
				.map((c) => c.trim())
				.filter((c) => c.length > 0);
			// buang duplikat (case-insensitive), pertahankan ejaan pertama
			const seen = new Set<string>();
			const unique: string[] = [];
			for (const c of cleaned) {
				const key = c.toLowerCase();
				if (!seen.has(key)) {
					seen.add(key);
					unique.push(c);
				}
			}
			if (unique.length > 0) categoriesState.items = unique;
		}
	} catch {
		// abaikan, pakai bawaan
	}
}

if (isBrowser) loadCategories();

export function addCategory(name: string): { ok: boolean; message?: string } {
	const trimmed = name.trim();
	if (!trimmed) return { ok: false, message: 'Nama kategori wajib diisi.' };
	const exists = categoriesState.items.some((c) => c.toLowerCase() === trimmed.toLowerCase());
	if (exists) return { ok: false, message: `Kategori "${trimmed}" sudah ada.` };
	categoriesState.items = [...categoriesState.items, trimmed];
	persist();
	return { ok: true };
}

export function renameCategory(oldName: string, newName: string): { ok: boolean; message?: string } {
	const trimmed = newName.trim();
	if (!trimmed) return { ok: false, message: 'Nama kategori wajib diisi.' };
	const idx = categoriesState.items.findIndex((c) => c === oldName);
	if (idx === -1) return { ok: false, message: 'Kategori tidak ditemukan.' };
	if (oldName.toLowerCase() !== trimmed.toLowerCase()) {
		const dup = categoriesState.items.some((c) => c.toLowerCase() === trimmed.toLowerCase());
		if (dup) return { ok: false, message: `Kategori "${trimmed}" sudah ada.` };
	}
	categoriesState.items = categoriesState.items.map((c, i) => (i === idx ? trimmed : c));
	persist();
	return { ok: true };
}

export function deleteCategory(name: string): void {
	categoriesState.items = categoriesState.items.filter((c) => c !== name);
	persist();
}

export function moveCategory(name: string, direction: -1 | 1): void {
	const idx = categoriesState.items.findIndex((c) => c === name);
	const target = idx + direction;
	if (idx === -1 || target < 0 || target >= categoriesState.items.length) return;
	const next = [...categoriesState.items];
	const [moved] = next.splice(idx, 1);
	next.splice(target, 0, moved);
	categoriesState.items = next;
	persist();
}

export function resetCategories(): void {
	categoriesState.items = [...defaultCategories];
	if (isBrowser) {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			// abaikan
		}
	}
}
