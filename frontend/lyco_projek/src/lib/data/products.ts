export type Product = {
	id: number;
	name: string;
	description: string;
	price: number;
	image: string;
	category: string;
	featured: boolean;
};

// Urutan kategori sesuai PDF MENU LYCO COFFEE
export const categoryOrder = [
	'Signature',
	'Frappe',
	'Oatside',
	'Coffee',
	'Flavour',
	'Mixology',
	'Matcha',
	'Tea',
	'Donat',
	'Food',
	'BBQ'
] as const;

// Foto produk memakai foto ASLI Lyco dari PDF (hal. Best Produk & Heavy Food).
// Untuk varian yang tidak punya foto close-up bersih di PDF, dipakai foto
// representatif dari keluarga menu yang sama (semua tetap foto asli Lyco).
const IMG_NINETEEN = '/menu/menu-nineteen-frappe.jpg';
const IMG_LOTUS = '/menu/menu-lotus-frappe.jpg';
const IMG_VANILLA = '/menu/menu-vanilla-frappe.jpg';
const IMG_SHARING = '/menu/menu-sharing-mandhi.jpg';
const IMG_BLACKPEPPER = '/menu/menu-chicken-blackpepper.jpg';
const IMG_MANDHI = '/menu/menu-mandhi-rice.jpg';
const IMG_SAMBAL = '/menu/menu-chicken-sambal.jpg';
const IMG_HONEY = '/menu/menu-chicken-honey.jpg';
const IMG_MIE = '/menu/menu-mie-grebek.jpg';
const IMG_MAC = '/menu/menu-mac-cheese.jpg';

