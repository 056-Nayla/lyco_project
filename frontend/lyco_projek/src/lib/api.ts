// Client HTTP untuk backend Lyco (Express, default http://localhost:3001).
// Semua halaman publik memakai GET tanpa auth (dengan fallback lokal).
// Halaman admin memakai token JWT via Authorization: Bearer.

import type { Product } from './data/products.js';
import type { SiteSettings } from './data/settingsStore.svelte.js';

const RAW_BASE =
	(import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:3001';

export const API_BASE = RAW_BASE.replace(/\/+$/, '');

const TOKEN_KEY = 'lyco:admin:token';
const USER_KEY = 'lyco:admin:user';
const LEGACY_AUTH_KEY = 'lyco:admin:auth';

function isBrowser(): boolean {
	return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
}

export function getToken(): string | null {
	if (!isBrowser()) return null;
	try {
		return sessionStorage.getItem(TOKEN_KEY);
	} catch {
		return null;
	}
}

export function setToken(token: string, username?: string): void {
	if (!isBrowser()) return;
	try {
		sessionStorage.setItem(TOKEN_KEY, token);
		if (username) sessionStorage.setItem(USER_KEY, username);
		// Tandai juga flag lama agar guard lama tetap lolos
		sessionStorage.setItem(LEGACY_AUTH_KEY, '1');
	} catch {
		// abaikan
	}
}

export function clearToken(): void {
	if (!isBrowser()) return;
	try {
		sessionStorage.removeItem(TOKEN_KEY);
		sessionStorage.removeItem(USER_KEY);
		sessionStorage.removeItem(LEGACY_AUTH_KEY);
	} catch {
		// abaikan
	}
}

export function getUsername(): string | null {
	if (!isBrowser()) return null;
	try {
		return sessionStorage.getItem(USER_KEY);
	} catch {
		return null;
	}
}

/** Auth header untuk request admin. */
export function authHeaders(token?: string): Record<string, string> {
	const t = token ?? getToken();
	return t ? { Authorization: `Bearer ${t}` } : {};
}

/**
 * Ubah path image dari DB menjadi URL yang bisa dibuka browser.
 * - http(s)/data:/blob: dipakai apa adanya
 * - /uploads/xxx (file upload backend) -> http://localhost:3001/uploads/xxx
 * - /menu/..., /cafe/... (static frontend) -> dipakai apa adanya
 */
export function resolveImage(src: string): string {
	if (!src) return src;
	const s = src.trim();
	if (!s) return s;
	if (/^(https?:|data:|blob:)/i.test(s)) return s;
	if (s.startsWith('/uploads/')) return `${API_BASE}${s}`;
	return s;
}

export class ApiError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
	const headers: Record<string, string> = { ...(init.headers as Record<string, string> | undefined) };
	const hasBody = init.body !== undefined && init.body !== null;
	if (hasBody && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
	// Otomatis sertakan token admin kalau ada (kecuali caller sudah set Authorization)
	if (!headers['Authorization']) {
		const t = getToken();
		if (t) headers['Authorization'] = `Bearer ${t}`;
	}
	let res: Response;
	try {
		res = await fetch(`${API_BASE}${path}`, { ...init, headers });
	} catch {
		throw new ApiError('Backend tidak bisa dihubungi. Periksa npm run dev di folder backend.', 0);
	}
	if (res.status === 204) return null as T;
	let body: unknown = null;
	try {
		body = await res.json();
	} catch {
		body = null;
	}
	if (!res.ok) {
		const msg =
			(body as { error?: string } | null)?.error ??
			`Request gagal (HTTP ${res.status}).`;
		throw new ApiError(msg, res.status);
	}
	return body as T;
}

/** POST FormData (upload file). Jangan set Content-Type manual. */
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
	const headers: Record<string, string> = {};
	const t = getToken();
	if (t) headers['Authorization'] = `Bearer ${t}`;
	let res: Response;
	try {
		res = await fetch(`${API_BASE}${path}`, { method: 'POST', body: form, headers });
	} catch {
		throw new ApiError('Backend tidak bisa dihubungi saat upload.', 0);
	}
	let body: unknown = null;
	try {
		body = await res.json();
	} catch {
		body = null;
	}
	if (!res.ok) {
		const msg =
			(body as { error?: string } | null)?.error ?? `Upload gagal (HTTP ${res.status}).`;
		throw new ApiError(msg, res.status);
	}
	return body as T;
}

// ── Tipe balikan backend ──────────────────────────────────────────────
export type ProductsResponse = { total: number; items: Product[] };
export type CategoriesResponse = { items: { name: string; productCount: number }[] };

// ── Publik (tanpa auth) ─────────────────────────────────────────────
export type ProductQuery = {
	category?: string;
	search?: string;
	featured?: boolean;
	limit?: number;
	offset?: number;
};

/** Rangkai query GET /api/products dengan encode yang benar (limit max 200). */
export function buildProductQuery(q: ProductQuery = {}): string {
	const params = new URLSearchParams();
	if (q.category && q.category !== 'Semua') params.set('category', q.category);
	if (q.search?.trim()) params.set('search', q.search.trim());
	if (q.featured !== undefined) params.set('featured', q.featured ? 'true' : 'false');
	params.set('limit', String(Math.min(Math.max(q.limit ?? 12, 1), 200)));
	params.set('offset', String(Math.max(q.offset ?? 0, 0)));
	return `?${params.toString()}`;
}

export const getProducts = (q: ProductQuery = {}) =>
	api<ProductsResponse>(`/api/products${buildProductQuery(q)}`);
