import { pool } from './config/db.js';

async function run() {
  try {
    const [rows] = await pool.query('SELECT id, nama_lengkap, email, role, status_akun FROM users');
    console.log('=== USERS ===');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
