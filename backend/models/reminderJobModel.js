import { pool } from '../config/db.js';

class ReminderJobModel {
  // Get all jobs with optional filter
  static async findAll({ status, tipe_reminder } = {}) {
    let query = `
      SELECT rj.*,
             i.nomor_invoice, i.tanggal_jatuh_tempo, i.total,
             c.nama_pelanggan, c.no_whatsapp AS customer_no_wa
      FROM reminder_jobs rj
      LEFT JOIN invoices i ON rj.invoice_id = i.id
      LEFT JOIN master_customers c ON rj.pelanggan_id = c.id_pelanggan
    `;
    const conditions = [];
    const values = [];
    if (status) { conditions.push('rj.status = ?'); values.push(status); }
    if (tipe_reminder) { conditions.push('rj.tipe_reminder = ?'); values.push(tipe_reminder); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY rj.scheduled_at ASC';
    const [rows] = await pool.query(query, values);
    return rows;
  }

  // Get pending jobs that are due to be processed (scheduled_at <= NOW)
  static async findPending() {
    const [rows] = await pool.query(
      `SELECT rj.*,
              i.nomor_invoice, i.tanggal_jatuh_tempo, i.total, i.status_invoice,
              c.nama_pelanggan, c.no_whatsapp, c.id_pelanggan
       FROM reminder_jobs rj
       LEFT JOIN invoices i ON rj.invoice_id = i.id
       LEFT JOIN master_customers c ON rj.pelanggan_id = c.id_pelanggan
       WHERE rj.status = 'pending'
         AND rj.scheduled_at <= NOW()
         AND rj.attempt_count < 3
       ORDER BY rj.scheduled_at ASC
       LIMIT 50`
    );
    return rows;
  }

  // Get failed jobs eligible for retry (attempt_count < 3, last_attempt_at > 30min ago)
  static async findRetryable() {
    const [rows] = await pool.query(
      `SELECT rj.*,
              i.nomor_invoice, i.tanggal_jatuh_tempo, i.total, i.status_invoice,
              c.nama_pelanggan, c.no_whatsapp
       FROM reminder_jobs rj
       LEFT JOIN invoices i ON rj.invoice_id = i.id
       LEFT JOIN master_customers c ON rj.pelanggan_id = c.id_pelanggan
       WHERE rj.status = 'failed'
         AND rj.attempt_count < 3
         AND rj.last_attempt_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
       ORDER BY rj.last_attempt_at ASC
       LIMIT 20`
    );
    return rows;
  }

  // Check if a job already exists (deduplication)
  static async exists(invoice_id, tipe_reminder, channel) {
    const [rows] = await pool.query(
      'SELECT id, status FROM reminder_jobs WHERE invoice_id = ? AND tipe_reminder = ? AND channel = ? LIMIT 1',
      [invoice_id, tipe_reminder, channel]
    );
    return rows[0] || null;
  }

  // Create a new job (upsert if exists)
  static async create({ invoice_id, pelanggan_id, email_tujuan, tipe_reminder, channel, email_template_id, scheduled_at }) {
    const [result] = await pool.query(
      `INSERT INTO reminder_jobs (invoice_id, pelanggan_id, email_tujuan, tipe_reminder, channel, email_template_id, scheduled_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         scheduled_at = VALUES(scheduled_at),
         status = IF(status IN ('sent','skipped'), status, 'pending'),
         updated_at = NOW()`,
      [invoice_id, pelanggan_id || null, email_tujuan || null, tipe_reminder, channel || 'email', email_template_id || null, scheduled_at]
    );
    return result.insertId;
  }

  // Update job status
  static async updateStatus(id, status, { error_message, sent_at } = {}) {
    const fields = ['status = ?', 'attempt_count = attempt_count + 1', 'last_attempt_at = NOW()'];
    const values = [status];
    if (error_message !== undefined) { fields.push('error_message = ?'); values.push(error_message); }
    if (sent_at !== undefined) { fields.push('sent_at = ?'); values.push(sent_at); }
    values.push(id);
    await pool.query(`UPDATE reminder_jobs SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  // Mark job as processing (lock for concurrent safety)
  static async markProcessing(id) {
    const [result] = await pool.query(
      "UPDATE reminder_jobs SET status = 'processing', last_attempt_at = NOW() WHERE id = ? AND status IN ('pending','failed')",
      [id]
    );
    return result.affectedRows > 0;
  }
}

export default ReminderJobModel;
