import { pool } from './config/db.js';

async function run() {
  try {
    const [rows] = await pool.query('SELECT id, deleted_at, transaction_type, amount FROM transactions');
    console.log('=== ALL TRANSACTIONS (INCL DELETED) ===');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
