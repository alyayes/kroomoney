import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function runMigration() {
  let connection;
  try {
    console.log('🔄 Running database schema migration to support manual transactions and debit/credit flow...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kroomoney'
    });

    // 1. Modify pelanggan_id to be NULL
    console.log('🔹 Making pelanggan_id column nullable in pembayaran_masuk table...');
    await connection.execute('ALTER TABLE pembayaran_masuk MODIFY COLUMN pelanggan_id VARCHAR(50) NULL;');

    // Get existing columns in pembayaran_masuk to check if we already added our columns
    const [columns] = await connection.execute('SHOW COLUMNS FROM pembayaran_masuk');
    const colNames = columns.map(c => c.Field);

    // 2. Add tipe_transaksi column if not exists
    if (!colNames.includes('tipe_transaksi')) {
      console.log('🔹 Adding tipe_transaksi column to pembayaran_masuk table...');
      await connection.execute(
        "ALTER TABLE pembayaran_masuk ADD COLUMN tipe_transaksi ENUM('Pemasukan', 'Pengeluaran') NOT NULL DEFAULT 'Pemasukan' AFTER status_konfirmasi;"
      );
    } else {
      console.log('🔸 Column tipe_transaksi already exists.');
    }

    // 3. Add nama_manual column if not exists
    if (!colNames.includes('nama_manual')) {
      console.log('🔹 Adding nama_manual column to pembayaran_masuk table...');
      await connection.execute(
        "ALTER TABLE pembayaran_masuk ADD COLUMN nama_manual VARCHAR(255) NULL AFTER pelanggan_id;"
      );
    } else {
      console.log('🔸 Column nama_manual already exists.');
    }

    // 4. Add no_whatsapp_manual column if not exists
    if (!colNames.includes('no_whatsapp_manual')) {
      console.log('🔹 Adding no_whatsapp_manual column to pembayaran_masuk table...');
      await connection.execute(
        "ALTER TABLE pembayaran_masuk ADD COLUMN no_whatsapp_manual VARCHAR(50) NULL AFTER nama_manual;"
      );
    } else {
      console.log('🔸 Column no_whatsapp_manual already exists.');
    }

    console.log('✅ Database migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database migration failed:', err);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
