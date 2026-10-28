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
process.env.SUPERADMIN_USERNAME = 'superadmin';
process.env.SUPERADMIN_PASSWORD = 'lyco-super-123';

const { createApp } = await import('../src/app.js');
let api;
let token;
let superToken;

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

	it('login benar -> token + role admin', async () => {
		const res = await api.post('/api/auth/login').send({ username: 'admin', password: 'lyco123' });
		assert.equal(res.status, 200);
		assert.ok(res.body.token);
		assert.equal(res.body.role, 'admin');
		token = res.body.token;
	});

	it('login superadmin -> role superadmin', async () => {
		const res = await api.post('/api/auth/login').send({ username: 'superadmin', password: 'lyco-super-123' });
		assert.equal(res.status, 200);
		assert.equal(res.body.role, 'superadmin');
		superToken = res.body.token;
	});

	it('admin biasa CRUD produk -> 403', async () => {
		const res = await api
			.post('/api/products')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'X', price: 1000, category: 'Coffee', featured: false });
		assert.equal(res.status, 403);
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
			.set('Authorization', `Bearer ${superToken}`)
			.send({ name: 'Test Kopi', description: 'd', price: 15000, image: '/menu/x.jpg', category: 'Coffee', featured: true });
		assert.equal(created.status, 201);
		const id = created.body.id;

		const get = await api.get(`/api/products/${id}`);
		assert.equal(get.body.name, 'Test Kopi');

		const bad = await api
			.post('/api/products')
			.set('Authorization', `Bearer ${superToken}`)
			.send({ name: '', price: -5, category: '' });
		assert.equal(bad.status, 400);

		const del = await api.delete(`/api/products/${id}`).set('Authorization', `Bearer ${superToken}`);
		assert.equal(del.status, 204);
	});
});

describe('categories', () => {
	it('tambah duplikat (case-insensitive) -> 409', async () => {
		const res = await api
			.post('/api/categories')
			.set('Authorization', `Bearer ${superToken}`)
			.send({ name: 'coffee' });
		assert.equal(res.status, 409);
	});

	it('hapus kategori terpakai -> 409, rename pindahkan produk', async () => {
		const blocked = await api.delete('/api/categories/Coffee').set('Authorization', `Bearer ${superToken}`);
		assert.equal(blocked.status, 409);

		const added = await api
			.post('/api/categories')
			.set('Authorization', `Bearer ${superToken}`)
			.send({ name: 'Kopi Test' });
		assert.equal(added.status, 201);

		const renamed = await api
			.put('/api/categories/Kopi Test')
			.set('Authorization', `Bearer ${superToken}`)
			.send({ name: 'Kopi Test 2' });
		assert.equal(renamed.status, 200);
		assert.ok(renamed.body.items.some((c) => c.name === 'Kopi Test 2'));

		const gone = await api.delete('/api/categories/Kopi Test 2').set('Authorization', `Bearer ${superToken}`);
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
			.set('Authorization', `Bearer ${superToken}`)
			.send({ heroTitle: 'LYCO TEST' });
		assert.equal(updated.status, 200);
		assert.equal(updated.body.heroTitle, 'LYCO TEST');
	});
});

