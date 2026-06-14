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
    console.log('🔄 Updating status_konfirmasi ENUM to support pending, lunas, dp, and belum_lunas...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kroomoney'
    });

    // Modify status_konfirmasi to ENUM('pending', 'lunas', 'dp', 'belum_lunas')
    await connection.execute(
      "ALTER TABLE pembayaran_masuk MODIFY COLUMN status_konfirmasi ENUM('pending', 'lunas', 'dp', 'belum_lunas') NOT NULL DEFAULT 'pending';"
    );

    console.log('✅ Database status enum update completed successfully.');
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
