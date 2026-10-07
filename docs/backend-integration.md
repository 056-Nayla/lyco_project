# Integrasi Backend → Frontend

Backend: `backend/` (Express + SQLite, port 3001). Frontend saat ini masih
`localStorage` (`productsStore`, `categoriesStore`, `settingsStore`).
Dokumen ini cara migrasi bertahap tanpa merusak halaman yang sudah jalan.

## 1. Jalankan keduanya

```sh
# terminal 1
cd backend && npm install && npm run seed && npm run dev
# terminal 2
cd frontend/lyco_projek && npm install && npm run dev -- --open
```

Frontend di `http://localhost:5173`, API di `http://localhost:3001/api`.

## 2. Client API (tambah file baru di frontend)

Buat `src/lib/api.ts`:

```ts
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export async function api(path: string, init: RequestInit = {}) {
	const res = await fetch(`${BASE}${path}`, {
		...init,
		headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) }
	});
	if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
	if (res.status === 204) return null;
	return res.json();
}

export const getProducts = (q = '') => api(`/api/products?limit=200${q}`);
export const getCategories = () => api('/api/categories');
export const getSettings = () => api('/api/settings');
export const login = (username: string, password: string) =>
	api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

export function authHeaders(token: string) {
	return { Authorization: `Bearer ${token}` };
}
```

Lalu `.env` di `frontend/lyco_projek/`:

```
VITE_API_URL=http://localhost:3001
```

## 3. Strategi migrasi (disarankan: baca dulu, tulis belakangan)

1. Halaman publik (`menu`, landing): ganti isi awal store dari `fetch`
   `GET /api/products` + `GET /api/categories` + `GET /api/settings`,
   fallback ke data lokal kalau API mati.
2. Halaman admin: simpan token dari `POST /api/auth/login` ke
   `sessionStorage`, kirim via `Authorization: Bearer`.
   Ganti `addProduct/updateProduct/deleteProduct` → `POST/PUT/DELETE /api/products`.
   Aturan validasi sudah sama (Zod di backend ≈ cek manual di admin).
3. Upload foto: `POST /api/uploads` (form `image`) → pakai `url` balikan
   sebagai `image` produk. Foto bawaan tetap di `static/` frontend.
4. Setelah stabil, hapus `localStorage` persist agar tidak konflik dengan DB.

## 4. Perilaku yang sudah disamakan

- Rename kategori memindahkan produk (`PUT /api/categories/:name`).
- Hapus kategori ditolak 409 kalau masih dipakai produk.
- `GET /api/stats` = angka dashboard admin (total, kategori, unggulan, kosong).
- `POST */reset` = tombol "Reset ke Bawaan" di admin.
