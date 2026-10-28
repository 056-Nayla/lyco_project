// Gerbang login pelanggan (Nama + No. WA, tanpa password).
// Wajib lolos sebelum bisa melihat portal pelanggan (home, menu, pesanan).
// Rute /admin dikecualikan — punya login sendiri.

const KEY = 'lyco:customer:auth';
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export type Customer = { name: string; phone: string };

export const customerAuth = $state<{ customer: Customer | null; ready: boolean }>({
	customer: null,
	ready: false
});

/** Normalisasi nomor WA ke format 62xxx. '' = tidak valid. */
export function normalizeCustomerPhone(raw: string): string {
	const d = (raw ?? '').replace(/\D/g, '');
	if (!d) return '';
	if (d.startsWith('0')) return `62${d.slice(1)}`;
	if (d.startsWith('8')) return `62${d}`;
	return d;
}

export function isValidCustomerPhone(raw: string): boolean {
	const d = normalizeCustomerPhone(raw);
	return d.length >= 9 && d.length <= 15;
}

/** Baca sesi login tersimpan (dipanggil sekali saat layout mount). */
export function loadCustomerAuth(): void {
	if (!isBrowser) return;
	try {
		const raw = localStorage.getItem(KEY);
		if (raw) {
			const p = JSON.parse(raw) as Customer;
			if (p?.name?.trim() && isValidCustomerPhone(p.phone ?? '')) {
				customerAuth.customer = {
					name: p.name.trim(),
					phone: normalizeCustomerPhone(p.phone)
				};
			}
		}
	} catch {
		// abaikan — anggap belum login
	} finally {
		customerAuth.ready = true;
	}
}

export function loginCustomer(name: string, phone: string): void {
	const c = { name: name.trim(), phone: normalizeCustomerPhone(phone) };
	customerAuth.customer = c;
	if (!isBrowser) return;
	try {
		localStorage.setItem(KEY, JSON.stringify(c));
	} catch {
		// abaikan
	}
}

export function logoutCustomer(): void {
	customerAuth.customer = null;
	if (!isBrowser) return;
	try {
		localStorage.removeItem(KEY);
	} catch {
		// abaikan
	}
}