export const products: Product[] = [
	// ── Frappe (Best Produk, hal. 3 & 5) ─────────────────────────────
	{
		id: 1,
		name: 'Nineteen Frappe',
		description: 'Frappe creamy signature dengan topping ice cream. Salah satu best produk Lyco.',
		price: 22000,
		image: IMG_NINETEEN,
		category: 'Frappe',
		featured: true
	},
	{
		id: 2,
		name: 'Lotus Biscoff Frappe',
		description: 'Frappe caramel dengan crumble Lotus Biscoff dan whipped cream.',
		price: 28000,
		image: IMG_LOTUS,
		category: 'Frappe',
		featured: true
	},
	{
		id: 3,
		name: 'Vanilla Coffee Frappe',
		description: 'Kopi susu frappe vanilla dengan ice cream yang lembut dan menyegarkan.',
		price: 24000,
		image: IMG_VANILLA,
		category: 'Frappe',
		featured: true
	},
	{
		id: 11,
		name: 'Pandan Coffee Frappe',
		description: 'Kopi susu frappe dengan aroma pandan yang wangi dan creamy.',
		price: 24000,
		image: IMG_VANILLA,
		category: 'Frappe',
		featured: false
	},
	// ── Signature (hal. 5) ───────────────────────────────────────────
	{
		id: 12,
		name: 'Lyco Prime',
		description: 'Minuman signature andalan Lyco. Wajib coba untuk pertama kali.',
		price: 25000,
		image: IMG_LOTUS,
		category: 'Signature',
		featured: false
	},
	{
		id: 13,
		name: 'Leberry',
		description: 'Minuman signature segar dengan sentuhan berry.',
		price: 25000,
		image: IMG_NINETEEN,
		category: 'Signature',
		featured: false
	},
	// ── Oatside (hal. 7) ─────────────────────────────────────────────
	{
		id: 14,
		name: 'Lyco Oat',
		description: 'Minuman oat signature Lyco yang creamy dengan topping ice cream.',
		price: 25000,
		image: IMG_LOTUS,
		category: 'Oatside',
		featured: false
	},
	{
		id: 15,
		name: 'Caramel Latte Oat',
		description: 'Perpaduan caramel latte dengan susu oat yang smooth.',
		price: 23000,
		image: IMG_VANILLA,
		category: 'Oatside',
		featured: false
	},
	{
		id: 16,
		name: 'Hazelnut Oat',
		description: 'Hazelnut latte creamy dengan susu oat.',
		price: 24000,
		image: IMG_NINETEEN,
		category: 'Oatside',
		featured: false
	},
	{
		id: 17,
		name: 'Chocolate Oat',
		description: 'Coklat creamy dengan susu oat dan topping ice cream.',
		price: 24000,
		image: IMG_LOTUS,
		category: 'Oatside',
		featured: false
	},
	{
		id: 18,
		name: 'Red Velvet Oat',
		description: 'Red velvet lembut dengan susu oat yang creamy.',
		price: 24000,
		image: IMG_VANILLA,
		category: 'Oatside',
		featured: false
	},
	{
		id: 19,
		name: 'Taro Oat',
		description: 'Taro manis creamy dengan susu oat.',
		price: 23000,
		image: IMG_NINETEEN,
		category: 'Oatside',
		featured: false
	},
	// ── Coffee (hal. 8, harga ice; hot tersedia untuk sebagian) ───────
	{
		id: 20,
		name: 'Espresso',
		description: 'Shot espresso pekat single origin. (Hot only)',
		price: 8000,
		image: IMG_VANILLA,
		category: 'Coffee',
		featured: false
	},
	{
		id: 21,
		name: 'Americano',
		description: 'Kopi hitam bold biji pilihan Lyco. Hot 10k / Ice 12k.',
		price: 12000,
		image: IMG_NINETEEN,
		category: 'Coffee',
		featured: false
	},
	{
		id: 22,
		name: 'Cappuccino',
		description: 'Espresso creamy dengan foam susu lembut. Hot 13k / Ice 14k.',
		price: 14000,
		image: IMG_LOTUS,
		category: 'Coffee',
		featured: false
	},
	{
		id: 23,
		name: 'Caffe Latte',
		description: 'Perpaduan espresso dan susu steamed yang smooth. Hot 13k / Ice 15k.',
		price: 15000,
		image: IMG_VANILLA,
		category: 'Coffee',
		featured: false
	},
	{
		id: 24,
		name: 'Caramel Latte',
		description: 'Latte manis dengan saus caramel. Hot 14k / Ice 18k.',
		price: 18000,
		image: IMG_LOTUS,
		category: 'Coffee',
		featured: false
	},
	{
		id: 25,
		name: 'Hazelnut Latte',
		description: 'Latte dengan aroma hazelnut yang wangi. Hot 15k / Ice 18k.',
		price: 18000,
		image: IMG_NINETEEN,
		category: 'Coffee',
		featured: false
	},
	{
		id: 26,
		name: 'Sutra Jelly',
		description: 'Kopi susu dengan jelly sutra yang kenyal. (Ice only)',
		price: 20000,
		image: IMG_VANILLA,
		category: 'Coffee',
		featured: false
	},
	{
		id: 27,
		name: 'Golden Bliss',
		description: 'Racikan kopi susu manis nan lembut. (Ice only)',
		price: 19000,
		image: IMG_LOTUS,
		category: 'Coffee',
		featured: false
	},
	{
		id: 28,
		name: 'Coffee Milk Creamy',
		description: 'Kopi susu creamy andalan Lyco dalam kemasan botol. (Ice only)',
		price: 20000,
		image: IMG_NINETEEN,
		category: 'Coffee',
		featured: false
	},
	{
		id: 29,
		name: 'Coffee Ice Cube',
		description: 'Kopi dengan es batu kopi, makin lama makin nikmat. (Ice only)',
		price: 20000,
		image: IMG_VANILLA,
		category: 'Coffee',
		featured: false
	},
	{
		id: 30,
		name: 'Affogato',
		description: 'Espresso panas disiram di atas ice cream dingin. (Ice only)',
		price: 20000,
		image: IMG_LOTUS,
		category: 'Coffee',
		featured: false
	},
	{
		id: 31,
		name: 'Treffen Coffee',
		description: 'Racikan kopi spesial Lyco yang menyegarkan. (Ice only)',
		price: 18000,
		image: IMG_NINETEEN,
		category: 'Coffee',
		featured: false
	},
	{
		id: 32,
		name: 'Lycoris',
		description: 'Minuman kopi premium Lyco dalam kemasan botol. (Ice only)',
		price: 25000,
		image: IMG_VANILLA,
		category: 'Coffee',
		featured: false
	},
	// ── Flavour (hal. 9, non-coffee; harga ice) ───────────────────────
	{
		id: 33,
		name: 'Chocolate',
		description: 'Coklat creamy favorit semua umur. Hot 12k / Ice 17k.',
		price: 17000,
		image: IMG_LOTUS,
		category: 'Flavour',
		featured: false
	},
	{
		id: 34,
		name: 'Red Velvet',
		description: 'Red velvet manis dan creamy. Hot 12k / Ice 17k.',
		price: 17000,
		image: IMG_NINETEEN,
		category: 'Flavour',
		featured: false
	},
	{
		id: 35,
		name: 'Matcha (Flavour)',
		description: 'Matcha creamy yang menyegarkan. Hot 12k / Ice 17k.',
		price: 17000,
		image: IMG_VANILLA,
		category: 'Flavour',
		featured: false
	},
	{
		id: 36,
		name: 'Taro (Flavour)',
		description: 'Taro manis dengan susu creamy. Hot 10k / Ice 16k.',
		price: 16000,
		image: IMG_LOTUS,
		category: 'Flavour',
		featured: false
	},
	{
		id: 37,
		name: 'Cookies & Cream',
		description: 'Susu creamy dengan remahan cookies. Hot 10k / Ice 16k.',
		price: 16000,
		image: IMG_VANILLA,
		category: 'Flavour',
		featured: false
	},
	{
		id: 38,
		name: 'Avocado',
		description: 'Jus alpukat creamy yang mengenyangkan. Hot 10k / Ice 16k.',
		price: 16000,
		image: IMG_NINETEEN,
		category: 'Flavour',
		featured: false
	},
	{
		id: 39,
		name: 'Bubble Gum',
		description: 'Minuman manis rasa bubble gum favorit anak. Hot 10k / Ice 16k.',
		price: 16000,
		image: IMG_LOTUS,
		category: 'Flavour',
		featured: false
	},
	// ── Mixology (hal. 10) ───────────────────────────────────────────
	{
		id: 40,
		name: 'Msc Pineapple',
		description: 'Mocktail nanas segar yang menyegarkan.',
		price: 15000,
		image: IMG_NINETEEN,
		category: 'Mixology',
		featured: false
	},
	{
		id: 41,
		name: 'Kiwi Mojito',
		description: 'Mocktail kiwi dengan sensasi mint yang segar.',
		price: 15000,
		image: IMG_LOTUS,
		category: 'Mixology',
		featured: false
	},
	{
		id: 42,
		name: 'Rose Merry',
		description: 'Mocktail mawar yang wangi dan menyegarkan.',
		price: 15000,
		image: IMG_VANILLA,
		category: 'Mixology',
		featured: false
	},
	{
		id: 43,
		name: 'Amerka',
		description: 'Mocktail spesial Lyco dengan rasa berani.',
		price: 17000,
		image: IMG_NINETEEN,
		category: 'Mixology',
		featured: false
	},
	{
		id: 44,
		name: 'Berrys',
		description: 'Mocktail aneka berry yang segar dan manis.',
		price: 15000,
		image: IMG_LOTUS,
		category: 'Mixology',
		featured: false
	},
	// ── Matcha (Matchaku, hal. 11) ────────────────────────────────────
	{
		id: 45,
		name: 'Matcha Oat',
		description: 'Matcha creamy dengan susu oat. Juga ada di menu Oatside.',
		price: 25000,
		image: IMG_VANILLA,
		category: 'Matcha',
		featured: false
	},
	{
		id: 46,
		name: 'Matcha Latte',
		description: 'Matcha premium dengan susu segar.',
		price: 17000,
		image: IMG_LOTUS,
		category: 'Matcha',
		featured: false
	},
	{
		id: 47,
		name: 'Banana Matcha',
		description: 'Perpaduan unik pisang manis dengan matcha.',
		price: 19000,
		image: IMG_NINETEEN,
		category: 'Matcha',
		featured: false
	},
	{
		id: 48,
		name: 'Coconut Matcha',
		description: 'Matcha dengan sentuhan kelapa yang gurih dan segar.',
		price: 20000,
		image: IMG_VANILLA,
		category: 'Matcha',
		featured: false
	},
	// ── Tea & Pitcher (hal. 12) ──────────────────────────────────────
	{
		id: 49,
		name: 'Lechee Tea',
		description: 'Teh leci manis yang menyegarkan.',
		price: 14000,
		image: IMG_NINETEEN,
		category: 'Tea',
		featured: false
	},
	{
		id: 50,
		name: 'Lemon Tea',
		description: 'Teh lemon klasik yang segar.',
		price: 14000,
		image: IMG_VANILLA,
		category: 'Tea',
		featured: false
	},
	{
		id: 51,
		name: 'Lechee Tea Pitcher',
		description: 'Teh leci ukuran pitcher untuk rame-rame.',
		price: 55000,
		image: IMG_LOTUS,
		category: 'Tea',
		featured: false
	},
	{
		id: 52,
		name: 'Lemon Tea Pitcher',
		description: 'Teh lemon ukuran pitcher untuk rame-rame.',
		price: 55000,
		image: IMG_NINETEEN,
		category: 'Tea',
		featured: false
	},
	// ── Donat (hal. 13, semua 12k) ────────────────────────────────────
	{
		id: 53,
		name: 'Donat Choco Crunchy',
		description: 'Donat dengan topping coklat crunchy yang renyah.',
		price: 12000,
		image: IMG_LOTUS,
		category: 'Donat',
		featured: false
	},
	{
		id: 54,
		name: 'Donat Coklat Almond',
		description: 'Donat coklat dengan taburan almond.',
		price: 12000,
		image: IMG_VANILLA,
		category: 'Donat',
		featured: false
	},
	{
		id: 55,
		name: 'Donat Coklat Kacang',
		description: 'Donat coklat dengan taburan kacang.',
		price: 12000,
		image: IMG_NINETEEN,
		category: 'Donat',
		featured: false
	},
	{
		id: 56,
		name: 'Donat Tiramisu Coklat',
		description: 'Donat dengan glaze tiramisu dan coklat.',
		price: 12000,
		image: IMG_LOTUS,
		category: 'Donat',
		featured: false
	},
	{
		id: 57,
		name: 'Donat Tiramisu Kacang',
		description: 'Donat dengan glaze tiramisu dan taburan kacang.',
		price: 12000,
		image: IMG_VANILLA,
		category: 'Donat',
		featured: false
	},
	{
		id: 58,
		name: 'Donat Strawberry',
		description: 'Donat dengan glaze strawberry yang manis.',
		price: 12000,
		image: IMG_NINETEEN,
		category: 'Donat',
		featured: false
	},
	{
		id: 59,
		name: 'Donat Strawberry Meses',
		description: 'Donat strawberry dengan taburan meses.',
		price: 12000,
		image: IMG_LOTUS,
		category: 'Donat',
		featured: false
	},
	// ── Heavy Food (hal. 4, foto close-up asli) ───────────────────────
	{
		id: 4,
		name: 'Chicken Black Pepper',
		description: 'Nasi dengan ayam black pepper, wijen, timun dan selada.',
		price: 18000,
		image: IMG_BLACKPEPPER,
		category: 'Food',
		featured: true
	},
	{
		id: 5,
		name: 'Mandhi Rice',
		description: 'Nasi mandhi dengan ayam, jeruk, rempah, cabai, timun dan tomat.',
		price: 40000,
		image: IMG_MANDHI,
		category: 'Food',
		featured: true
	},
	{
		id: 6,
		name: 'Chicken Sambal Matah',
		description: 'Nasi ayam sambal matah dengan telur, timun dan selada.',
		price: 18000,
		image: IMG_SAMBAL,
		category: 'Food',
		featured: true
	},
	{
		id: 7,
		name: 'Chicken Honey Lime',
		description: 'Nasi dengan ayam madu lemon, wijen, timun dan selada.',
		price: 20000,
		image: IMG_HONEY,
		category: 'Food',
		featured: true
	},
	{
		id: 8,
		name: 'Mie Grebek',
		description: 'Mie rempah dengan telur, sosis, selada dan timun. Favorit pelanggan Lyco.',
		price: 16000,
		image: IMG_MIE,
		category: 'Food',
		featured: true
	},
	{
		id: 9,
		name: 'Sharing Mandhi Rice',
		description: 'Mandhi rice jumbo untuk 6-7 orang. Khusus reservasi (for RSVP only).',
		price: 250000,
		image: IMG_SHARING,
		category: 'Food',
		featured: false
	},
	{
		id: 10,
		name: 'Mac and Cheese',
		description: 'Macaroni keju dengan smoked beef, mushroom broth, bawang dan parsley.',
		price: 25000,
		image: IMG_MAC,
		category: 'Food',
		featured: false
	},
	// ── Snack & Food lain (hal. 14) ────────────────────────────────────
	{
		id: 60,
		name: 'Mix Platter',
		description: 'Aneka snack dalam satu piring untuk sharing rame-rame.',
		price: 25000,
		image: IMG_SHARING,
		category: 'Food',
		featured: false
	},
	{
		id: 61,
		name: 'French Fries',
		description: 'Kentang goreng renyah dengan seasoning gurih.',
		price: 12000,
		image: IMG_MAC,
		category: 'Food',
		featured: false
	},
	{
		id: 62,
		name: 'Kebab Beef',
		description: 'Kebab dengan isian daging sapi yang gurih.',
		price: 18000,
		image: IMG_BLACKPEPPER,
		category: 'Food',
		featured: false
	},
	{
		id: 63,
		name: 'Corn Ribs',
		description: 'Jagung bakar dengan bumbu gurih, cocok untuk ngemil.',
		price: 12000,
		image: IMG_MANDHI,
		category: 'Food',
		featured: false
	},
	{
		id: 64,
		name: 'Nugget',
		description: 'Nugget ayam goreng yang renyah.',
		price: 10000,
		image: IMG_SAMBAL,
		category: 'Food',
		featured: false
	},
	{
		id: 65,
		name: 'Sausage',
		description: 'Sosis goreng yang gurih untuk teman ngopi.',
		price: 10000,
		image: IMG_HONEY,
		category: 'Food',
		featured: false
	},
	{
		id: 66,
		name: 'Grilled Sausage',
		description: 'Sosis bakar dengan aroma smokey yang menggoda.',
		price: 12000,
		image: IMG_MIE,
		category: 'Food',
		featured: false
	},
	{
		id: 67,
		name: 'Ice Cream Toast',
		description: 'Roti panggang hangat dengan topping ice cream.',
		price: 18000,
		image: IMG_LOTUS,
		category: 'Food',
		featured: false
	},
	// ── BBQ Grill (hal. 2) ───────────────────────────────────────────
	{
		id: 68,
		name: 'Family BBQ Grill',
		description: 'Paket BBQ grill untuk 3-5 orang. Makan rame-rame makin seru.',
		price: 105000,
		image: IMG_SHARING,
		category: 'BBQ',
		featured: false
	}
];

export function formatRupiah(value: number): string {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(value);
}
