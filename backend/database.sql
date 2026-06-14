-- Database KroomBox SQL schema

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

-- 4. Table pembayaran_masuk (Transactions linked to Customers)
CREATE TABLE IF NOT EXISTS pembayaran_masuk (
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
  FOREIGN KEY (pelanggan_id) REFERENCES master_customers(id_pelanggan) ON DELETE CASCADE,
  FOREIGN KEY (dikonfirmasi_oleh) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Table user_audit_trails (Action logs)
CREATE TABLE IF NOT EXISTS user_audit_trails (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  aktivitas VARCHAR(255) NOT NULL,
  ip_address VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
