-- ============================================================
-- Kroomoney Financial Management System
-- Database Schema — Version 3.0
-- Renamed: pembayaran_masuk → transaksi
-- Added: invoices, receipts, reminder_logs
-- No FK constraints (enforced at application layer)
-- ============================================================

-- 1. Table users (Credentials and Auth Status)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_lengkap VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin_sistem', 'bendahara') NOT NULL DEFAULT 'bendahara',
  status_akun ENUM('menunggu_persetujuan', 'aktif', 'nonaktif') NOT NULL DEFAULT 'menunggu_persetujuan',
  foto_profil TEXT NULL,
  tanda_tangan TEXT NULL,
  reset_otp VARCHAR(10) NULL,
  reset_otp_expiry DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Table global_settings (Dynamic Configurations)
CREATE TABLE IF NOT EXISTS global_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT NULL,
  gemini_model_version VARCHAR(255) NULL DEFAULT 'gemini-1.5-flash',
  gemini_temperature FLOAT DEFAULT 0.2,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Table master_customers (Clients Hosting Database)
CREATE TABLE IF NOT EXISTS master_customers (
  id_pelanggan VARCHAR(50) PRIMARY KEY,
  nama_pelanggan VARCHAR(255) NOT NULL,
  no_whatsapp VARCHAR(50) NOT NULL,
  paket_hosting VARCHAR(255) NOT NULL,
  nominal_tagihan INT NOT NULL,
  tanggal_jatuh_tempo DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Table transaksi (semua transaksi keuangan — pemasukan & pengeluaran)
-- Sebelumnya bernama: pembayaran_masuk
-- Ref logis ke master_customers (pelanggan_id) dan users (dikonfirmasi_oleh)
-- tanpa FK constraint — integritas dijaga di application layer
CREATE TABLE IF NOT EXISTS transaksi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pelanggan_id VARCHAR(50) NULL,
  nama_manual VARCHAR(255) NULL,
  no_whatsapp_manual VARCHAR(50) NULL,
  nominal_transfer INT NOT NULL,
  kuantitas INT NOT NULL DEFAULT 1,
  tanggal_bayar DATE NOT NULL,
  status_konfirmasi ENUM('pending', 'lunas', 'dp', 'belum_lunas') NOT NULL DEFAULT 'pending',
  status_dokumen ENUM('Draft', 'Diproses', 'Disetujui') NOT NULL DEFAULT 'Draft',
  sertakan_tanda_tangan TINYINT(1) NOT NULL DEFAULT 0,
  tipe_transaksi ENUM('Pemasukan', 'Pengeluaran') NOT NULL DEFAULT 'Pemasukan',
  dikonfirmasi_oleh INT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Table invoices (Invoice yang diterbitkan per transaksi)
-- Ref logis ke transaksi (transaksi_id) dan master_customers (pelanggan_id)
-- status_invoice: draft → terkirim → dibayar | overdue | dibatalkan
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
) ENGINE=InnoDB;

-- 6. Table receipts (Kwitansi — diterbitkan setelah invoice dibayar/lunas)
-- Ref logis ke invoices (invoice_id) dan master_customers (pelanggan_id)
-- Satu invoice hanya bisa punya satu kwitansi (1:1)
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
) ENGINE=InnoDB;

-- 7. Table reminder_logs (Log pengiriman reminder WA & Email per invoice)
-- Ref logis ke invoices (invoice_id) dan master_customers (pelanggan_id)
-- tipe_reminder: H7 = 7 hari sebelum, H3 = 3 hari, H1 = 1 hari, overdue = lewat jatuh tempo
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
) ENGINE=InnoDB;

-- 8. Table user_audit_trails (Action logs)
-- Ref logis ke users (user_id)
CREATE TABLE IF NOT EXISTS user_audit_trails (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  aktivitas VARCHAR(255) NOT NULL,
  ip_address VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 9. Table email_templates (Reusable email reminder templates)
-- Mendukung placeholder: {{customer_name}}, {{invoice_number}}, {{amount}}, {{due_date}},
-- {{days_remaining}}, {{payment_link}}, {{company_name}}, {{support_email}}
CREATE TABLE IF NOT EXISTS email_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_template VARCHAR(100) UNIQUE NOT NULL COMMENT 'Nama unik template',
  tipe_reminder ENUM('H30', 'H7', 'H1', 'overdue', 'custom') NOT NULL DEFAULT 'custom',
  subject VARCHAR(255) NOT NULL COMMENT 'Subject email dengan placeholder',
  body_html LONGTEXT NOT NULL COMMENT 'Body HTML email dengan placeholder',
  body_text TEXT NULL COMMENT 'Plain text fallback',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_default TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Template default untuk tipe ini',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Template email reminder yang dapat dikustomisasi';

-- 10. Table reminder_jobs (Antrian reminder — mencegah duplikat pengiriman)
-- status: pending → processing → sent | failed | skipped
-- Satu job per kombinasi (invoice_id + tipe_reminder + channel)
CREATE TABLE IF NOT EXISTS reminder_jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL COMMENT 'Ref logis ke invoices.id',
  pelanggan_id VARCHAR(50) NULL COMMENT 'Ref logis ke master_customers',
  email_tujuan VARCHAR(255) NULL,
  tipe_reminder ENUM('H30', 'H7', 'H1', 'overdue', 'manual') NOT NULL,
  channel ENUM('email', 'whatsapp') NOT NULL DEFAULT 'email',
  email_template_id INT NULL COMMENT 'Ref logis ke email_templates.id',
  scheduled_at DATETIME NOT NULL COMMENT 'Waktu dijadwalkan untuk dikirim',
  status ENUM('pending', 'processing', 'sent', 'failed', 'skipped') NOT NULL DEFAULT 'pending',
  attempt_count INT NOT NULL DEFAULT 0 COMMENT 'Jumlah percobaan pengiriman',
  last_attempt_at DATETIME NULL,
  error_message TEXT NULL COMMENT 'Pesan error dari attempt terakhir',
  sent_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_job_invoice_tipe_channel (invoice_id, tipe_reminder, channel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Antrian reminder — satu job per invoice+tipe+channel';

-- 11. Table notification_settings (Konfigurasi global reminder service)
-- Disimpan sebagai key-value pairs
CREATE TABLE IF NOT EXISTS notification_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NULL,
  setting_group ENUM('scheduler', 'email', 'whatsapp', 'general') NOT NULL DEFAULT 'general',
  deskripsi VARCHAR(255) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Konfigurasi global reminder service';
