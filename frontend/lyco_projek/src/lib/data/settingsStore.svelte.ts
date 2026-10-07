const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export type SiteSettings = {
	heroBadge: string;
	heroTitle: string;
	heroSubtitle: string;
	promoTitle: string;
	promoSubtitle: string;
	footerAbout: string;
	addressName: string;
	addressLines: string;
	mapsUrl: string;
	phoneDisplay: string;
	phoneHref: string;
	email: string;
	hoursWeekdayLabel: string;
	hoursWeekdayTime: string;
	hoursWeekendLabel: string;
	hoursWeekendTime: string;
};

const STORAGE_KEY = 'lyco:settings:v1';

export const defaultSettings: SiteSettings = {
	heroBadge: 'LYCO • Coffee and Place',
	heroTitle: 'LYCO',
	heroSubtitle:
		'Coffee and Place — Temukan kopi favoritmu. Pesan kopi dan makanan dengan mudah, cepat, dan nyaman.',
	promoTitle: 'Ngopi Lebih Nikmat Hari Ini',
	promoSubtitle: 'Dapatkan pengalaman menikmati kopi dan makanan favoritmu bersama Lyco.',
	footerAbout:
		'Coffee and Place — tempat menikmati kopi dan makanan favorit dengan pemesanan yang praktis, cepat, dan nyaman.',
	addressName: 'Lyco Coffee And Place',
	addressLines:
		'Jl. Syamsul Arifien, Rw. V, Polagan, Kec. Sampang, Kabupaten Sampang, Jawa Timur 60253',
	mapsUrl:
		'https://www.google.com/maps/search/?api=1&query=Jl.+Syamsul+Arifien,+Polagan,+Kec.+Sampang,+Kabupaten+Sampang,+Jawa+Timur+60253',
	phoneDisplay: '+62 274 123 456',
	phoneHref: 'tel:+62274123456',
	email: 'halo@lyco.id',
	hoursWeekdayLabel: 'Senin – Jumat',
	hoursWeekdayTime: '08.00 – 22.00 WIB',
	hoursWeekendLabel: 'Sabtu – Minggu',
	hoursWeekendTime: '09.00 – 23.00 WIB'
};

/** Pengaturan landing page yang reaktif + tersimpan di browser. */
export const site = $state<{ current: SiteSettings }>({ current: defaultSettings });

export function loadSettings(): void {
	if (!isBrowser) return;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;
		const parsed = JSON.parse(raw) as Partial<SiteSettings>;
		site.current = { ...defaultSettings, ...parsed };
	} catch {
		// abaikan
	}
}

if (isBrowser) loadSettings();

export function saveSettings(next: SiteSettings): void {
	site.current = { ...next };
	if (!isBrowser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(site.current));
	} catch {
		// abaikan
	}
}

export function resetSettings(): void {
	site.current = { ...defaultSettings };
	if (isBrowser) {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			// abaikan
		}
	}
}
