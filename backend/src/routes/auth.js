import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { ah, validate } from '../middleware/http.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { loginSchema } from '../schemas.js';

export function authRoutes(db) {
	const r = Router();

	r.post(
		'/login',
		validate(loginSchema),
		ah(async (req, res) => {
			const { username, password } = req.body;
			const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
			// Samakan waktu respons agar tidak bocor info user ada/tidak.
			const hash = user?.password_hash ?? '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
			const ok = await bcrypt.compare(password, hash);
			if (!user || !ok) {
				return res.status(401).json({ error: 'Username atau password salah.' });
			}
			const token = signToken({ sub: user.id, username: user.username });
			return res.json({ token, username: user.username });
		})
	);

	r.get('/me', requireAuth, (req, res) => {
		return res.json({ username: req.user.username });
	});

	return r;
}
