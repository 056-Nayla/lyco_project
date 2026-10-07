import { config } from './config.js';
import { openDatabase, seedDatabase } from './db.js';

// CLI: npm run seed [-- --reset]
const reset = process.argv.includes('--reset');
const db = openDatabase(config.dbPath);
seedDatabase(db, { reset });
const counts = {
	users: db.prepare('SELECT COUNT(*) AS n FROM users').get().n,
	categories: db.prepare('SELECT COUNT(*) AS n FROM categories').get().n,
	products: db.prepare('SELECT COUNT(*) AS n FROM products').get().n
};
console.log(`seed ${reset ? '(reset) ' : ''}done:`, counts);
db.close();
