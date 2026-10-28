// Data shift kerja (nama asal/contoh) — tersimpan lokal di browser admin.
// Naikkan ke backend kalau nanti butuh dipakai multi-perangkat.

const STORAGE_KEY = 'lyco:shifts:v1';
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export type Shift = {
	id: string;
	name: string;
	time: string;
	days: string;
	active: boolean;
};

export const defaultShifts: Shift[] = [
	{ id: 'sh-1', name: 'Shift Pagi', time: '08.00 – 16.00', days: 'Senin – Jumat', active: true },
	{ id: 'sh-2', name: 'Shift Sore', time: '14.00 – 22.00', days: 'Senin – Jumat', active: true },
	{ id: 'sh-3', name: 'Shift Weekend', time: '09.00 – 23.00', days: 'Sabtu – Minggu', active: true }
];

export const shiftState = $state<{ items: Shift[] }>({ items: [...defaultShifts] });

function persist(): void {
	if (!isBrowser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(shiftState.items));
	} catch {
		// abaikan
	}
}

function clean(list: unknown): Shift[] | null {
	if (!Array.isArray(list)) return null;
	const out: Shift[] = [];
	for (const s of list as Partial<Shift>[]) {
		if (!s || typeof s.name !== 'string' || !s.name.trim()) continue;
		out.push({
			id: typeof s.id === 'string' && s.id ? s.id : `sh-${Date.now()}-${out.length}`,
			name: s.name.trim(),
			time: typeof s.time === 'string' ? s.time.trim() : '',
			days: typeof s.days === 'string' ? s.days.trim() : '',
			active: s.active !== false
		});
	}
	return out;
}

export function loadShifts(): void {
	if (!isBrowser) return;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;
		const parsed = clean(JSON.parse(raw));
		if (parsed && parsed.length > 0) shiftState.items = parsed;
	} catch {
		// abaikan, pakai bawaan
	}
}

if (isBrowser) loadShifts();

export function addShift(data: Omit<Shift, 'id'>): { ok: boolean; message?: string } {
	if (!data.name.trim()) return { ok: false, message: 'Nama shift wajib diisi.' };
	shiftState.items = [
		...shiftState.items,
		{ ...data, name: data.name.trim(), id: `sh-${Date.now().toString(36)}` }
	];
	persist();
	return { ok: true };
}

export function updateShift(id: string, data: Omit<Shift, 'id'>): { ok: boolean; message?: string } {
	if (!data.name.trim()) return { ok: false, message: 'Nama shift wajib diisi.' };
	const idx = shiftState.items.findIndex((s) => s.id === id);
	if (idx === -1) return { ok: false, message: 'Shift tidak ditemukan.' };
	shiftState.items = shiftState.items.map((s, i) =>
		i === idx ? { ...data, name: data.name.trim(), id } : s
	);
	persist();
	return { ok: true };
}

export function toggleShift(id: string): void {
	shiftState.items = shiftState.items.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
	persist();
}

export function removeShift(id: string): void {
	shiftState.items = shiftState.items.filter((s) => s.id !== id);
	persist();
}

export function resetShifts(): void {
	shiftState.items = [...defaultShifts];
	if (isBrowser) {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			// abaikan
		}
	}
}
