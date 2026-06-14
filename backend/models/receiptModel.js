import { pool } from '../config/db.js';

class ReceiptModel {
  // Generate nomor kwitansi otomatis: KWT-YYYY-NNNNN
  static async generateNomor() {
    const year = new Date().getFullYear();
    const prefix = `KWT-${year}-`;
    const [rows] = await pool.query(
      `SELECT nomor_kwitansi FROM receipts WHERE nomor_kwitansi LIKE ? ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );
    if (rows.length === 0) return `${prefix}00001`;
    const lastNum = parseInt(rows[0].nomor_kwitansi.replace(prefix, ''), 10);
    return `${prefix}${String(lastNum + 1).padStart(5, '0')}`;
  }

  // Get all receipts joined with customer and invoice data
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT r.*,
              i.nomor_invoice, i.total AS nominal_invoice,
              c.nama_pelanggan, c.no_whatsapp
       FROM receipts r
       LEFT JOIN invoices i ON r.invoice_id = i.id
       LEFT JOIN master_customers c ON r.pelanggan_id = c.id_pelanggan
       ORDER BY r.created_at DESC`
    );
    return rows;
  }

  // Get single receipt by id
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT r.*,
              i.nomor_invoice,
              c.nama_pelanggan, c.no_whatsapp
       FROM receipts r
       LEFT JOIN invoices i ON r.invoice_id = i.id
       LEFT JOIN master_customers c ON r.pelanggan_id = c.id_pelanggan
       WHERE r.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  // Get receipt by invoice_id (1:1 relation)
  static async findByInvoiceId(invoice_id) {
    const [rows] = await pool.query(
      'SELECT * FROM receipts WHERE invoice_id = ? LIMIT 1',
      [invoice_id]
    );
    return rows[0] || null;
  }

  // Create new receipt (biasanya dipanggil otomatis setelah invoice dibayar)
  static async create({
    invoice_id, pelanggan_id, nama_manual,
    tanggal_terbit, nominal_diterima,
    metode_pembayaran, diterima_oleh, keterangan, created_by
  }) {
    const nomor_kwitansi = await ReceiptModel.generateNomor();
    const [result] = await pool.query(
      `INSERT INTO receipts 
       (nomor_kwitansi, invoice_id, pelanggan_id, nama_manual, tanggal_terbit, nominal_diterima, metode_pembayaran, diterima_oleh, keterangan, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nomor_kwitansi,
        invoice_id,
        pelanggan_id || null,
        nama_manual || null,
        tanggal_terbit,
        nominal_diterima,
        metode_pembayaran || 'Transfer Bank',
        diterima_oleh || null,
        keterangan || null,
        created_by || null
      ]
    );
    return { insertId: result.insertId, nomor_kwitansi };
  }

  // Mark receipt as sent via WA
  static async markSentWa(id) {
    await pool.query(
      'UPDATE receipts SET status_kirim = "terkirim", tanggal_kirim_wa = NOW() WHERE id = ?',
      [id]
    );
  }

  // Mark receipt as sent via Email
  static async markSentEmail(id) {
    await pool.query(
      'UPDATE receipts SET status_kirim = "terkirim", tanggal_kirim_email = NOW() WHERE id = ?',
      [id]
    );
  }

  // Delete receipt
  static async delete(id) {
    await pool.query('DELETE FROM receipts WHERE id = ?', [id]);
  }
}

export default ReceiptModel;
