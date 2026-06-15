import 'dotenv/config';
import { pool } from './config/db.js';

async function migrate() {
  console.log('🚀 Running migrate-v6-api-integration...');

  // 1. Create api_clients
  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_clients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_name VARCHAR(100) NOT NULL COMMENT 'Nama aplikasi: Hosting System, VPS Panel, dll',
      client_code VARCHAR(50) UNIQUE NOT NULL COMMENT 'Kode unik: hosting, vps, domain, crm',
      api_key VARCHAR(64) UNIQUE NOT NULL COMMENT 'API Key (random 64-char hex)',
      api_secret VARCHAR(128) NOT NULL COMMENT 'Secret key untuk HMAC signature',
      callback_url VARCHAR(500) NULL COMMENT 'URL untuk POST callback status update',
      callback_secret VARCHAR(128) NULL COMMENT 'Secret untuk sign callback payload',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      rate_limit_per_minute INT NOT NULL DEFAULT 60,
      allowed_ips TEXT NULL COMMENT 'Comma-separated IP whitelist (NULL = semua diizinkan)',
      description TEXT NULL,
      created_by INT NULL COMMENT 'Admin yang mendaftarkan',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ api_clients table created');

  // 2. Create api_tokens
  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL COMMENT 'Ref ke api_clients.id',
      token VARCHAR(500) NOT NULL COMMENT 'JWT Bearer token',
      expires_at DATETIME NOT NULL,
      is_revoked TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_client_id (client_id),
      INDEX idx_token (token(255))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ api_tokens table created');

  // 3. Create ext_customers
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ext_customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      external_customer_id VARCHAR(100) NOT NULL COMMENT 'ID dari aplikasi sumber',
      source_client_id INT NOT NULL COMMENT 'Ref ke api_clients.id',
      internal_customer_id VARCHAR(50) NULL COMMENT 'Ref ke master_customers.id_pelanggan',
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255) NULL,
      customer_phone VARCHAR(50) NULL,
      raw_data JSON NULL COMMENT 'Data mentah dari API',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_ext_cust (external_customer_id, source_client_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ ext_customers table created');

  // 4. Create ext_transactions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ext_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      external_transaction_id VARCHAR(100) NOT NULL COMMENT 'TRX-123456 dari sumber',
      source_client_id INT NOT NULL COMMENT 'Ref ke api_clients.id',
      source_application VARCHAR(100) NOT NULL COMMENT 'Nama aplikasi sumber',
      internal_transaction_id INT NULL COMMENT 'Ref ke transaksi.id',
      ext_customer_id INT NULL COMMENT 'Ref ke ext_customers.id',
      service_name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      amount BIGINT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      due_date DATE NOT NULL,
      status ENUM('pending','verified','invoice_sent','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
      raw_payload JSON NULL COMMENT 'Full JSON payload dari API',
      callback_sent_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_ext_trx (external_transaction_id, source_client_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ ext_transactions table created');

  // 5. Create callback_log
  await pool.query(`
    CREATE TABLE IF NOT EXISTS callback_log (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      ext_transaction_id INT NOT NULL COMMENT 'Ref ke ext_transactions.id',
      client_id INT NOT NULL,
      callback_url VARCHAR(500) NOT NULL,
      payload JSON NOT NULL,
      http_status INT NULL,
      response_body TEXT NULL,
      attempt_count INT NOT NULL DEFAULT 1,
      status ENUM('success','failed','pending') NOT NULL DEFAULT 'pending',
      error_message TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ callback_log table created');

  // 6. Create api_request_log
  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_request_log (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NULL,
      method VARCHAR(10) NOT NULL,
      endpoint VARCHAR(255) NOT NULL,
      request_body TEXT NULL,
      response_status INT NOT NULL,
      response_body TEXT NULL,
      ip_address VARCHAR(50) NOT NULL,
      user_agent VARCHAR(500) NULL,
      duration_ms INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_client_created (client_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ api_request_log table created');

  // 7. Add email column to master_customers
  try {
    await pool.query('ALTER TABLE master_customers ADD COLUMN email VARCHAR(255) NULL AFTER no_whatsapp');
    console.log('✅ email column added to master_customers');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') console.log('⏭  master_customers.email already exists');
    else throw err;
  }

  // 8. Add source_type and ext_transaction_id columns to transaksi
  try {
    await pool.query("ALTER TABLE transaksi ADD COLUMN source_type ENUM('manual','api') NOT NULL DEFAULT 'manual' AFTER notes");
    console.log('✅ source_type column added to transaksi');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') console.log('⏭  transaksi.source_type already exists');
    else throw err;
  }

  try {
    await pool.query('ALTER TABLE transaksi ADD COLUMN ext_transaction_id INT NULL AFTER source_type');
    console.log('✅ ext_transaction_id column added to transaksi');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') console.log('⏭  transaksi.ext_transaction_id already exists');
    else throw err;
  }

  // 9. Seed default client for testing
  try {
    await pool.query(`
      INSERT INTO api_clients (client_name, client_code, api_key, api_secret, callback_url, callback_secret, description)
      VALUES ('Hosting System', 'hosting', 'test_key', 'test_secret', 'http://localhost:5000/api/health', 'test_callback_secret', 'Seeded client for testing purposes')
      ON DUPLICATE KEY UPDATE description = 'Seeded client for testing purposes'
    `);
    console.log('✅ Seeded default api_client (key: test_key, secret: test_secret)');
  } catch (err) {
    console.error('⚠️ Seeding default client failed:', err.message);
  }

  console.log('\n✅ migrate-v6-api-integration completed successfully!\n');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ migrate-v6-api-integration failed:', err);
  process.exit(1);
});
