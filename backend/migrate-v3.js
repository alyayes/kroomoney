/**
 * migrate-v3.js
 * Migration script untuk upgrade database Kroomoney ke versi 3.0
 *
 * Perubahan:
 *   1. Rename tabel `pembayaran_masuk` → `transaksi`
 *   2. Tambah kolom `updated_at` ke tabel `transaksi` (jika belum ada)
 *   3. Buat tabel `invoices`
 *   4. Buat tabel `receipts`
 *   5. Buat tabel `reminder_logs`
 *
 * Cara jalankan:
 *   node backend/migrate-v3.js
 */

import { pool } from './config/db.js';

async function runMigration() {
  const conn = await pool.getConnection();
  try {
    console.log('🚀 Memulai migrasi database Kroomoney v3.0...\n');

    // ──────────────────────────────────────────────────
    // STEP 1: Rename pembayaran_masuk → transaksi
    // ──────────────────────────────────────────────────
    const [tables] = await conn.execute("SHOW TABLES LIKE 'pembayaran_masuk'");
    if (tables.length > 0) {
      await conn.execute('RENAME TABLE pembayaran_masuk TO transaksi');
      console.log('✅ Tabel `pembayaran_masuk` berhasil di-rename → `transaksi`');
    } else {
      console.log('ℹ️  Tabel `pembayaran_masuk` tidak ditemukan. Mungkin sudah direname sebelumnya.');
    }

    // Cek apakah tabel transaksi ada (baik dari rename atau sudah ada)
    const [transaksiExists] = await conn.execute("SHOW TABLES LIKE 'transaksi'");
    if (transaksiExists.length === 0) {
      console.log('⚠️  Tabel `transaksi` tidak ditemukan. Buat ulang dari awal via init-db.js');
    } else {
      // ──────────────────────────────────────────────────
      // STEP 2: Tambah kolom updated_at ke transaksi (jika belum ada)
      // ──────────────────────────────────────────────────
      const [cols] = await conn.execute('SHOW COLUMNS FROM transaksi LIKE "updated_at"');
      if (cols.length === 0) {
        await conn.execute(
          'ALTER TABLE transaksi ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at'
        );
        console.log('✅ Kolom `updated_at` ditambahkan ke tabel `transaksi`');
      } else {
        console.log('ℹ️  Kolom `updated_at` sudah ada di tabel `transaksi`.');
      }

      // Drop FK lama di transaksi (dari pembayaran_masuk) jika masih ada
      try {
        const [fkRows] = await conn.execute(`
          SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'transaksi'
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);
        for (const fk of fkRows) {
          await conn.execute(`ALTER TABLE transaksi DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
          console.log(`✅ FK constraint '${fk.CONSTRAINT_NAME}' dihapus dari tabel transaksi`);
        }
      } catch (e) {
        console.log('ℹ️  Tidak ada FK constraint lama yang perlu dihapus di transaksi.');
      }
    }

    // Drop FK lama di user_audit_trails jika masih ada
    try {
      const [fkAudit] = await conn.execute(`
        SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'user_audit_trails'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `);
      for (const fk of fkAudit) {
        await conn.execute(`ALTER TABLE user_audit_trails DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
        console.log(`✅ FK constraint '${fk.CONSTRAINT_NAME}' dihapus dari tabel user_audit_trails`);
      }
    } catch (e) {
      console.log('ℹ️  Tidak ada FK constraint lama yang perlu dihapus di user_audit_trails.');
    }

    // ──────────────────────────────────────────────────
    // STEP 3: Buat tabel invoices
    // ──────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nomor_invoice VARCHAR(30) UNIQUE NOT NULL,
        transaksi_id INT NOT NULL,
        pelanggan_id VARCHAR(50) NULL,
        nama_manual VARCHAR(255) NULL,
        no_wa_manual VARCHAR(50) NULL,
        subtotal INT NOT NULL DEFAULT 0,
        diskon INT NOT NULL DEFAULT 0,
        total INT NOT NULL DEFAULT 0,
        status_invoice ENUM('draft', 'terkirim', 'dibayar', 'overdue', 'dibatalkan') NOT NULL DEFAULT 'draft',
        tanggal_terbit DATE NOT NULL,
        tanggal_jatuh_tempo DATE NOT NULL,
        tanggal_kirim_wa DATETIME NULL,
        tanggal_kirim_email DATETIME NULL,
        tanggal_bayar DATETIME NULL,
        catatan TEXT NULL,
        catatan_internal TEXT NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        COMMENT='Invoice keuangan — ref logis ke transaksi dan master_customers'
    `);
    console.log('✅ Tabel `invoices` siap');

    // ──────────────────────────────────────────────────
    // STEP 4: Buat tabel receipts
    // ──────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS receipts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nomor_kwitansi VARCHAR(30) UNIQUE NOT NULL,
        invoice_id INT UNIQUE NOT NULL,
        pelanggan_id VARCHAR(50) NULL,
        nama_manual VARCHAR(255) NULL,
        tanggal_terbit DATE NOT NULL,
        nominal_diterima INT NOT NULL,
        metode_pembayaran VARCHAR(100) NOT NULL DEFAULT 'Transfer Bank',
        diterima_oleh VARCHAR(255) NULL,
        keterangan TEXT NULL,
        tanggal_kirim_wa DATETIME NULL,
        tanggal_kirim_email DATETIME NULL,
        status_kirim ENUM('belum', 'terkirim', 'gagal') NOT NULL DEFAULT 'belum',
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        COMMENT='Kwitansi — diterbitkan otomatis setelah invoice dibayar'
    `);
    console.log('✅ Tabel `receipts` siap');

    // ──────────────────────────────────────────────────
    // STEP 5: Buat tabel reminder_logs
    // ──────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS reminder_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        pelanggan_id VARCHAR(50) NULL,
        nama_manual VARCHAR(255) NULL,
        tipe_reminder ENUM('H7', 'H3', 'H1', 'overdue', 'manual') NOT NULL,
        channel ENUM('whatsapp', 'email') NOT NULL DEFAULT 'whatsapp',
        no_tujuan VARCHAR(100) NOT NULL,
        isi_pesan TEXT NOT NULL,
        status_kirim ENUM('pending', 'berhasil', 'gagal') NOT NULL DEFAULT 'pending',
        response_gateway TEXT NULL,
        dikirim_oleh INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        COMMENT='Log pengiriman reminder WA dan Email per invoice'
    `);
    console.log('✅ Tabel `reminder_logs` siap');

    // ──────────────────────────────────────────────────
    // SELESAI
    // ──────────────────────────────────────────────────
    console.log('\n🎉 Migrasi database v3.0 selesai!');
    console.log('📋 Tabel aktif:');
    const [allTables] = await conn.execute('SHOW TABLES');
    allTables.forEach(row => console.log('   •', Object.values(row)[0]));

  } catch (err) {
    console.error('\n❌ Error saat migrasi:', err.message);
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

runMigration();