describe('orders', () => {
	let orderId;
	let session = 'test-session-123';

	it('buat pesanan tanpa nama -> 400', async () => {
		const res = await api.post('/api/orders').send({
			buyer_name: '',
			buyer_session: session,
			items: [{ id: 1, name: 'X', price: 1, qty: 1 }]
		});
		assert.equal(res.status, 400);
	});

	it('buat pesanan valid -> 201 + total dari DB', async () => {
		const list = await api.get('/api/products?limit=200');
		const a = list.body.items[0];
		const b = list.body.items[4];
		const res = await api.post('/api/orders').send({
			buyer_name: 'Budi',
			buyer_session: session,
			table_no: 'A5',
			note: 'Es sedikit',
			items: [
				{ id: a.id, name: 'Coba Manipulasi', price: 1, qty: 2 },
				{ id: b.id, name: b.name, price: 1, qty: 1 }
			]
		});
		assert.equal(res.status, 201);
		assert.match(res.body.code, /^LYCO-[0-9A-F]{6}$/);
		assert.equal(res.body.status, 'baru');
		// harga harus dari DB, bukan dari client (price: 1 diabaikan)
		assert.equal(res.body.total, a.price * 2 + b.price);
		assert.equal(res.body.items[0].name, a.name);
		orderId = res.body.id;
	});

	it('mine mengembalikan pesanan sesi tsb', async () => {
		const res = await api.get(`/api/orders/mine?session=${session}`);
		assert.equal(res.status, 200);
		assert.ok(res.body.items.some((o) => o.id === orderId));
	});

	it('list admin tanpa token -> 401, dengan token -> 200', async () => {
		const anon = await api.get('/api/orders');
		assert.equal(anon.status, 401);
		const authed = await api
			.get('/api/orders')
			.set('Authorization', `Bearer ${token}`);
		assert.equal(authed.status, 200);
		assert.ok(authed.body.total >= 1);
	});

	it('ubah status -> diproses', async () => {
		const res = await api
			.patch(`/api/orders/${orderId}/status`)
			.set('Authorization', `Bearer ${token}`)
			.send({ status: 'diproses' });
		assert.equal(res.status, 200);
		assert.equal(res.body.status, 'diproses');

		const bad = await api
			.patch(`/api/orders/${orderId}/status`)
			.set('Authorization', `Bearer ${token}`)
			.send({ status: 'ngaco' });
		assert.equal(bad.status, 400);
	});
});

describe('tables', () => {
	it('list bawaan 8 meja', async () => {
		const res = await api.get('/api/tables');
		assert.equal(res.status, 200);
		assert.equal(res.body.items.length, 8);
		assert.ok(res.body.items.some((t) => t.code === '1'));
	});

	it('CRUD meja + validasi kode', async () => {
		const bad = await api
			.post('/api/tables')
			.set('Authorization', `Bearer ${superToken}`)
			.send({ code: 'A 5!' });
		assert.equal(bad.status, 400);

		const created = await api
			.post('/api/tables')
			.set('Authorization', `Bearer ${superToken}`)
			.send({ code: '9', name: 'Teras' });
		assert.equal(created.status, 201);
		assert.ok(created.body.items.some((t) => t.code === '9'));

		const dup = await api
			.post('/api/tables')
			.set('Authorization', `Bearer ${superToken}`)
			.send({ code: '9' });
		assert.equal(dup.status, 409);

		const renamed = await api
			.put('/api/tables/9')
			.set('Authorization', `Bearer ${superToken}`)
			.send({ code: '10' });
		assert.equal(renamed.status, 200);
		assert.ok(renamed.body.items.some((t) => t.code === '10'));

		const off = await api
			.put('/api/tables/10')
			.set('Authorization', `Bearer ${superToken}`)
			.send({ active: false });
		assert.equal(off.body.items.find((t) => t.code === '10').active, false);

		const gone = await api
			.delete('/api/tables/10')
			.set('Authorization', `Bearer ${superToken}`);
		assert.equal(gone.status, 200);
		assert.ok(!gone.body.items.some((t) => t.code === '10'));
	});

	it('hapus meja terpakai pesanan aktif -> 409', async () => {
		const created = await api.post('/api/orders').send({
			buyer_name: 'Meja Test',
			buyer_session: 'table-session-1',
			table_no: '1',
			items: [{ id: 1, name: 'X', price: 1, qty: 1 }]
		});
		assert.equal(created.status, 201);

		const blocked = await api
			.delete('/api/tables/1')
			.set('Authorization', `Bearer ${superToken}`);
		assert.equal(blocked.status, 409);

		await api
			.patch(`/api/orders/${created.body.id}/status`)
			.set('Authorization', `Bearer ${token}`)
			.send({ status: 'selesai' });

		const ok = await api
			.delete('/api/tables/1')
			.set('Authorization', `Bearer ${superToken}`);
		assert.equal(ok.status, 200);
	});
});
