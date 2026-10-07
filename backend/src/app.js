import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import morgan from 'morgan';
import { config } from './config.js';
import { openDatabase, rowToProduct, seedDatabase } from './db.js';
import { errorHandler } from './middleware/http.js';
import { authRoutes } from './routes/auth.js';
import { categoryRoutes } from './routes/categories.js';
import { productRoutes } from './routes/products.js';
import { settingsRoutes } from './routes/settings.js';
import { uploadRoutes } from './routes/uploads.js';

/** Bikin app Express. dbPath opsional — test memakai ':memory:'. */
export function createApp({ dbPath } = {}) {
	const db = openDatabase(dbPath ?? config.dbPath);
	seedDatabase(db);
	fs.mkdirSync(config.uploadDir, { recursive: true });

	const app = express();
	app.disable('x-powered-by');
	app.use(morgan('dev'));
	app.use(cors({ origin: config.corsOrigin }));
	app.use(express.json({ limit: '1mb' }));
	app.use('/uploads', express.static(config.uploadDir));

	app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'lyco-backend' }));

	app.get('/api/stats', (_req, res) => {
		const total = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
		const kategori = db.prepare('SELECT COUNT(*) AS n FROM categories').get().n;
		const unggulan = db.prepare('SELECT COUNT(*) AS n FROM products WHERE featured = 1').get().n;
		const kosong = db
			.prepare(
				'SELECT COUNT(*) AS n FROM categories c WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.category = c.name)'
			)
			.get().n;
		res.json({ total, kategori, unggulan, kosong });
	});

	// Daftar foto lokal bawaan (samakan LOCAL_IMAGES di frontend agar dropdown admin konsisten).
	app.get('/api/images', (_req, res) => {
		const rows = db.prepare('SELECT DISTINCT image FROM products ORDER BY image ASC').all();
		res.json({ items: rows.map((r) => r.image).filter(Boolean) });
	});

	app.use('/api/auth', authRoutes(db));
	app.use('/api/products', productRoutes(db));
	app.use('/api/categories', categoryRoutes(db));
	app.use('/api/settings', settingsRoutes(db));
	app.use('/api/uploads', uploadRoutes());

	app.use((_req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan.' }));
	app.use(errorHandler);

	return { app, db };
}
