import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './config/db.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabase() {
  try {
    const sqlPath = path.join(__dirname, 'database.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Strip SQL comments line by line
    const cleanSql = sqlContent
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('--') || trimmed.startsWith('#')) {
          return '';
        }
        return line;
      })
      .join('\n');
    
    // Split queries by semicolon
    const queries = cleanSql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    console.log('🔄 Initializing MySQL Database tables...');
    for (const query of queries) {
      await pool.query(query);
    }
    console.log('✅ MySQL Database tables initialized successfully.');

    // Seed default admin account if not exists
    const [existingAdmin] = await pool.query('SELECT * FROM users WHERE email = ?', ['admin@kroomoney.com']);
    if (existingAdmin.length === 0) {
      console.log('👤 Seeding default Super Admin account...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      await pool.query(
        'INSERT INTO users (nama_lengkap, email, password_hash, role, status_akun) VALUES (?, ?, ?, ?, ?)',
        ['Super Admin', 'admin@kroomoney.com', hashedPassword, 'admin_sistem', 'aktif']
      );
      console.log('✅ Default Super Admin account seeded successfully (admin@kroomoney.com / admin123).');
    }

    // Seed default settings if not exists
    const defaultSettings = [
      { key: 'gemini_api_key', val: process.env.GEMINI_API_KEY || '', model: 'gemini-1.5-flash', temp: 0.2 },
      { key: 'whatsapp_token', val: 'whatsapp_mock_token_session_2026', model: null, temp: 0.0 }
    ];

    for (const setting of defaultSettings) {
      const [existingSetting] = await pool.query('SELECT * FROM global_settings WHERE setting_key = ?', [setting.key]);
      if (existingSetting.length === 0) {
        await pool.query(
          'INSERT INTO global_settings (setting_key, setting_value, gemini_model_version, gemini_temperature) VALUES (?, ?, ?, ?)',
          [setting.key, setting.val, setting.model, setting.temp]
        );
        console.log(`⚙️ Default setting seeded: ${setting.key}`);
      }
    }

  } catch (err) {
    console.error('❌ Error initializing MySQL database:', err);
  }
}
