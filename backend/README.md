# Lyco Backend

REST API untuk Lyco Coffee and Place. Menggantikan `localStorage` di frontend
agar data menu/kategori/settings tersimpan permanen dan bisa dikelola multi-admin.

- Runtime: Node.js 22+ (pakai `node:sqlite` bawaan, tanpa server DB terpisah)
- Framework: Express 4 + Zod + JWT + bcrypt + Multer
- DB default: file SQLite `data/lyco.db` (diabaikan git). Untuk production
  disarankan Postgres — skema di `src/db.js` gampang diporting.

## Cara jalan

```sh
cd backend
cp .env.example .env   # di Windows: copy .env.example .env
npm install
npm run seed           # isi awal: 1 admin + 11 kategori + 68 produk + settings
npm run dev            # http://localhost:3001
```

Akun awal dari `.env`: `ADMIN_USERNAME` / `ADMIN_PASSWORD` (default `admin` / `lyco123`).

## Endpoint

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/api/health` | — | cek hidup |
| GET | `/api/stats` | — | total, kategori, unggulan, kosong (dipakai dashboard) |
| GET | `/api/images` | — | daftar URL image unik |
| POST | `/api/auth/login` | — | `{username, password}` → `{token}` |
| GET | `/api/auth/me` | admin | profil dari token |
| GET | `/api/products?category=&search=&featured=true&limit=100&offset=0` | — | list + `total` |
| GET | `/api/products/:id` | — | detail |
| POST | `/api/products` | admin | buat produk |
| PUT | `/api/products/:id` | admin | edit penuh |
| DELETE | `/api/products/:id` | admin | hapus |
| POST | `/api/products/reset` | admin | kembalikan ke seed |
| GET | `/api/categories` | — | `{items:[{name, productCount}]}` urut `position` |
| POST | `/api/categories` | admin | `{name}` |
| PUT | `/api/categories/reorder` | admin | `{order:[nama...]}` harus lengkap |
| PUT | `/api/categories/:name` | admin | rename + produk ikut pindah |
| DELETE | `/api/categories/:name` | admin | ditolak 409 kalau masih dipakai |
| POST | `/api/categories/reset` | admin | kembalikan ke seed |
| GET | `/api/settings` | — | settings landing page |
| PUT | `/api/settings` | admin | partial update |
| POST | `/api/settings/reset` | admin | kembalikan ke bawaan |
| POST | `/api/uploads` | admin | form `image` (JPG/PNG/WebP ≤ 2MB) → `{url}` |
| DELETE | `/api/uploads/:filename` | admin | hapus file upload |

Auth: header `Authorization: Bearer <token>`.

Contoh:

```sh
curl -s http://localhost:3001/api/health
curl -s "http://localhost:3001/api/products?category=Coffee&limit=5"
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"lyco123"}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).token))")
curl -s http://localhost:3001/api/stats
```

## Testing

```sh
npm test   # node:test + supertest, DB :memory:, upload ke folder temp
```

## Struktur

```
backend/
  src/index.js      # boot server
  src/app.js        # createApp({dbPath}) — dipakai server + test
  src/config.js     # baca .env
  src/db.js         # skema SQLite + seed + settings
  src/seed-data.js  # GENERATED dari frontend products.ts (68 produk)
  src/seed-settings.js
  src/seed.js       # CLI npm run seed
  src/schemas.js    # validasi Zod (samakan aturan frontend)
  src/middleware/   # JWT + validate + error handler
  src/routes/       # auth, products, categories, settings, uploads
  test/api.test.js
  data/             # lyco.db (gitignored)
  uploads/          # hasil upload (gitignored)
```

Regenerate seed: ubah `frontend/.../products.ts` lalu generate ulang
`src/seed-data.js` (lihat riwayat commit untuk skripnya) dan `npm run seed:reset`
di dev saja.
