import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';

// Isolasi: DB memory + folder upload sementara per run.
const tmpUpload = fs.mkdtempSync(path.join(os.tmpdir(), 'lyco-uploads-'));
process.env.UPLOAD_DIR = tmpUpload;
process.env.JWT_SECRET = 'test-secret-min-32-karakter-abcdef';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'lyco123';

const { createApp } = await import('../src/app.js');
let api;
let token;

before(() => {
	const { app } = createApp({ dbPath: ':memory:' });
	api = request(app);
});

after(() => {
	fs.rmSync(tmpUpload, { recursive: true, force: true });
});

describe('health & stats', () => {
	it('GET /api/health -> ok', async () => {
		const res = await api.get('/api/health');
		assert.equal(res.status, 200);
		assert.equal(res.body.ok, true);
	});

	it('GET /api/stats konsisten dengan seed (68 produk, 11 kategori)', async () => {
		const res = await api.get('/api/stats');
		assert.equal(res.status, 200);
		assert.equal(res.body.total, 68);
		assert.equal(res.body.kategori, 11);
	});
});

describe('auth', () => {
	it('login salah -> 401', async () => {
		const res = await api.post('/api/auth/login').send({ username: 'admin', password: 'salah' });
		assert.equal(res.status, 401);
	});

	it('login benar -> token', async () => {
		const res = await api.post('/api/auth/login').send({ username: 'admin', password: 'lyco123' });
		assert.equal(res.status, 200);
		assert.ok(res.body.token);
		token = res.body.token;
	});

	it('tanpa token akses POST produk -> 401', async () => {
		const res = await api.post('/api/products').send({
			name: 'X',
			price: 1000,
			category: 'Coffee',
			featured: false
		});
		assert.equal(res.status, 401);
	});
});

describe('products', () => {
	it('list default 68 item + filter kategori', async () => {
		const all = await api.get('/api/products?limit=200');
		assert.equal(all.body.total, 68);
		const coffee = await api.get('/api/products?category=Coffee');
		assert.ok(coffee.body.total > 0);
		assert.ok(coffee.body.items.every((p) => p.category === 'Coffee'));
	});

	it('CRUD produk dengan auth', async () => {
		const created = await api
			.post('/api/products')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Test Kopi', description: 'd', price: 15000, image: '/menu/x.jpg', category: 'Coffee', featured: true });
		assert.equal(created.status, 201);
		const id = created.body.id;

		const get = await api.get(`/api/products/${id}`);
		assert.equal(get.body.name, 'Test Kopi');

		const bad = await api
			.post('/api/products')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: '', price: -5, category: '' });
		assert.equal(bad.status, 400);

		const del = await api.delete(`/api/products/${id}`).set('Authorization', `Bearer ${token}`);
		assert.equal(del.status, 204);
	});
});

describe('categories', () => {
	it('tambah duplikat (case-insensitive) -> 409', async () => {
		const res = await api
			.post('/api/categories')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'coffee' });
		assert.equal(res.status, 409);
	});

	it('hapus kategori terpakai -> 409, rename pindahkan produk', async () => {
		const blocked = await api.delete('/api/categories/Coffee').set('Authorization', `Bearer ${token}`);
		assert.equal(blocked.status, 409);

		const added = await api
			.post('/api/categories')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Kopi Test' });
		assert.equal(added.status, 201);

		const renamed = await api
			.put('/api/categories/Kopi Test')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Kopi Test 2' });
		assert.equal(renamed.status, 200);
		assert.ok(renamed.body.items.some((c) => c.name === 'Kopi Test 2'));

		const gone = await api.delete('/api/categories/Kopi Test 2').set('Authorization', `Bearer ${token}`);
		assert.equal(gone.status, 200);
	});
});

describe('settings', () => {
	it('GET lalu PUT settings', async () => {
		const beforeRes = await api.get('/api/settings');
		assert.equal(beforeRes.status, 200);
		assert.ok(beforeRes.body.heroTitle);

		const updated = await api
			.put('/api/settings')
			.set('Authorization', `Bearer ${token}`)
			.send({ heroTitle: 'LYCO TEST' });
		assert.equal(updated.status, 200);
		assert.equal(updated.body.heroTitle, 'LYCO TEST');
	});
});
