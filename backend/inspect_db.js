import { pool } from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const [txs] = await pool.query('SELECT id, nama_manual, amount, items, created_at FROM transactions');
    console.log('=== ALL TRANSACTIONS ===');
    console.log(JSON.stringify(txs, null, 2));

    const [txItems] = await pool.query('SELECT * FROM transaction_items');
    console.log('=== ALL TRANSACTION ITEMS ===');
    console.log(JSON.stringify(txItems, null, 2));

    const [invs] = await pool.query('SELECT id, invoice_number, transaction_id, total, subtotal, discount FROM invoices');
    console.log('=== ALL INVOICES ===');
    console.log(JSON.stringify(invs, null, 2));

    const [invItems] = await pool.query('SELECT * FROM invoice_items');
    console.log('=== ALL INVOICE ITEMS ===');
    console.log(JSON.stringify(invItems, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
