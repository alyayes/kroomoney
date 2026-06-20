-- ============================================================
-- Kroomoney Financial Management System
-- Database Schema v7.0 — Refactored (12 Tables Total)
-- NO FOREIGN KEY constraints
-- Relationships enforced at application layer
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. users
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_lengkap VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin_sistem', 'bendahara') NOT NULL DEFAULT 'bendahara',
  status_akun ENUM('menunggu_persetujuan', 'aktif', 'nonaktif') NOT NULL DEFAULT 'menunggu_persetujuan',
  foto_profil TEXT NULL,
  tanda_tangan TEXT NULL,
  reset_otp VARCHAR(10) NULL,
  reset_otp_expiry DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
-- 2. customers
-- Gabungan: master_customers + ext_customers
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_code VARCHAR(50) NOT NULL COMMENT 'Kode unik pelanggan (ex: PLG-001)',
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  source_type ENUM('manual', 'api') NOT NULL DEFAULT 'manual',
  external_customer_id VARCHAR(100) NULL COMMENT 'ID dari app eksternal',
  api_client_id INT NULL COMMENT 'Ref logis ke api_clients.id',
  hosting_package VARCHAR(255) NULL COMMENT 'Paket hosting (legacy)',
  billing_amount BIGINT NULL DEFAULT 0 COMMENT 'Nominal tagihan default',
  billing_due_date DATE NULL COMMENT 'Tanggal jatuh tempo default',
  metadata JSON NULL COMMENT 'Data tambahan dari API',
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_customers_code (customer_code),
  UNIQUE KEY uk_customers_ext (external_customer_id, api_client_id),
  INDEX idx_customers_source (source_type),
  INDEX idx_customers_api_client (api_client_id),
  INDEX idx_customers_email (email),
  INDEX idx_customers_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
-- 3. transactions
-- Gabungan: transaksi + ext_transactions
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NULL COMMENT 'Ref logis ke customers.id',
  nama_manual VARCHAR(255) NULL,
  no_whatsapp_manual VARCHAR(50) NULL,
  source_type ENUM('manual', 'api') NOT NULL DEFAULT 'manual',
  external_transaction_id VARCHAR(100) NULL COMMENT 'TRX ID dari app eksternal',
  api_client_id INT NULL COMMENT 'Ref logis ke api_clients.id',
  service_name VARCHAR(255) NULL COMMENT 'Nama layanan/paket',
  description TEXT NULL,
  amount BIGINT NOT NULL DEFAULT 0,
  quantity INT NOT NULL DEFAULT 1,
  discount BIGINT NOT NULL DEFAULT 0 COMMENT 'Nominal diskon manual',
  due_date DATE NOT NULL,
  payment_status ENUM('pending', 'lunas', 'dp', 'belum_lunas') NOT NULL DEFAULT 'pending',
  document_status ENUM('draft', 'diproses', 'disetujui') NOT NULL DEFAULT 'draft',
  transaction_type ENUM('pemasukan', 'pengeluaran') NOT NULL DEFAULT 'pemasukan',
  include_signature TINYINT(1) NOT NULL DEFAULT 0,
  confirmed_by INT NULL COMMENT 'Ref logis ke users.id',
  notes TEXT NULL,
  raw_payload JSON NULL COMMENT 'Payload asli dari API',
  items JSON NULL COMMENT 'Daftar item rincian transaksi',
  callback_sent_at DATETIME NULL COMMENT 'Waktu callback terakhir dikirim',
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_trx_external (external_transaction_id, api_client_id),
  INDEX idx_trx_customer (customer_id),
  INDEX idx_trx_source (source_type),
  INDEX idx_trx_api_client (api_client_id),
  INDEX idx_trx_status (payment_status),
  INDEX idx_trx_type (transaction_type),
  INDEX idx_trx_due_date (due_date),
  INDEX idx_trx_confirmed_by (confirmed_by),
  INDEX idx_trx_created_at (created_at),
  INDEX idx_trx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
