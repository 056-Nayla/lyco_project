import crypto from 'node:crypto';
import { Router } from 'express';
import { ah, validate } from '../middleware/http.js';
import { requireAuth } from '../middleware/auth.js';
import {
	adminOrdersQuerySchema,
	createOrderSchema,
	mineOrdersQuerySchema,
	updateOrderStatusSchema
} from '../schemas.js';
import { config } from '../config.js';
import { rowToOrder } from '../db.js';
import { normalizePhone, sendOrderStatusWa } from '../wa.js';

function makeCode() {
	return `LYCO-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export function orderRoutes(db) {
	const r = Router();

	// Buat pesanan (publik — pembeli checkout dari keranjang).
	// Harga dihitung ulang dari DB agar tidak bisa dimanipulasi dari client.
	r.post(
		'/',
		validate(createOrderSchema),
		ah(async (req, res) => {
			const { buyer_name, buyer_session, buyer_phone, table_no, note, items } = req.body;
			const getPrice = db.prepare('SELECT price, name FROM products WHERE id = ?');
			const clean = items.map((it) => {
				const row = getPrice.get(it.id);
				return {
					id: it.id,
					name: row?.name ?? it.name,
					price: row ? row.price : it.price,
					qty: it.qty,
					image: it.image ?? '',
					category: ''
				};
			});
			const total = clean.reduce((n, it) => n + it.price * it.qty, 0);

			let code = makeCode();
			for (let i = 0; i < 5; i++) {
				const dup = db.prepare('SELECT id FROM orders WHERE code = ?').get(code);
				if (!dup) break;
				code = makeCode();
			}

			const phone = normalizePhone(buyer_phone ?? '');
			const info = db
				.prepare(
					'INSERT INTO orders (code, buyer_name, buyer_session, buyer_phone, table_no, note, items, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
				)
				.run(code, buyer_name, buyer_session, phone, table_no, note, JSON.stringify(clean), total, 'baru');
			const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(info.lastInsertRowid));
			return res.status(201).json(rowToOrder(row));
		})
	);

	// Pesanan milik satu sesi pembeli (publik — halaman "Pesanan Saya").
	// Ditaruh SEBELUM '/:id' agar tidak tertelan param.
	r.get(
		'/mine',
		validate(mineOrdersQuerySchema, 'query'),
		ah(async (req, res) => {
			const { session, limit } = req.query;
			const rows = db
				.prepare('SELECT * FROM orders WHERE buyer_session = ? ORDER BY id DESC LIMIT ?')
				.all(session, limit);
			return res.json({ items: rows.map(rowToOrder) });
		})
	);

	// Semua pesanan (admin — tab Pesanan).
	r.get(
		'/',
		requireAuth,
		validate(adminOrdersQuerySchema, 'query'),
		ah(async (req, res) => {
			const { status, limit, offset } = req.query;
			const where = status ? 'WHERE status = ?' : '';
			const args = status ? [status] : [];
			const total = db.prepare(`SELECT COUNT(*) AS n FROM orders ${where}`).get(...args).n;
			const rows = db
				.prepare(`SELECT * FROM orders ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
				.all(...args, limit, offset);
			return res.json({ total, items: rows.map(rowToOrder) });
		})
	);

	// Status konfigurasi WA gateway (admin — untuk banner peringatan di portal).
	r.get('/wa-config', requireAuth, (_req, res) => {
		return res.json({
			configured: Boolean(config.wa.apiKey),
			autoSend: config.wa.autoSend,
			apiUrl: config.wa.apiUrl
		});
	});

	// Ubah status pesanan (admin) + notif WA otomatis ke pelanggan
	// (diproses / selesai / batal) via gateway kalau WA_API_KEY terisi.
	r.patch(
		'/:id/status',
		requireAuth,
		validate(updateOrderStatusSchema),
		ah(async (req, res) => {
			const id = Number(req.params.id);
			if (!Number.isInteger(id) || id <= 0) {
				return res.status(400).json({ error: 'ID pesanan tidak valid.' });
			}
			const exists = db.prepare('SELECT id FROM orders WHERE id = ?').get(id);
			if (!exists) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
			db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(
				req.body.status,
				id
			);
			const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
			const order = rowToOrder(row);
			// Kirim WA otomatis hanya untuk status yang relevan; jangan blokir response terlalu lama.
			let wa = null;
			if (['diproses', 'selesai', 'batal'].includes(order.status)) {
				try {
					wa = await sendOrderStatusWa(order);
				} catch (e) {
					wa = { sent: false, to: normalizePhone(order.buyer_phone), error: String(e?.message ?? e) };
				}
			}
			return res.json({ ...order, wa });
		})
	);

	// Laporan penjualan minggu berjalan (admin — grafik + makanan terlaris).
	// Dihitung live dari DB setiap request (zona Asia/Jakarta) sehingga selalu update.
	// Hanya pesanan 'selesai' yang dihitung sebagai omzet.
	r.get(
		'/report/weekly',
		requireAuth,
		ah(async (_req, res) => {
			const rows = db
				.prepare(
					`SELECT created_at, items, total FROM orders
					 WHERE status = 'selesai' AND created_at >= datetime('now', '-14 days')`
				)
				.all();

			const fmtDay = new Intl.DateTimeFormat('en-CA', {
				timeZone: 'Asia/Jakarta',
				year: 'numeric',
				month: '2-digit',
				day: '2-digit'
			});
			const toKey = (d) => fmtDay.format(d); // YYYY-MM-DD (WIB)

			// Senin minggu berjalan (WIB): mundur dari hari ini sesuai nomor hari.
			const WEEKDAY_NUM = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
			const nowUtc = new Date();
			const weekdayShort = new Intl.DateTimeFormat('en-GB', {
				timeZone: 'Asia/Jakarta',
				weekday: 'short'
			}).format(nowUtc);
			const weekday = WEEKDAY_NUM[weekdayShort] ?? 7;
			const todayNoonWib = new Date(`${toKey(nowUtc)}T12:00:00+07:00`);
			const mondayNoon = new Date(todayNoonWib.getTime() - (weekday - 1) * 86400000);

			const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
			const days = Array.from({ length: 7 }, (_, i) => {
				const d = new Date(mondayNoon.getTime() + i * 86400000);
				return { date: toKey(d), label: DAY_LABELS[i], total: 0, count: 0 };
			});
			const byDate = new Map(days.map((d) => [d.date, d]));
			// Minggu lalu: 7 hari sebelum Senin minggu ini.
			let prevTotal = 0;
			let prevCount = 0;

			const top = new Map();
			for (const row of rows) {
				const at = new Date(String(row.created_at).replace(' ', 'T') + 'Z');
				if (Number.isNaN(at.getTime())) continue;
				const key = toKey(at);
				const slot = byDate.get(key);
				if (slot) {
					slot.total += row.total;
					slot.count += 1;
					let items = [];
					try {
						items = JSON.parse(row.items ?? '[]');
					} catch {
						items = [];
					}
					for (const it of items) {
						const cur = top.get(it.name) ?? { name: it.name, qty: 0, revenue: 0 };
						cur.qty += it.qty;
						cur.revenue += it.qty * it.price;
						top.set(it.name, cur);
					}
				} else {
					// Di luar minggu ini (maks. 14 hari ke belakang) → hitung sebagai minggu lalu.
					prevTotal += row.total;
					prevCount += 1;
				}
			}

			const weekTotal = days.reduce((n, d) => n + d.total, 0);
			const weekCount = days.reduce((n, d) => n + d.count, 0);
			const topItems = [...top.values()].sort((a, b) => b.qty - a.qty).slice(0, 10);

			return res.json({
				weekStart: days[0].date,
				weekEnd: days[6].date,
				days,
				weekTotal,
				weekCount,
				avgTicket: weekCount ? Math.round(weekTotal / weekCount) : 0,
				prevTotal,
				prevCount,
				topItems
			});
		})
	);

	return r;
}
