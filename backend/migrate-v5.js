import { pool } from './config/db.js';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  console.log('🚀 Running migrate-v5...');

  // 1. Add pdf_path to invoices
  try {
    await pool.query(`ALTER TABLE invoices ADD COLUMN pdf_path VARCHAR(500) NULL AFTER catatan_internal`);
    console.log('✅ invoices.pdf_path added');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭  invoices.pdf_path already exists');
    else throw e;
  }

  // 2. Add pdf_path to receipts
  try {
    await pool.query(`ALTER TABLE receipts ADD COLUMN pdf_path VARCHAR(500) NULL AFTER keterangan`);
    console.log('✅ receipts.pdf_path added');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭  receipts.pdf_path already exists');
    else throw e;
  }

  // 3. Create invoice_items table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_id INT NOT NULL,
      deskripsi TEXT NOT NULL,
      sub_deskripsi VARCHAR(500) NULL,
      kuantitas INT NOT NULL DEFAULT 1,
      harga_satuan BIGINT NOT NULL DEFAULT 0,
      diskon_persen DECIMAL(5,2) NOT NULL DEFAULT 0,
      subtotal BIGINT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ invoice_items table created (or already exists)');

  // 4. Seed global settings for company info if not present
  const defaultSettings = [
    { key: 'company_name',    value: 'Kroombox' },
    { key: 'company_address', value: 'Ko+Lab Hub Studio, Gd.Selaru lt.4 Universitas Telkom' },
    { key: 'company_city',    value: 'Bandung' },
    { key: 'company_phone',   value: '+62-878-9000-4465' },
    { key: 'company_email',   value: 'kroombox@gmail.com' },
    { key: 'company_website', value: 'kroombox.com' },
    { key: 'signer_name',     value: 'Andi Ahmad N.' },
    { key: 'signer_title',    value: 'Bendahara' },
  ];
  for (const s of defaultSettings) {
    await pool.query(
      `INSERT IGNORE INTO global_settings (setting_key, setting_value) VALUES (?, ?)`,
      [s.key, s.value]
    );
  }
  console.log('✅ Company settings seeded (INSERT IGNORE)');

  // 5. Create storage directories
  const dirs = [
    join(__dirname, 'storage', 'invoices'),
    join(__dirname, 'storage', 'receipts'),
  ];
  for (const dir of dirs) {
    await mkdir(dir, { recursive: true });
    console.log(`✅ Directory ensured: ${dir}`);
  }

  console.log('\\n✅ migrate-v5 completed successfully!\\n');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ migrate-v5 failed:', err);
  process.exit(1);
});
