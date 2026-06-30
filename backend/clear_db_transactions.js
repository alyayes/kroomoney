import { pool } from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    console.log('Clearing database transactions and invoices...');
    // Table invoices may have rows, and invoice_items may reference invoices
    try {
      await pool.query('DELETE FROM invoice_items');
    } catch(e) {
      console.log('Skipping invoice_items clear or table does not exist');
    }
    
    try {
      await pool.query('DELETE FROM invoices');
    } catch(e) {
      console.log('Skipping invoices clear or table does not exist');
    }
    
    try {
      await pool.query('DELETE FROM transactions');
    } catch(e) {
      console.log('Skipping transactions clear or table does not exist');
    }
    
    console.log('✅ Database transactions cleared successfully!');
  } catch (err) {
    console.error('Error clearing database:', err);
  } finally {
    await pool.end();
  }
}

run();