-- 4. invoices
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(30) NOT NULL COMMENT 'INV-YYYYMM-XXXX',
  transaction_id INT NOT NULL COMMENT 'Ref logis ke transactions.id',
  customer_id INT NULL COMMENT 'Ref logis ke customers.id',
  nama_manual VARCHAR(255) NULL,
  no_wa_manual VARCHAR(50) NULL,
  subtotal BIGINT NOT NULL DEFAULT 0,
  discount BIGINT NOT NULL DEFAULT 0,
  total BIGINT NOT NULL DEFAULT 0,
  status ENUM('draft', 'terkirim', 'dibayar', 'overdue', 'dibatalkan') NOT NULL DEFAULT 'draft',
  issued_date DATE NOT NULL,
  due_date DATE NOT NULL,
  sent_wa_at DATETIME NULL,
  sent_email_at DATETIME NULL,
  paid_at DATETIME NULL,
  notes TEXT NULL,
  internal_notes TEXT NULL,
  pdf_path VARCHAR(500) NULL,
  created_by INT NULL COMMENT 'Ref logis ke users.id',
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_invoices_number (invoice_number),
  INDEX idx_invoices_transaction (transaction_id),
  INDEX idx_invoices_customer (customer_id),
  INDEX idx_invoices_status (status),
  INDEX idx_invoices_due_date (due_date),
  INDEX idx_invoices_created_by (created_by),
  INDEX idx_invoices_created_at (created_at),
  INDEX idx_invoices_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
-- 5. invoice_items
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL COMMENT 'Ref logis ke invoices.id',
  description TEXT NOT NULL,
  sub_description VARCHAR(500) NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price BIGINT NOT NULL DEFAULT 0,
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  subtotal BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_invoice_items_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
-- 6. receipts
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receipts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  receipt_number VARCHAR(30) NOT NULL COMMENT 'KWT-YYYYMM-XXXX',
  invoice_id INT NOT NULL COMMENT 'Ref logis ke invoices.id (1:1)',
  customer_id INT NULL COMMENT 'Ref logis ke customers.id',
  nama_manual VARCHAR(255) NULL,
  issued_date DATE NOT NULL,
  amount_received BIGINT NOT NULL,
  payment_method VARCHAR(100) NOT NULL DEFAULT 'Transfer Bank',
  received_by VARCHAR(255) NULL,
  notes TEXT NULL,
  sent_wa_at DATETIME NULL,
  sent_email_at DATETIME NULL,
  send_status ENUM('belum', 'terkirim', 'gagal') NOT NULL DEFAULT 'belum',
  pdf_path VARCHAR(500) NULL,
  created_by INT NULL COMMENT 'Ref logis ke users.id',
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_receipts_number (receipt_number),
  UNIQUE KEY uk_receipts_invoice (invoice_id),
  INDEX idx_receipts_customer (customer_id),
  INDEX idx_receipts_status (send_status),
  INDEX idx_receipts_created_by (created_by),
  INDEX idx_receipts_created_at (created_at),
  INDEX idx_receipts_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
