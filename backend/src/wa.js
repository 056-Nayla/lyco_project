import { config } from './config.js';

/**
 * Normalisasi nomor HP Indonesia ke format internasional tanpa '+'.
 * cth: "0889-8983-4160", "+6288989834160", "62889..." -> "6288989834160"
 * return '' kalau tidak valid (digit < 9 atau > 15).
 */
export function normalizePhone(raw) {
	if (!raw) return '';
	let d = String(raw).trim().replace(/[^\d]/g, '');
	if (!d) return '';
	if (d.startsWith('0')) d = `62${d.slice(1)}`;
	if (d.startsWith('8')) d = `62${d}`;
	// sudah 62xxx atau 60xxx (MY) / 65xxx (SG) — biarkan selama panjang wajar
	if (d.length < 9 || d.length > 15) return '';
	return d;
}

function rupiah(n) {
	try {
		return `Rp${Number(n).toLocaleString('id-ID')}`;
	} catch {
		return `Rp${n}`;
	}
}

function itemsLine(order) {
	const items = Array.isArray(order.items) ? order.items : [];
	return items.map((it, i) => `${i + 1}. ${it.qty}x ${it.name} — ${rupiah(it.qty * it.price)}`).join('\n');
}

/** Template pesan WA per status. */
export function buildStatusMessage(order) {
	const lines = itemsLine(order);
	const base = [
		`Halo ${order.buyer_name || 'kak'}! Pesanan Lyco Coffee *${order.code}*`,
		order.table_no ? `Meja: ${order.table_no}` : '',
		lines ? `Rincian:\n${lines}` : '',
		`Total: ${rupiah(order.total)}`
	].filter(Boolean);

	if (order.status === 'diproses') {
		return [
			...base,
			'',
			'Status: *SEDANG DIPROSES* ☕',
			'Pesanan kakak lagi kami siapkan. Ditunggu ya!'
		].join('\n');
	}
	if (order.status === 'selesai') {
		return [
			...base,
			'',
			'Status: *SELESAI* ✅',
			'Pesanan kakak sudah siap! Silakan diambil / dinikmati. Terima kasih sudah jajan di Lyco!'
		].join('\n');
	}
	if (order.status === 'batal') {
		return [...base, '', 'Status: *DIBATALKAN*. Hubungi kasir jika ada pertanyaan.'].join('\n');
	}
	return [...base, '', `Status terbaru: *${String(order.status).toUpperCase()}*`].join('\n');
}

/** Link wa.me fallback (dipakai admin kalau gateway gagal / belum dikonfig). */
export function waMeLink(toNormalized, message) {
	return `https://wa.me/${toNormalized}?text=${encodeURIComponent(message)}`;
}

/**
 * Kirim WA via gateway (Fonnte-compatible).
 * Env:
 *  WA_API_KEY   = token Fonnte (wajib untuk auto-send)
 *  WA_API_URL   = override endpoint (default https://api.fonnte.com/send)
 *  WA_SENDER    = device sender opsional (Fonnte: 0 = default)
 *  WA_AUTO_SEND = 'true'/'false' (default true kalau key ada)
 *  WA_TIMEOUT_MS= timeout fetch (default 10000)
 * return { sent, to, message, link, provider, detail?, error? }
 */
export async function sendOrderStatusWa(order) {
	const message = buildStatusMessage(order);
	const to = normalizePhone(order.buyer_phone);
	const link = to ? waMeLink(to, message) : '';

	if (!to) return { sent: false, to: '', message, link: '', error: 'Nomor WA pelanggan kosong/tidak valid.' };
	if (!config.wa.apiKey) return { sent: false, to, message, link, error: 'WA_API_KEY belum diisi di backend .env.' };
	if (!config.wa.autoSend) return { sent: false, to, message, link, error: 'WA_AUTO_SEND=false (auto-send dimatikan).' };

	const url = config.wa.apiUrl || 'https://api.fonnte.com/send';
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), config.wa.timeoutMs);
	try {
		// Fonnte menerima form-urlencoded: target, message (+ delay, countryCode opsional)
		const body = new URLSearchParams();
		body.set('target', to);
		body.set('message', message);
		if (config.wa.sender) body.set('sender', config.wa.sender);

		const res = await fetch(url, {
			method: 'POST',
			headers: { Authorization: config.wa.apiKey },
			body,
			signal: controller.signal
		});
		const text = await res.text().catch(() => '');
		let json = null;
		try {
			json = text ? JSON.parse(text) : null;
		} catch {
			json = null;
		}
		if (!res.ok) {
			return { sent: false, to, message, link, provider: url, error: `Gateway HTTP ${res.status}: ${text.slice(0, 300)}` };
		}
		// Fonnte: { status: true/false, ... } — anggap gagal kalau status === false
		if (json && json.status === false) {
			return { sent: false, to, message, link, provider: url, error: `Gateway menolak: ${text.slice(0, 300)}` };
		}
		return { sent: true, to, message, link, provider: url, detail: json ?? text.slice(0, 500) };
	} catch (e) {
		const msg = e?.name === 'AbortError' ? `Timeout ${config.wa.timeoutMs}ms ke gateway.` : String(e?.message ?? e);
		return { sent: false, to, message, link, provider: url, error: msg };
	} finally {
		clearTimeout(timer);
	}
}
