import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { ah } from '../middleware/http.js';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.diskStorage({
	destination(_req, _file, cb) {
		fs.mkdirSync(config.uploadDir, { recursive: true });
		cb(null, config.uploadDir);
	},
	filename(_req, file, cb) {
		const ext = path.extname(file.originalname).toLowerCase();
		cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
	}
});

function fileFilter(_req, file, cb) {
	if (!ALLOWED.has(file.mimetype)) {
		const err = new Error('Tipe file harus JPG, PNG, atau WebP.');
		err.code = 'INVALID_FILE_TYPE';
		return cb(err);
	}
	return cb(null, true);
}

export function uploadRoutes() {
	const r = Router();
	const upload = multer({
		storage,
		fileFilter,
		limits: { fileSize: config.maxUploadBytes }
	});

	// Upload satu foto produk (admin). Form field: "image".
	r.post('/', requireAuth, upload.single('image'), (req, res) => {
		if (!req.file) return res.status(400).json({ error: 'File image wajib diisi.' });
		return res.status(201).json({ url: `/uploads/${req.file.filename}` });
	});

	r.delete(
		'/:filename',
		requireAuth,
		ah(async (req, res) => {
			const name = path.basename(req.params.filename);
			const target = path.join(config.uploadDir, name);
			try {
				await fs.promises.unlink(target);
			} catch (e) {
				if (e?.code === 'ENOENT') return res.status(404).json({ error: 'File tidak ditemukan.' });
				throw e;
			}
			return res.status(204).end();
		})
	);

	return r;
}
