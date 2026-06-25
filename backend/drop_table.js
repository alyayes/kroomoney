import { pool } from './config/db.js';

async function dropTable() {
  try {
    console.log('Dropping transaction_items table...');
    await pool.query('DROP TABLE IF EXISTS transaction_items');
    console.log('Table dropped successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error dropping table:', err);
    process.exit(1);
  }
}

dropTable();