export const getCategories = () => api<CategoriesResponse>('/api/categories');
export const getSettings = () => api<SiteSettings>('/api/settings');
export const getStats = () =>
	api<{ total: number; kategori: number; unggulan: number; kosong: number }>('/api/stats');
export const login = (username: string, password: string) =>
	api<{ token: string; username: string }>('/api/auth/login', {
		method: 'POST',
		body: JSON.stringify({ username, password })
	});

// ── Admin: produk ───────────────────────────────────────────────────
export type ProductInput = Omit<Product, 'id'>;

export const createProduct = (data: ProductInput) =>
	api<Product>('/api/products', { method: 'POST', body: JSON.stringify(data) });
export const updateProductApi = (id: number, data: ProductInput) =>
	api<Product>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProductApi = (id: number) =>
	api<null>(`/api/products/${id}`, { method: 'DELETE' });
export const resetProductsApi = () => api<{ ok: boolean; total: number }>('/api/products/reset', { method: 'POST' });

// ── Admin: kategori ─────────────────────────────────────────────────
export const createCategoryApi = (name: string) =>
	api<CategoriesResponse>('/api/categories', {
		method: 'POST',
		body: JSON.stringify({ name })
	});
export const renameCategoryApi = (oldName: string, name: string) =>
	api<CategoriesResponse>(`/api/categories/${encodeURIComponent(oldName)}`, {
		method: 'PUT',
		body: JSON.stringify({ name })
	});
export const reorderCategoriesApi = (order: string[]) =>
	api<CategoriesResponse>('/api/categories/reorder', {
		method: 'PUT',
		body: JSON.stringify({ order })
	});
export const deleteCategoryApi = (name: string) =>
	api<CategoriesResponse>(`/api/categories/${encodeURIComponent(name)}`, { method: 'DELETE' });
export const resetCategoriesApi = () =>
	api<CategoriesResponse>('/api/categories/reset', { method: 'POST' });

// ── Admin: settings ─────────────────────────────────────────────────
export const updateSettingsApi = (partial: Partial<SiteSettings>) =>
	api<SiteSettings>('/api/settings', { method: 'PUT', body: JSON.stringify(partial) });
export const resetSettingsApi = () => api<SiteSettings>('/api/settings/reset', { method: 'POST' });

// ── Admin: upload ───────────────────────────────────────────────────
export const uploadImageApi = (file: File) => {
	const form = new FormData();
	form.append('image', file);
	return apiUpload<{ url: string }>('/api/uploads', form);
};

// ── Pesanan (sesi pembeli antar pengguna) ───────────────────────────
export type OrderStatus = 'baru' | 'diproses' | 'selesai' | 'batal';
export type OrderItemInput = {
	id: number;
	name: string;
	price: number;
	qty: number;
	image?: string;
	category?: string;
};
export type Order = {
	id: number;
	code: string;
	buyer_name: string;
	buyer_session: string;
	table_no: string;
	note: string;
	items: (OrderItemInput & { price: number; qty: number })[];
	total: number;
	status: OrderStatus;
	created_at: string;
	updated_at: string;
};
export type CreateOrderInput = {
	buyer_name: string;
	buyer_session: string;
	table_no?: string;
	note?: string;
	items: OrderItemInput[];
};

/** Buat pesanan baru (publik — checkout keranjang). Total dihitung ulang server. */
export const createOrder = (data: CreateOrderInput) =>
	api<Order>('/api/orders', { method: 'POST', body: JSON.stringify(data) });

/** Pesanan milik satu sesi pembeli (publik — halaman "Pesanan Saya"). */
export const getMyOrders = (session: string, limit = 20) =>
	api<{ items: Order[] }>(
		`/api/orders/mine?session=${encodeURIComponent(session)}&limit=${limit}`
	);

/** Semua pesanan (admin). */
export const getAllOrders = (status?: OrderStatus) =>
	api<{ total: number; items: Order[] }>(`/api/orders${status ? `?status=${status}` : ''}`);

/** Ubah status pesanan (admin). */
export const setOrderStatus = (id: number, status: OrderStatus) =>
	api<Order>(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

/** Detail satu produk (halaman detail). */
export const getProductById = (id: number) => api<Product>(`/api/products/${id}`);

// ── Meja & QR ───────────────────────────────────────────────────────
export type TableInfo = { code: string; name: string; active: boolean };

/** Daftar meja (publik). */
export const getTables = () => api<{ items: TableInfo[] }>('/api/tables');

/** Tambah meja (admin). */
export const createTableApi = (code: string, name = '') =>
	api<{ items: TableInfo[] }>('/api/tables', {
		method: 'POST',
		body: JSON.stringify({ code, name })
	});

/** Ubah meja: rename / nama / aktif (admin). */
export const updateTableApi = (
	code: string,
	patch: { code?: string; name?: string; active?: boolean }
) =>
	api<{ items: TableInfo[] }>(`/api/tables/${encodeURIComponent(code)}`, {
		method: 'PUT',
		body: JSON.stringify(patch)
	});

/** Urutan tampil meja (admin). */
export const reorderTablesApi = (order: string[]) =>
	api<{ items: TableInfo[] }>('/api/tables/reorder', {
		method: 'PUT',
		body: JSON.stringify({ order })
	});

/** Hapus meja (admin, 409 kalau masih dipakai pesanan aktif). */
export const deleteTableApi = (code: string) =>
	api<{ items: TableInfo[] }>(`/api/tables/${encodeURIComponent(code)}`, { method: 'DELETE' });

/** Reset meja ke bawaan (admin). */
export const resetTablesApi = () => api<{ items: TableInfo[] }>('/api/tables/reset', { method: 'POST' });
