// Meja dine-in: daftar dari backend + meja aktif hasil scan QR
// (`/menu?meja=A5`) yang otomatis terisi di form checkout.

import { getTables, type TableInfo } from '#lib/api.js';

const TABLE_KEY = 'lyco:table:v1';
const QR_BASE_KEY = 'lyco:qr:base';
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

/** Daftar meja dari backend (untuk admin + validasi). */
export const tablesState = $state<{ items: TableInfo[] }>({ items: [] });

/** Meja yang sedang dipakai pengunjung (hasil scan QR / pilih manual). */
export const dineIn = $state<{ code: string }>({ code: '' });

export function loadTableChoice(): void {
	if (!isBrowser) return;
	try {
		dineIn.code = localStorage.getItem(TABLE_KEY) ?? '';
	} catch {
		dineIn.code = '';
	}
}

if (isBrowser) loadTableChoice();

export function setTables(items: TableInfo[]): void {
	tablesState.items = items;
}

/** Kode meja → link pemesanan penuh (isi QR). */
export function tableLink(code: string, base?: string): string {
	const b = (base ?? getQrBase()).replace(/\/+$/, '');
	return `${b}/menu?meja=${encodeURIComponent(code)}`;
}

export function setTableChoice(code: string): void {
	dineIn.code = code.trim();
	if (!isBrowser) return;
	try {
		if (dineIn.code) localStorage.setItem(TABLE_KEY, dineIn.code);
		else localStorage.removeItem(TABLE_KEY);
	} catch {
		// abaikan
	}
}

export function clearTableChoice(): void {
	setTableChoice('');
}

/** Basis URL untuk QR (default origin saat ini; bisa diubah di admin untuk cetak). */
export function getQrBase(): string {
	if (!isBrowser) return '';
	try {
		return localStorage.getItem(QR_BASE_KEY) || window.location.origin;
	} catch {
		return typeof window !== 'undefined' ? window.location.origin : '';
	}
}

export function setQrBase(url: string): void {
	if (!isBrowser) return;
	try {
		localStorage.setItem(QR_BASE_KEY, url.trim().replace(/\/+$/, ''));
	} catch {
		// abaikan
	}
}

/** Ambil daftar meja dari backend (fallback: biarkan apa adanya). */
export async function refreshTables(): Promise<boolean> {
	try {
		const res = await getTables();
		setTables(res.items);
		return true;
	} catch {
		return false;
	}
}
