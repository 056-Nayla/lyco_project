import { z } from 'zod';

export const loginSchema = z.object({
	username: z.string().min(1, 'Username wajib diisi.'),
	password: z.string().min(1, 'Password wajib diisi.')
});

export const idParamSchema = z.object({
	id: z.coerce.number().int().positive('ID harus bilangan positif.')
});

export const productSchema = z.object({
	name: z.string().trim().min(1, 'Nama produk wajib diisi.').max(120),
	description: z.string().default(''),
	price: z.number().int().positive('Harga harus lebih dari 0.').max(100_000_000),
	image: z.string().trim().max(500).default(''),
	category: z.string().trim().min(1, 'Kategori wajib diisi.').max(60),
	featured: z.boolean().default(false)
});

export const productQuerySchema = z.object({
	category: z.string().trim().optional(),
	search: z.string().trim().optional(),
	featured: z.enum(['true', 'false']).optional(),
	limit: z.coerce.number().int().min(1).max(200).default(100),
	offset: z.coerce.number().int().min(0).default(0)
});

export const categorySchema = z.object({
	name: z.string().trim().min(1, 'Nama kategori wajib diisi.').max(60)
});

export const renameCategorySchema = z.object({
	name: z.string().trim().min(1, 'Nama kategori wajib diisi.').max(60)
});

export const reorderCategoriesSchema = z.object({
	order: z.array(z.string().trim().min(1)).min(1, 'Urutan wajib diisi.')
});

export const settingsSchema = z
	.object({
		heroBadge: z.string().max(120).optional(),
		heroTitle: z.string().max(120).optional(),
		heroSubtitle: z.string().max(500).optional(),
		promoTitle: z.string().max(120).optional(),
		promoSubtitle: z.string().max(300).optional(),
		footerAbout: z.string().max(500).optional(),
		addressName: z.string().max(120).optional(),
		addressLines: z.string().max(500).optional(),
		mapsUrl: z.string().max(500).optional(),
		phoneDisplay: z.string().max(40).optional(),
		phoneHref: z.string().max(80).optional(),
		email: z.string().max(120).optional(),
		hoursWeekdayLabel: z.string().max(60).optional(),
		hoursWeekdayTime: z.string().max(60).optional(),
		hoursWeekendLabel: z.string().max(60).optional(),
		hoursWeekendTime: z.string().max(60).optional()
	})
	.refine((v) => Object.keys(v).length > 0, { message: 'Minimal satu field settings.' });

export const ORDER_STATUSES = ['baru', 'diproses', 'selesai', 'batal'];

const orderItemSchema = z.object({
	id: z.number().int().positive('ID produk harus positif.'),
	name: z.string().trim().min(1).max(120),
	price: z.number().int().min(0).max(100_000_000),
	qty: z.number().int().min(1, 'Qty minimal 1.').max(99, 'Qty maksimal 99.'),
	image: z.string().trim().max(500).default(''),
	category: z.string().trim().max(60).default('')
});

export const createOrderSchema = z.object({
	buyer_name: z.string().trim().min(1, 'Nama pemesan wajib diisi.').max(80),
	buyer_session: z.string().trim().min(1, 'Sesi pembeli wajib diisi.').max(100),
	table_no: z.string().trim().max(20).default(''),
	note: z.string().trim().max(300).default(''),
	items: z.array(orderItemSchema).min(1, 'Keranjang masih kosong.').max(50, 'Maksimal 50 baris item.')
});

export const mineOrdersQuerySchema = z.object({
	session: z.string().trim().min(1, 'Sesi pembeli wajib diisi.').max(100),
	limit: z.coerce.number().int().min(1).max(50).default(20)
});

export const adminOrdersQuerySchema = z.object({
	status: z.enum(ORDER_STATUSES).optional(),
	limit: z.coerce.number().int().min(1).max(100).default(50),
	offset: z.coerce.number().int().min(0).default(0)
});

export const updateOrderStatusSchema = z.object({
	status: z.enum(ORDER_STATUSES)
});

export const tableCodeSchema = z
	.string()
	.trim()
	.min(1, 'Kode meja wajib diisi.')
	.max(10, 'Kode meja maksimal 10 karakter.')
	.regex(/^[A-Za-z0-9-]+$/, 'Kode meja hanya huruf, angka, dan strip.');

export const createTableSchema = z.object({
	code: tableCodeSchema,
	name: z.string().trim().max(60).default('')
});

export const updateTableSchema = z.object({
	code: tableCodeSchema.optional(),
	name: z.string().trim().max(60).optional(),
	active: z.boolean().optional()
}).refine((v) => Object.keys(v).length > 0, { message: 'Minimal satu field meja.' });

export const reorderTablesSchema = z.object({
	order: z.array(z.string().trim().min(1)).min(1, 'Urutan wajib diisi.')
});
