import { Router } from 'express';
import { ah, validate } from '../middleware/http.js';
import { requireAuth } from '../middleware/auth.js';
import { idParamSchema, productQuerySchema, productSchema } from '../schemas.js';
import { rowToProduct, seedDatabase } from '../db.js';

export function productRoutes(db) {
	const r = Router();

	r.get(
		'/',
		validate(productQuerySchema, 'query'),
		ah(async (req, res) => {
			const { category, search, featured, limit, offset } = req.query;
			const where = [];
			const args = [];
			if (category) {
				where.push('category = ?');
				args.push(category);
			}
			if (featured !== undefined) {
				where.push('featured = ?');
				args.push(featured === 'true' ? 1 : 0);
			}
			if (search) {
				where.push('(name LIKE ? OR description LIKE ?)');
				args.push(`%${search}%`, `%${search}%`);
			}
			const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
			const total = db.prepare(`SELECT COUNT(*) AS n FROM products ${clause}`).get(...args).n;
			const rows = db
				.prepare(`SELECT * FROM products ${clause} ORDER BY id ASC LIMIT ? OFFSET ?`)
				.all(...args, limit, offset);
			return res.json({ total, items: rows.map(rowToProduct) });
		})
	);

	r.get(
		'/:id',
		validate(idParamSchema, 'params'),
		ah(async (req, res) => {
			const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
			if (!row) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
			return res.json(rowToProduct(row));
		})
	);

	r.post(
		'/',
		requireAuth,
		validate(productSchema),
		ah(async (req, res) => {
			const p = req.body;
			const info = db
				.prepare(
					'INSERT INTO products (name, description, price, image, category, featured) VALUES (?, ?, ?, ?, ?, ?)'
				)
				.run(p.name, p.description, p.price, p.image, p.category, p.featured ? 1 : 0);
			const row = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(info.lastInsertRowid));
			return res.status(201).json(rowToProduct(row));
		})
	);

	r.put(
		'/:id',
		requireAuth,
		validate(idParamSchema, 'params'),
		validate(productSchema),
		ah(async (req, res) => {
			const exists = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
			if (!exists) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
			const p = req.body;
			db.prepare(
				"UPDATE products SET name = ?, description = ?, price = ?, image = ?, category = ?, featured = ?, updated_at = datetime('now') WHERE id = ?"
			).run(p.name, p.description, p.price, p.image, p.category, p.featured ? 1 : 0, req.params.id);
			const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
			return res.json(rowToProduct(row));
		})
	);

	r.delete(
		'/:id',
		requireAuth,
		validate(idParamSchema, 'params'),
		ah(async (req, res) => {
			const info = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
			if (info.changes === 0) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
			return res.status(204).end();
		})
	);

	// Kembalikan katalog ke bawaan seed (dipakai tombol "Reset ke Bawaan" di admin).
	r.post(
		'/reset',
		requireAuth,
		ah(async (_req, res) => {
			db.exec('DELETE FROM products; DELETE FROM categories;');
			seedDatabase(db);
			const total = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
			return res.json({ ok: true, total });
		})
	);

	return r;
}
