import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { defaultSettings } from './seed-settings.js';
import { seedCategories, seedProducts } from './seed-data.js';

/**
 * Buka (atau buat) database SQLite + siapkan skema.
 * @param {string} [dbPath] default dari config. Pakai ':memory:' untuk testing.
 */
export function openDatabase(dbPath = config.dbPath) {
	if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });
	const db = new DatabaseSync(dbPath);
	db.exec('PRAGMA journal_mode = WAL;');
	db.exec('PRAGMA foreign_keys = ON;');
	db.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);
		CREATE TABLE IF NOT EXISTS categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT UNIQUE NOT NULL,
			position INTEGER NOT NULL DEFAULT 0
		);
		CREATE TABLE IF NOT EXISTS products (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			price INTEGER NOT NULL,
			image TEXT NOT NULL DEFAULT '',
			category TEXT NOT NULL,
			featured INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			updated_at TEXT NOT NULL DEFAULT (datetime('now'))
		);
		CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
		CREATE TABLE IF NOT EXISTS settings (
			id INTEGER PRIMARY KEY CHECK (id = 1),
			data TEXT NOT NULL,
			updated_at TEXT NOT NULL DEFAULT (datetime('now'))
		);
	`);
	return db;
}

export function rowToProduct(row) {
	if (!row) return null;
	return {
		id: row.id,
		name: row.name,
		description: row.description ?? '',
		price: row.price,
		image: row.image ?? '',
		category: row.category,
		featured: row.featured === 1
	};
}

/** Seed awal: admin + kategori + produk + settings. Idempotent kecuali reset=true. */
export function seedDatabase(db, { reset = false } = {}) {
	if (reset) {
		db.exec('DELETE FROM products; DELETE FROM categories; DELETE FROM settings; DELETE FROM users;');
	}

	const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
	if (userCount === 0) {
		const hash = bcrypt.hashSync(config.adminUsername === 'admin' ? config.adminPassword : config.adminPassword, 10);
		db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(
			config.adminUsername,
			hash
		);
	}

	const catCount = db.prepare('SELECT COUNT(*) AS n FROM categories').get().n;
	if (catCount === 0) {
		const insert = db.prepare('INSERT INTO categories (name, position) VALUES (?, ?)');
		seedCategories.forEach((name, i) => insert.run(name, i));
	}

	const prodCount = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
	if (prodCount === 0) {
		const insert = db.prepare(
			'INSERT INTO products (name, description, price, image, category, featured) VALUES (?, ?, ?, ?, ?, ?)'
		);
		for (const p of seedProducts) {
			insert.run(p.name, p.description ?? '', p.price, p.image ?? '', p.category, p.featured ? 1 : 0);
		}
	}

	const settingsCount = db.prepare('SELECT COUNT(*) AS n FROM settings WHERE id = 1').get().n;
	if (settingsCount === 0) {
		db.prepare('INSERT INTO settings (id, data) VALUES (1, ?)').run(JSON.stringify(defaultSettings));
	}
}

export function readSettings(db) {
	const row = db.prepare('SELECT data FROM settings WHERE id = 1').get();
	if (!row) return { ...defaultSettings };
	try {
		return { ...defaultSettings, ...JSON.parse(row.data) };
	} catch {
		return { ...defaultSettings };
	}
}

export function writeSettings(db, next) {
	const merged = { ...defaultSettings, ...next };
	db.prepare("UPDATE settings SET data = ?, updated_at = datetime('now') WHERE id = 1").run(
		JSON.stringify(merged)
	);
	return merged;
}
