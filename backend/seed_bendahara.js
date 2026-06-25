import { pool } from './config/db.js';
import bcrypt from 'bcryptjs';

async function run() {
  try {
    const email = 'bendahara@kroomoney.com';
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length === 0) {
      console.log('👤 Seeding default Bendahara account...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('BendaharaPassword123@', salt);
      await pool.query(
        'INSERT INTO users (nama_lengkap, email, password_hash, role, status_akun) VALUES (?, ?, ?, ?, ?)',
        ['Bendahara Kroombox', email, hashedPassword, 'bendahara', 'aktif']
      );
      console.log('✅ Default Bendahara account seeded successfully (bendahara@kroomoney.com / BendaharaPassword123@).');
    } else {
      console.log('👤 Bendahara account already exists.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
