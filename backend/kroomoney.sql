-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: localhost    Database: kroomoney
-- ------------------------------------------------------
-- Server version	8.4.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `api_clients`
--

DROP TABLE IF EXISTS `api_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_clients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `api_key` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `api_secret` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `callback_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `callback_secret` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `rate_limit_per_minute` int NOT NULL DEFAULT '60',
  `allowed_ips` text COLLATE utf8mb4_unicode_ci COMMENT 'Comma-separated IP whitelist',
  `description` text COLLATE utf8mb4_unicode_ci,
  `token_revoked_at` datetime DEFAULT NULL COMMENT 'Jika di-set, semua token lama invalid',
  `created_by` int DEFAULT NULL COMMENT 'Ref logis ke users.id',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_api_clients_code` (`client_code`),
  UNIQUE KEY `uk_api_clients_key` (`api_key`),
  KEY `idx_api_clients_active` (`is_active`),
  KEY `idx_api_clients_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_clients`
--

LOCK TABLES `api_clients` WRITE;
/*!40000 ALTER TABLE `api_clients` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_logs`
--

DROP TABLE IF EXISTS `api_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `log_type` enum('request','callback') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'request',
  `api_client_id` int DEFAULT NULL COMMENT 'Ref logis ke api_clients.id',
  `method` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `endpoint` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ref_transaction_id` int DEFAULT NULL COMMENT 'Ref logis ke transactions.id (untuk callback)',
  `request_body` text COLLATE utf8mb4_unicode_ci,
  `response_status` int DEFAULT NULL,
  `response_body` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_ms` int DEFAULT NULL,
  `attempt_count` int NOT NULL DEFAULT '1',
  `status` enum('success','failed','pending') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'success',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_api_logs_type` (`log_type`),
  KEY `idx_api_logs_client` (`api_client_id`),
  KEY `idx_api_logs_ref_trx` (`ref_transaction_id`),
  KEY `idx_api_logs_status` (`status`),
  KEY `idx_api_logs_created` (`created_at`),
  KEY `idx_api_logs_client_created` (`api_client_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_logs`
--

LOCK TABLES `api_logs` WRITE;
/*!40000 ALTER TABLE `api_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL COMMENT 'Ref logis ke users.id (NULL untuk system)',
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'login, approve_transaction, create_invoice, dll',
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'transaction, invoice, receipt, customer, dll',
  `entity_id` int DEFAULT NULL COMMENT 'ID dari entity terkait',
  `old_values` json DEFAULT NULL COMMENT 'Snapshot sebelum perubahan',
  `new_values` json DEFAULT NULL COMMENT 'Snapshot sesudah perubahan',
  `ip_address` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  KEY `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cash_books`
--

DROP TABLE IF EXISTS `cash_books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cash_books` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('income','expense') COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_id` int DEFAULT NULL COMMENT 'Ref logis ke transactions.id',
  `invoice_id` int DEFAULT NULL COMMENT 'Ref logis ke invoices.id',
  `receipt_id` int DEFAULT NULL COMMENT 'Ref logis ke receipts.id',
  `amount` bigint NOT NULL DEFAULT '0',
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kategori: hosting, domain, operasional, dll',
  `description` text COLLATE utf8mb4_unicode_ci,
  `entry_date` date NOT NULL,
  `created_by` int DEFAULT NULL COMMENT 'Ref logis ke users.id',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cashbooks_type` (`type`),
  KEY `idx_cashbooks_transaction` (`transaction_id`),
  KEY `idx_cashbooks_invoice` (`invoice_id`),
  KEY `idx_cashbooks_receipt` (`receipt_id`),
  KEY `idx_cashbooks_entry_date` (`entry_date`),
  KEY `idx_cashbooks_created_by` (`created_by`),
  KEY `idx_cashbooks_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_books`
--

LOCK TABLES `cash_books` WRITE;
/*!40000 ALTER TABLE `cash_books` DISABLE KEYS */;
/*!40000 ALTER TABLE `cash_books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode unik pelanggan (ex: PLG-001)',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source_type` enum('manual','api') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual',
  `external_customer_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ID dari app eksternal',
  `api_client_id` int DEFAULT NULL COMMENT 'Ref logis ke api_clients.id',
  `hosting_package` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Paket hosting (legacy)',
  `billing_amount` bigint DEFAULT '0' COMMENT 'Nominal tagihan default',
  `billing_due_date` date DEFAULT NULL COMMENT 'Tanggal jatuh tempo default',
  `metadata` json DEFAULT NULL COMMENT 'Data tambahan dari API',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_customers_code` (`customer_code`),
  UNIQUE KEY `uk_customers_ext` (`external_customer_id`,`api_client_id`),
  KEY `idx_customers_source` (`source_type`),
  KEY `idx_customers_api_client` (`api_client_id`),
  KEY `idx_customers_email` (`email`),
  KEY `idx_customers_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL COMMENT 'Ref logis ke invoices.id',
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sub_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` bigint NOT NULL DEFAULT '0',
  `discount_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `subtotal` bigint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_invoice_items_invoice` (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_items`
--

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'INV-YYYYMM-XXXX',
  `transaction_id` int NOT NULL COMMENT 'Ref logis ke transactions.id',
  `customer_id` int DEFAULT NULL COMMENT 'Ref logis ke customers.id',
  `nama_manual` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_wa_manual` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotal` bigint NOT NULL DEFAULT '0',
  `discount` bigint NOT NULL DEFAULT '0',
  `total` bigint NOT NULL DEFAULT '0',
  `status` enum('draft','terkirim','dibayar','overdue','dibatalkan') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `issued_date` date NOT NULL,
  `due_date` date NOT NULL,
  `sent_wa_at` datetime DEFAULT NULL,
  `sent_email_at` datetime DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `internal_notes` text COLLATE utf8mb4_unicode_ci,
  `pdf_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL COMMENT 'Ref logis ke users.id',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_invoices_number` (`invoice_number`),
  KEY `idx_invoices_transaction` (`transaction_id`),
  KEY `idx_invoices_customer` (`customer_id`),
  KEY `idx_invoices_status` (`status`),
  KEY `idx_invoices_due_date` (`due_date`),
  KEY `idx_invoices_created_by` (`created_by`),
  KEY `idx_invoices_created_at` (`created_at`),
  KEY `idx_invoices_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receipts`
--

DROP TABLE IF EXISTS `receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receipts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `receipt_number` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'KWT-YYYYMM-XXXX',
  `invoice_id` int NOT NULL COMMENT 'Ref logis ke invoices.id (1:1)',
  `customer_id` int DEFAULT NULL COMMENT 'Ref logis ke customers.id',
  `nama_manual` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issued_date` date NOT NULL,
  `amount_received` bigint NOT NULL,
  `payment_method` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Transfer Bank',
  `received_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `sent_wa_at` datetime DEFAULT NULL,
  `sent_email_at` datetime DEFAULT NULL,
  `send_status` enum('belum','terkirim','gagal') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'belum',
  `pdf_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL COMMENT 'Ref logis ke users.id',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_receipts_number` (`receipt_number`),
  UNIQUE KEY `uk_receipts_invoice` (`invoice_id`),
  KEY `idx_receipts_customer` (`customer_id`),
  KEY `idx_receipts_status` (`send_status`),
  KEY `idx_receipts_created_by` (`created_by`),
  KEY `idx_receipts_created_at` (`created_at`),
  KEY `idx_receipts_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipts`
--

LOCK TABLES `receipts` WRITE;
/*!40000 ALTER TABLE `receipts` DISABLE KEYS */;
/*!40000 ALTER TABLE `receipts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reminders`
--

DROP TABLE IF EXISTS `reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL COMMENT 'Ref logis ke invoices.id',
  `customer_id` int DEFAULT NULL COMMENT 'Ref logis ke customers.id',
  `recipient_contact` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Email atau nomor WA tujuan',
  `reminder_type` enum('H30','H7','H1','overdue','manual') COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` enum('email','whatsapp') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'email',
  `scheduled_at` datetime NOT NULL COMMENT 'Waktu dijadwalkan',
  `status` enum('pending','processing','sent','failed','skipped') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `attempt_count` int NOT NULL DEFAULT '0',
  `last_attempt_at` datetime DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `message_content` text COLLATE utf8mb4_unicode_ci COMMENT 'Isi pesan yang dikirim',
  `gateway_response` text COLLATE utf8mb4_unicode_ci COMMENT 'Response dari gateway WA/Email',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `sent_by` int DEFAULT NULL COMMENT 'Ref logis ke users.id (untuk manual)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reminders_dedup` (`invoice_id`,`reminder_type`,`channel`),
  KEY `idx_reminders_customer` (`customer_id`),
  KEY `idx_reminders_status` (`status`),
  KEY `idx_reminders_scheduled` (`scheduled_at`),
  KEY `idx_reminders_type` (`reminder_type`),
  KEY `idx_reminders_sent_by` (`sent_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reminders`
--

LOCK TABLES `reminders` WRITE;
/*!40000 ALTER TABLE `reminders` DISABLE KEYS */;
/*!40000 ALTER TABLE `reminders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `setting_group` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general' COMMENT 'general, smtp, whatsapp, scheduler, company, gemini',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_settings_key` (`setting_key`),
  KEY `idx_settings_group` (`setting_group`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'gemini_api_key','','gemini','Gemini API Key','2026-06-19 07:34:58'),(2,'gemini_model_version','gemini-1.5-flash','gemini','Gemini model version setting','2026-06-19 07:34:58'),(3,'gemini_temperature','0.2','gemini','Gemini temperature setting','2026-06-19 07:34:58'),(4,'whatsapp_token','whatsapp_mock_token_session_2026','whatsapp','WhatsApp token','2026-06-19 07:34:58');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL COMMENT 'Ref logis ke customers.id',
  `nama_manual` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_whatsapp_manual` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source_type` enum('manual','api') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual',
  `external_transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'TRX ID dari app eksternal',
  `api_client_id` int DEFAULT NULL COMMENT 'Ref logis ke api_clients.id',
  `service_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nama layanan/paket',
  `description` text COLLATE utf8mb4_unicode_ci,
  `amount` bigint NOT NULL DEFAULT '0',
  `quantity` int NOT NULL DEFAULT '1',
  `discount` bigint NOT NULL DEFAULT '0' COMMENT 'Nominal diskon manual',
  `due_date` date NOT NULL,
  `payment_status` enum('pending','lunas','dp','belum_lunas') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `document_status` enum('draft','diproses','disetujui') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `transaction_type` enum('pemasukan','pengeluaran') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pemasukan',
  `include_signature` tinyint(1) NOT NULL DEFAULT '0',
  `confirmed_by` int DEFAULT NULL COMMENT 'Ref logis ke users.id',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `raw_payload` json DEFAULT NULL COMMENT 'Payload asli dari API',
  `items` json DEFAULT NULL COMMENT 'Daftar item rincian transaksi',
  `callback_sent_at` datetime DEFAULT NULL COMMENT 'Waktu callback terakhir dikirim',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_trx_external` (`external_transaction_id`,`api_client_id`),
  KEY `idx_trx_customer` (`customer_id`),
  KEY `idx_trx_source` (`source_type`),
  KEY `idx_trx_api_client` (`api_client_id`),
  KEY `idx_trx_status` (`payment_status`),
  KEY `idx_trx_type` (`transaction_type`),
  KEY `idx_trx_due_date` (`due_date`),
  KEY `idx_trx_confirmed_by` (`confirmed_by`),
  KEY `idx_trx_created_at` (`created_at`),
  KEY `idx_trx_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_lengkap` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin_sistem','bendahara') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'bendahara',
  `status_akun` enum('menunggu_persetujuan','aktif','nonaktif') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'menunggu_persetujuan',
  `foto_profil` text COLLATE utf8mb4_unicode_ci,
  `tanda_tangan` text COLLATE utf8mb4_unicode_ci,
  `reset_otp` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_otp_expiry` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Super Admin','admin@kroomoney.com','$2a$10$Zas07sowARDokzbrUxXOK.mTxrVG8PB1lro9CKM.7nEwzbYRQggg.','admin_sistem','aktif',NULL,NULL,NULL,NULL,'2026-06-19 07:34:58','2026-06-19 07:34:58');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-19 14:36:11


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
