import { pool } from '../config/db.js';

class ReminderModel {
  // Get all reminders (logs/jobs) joined with invoice and customer details
  static async findAll({ status, tipe_reminder } = {}) {
    let query = `
      SELECT r.*,
             r.recipient_contact AS email_tujuan,
             r.reminder_type AS tipe_reminder,
             i.invoice_number, i.invoice_number AS nomor_invoice, 
             i.due_date AS tanggal_jatuh_tempo, i.total,
             c.name AS nama_pelanggan, c.phone AS customer_no_wa,
             r.sent_by AS dikirim_oleh
      FROM reminders r
      LEFT JOIN invoices i ON r.invoice_id = i.id
      LEFT JOIN customers c ON r.customer_id = c.id
    `;
    const conditions = [];
    const values = [];
    if (status) { conditions.push('r.status = ?'); values.push(status); }
    if (tipe_reminder) { conditions.push('r.reminder_type = ?'); values.push(tipe_reminder); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY r.scheduled_at DESC, r.created_at DESC';
    
    const [rows] = await pool.query(query, values);
    return rows;
  }

  // Get pending jobs that are due to be processed
  static async findPending() {
    const [rows] = await pool.query(
      `SELECT r.*,
              r.recipient_contact AS email_tujuan,
              r.reminder_type AS tipe_reminder,
              i.invoice_number, i.invoice_number AS nomor_invoice, 
              i.due_date AS tanggal_jatuh_tempo, i.total, i.status AS status_invoice,
              c.name AS nama_pelanggan, c.phone AS no_whatsapp, c.customer_code AS id_pelanggan
       FROM reminders r
       LEFT JOIN invoices i ON r.invoice_id = i.id
       LEFT JOIN customers c ON r.customer_id = c.id
       WHERE r.status = 'pending'
         AND r.scheduled_at <= NOW()
         AND r.attempt_count < 3
       ORDER BY r.scheduled_at ASC
       LIMIT 50`
    );
    return rows;
  }

  // Get failed jobs eligible for retry
  static async findRetryable() {
    const [rows] = await pool.query(
      `SELECT r.*,
              r.recipient_contact AS email_tujuan,
              r.reminder_type AS tipe_reminder,
              i.invoice_number, i.invoice_number AS nomor_invoice, 
              i.due_date AS tanggal_jatuh_tempo, i.total, i.status AS status_invoice,
              c.name AS nama_pelanggan, c.phone AS no_whatsapp
       FROM reminders r
       LEFT JOIN invoices i ON r.invoice_id = i.id
       LEFT JOIN customers c ON r.customer_id = c.id
       WHERE r.status = 'failed'
         AND r.attempt_count < 3
         AND r.last_attempt_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
       ORDER BY r.last_attempt_at ASC
       LIMIT 20`
    );
    return rows;
  }

  // Check if a reminder exists
  static async exists(invoice_id, tipe_reminder, channel) {
    const [rows] = await pool.query(
      'SELECT id, status FROM reminders WHERE invoice_id = ? AND reminder_type = ? AND channel = ? LIMIT 1',
      [invoice_id, tipe_reminder, channel]
    );
    return rows[0] || null;
  }

  // Helper to resolve customer_id from customer_code
  static async resolveCustomerId(pelanggan_id) {
    if (!pelanggan_id) return null;
    const [rows] = await pool.query('SELECT id FROM customers WHERE customer_code = ? AND deleted_at IS NULL', [pelanggan_id]);
    return rows[0]?.id || null;
  }

  // Create a new reminder job or log entry
  static async create({ invoice_id, pelanggan_id, customer_id, recipient_contact, email_tujuan, no_tujuan, tipe_reminder, reminder_type, channel, scheduled_at, message_content, isi_pesan, sent_by, dikirim_oleh }) {
    const contact = recipient_contact || email_tujuan || no_tujuan || '';
    const type = reminder_type || tipe_reminder;
    const msg = message_content || isi_pesan || '';
    const sender = sent_by || dikirim_oleh || null;

    let custId = customer_id;
    if (!custId && pelanggan_id) {
      custId = await this.resolveCustomerId(pelanggan_id);
    }

    const [result] = await pool.query(
      `INSERT INTO reminders (
        invoice_id, customer_id, recipient_contact, reminder_type, channel, 
        scheduled_at, status, message_content, sent_by
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      ON DUPLICATE KEY UPDATE 
        scheduled_at = VALUES(scheduled_at),
        status = IF(status IN ('sent','skipped'), status, 'pending'),
        message_content = VALUES(message_content),
        updated_at = NOW()`,
      [
        invoice_id,
        custId,
        contact,
        type,
        channel || 'email',
        scheduled_at || new Date(),
        msg,
        sender
      ]
    );
    return result.insertId;
  }

  // Update status after execution attempt
  static async updateStatus(id, status, extra = {}) {
    const fields = ['status = ?', 'attempt_count = attempt_count + 1', 'last_attempt_at = NOW()'];
    const values = [status];
    
    // Support keys from both ReminderJobModel and ReminderLogModel
    const errorMsg = extra.error_message || extra.errorMessage;
    if (errorMsg !== undefined) {
      fields.push('error_message = ?');
      values.push(errorMsg);
    }
    
    const sentAt = extra.sent_at || extra.sentAt;
    if (sentAt !== undefined) {
      fields.push('sent_at = ?');
      values.push(sentAt);
    }

    const gatewayResponse = extra.gateway_response || extra.gatewayResponse;
    if (gatewayResponse !== undefined) {
      fields.push('gateway_response = ?');
      values.push(gatewayResponse);
    }

    // Direct support for raw status_kirim / response_gateway parameters
    // passed as direct arguments: (id, status_kirim, response_gateway)
    if (typeof extra === 'string') {
      // It means the signature is updateStatus(id, status_kirim, response_gateway)
      // mapped by arguments
      const status_kirim = status; // status passed as 2nd arg
      const response_gateway = extra; // response passed as 3rd arg (extra)
      
      const mappedStatus = status_kirim === 'berhasil' ? 'sent' : 'failed';
      fields[0] = 'status = ?';
      values[0] = mappedStatus;
      
      fields.push('gateway_response = ?');
      values.push(response_gateway);
      fields.push('sent_at = NOW()');
    }

    values.push(id);
    await pool.query(`UPDATE reminders SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  // Mark job as processing (lock for concurrent safety)
  static async markProcessing(id) {
    const [result] = await pool.query(
      "UPDATE reminders SET status = 'processing', last_attempt_at = NOW() WHERE id = ? AND status IN ('pending','failed')",
      [id]
    );
    return result.affectedRows > 0;
  }

  // Get reminders by invoice_id
  static async findByInvoiceId(invoice_id) {
    const [rows] = await pool.query(
      `SELECT r.*,
              r.recipient_contact AS no_tujuan,
              r.reminder_type AS tipe_reminder,
              r.status AS status_kirim,
              r.gateway_response AS response_gateway,
              r.sent_by AS dikirim_oleh
       FROM reminders r 
       WHERE r.invoice_id = ? 
       ORDER BY r.created_at DESC`,
      [invoice_id]
    );
    return rows;
  }

  // Get count of reminders sent for an invoice per type
  static async countByInvoiceAndTipe(invoice_id, tipe_reminder) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM reminders WHERE invoice_id = ? AND reminder_type = ? AND status = "sent"',
      [invoice_id, tipe_reminder]
    );
    return rows[0]?.total || 0;
  }
}

export default ReminderModel;
