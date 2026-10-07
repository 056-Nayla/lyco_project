import { Router } from 'express';
import { ah, validate } from '../middleware/http.js';
import { requireAuth } from '../middleware/auth.js';
import { categorySchema, renameCategorySchema, reorderCategoriesSchema } from '../schemas.js';
import { seedDatabase } from '../db.js';

function listCategories(db) {
	const cats = db.prepare('SELECT name FROM categories ORDER BY position ASC, id ASC').all();
	const counts = db
		.prepare('SELECT category AS name, COUNT(*) AS n FROM products GROUP BY category')
		.all();
	const countBy = new Map(counts.map((c) => [c.name, c.n]));
	return cats.map((c) => ({ name: c.name, productCount: countBy.get(c.name) ?? 0 }));
}

export function categoryRoutes(db) {
	const r = Router();

	r.get(
		'/',
		ah(async (_req, res) => {
			return res.json({ items: listCategories(db) });
		})
	);

	r.post(
		'/',
		requireAuth,
		validate(categorySchema),
		ah(async (req, res) => {
			const name = req.body.name.trim();
			const dup = db
				.prepare('SELECT id FROM categories WHERE lower(name) = lower(?)')
				.get(name);
			if (dup) return res.status(409).json({ error: `Kategori "${name}" sudah ada.` });
			const max = db.prepare('SELECT COALESCE(MAX(position), -1) AS m FROM categories').get().m;
			db.prepare('INSERT INTO categories (name, position) VALUES (?, ?)').run(name, max + 1);
			return res.status(201).json({ items: listCategories(db) });
		})
	);

	// Urutan drag ala tombol naik/turun di admin. PUT /api/categories/reorder
	// Ditaruh SEBELUM '/:name' agar tidak tertelan param.
	r.put(
		'/reorder',
		requireAuth,
		validate(reorderCategoriesSchema),
		ah(async (req, res) => {
			const order = [...new Set(req.body.order.map((s) => s.trim()).filter(Boolean))];
			const existing = db.prepare('SELECT name FROM categories').all().map((c) => c.name);
			if (order.length !== existing.length || !order.every((n) => existing.includes(n))) {
				return res
					.status(400)
					.json({ error: 'Urutan harus memuat semua kategori yang ada, tanpa duplikat.' });
			}
			const stmt = db.prepare('UPDATE categories SET position = ? WHERE name = ?');
			order.forEach((name, i) => stmt.run(i, name));
			return res.json({ items: listCategories(db) });
		})
	);

	r.put(
		'/:name',
		requireAuth,
		validate(renameCategorySchema),
		ah(async (req, res) => {
			const oldName = req.params.name;
			const newName = req.body.name.trim();
			const row = db.prepare('SELECT id FROM categories WHERE name = ?').get(oldName);
			if (!row) return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
			if (oldName.toLowerCase() !== newName.toLowerCase()) {
				const dup = db
					.prepare('SELECT id FROM categories WHERE lower(name) = lower(?)')
					.get(newName);
				if (dup) return res.status(409).json({ error: `Kategori "${newName}" sudah ada.` });
			}
			db.prepare('UPDATE categories SET name = ? WHERE name = ?').run(newName, oldName);
			// Produk ikut pindah nama (samakan perilaku renameCategoryProducts di frontend).
			db.prepare('UPDATE products SET category = ? WHERE category = ?').run(newName, oldName);
			return res.json({ items: listCategories(db) });
		})
	);

	r.delete(
		'/:name',
		requireAuth,
		ah(async (req, res) => {
			const name = req.params.name;
			const row = db.prepare('SELECT id FROM categories WHERE name = ?').get(name);
			if (!row) return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
			const used = db
				.prepare('SELECT COUNT(*) AS n FROM products WHERE category = ?')
				.get(name).n;
			if (used > 0) {
				return res.status(409).json({
					error: `Kategori "${name}" masih dipakai ${used} produk. Pindahkan/hapus produknya dulu.`
				});
			}
			db.prepare('DELETE FROM categories WHERE name = ?').run(name);
			return res.json({ items: listCategories(db) });
		})
	);

	r.post(
		'/reset',
		requireAuth,
		ah(async (_req, res) => {
			db.exec('DELETE FROM products; DELETE FROM categories;');
			seedDatabase(db);
			return res.json({ items: listCategories(db) });
		})
	);

	return r;
}
