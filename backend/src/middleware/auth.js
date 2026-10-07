import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function signToken(payload) {
	return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function requireAuth(req, res, next) {
	const header = req.headers.authorization ?? '';
	const [scheme, token] = header.split(' ');
	if (scheme !== 'Bearer' || !token) {
		return res.status(401).json({ error: 'Token admin wajib diisi (Authorization: Bearer <token>).' });
	}
	try {
		req.user = jwt.verify(token, config.jwtSecret);
		return next();
	} catch {
		return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa. Login ulang.' });
	}
}
