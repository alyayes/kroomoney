import { pool } from '../config/db.js';

class ReminderLogModel {
  // Get all reminder logs joined with invoice and customer data
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT rl.*,
              i.nomor_invoice,
              c.nama_pelanggan
       FROM reminder_logs rl
       LEFT JOIN invoices i ON rl.invoice_id = i.id
       LEFT JOIN master_customers c ON rl.pelanggan_id = c.id_pelanggan
       ORDER BY rl.created_at DESC`
    );
    return rows;
  }

  // Get reminder logs by invoice_id
  static async findByInvoiceId(invoice_id) {
    const [rows] = await pool.query(
      'SELECT * FROM reminder_logs WHERE invoice_id = ? ORDER BY created_at DESC',
      [invoice_id]
    );
    return rows;
  }

  // Create a new reminder log entry
  static async create({
    invoice_id, pelanggan_id, nama_manual,
    tipe_reminder, channel, no_tujuan,
    isi_pesan, dikirim_oleh
  }) {
    const [result] = await pool.query(
      `INSERT INTO reminder_logs 
       (invoice_id, pelanggan_id, nama_manual, tipe_reminder, channel, no_tujuan, isi_pesan, status_kirim, dikirim_oleh)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        invoice_id,
        pelanggan_id || null,
        nama_manual || null,
        tipe_reminder,
        channel || 'whatsapp',
        no_tujuan,
        isi_pesan,
        dikirim_oleh || null
      ]
    );
    return result.insertId;
  }

  // Update status after gateway response
  static async updateStatus(id, status_kirim, response_gateway) {
    await pool.query(
      'UPDATE reminder_logs SET status_kirim = ?, response_gateway = ? WHERE id = ?',
      [status_kirim, response_gateway || null, id]
    );
  }

  // Get count of reminders sent for an invoice per tipe
  static async countByInvoiceAndTipe(invoice_id, tipe_reminder) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM reminder_logs WHERE invoice_id = ? AND tipe_reminder = ? AND status_kirim = "berhasil"',
      [invoice_id, tipe_reminder]
    );
    return rows[0]?.total || 0;
  }
}

export default ReminderLogModel;
