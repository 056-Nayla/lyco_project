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
import { rowToOrder } from '../db.js';

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
			const { buyer_name, buyer_session, table_no, note, items } = req.body;
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

			const info = db
				.prepare(
					'INSERT INTO orders (code, buyer_name, buyer_session, table_no, note, items, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
				)
				.run(code, buyer_name, buyer_session, table_no, note, JSON.stringify(clean), total, 'baru');
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

	// Ubah status pesanan (admin).
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
			return res.json(rowToOrder(row));
		})
	);

	return r;
}