-- 7. reminders
-- Gabungan: reminder_jobs + reminder_logs
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL COMMENT 'Ref logis ke invoices.id',
  customer_id INT NULL COMMENT 'Ref logis ke customers.id',
  recipient_contact VARCHAR(255) NOT NULL COMMENT 'Email atau nomor WA tujuan',
  reminder_type ENUM('H30', 'H7', 'H1', 'overdue', 'manual') NOT NULL,
  channel ENUM('email', 'whatsapp') NOT NULL DEFAULT 'email',
  scheduled_at DATETIME NOT NULL COMMENT 'Waktu dijadwalkan',
  status ENUM('pending', 'processing', 'sent', 'failed', 'skipped') NOT NULL DEFAULT 'pending',
  attempt_count INT NOT NULL DEFAULT 0,
  last_attempt_at DATETIME NULL,
  sent_at DATETIME NULL,
  message_content TEXT NULL COMMENT 'Isi pesan yang dikirim',
  gateway_response TEXT NULL COMMENT 'Response dari gateway WA/Email',
  error_message TEXT NULL,
  sent_by INT NULL COMMENT 'Ref logis ke users.id (untuk manual)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_reminders_dedup (invoice_id, reminder_type, channel),
  INDEX idx_reminders_customer (customer_id),
  INDEX idx_reminders_status (status),
  INDEX idx_reminders_scheduled (scheduled_at),
  INDEX idx_reminders_type (reminder_type),
  INDEX idx_reminders_sent_by (sent_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
-- 8. cash_books
-- Baru: Kas masuk & kas keluar
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cash_books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('income', 'expense') NOT NULL,
  transaction_id INT NULL COMMENT 'Ref logis ke transactions.id',
  invoice_id INT NULL COMMENT 'Ref logis ke invoices.id',
  receipt_id INT NULL COMMENT 'Ref logis ke receipts.id',
  amount BIGINT NOT NULL DEFAULT 0,
  category VARCHAR(100) NULL COMMENT 'Kategori: hosting, domain, operasional, dll',
  description TEXT NULL,
  entry_date DATE NOT NULL,
  created_by INT NULL COMMENT 'Ref logis ke users.id',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_cashbooks_type (type),
  INDEX idx_cashbooks_transaction (transaction_id),
  INDEX idx_cashbooks_invoice (invoice_id),
  INDEX idx_cashbooks_receipt (receipt_id),
  INDEX idx_cashbooks_entry_date (entry_date),
  INDEX idx_cashbooks_created_by (created_by),
  INDEX idx_cashbooks_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
-- 9. api_clients
-- Gabungan: api_clients + api_tokens (token dihapus)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_name VARCHAR(100) NOT NULL,
  client_code VARCHAR(50) NOT NULL,
  api_key VARCHAR(64) NOT NULL,
  api_secret VARCHAR(128) NOT NULL,
  callback_url VARCHAR(500) NULL,
  callback_secret VARCHAR(128) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  rate_limit_per_minute INT NOT NULL DEFAULT 60,
  allowed_ips TEXT NULL COMMENT 'Comma-separated IP whitelist',
  description TEXT NULL,
  token_revoked_at DATETIME NULL COMMENT 'Jika di-set, semua token lama invalid',
  created_by INT NULL COMMENT 'Ref logis ke users.id',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_api_clients_code (client_code),
  UNIQUE KEY uk_api_clients_key (api_key),
  INDEX idx_api_clients_active (is_active),
  INDEX idx_api_clients_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
-- 10. api_logs
-- Gabungan: api_request_log + callback_log
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  log_type ENUM('request', 'callback') NOT NULL DEFAULT 'request',
  api_client_id INT NULL COMMENT 'Ref logis ke api_clients.id',
  method VARCHAR(10) NULL,
  endpoint VARCHAR(500) NULL,
  ref_transaction_id INT NULL COMMENT 'Ref logis ke transactions.id (untuk callback)',
  request_body TEXT NULL,
  response_status INT NULL,
  response_body TEXT NULL,
  ip_address VARCHAR(50) NULL,
  user_agent VARCHAR(500) NULL,
  duration_ms INT NULL,
  attempt_count INT NOT NULL DEFAULT 1,
  status ENUM('success', 'failed', 'pending') NOT NULL DEFAULT 'success',
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_api_logs_type (log_type),
  INDEX idx_api_logs_client (api_client_id),
  INDEX idx_api_logs_ref_trx (ref_transaction_id),
  INDEX idx_api_logs_status (status),
  INDEX idx_api_logs_created (created_at),
  INDEX idx_api_logs_client_created (api_client_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
-- 11. settings
-- Gabungan: global_settings + notification_settings
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NULL,
  setting_group VARCHAR(50) NOT NULL DEFAULT 'general' COMMENT 'general, smtp, whatsapp, scheduler, company, gemini',
  description VARCHAR(255) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_settings_key (setting_key),
  INDEX idx_settings_group (setting_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
-- 12. audit_logs
-- Gabungan: user_audit_trails + system logs
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL COMMENT 'Ref logis ke users.id (NULL untuk system)',
  action VARCHAR(255) NOT NULL COMMENT 'login, approve_transaction, create_invoice, dll',
  entity_type VARCHAR(50) NULL COMMENT 'transaction, invoice, receipt, customer, dll',
  entity_id INT NULL COMMENT 'ID dari entity terkait',
  old_values JSON NULL COMMENT 'Snapshot sebelum perubahan',
  new_values JSON NULL COMMENT 'Snapshot sesudah perubahan',
  ip_address VARCHAR(50) NULL,
  user_agent VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_audit_user (user_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Tabel untuk transaction_items
CREATE TABLE IF NOT EXISTS transaction_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id INT NOT NULL COMMENT 'Ref logis ke transactions.id',
  tanggal DATE,
  tipe VARCHAR(50),
  status_pembayaran VARCHAR(50),
  jumlah BIGINT DEFAULT 0,
  kuantitas INT DEFAULT 1,
  diskon BIGINT DEFAULT 0,
  nama_pembeli VARCHAR(255),
  no_telepon VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);
