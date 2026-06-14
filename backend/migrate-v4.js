/**
 * migrate-v4.js — Tambah tabel baru ke database Kroomoney
 * Menambahkan: email_templates, reminder_jobs, notification_settings
 * Juga memperbaiki ENUM reminder_logs.tipe_reminder (tambah H30)
 *
 * Cara jalankan: node backend/migrate-v4.js
 */
import { pool } from './config/db.js';

async function runMigration() {
  const conn = await pool.getConnection();
  try {
    console.log('🚀 Migrasi database Kroomoney v4.0...\n');

    // 1. Update ENUM reminder_logs untuk tambah H30
    try {
      await conn.execute(`
        ALTER TABLE reminder_logs
        MODIFY COLUMN tipe_reminder ENUM('H30','H7','H3','H1','overdue','manual') NOT NULL
      `);
      console.log('✅ reminder_logs.tipe_reminder ENUM diupdate (tambah H30)');
    } catch (e) {
      console.log('ℹ️  reminder_logs.tipe_reminder:', e.message);
    }

    // 2. Tambah kolom email ke master_customers jika belum ada
    const [custCols] = await conn.execute('SHOW COLUMNS FROM master_customers LIKE "email"');
    if (custCols.length === 0) {
      await conn.execute('ALTER TABLE master_customers ADD COLUMN email VARCHAR(255) NULL AFTER no_whatsapp');
      console.log('✅ Kolom email ditambahkan ke master_customers');
    } else {
      console.log('ℹ️  Kolom email sudah ada di master_customers');
    }

    // 3. Tabel email_templates
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_template VARCHAR(100) UNIQUE NOT NULL,
        tipe_reminder ENUM('H30','H7','H1','overdue','custom') NOT NULL DEFAULT 'custom',
        subject VARCHAR(255) NOT NULL,
        body_html LONGTEXT NOT NULL,
        body_text TEXT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        is_default TINYINT(1) NOT NULL DEFAULT 0,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabel email_templates siap');

    // 4. Tabel reminder_jobs
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS reminder_jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        pelanggan_id VARCHAR(50) NULL,
        email_tujuan VARCHAR(255) NULL,
        tipe_reminder ENUM('H30','H7','H1','overdue','manual') NOT NULL,
        channel ENUM('email','whatsapp') NOT NULL DEFAULT 'email',
        email_template_id INT NULL,
        scheduled_at DATETIME NOT NULL,
        status ENUM('pending','processing','sent','failed','skipped') NOT NULL DEFAULT 'pending',
        attempt_count INT NOT NULL DEFAULT 0,
        last_attempt_at DATETIME NULL,
        error_message TEXT NULL,
        sent_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_job_invoice_tipe_channel (invoice_id, tipe_reminder, channel)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabel reminder_jobs siap');

    // 5. Tabel notification_settings
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NULL,
        setting_group ENUM('scheduler','email','whatsapp','general') NOT NULL DEFAULT 'general',
        deskripsi VARCHAR(255) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabel notification_settings siap');

    // 6. Seed default notification_settings
    const defaultSettings = [
      ['scheduler_enabled', '1', 'scheduler', 'Aktifkan scheduler otomatis'],
      ['scheduler_cron', '0 8 * * *', 'scheduler', 'Jadwal cron (setiap hari jam 08:00)'],
      ['h30_enabled', '1', 'scheduler', 'Kirim reminder H-30'],
      ['h7_enabled', '1', 'scheduler', 'Kirim reminder H-7'],
      ['h1_enabled', '1', 'scheduler', 'Kirim reminder H-1'],
      ['overdue_enabled', '1', 'scheduler', 'Kirim reminder saat overdue'],
      ['max_retry_attempts', '3', 'scheduler', 'Maksimal retry jika gagal'],
      ['retry_interval_minutes', '30', 'scheduler', 'Interval retry dalam menit'],
    ];
    for (const [key, value, group, desc] of defaultSettings) {
      await conn.execute(
        'INSERT IGNORE INTO notification_settings (setting_key, setting_value, setting_group, deskripsi) VALUES (?, ?, ?, ?)',
        [key, value, group, desc]
      );
    }
    console.log('✅ Default notification_settings di-seed');

    // 7. Tambah SMTP keys ke global_settings
    const smtpKeys = [
      ['smtp_host', 'smtp.gmail.com'],
      ['smtp_port', '587'],
      ['smtp_encryption', 'tls'],
      ['smtp_user', ''],
      ['smtp_password', ''],
      ['smtp_from_name', 'Kroomoney Finance'],
      ['smtp_from_email', ''],
    ];
    for (const [key, val] of smtpKeys) {
      await conn.execute(
        'INSERT IGNORE INTO global_settings (setting_key, setting_value) VALUES (?, ?)',
        [key, val]
      );
    }
    console.log('✅ SMTP keys ditambahkan ke global_settings');

    // Summary
    console.log('\n🎉 Migrasi v4.0 selesai!');
    const [allTables] = await conn.execute('SHOW TABLES');
    console.log('📋 Tabel aktif:');
    allTables.forEach(row => console.log('   •', Object.values(row)[0]));

  } catch (err) {
    console.error('\n❌ Error migrasi:', err.message);
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

runMigration();
