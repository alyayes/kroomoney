import { pool } from '../config/db.js';

class ReceiptModel {
  // Generate nomor kwitansi otomatis: KWT-YYYYMM-XXXX
  static async generateNomor() {
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `KWT-${yyyymm}-`;
    const [rows] = await pool.query(
      `SELECT receipt_number FROM receipts WHERE receipt_number LIKE ? ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );
    if (rows.length === 0) return `${prefix}0001`;
    const lastNum = parseInt(rows[0].receipt_number.split('-').pop(), 10);
    return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
  }

  // Helper to select receipts with backward compatible aliases
  static get selectFields() {
    return `
      r.id,
      r.receipt_number,
      r.receipt_number AS nomor_kwitansi,
      r.invoice_id,
      r.customer_id,
      c.customer_code AS pelanggan_id,
      r.nama_manual,
      r.issued_date,
      r.issued_date AS tanggal_terbit,
      r.amount_received,
      r.amount_received AS nominal_diterima,
      r.payment_method,
      r.payment_method AS metode_pembayaran,
      r.received_by,
      r.received_by AS diterima_oleh,
      r.notes,
      r.notes AS keterangan,
      r.sent_wa_at,
      r.sent_wa_at AS tanggal_kirim_wa,
      r.sent_email_at,
      r.sent_email_at AS tanggal_kirim_email,
      r.send_status,
      r.send_status AS status_kirim,
      r.pdf_path,
      r.created_by,
      r.created_at,
      r.updated_at
    `;
  }

  // Get all receipts joined with customer and invoice data
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT ${this.selectFields},
              i.invoice_number AS nomor_invoice, i.total AS nominal_invoice,
              c.name AS nama_pelanggan, c.phone AS no_whatsapp
       FROM receipts r
       LEFT JOIN invoices i ON r.invoice_id = i.id
       LEFT JOIN customers c ON r.customer_id = c.id
       WHERE r.deleted_at IS NULL
       ORDER BY r.created_at DESC`
    );
    return rows;
  }

  // Get single receipt by id
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT ${this.selectFields},
              i.invoice_number AS nomor_invoice,
              c.name AS nama_pelanggan, c.phone AS no_whatsapp
       FROM receipts r
       LEFT JOIN invoices i ON r.invoice_id = i.id
       LEFT JOIN customers c ON r.customer_id = c.id
       WHERE r.id = ? AND r.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  // Get receipt by invoice_id (1:1 relation)
  static async findByInvoiceId(invoice_id) {
    const [rows] = await pool.query(
      `SELECT ${this.selectFields} FROM receipts r
       LEFT JOIN customers c ON r.customer_id = c.id
       WHERE r.invoice_id = ? AND r.deleted_at IS NULL LIMIT 1`,
      [invoice_id]
    );
    return rows[0] || null;
  }

  // Create new receipt
  static async create({
    invoice_id, pelanggan_id, nama_manual,
    tanggal_terbit, nominal_diterima,
    metode_pembayaran, diterima_oleh, keterangan, created_by
  }) {
    const nomor_kwitansi = await ReceiptModel.generateNomor();
    
    // Resolve customer_id
    let customerId = null;
    if (pelanggan_id) {
      const [cRows] = await pool.query('SELECT id FROM customers WHERE customer_code = ? AND deleted_at IS NULL', [pelanggan_id]);
      customerId = cRows[0]?.id || null;
    }

    const [result] = await pool.query(
      `INSERT INTO receipts 
       (receipt_number, invoice_id, customer_id, nama_manual, issued_date, amount_received, payment_method, received_by, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nomor_kwitansi,
        invoice_id,
        customerId,
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
      'UPDATE receipts SET send_status = "terkirim", sent_wa_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
  }

  // Mark receipt as sent via Email
  static async markSentEmail(id) {
    await pool.query(
      'UPDATE receipts SET send_status = "terkirim", sent_email_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
  }

  // Update pdf_path after PDF generation
  static async updatePdfPath(id, pdf_path) {
    await pool.query('UPDATE receipts SET pdf_path = ? WHERE id = ? AND deleted_at IS NULL', [pdf_path, id]);
  }

  // Soft delete receipt
  static async delete(id) {
    await pool.query('UPDATE receipts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL', [id]);
  }
}

export default ReceiptModel;
