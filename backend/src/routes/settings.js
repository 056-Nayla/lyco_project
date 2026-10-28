import { Router } from 'express';
import { ah, validate } from '../middleware/http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { settingsSchema } from '../schemas.js';
import { readSettings, seedDatabase, writeSettings } from '../db.js';

export function settingsRoutes(db) {
	const r = Router();

	r.get(
		'/',
		ah(async (_req, res) => {
			return res.json(readSettings(db));
		})
	);

	r.put(
		'/',
		requireAuth, requireRole('superadmin'),
		validate(settingsSchema),
		ah(async (req, res) => {
			const merged = writeSettings(db, req.body);
			return res.json(merged);
		})
	);

	r.post(
		'/reset',
		requireAuth, requireRole('superadmin'),
		ah(async (_req, res) => {
			db.prepare('DELETE FROM settings WHERE id = 1').run();
			seedDatabase(db);
			return res.json(readSettings(db));
		})
	);

	return r;
}
