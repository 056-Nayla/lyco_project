// Disalin dari frontend/.../settingsStore.svelte.ts defaultSettings agar seed konsisten.
export const defaultSettings = {
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

export const settingKeys = Object.keys(defaultSettings);
