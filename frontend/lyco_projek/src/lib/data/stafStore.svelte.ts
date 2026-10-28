// Data staf (nama asal/contoh) — tersimpan lokal di browser admin.
// Naikkan ke backend kalau nanti butuh dipakai multi-perangkat.

const STORAGE_KEY = 'lyco:staff:v1';
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export type Staff = {
	id: string;
	name: string;
	position: string;
	phone: string;
	active: boolean;
};

export const defaultStaff: Staff[] = [
	{ id: 'st-1', name: 'Budi Santoso', position: 'Barista', phone: '081234567890', active: true },
	{ id: 'st-2', name: 'Siti Aminah', position: 'Kasir', phone: '081234567891', active: true },
	{ id: 'st-3', name: 'Agus Pratama', position: 'Waiter', phone: '081234567892', active: true },
	{ id: 'st-4', name: 'Dewi Lestari', position: 'Kitchen', phone: '081234567893', active: false },
	{ id: 'st-5', name: 'Rudi Hartono', position: 'Cleaning', phone: '081234567894', active: true }
];

export const staffState = $state<{ items: Staff[] }>({ items: [...defaultStaff] });

function persist(): void {
	if (!isBrowser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(staffState.items));
	} catch {
		// abaikan
	}
}

function clean(list: unknown): Staff[] | null {
	if (!Array.isArray(list)) return null;
	const out: Staff[] = [];
	for (const s of list as Partial<Staff>[]) {
		if (!s || typeof s.name !== 'string' || !s.name.trim()) continue;
		out.push({
			id: typeof s.id === 'string' && s.id ? s.id : `st-${Date.now()}-${out.length}`,
			name: s.name.trim(),
			position: typeof s.position === 'string' ? s.position.trim() : '',
			phone: typeof s.phone === 'string' ? s.phone.trim() : '',
			active: s.active !== false
		});
	}
	return out;
}

export function loadStaff(): void {
	if (!isBrowser) return;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;
		const parsed = clean(JSON.parse(raw));
		if (parsed && parsed.length > 0) staffState.items = parsed;
	} catch {
		// abaikan, pakai bawaan
	}
}

if (isBrowser) loadStaff();

export function addStaff(data: Omit<Staff, 'id'>): { ok: boolean; message?: string } {
	if (!data.name.trim()) return { ok: false, message: 'Nama staf wajib diisi.' };
	staffState.items = [
		...staffState.items,
		{ ...data, name: data.name.trim(), id: `st-${Date.now().toString(36)}` }
	];
	persist();
	return { ok: true };
}

export function updateStaff(id: string, data: Omit<Staff, 'id'>): { ok: boolean; message?: string } {
	if (!data.name.trim()) return { ok: false, message: 'Nama staf wajib diisi.' };
	const idx = staffState.items.findIndex((s) => s.id === id);
	if (idx === -1) return { ok: false, message: 'Staf tidak ditemukan.' };
	staffState.items = staffState.items.map((s, i) =>
		i === idx ? { ...data, name: data.name.trim(), id } : s
	);
	persist();
	return { ok: true };
}

export function toggleStaff(id: string): void {
	staffState.items = staffState.items.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
	persist();
}

export function removeStaff(id: string): void {
	staffState.items = staffState.items.filter((s) => s.id !== id);
	persist();
}

export function resetStaff(): void {
	staffState.items = [...defaultStaff];
	if (isBrowser) {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			// abaikan
		}
	}
}
