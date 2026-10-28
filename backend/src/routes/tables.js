import { Router } from 'express';
import { ah, validate } from '../middleware/http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
	createTableSchema,
	reorderTablesSchema,
	updateTableSchema
} from '../schemas.js';
import { rowToTable } from '../db.js';

function listTables(db) {
	const rows = db.prepare('SELECT * FROM tables ORDER BY position ASC, id ASC').all();
	// Nama pelanggan yang sedang memakai tiap meja (pesanan aktif: baru/diproses).
	// Terbaru per table_no; tanpa pesanan aktif → occupant null (meja kosong).
	let active = [];
	try {
		active = db
			.prepare(
				`SELECT table_no, buyer_name, code, status FROM orders
				 WHERE status IN ('baru', 'diproses') AND table_no <> ''
				 ORDER BY id DESC`
			)
			.all();
	} catch {
		active = [];
	}
	const occupantByTable = new Map();
	for (const o of active) {
		if (!occupantByTable.has(o.table_no)) {
			occupantByTable.set(o.table_no, { name: o.buyer_name, code: o.code, status: o.status });
		}
	}
	return rows.map((t) => ({ ...rowToTable(t), occupant: occupantByTable.get(t.code) ?? null }));
}

export function tableRoutes(db) {
	const r = Router();

	// Daftar meja (publik — dipakai halaman menu untuk validasi ?meja=).
	r.get(
		'/',
		ah(async (_req, res) => {
			return res.json({ items: listTables(db) });
		})
	);

	r.post(
		'/',
		requireAuth, requireRole('superadmin'),
		validate(createTableSchema),
		ah(async (req, res) => {
			const code = req.body.code.trim();
			const dup = db
				.prepare('SELECT id FROM tables WHERE lower(code) = lower(?)')
				.get(code);
			if (dup) return res.status(409).json({ error: `Meja "${code}" sudah ada.` });
			const max = db.prepare('SELECT COALESCE(MAX(position), -1) AS m FROM tables').get().m;
			db.prepare('INSERT INTO tables (code, name, position) VALUES (?, ?, ?)').run(
				code,
				req.body.name ?? '',
				max + 1
			);
			return res.status(201).json({ items: listTables(db) });
		})
	);

	// Urutan tampil. Ditaruh SEBELUM '/:code' agar tidak tertelan param.
	r.put(
		'/reorder',
		requireAuth, requireRole('superadmin'),
		validate(reorderTablesSchema),
		ah(async (req, res) => {
			const order = [...new Set(req.body.order.map((s) => s.trim()).filter(Boolean))];
			const existing = db.prepare('SELECT code FROM tables').all().map((t) => t.code);
			if (order.length !== existing.length || !order.every((c) => existing.includes(c))) {
				return res
					.status(400)
					.json({ error: 'Urutan harus memuat semua meja yang ada, tanpa duplikat.' });
			}
			const stmt = db.prepare('UPDATE tables SET position = ? WHERE code = ?');
			order.forEach((code, i) => stmt.run(i, code));
			return res.json({ items: listTables(db) });
		})
	);

	r.put(
		'/:code',
		requireAuth, requireRole('superadmin'),
		validate(updateTableSchema),
		ah(async (req, res) => {
			const oldCode = req.params.code;
			const row = db.prepare('SELECT * FROM tables WHERE code = ?').get(oldCode);
			if (!row) return res.status(404).json({ error: 'Meja tidak ditemukan.' });
			const next = {
				code: req.body.code !== undefined ? req.body.code.trim() : row.code,
				name: req.body.name !== undefined ? req.body.name.trim() : row.name,
				active: req.body.active !== undefined ? (req.body.active ? 1 : 0) : row.active
			};
			if (next.code.toLowerCase() !== row.code.toLowerCase()) {
				const dup = db
					.prepare('SELECT id FROM tables WHERE lower(code) = lower(?)')
					.get(next.code);
				if (dup) return res.status(409).json({ error: `Meja "${next.code}" sudah ada.` });
			}
			db.prepare('UPDATE tables SET code = ?, name = ?, active = ? WHERE code = ?').run(
				next.code,
				next.name,
				next.active,
				oldCode
			);
			return res.json({ items: listTables(db) });
		})
	);

	r.delete(
		'/:code',
		requireAuth, requireRole('superadmin'),
		ah(async (req, res) => {
			const code = req.params.code;
			const row = db.prepare('SELECT id FROM tables WHERE code = ?').get(code);
			if (!row) return res.status(404).json({ error: 'Meja tidak ditemukan.' });
			const open = db
				.prepare("SELECT COUNT(*) AS n FROM orders WHERE table_no = ? AND status IN ('baru', 'diproses')")
				.get(code).n;
			if (open > 0) {
				return res.status(409).json({
					error: `Meja "${code}" masih dipakai ${open} pesanan aktif. Selesaikan/batalkan dulu.`
				});
			}
			db.prepare('DELETE FROM tables WHERE code = ?').run(code);
			return res.json({ items: listTables(db) });
		})
	);

	r.post(
		'/reset',
		requireAuth, requireRole('superadmin'),
		ah(async (_req, res) => {
			const { DEFAULT_TABLES } = await import('../db.js');
			db.prepare('DELETE FROM tables').run();
			const insert = db.prepare('INSERT INTO tables (code, position) VALUES (?, ?)');
			DEFAULT_TABLES.forEach((code, i) => insert.run(code, i));
			return res.json({ items: listTables(db) });
		})
	);

	return r;
}
