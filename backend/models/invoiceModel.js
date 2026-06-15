import { pool } from '../config/db.js';

class InvoiceModel {
  // Generate nomor invoice otomatis: INV-YYYYMM-XXXX
  static async generateNomor() {
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `INV-${yyyymm}-`;
    const [rows] = await pool.query(
      `SELECT nomor_invoice FROM invoices WHERE nomor_invoice LIKE ? ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );
    if (rows.length === 0) return `${prefix}0001`;
    const lastNum = parseInt(rows[0].nomor_invoice.split('-').pop(), 10);
    return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
  }

  // Get all invoices joined with customer name
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT i.*, 
              c.nama_pelanggan, c.no_whatsapp, c.paket_hosting,
              u.nama_lengkap AS dibuat_oleh_nama
       FROM invoices i
       LEFT JOIN master_customers c ON i.pelanggan_id = c.id_pelanggan
       LEFT JOIN users u ON i.created_by = u.id
       ORDER BY i.created_at DESC`
    );
    return rows;
  }

  // Get single invoice by id
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT i.*, 
              c.nama_pelanggan, c.no_whatsapp, c.paket_hosting
       FROM invoices i
       LEFT JOIN master_customers c ON i.pelanggan_id = c.id_pelanggan
       WHERE i.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  // Get invoice by transaksi_id (1:1 relation)
  static async findByTransaksiId(transaksi_id) {
    const [rows] = await pool.query(
      'SELECT * FROM invoices WHERE transaksi_id = ? LIMIT 1',
      [transaksi_id]
    );
    return rows[0] || null;
  }

  // Create new invoice
  static async create({
    transaksi_id, pelanggan_id, nama_manual, no_wa_manual,
    subtotal, diskon, total,
    tanggal_terbit, tanggal_jatuh_tempo,
    catatan, catatan_internal, created_by
  }) {
    const nomor_invoice = await InvoiceModel.generateNomor();
    const [result] = await pool.query(
      `INSERT INTO invoices 
       (nomor_invoice, transaksi_id, pelanggan_id, nama_manual, no_wa_manual, subtotal, diskon, total, tanggal_terbit, tanggal_jatuh_tempo, catatan, catatan_internal, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nomor_invoice,
        transaksi_id,
        pelanggan_id || null,
        nama_manual || null,
        no_wa_manual || null,
        subtotal || 0,
        diskon || 0,
        total || subtotal || 0,
        tanggal_terbit,
        tanggal_jatuh_tempo,
        catatan || null,
        catatan_internal || null,
        created_by || null
      ]
    );
    return { insertId: result.insertId, nomor_invoice };
  }

  // Update invoice fields
  static async update(id, fields) {
    const allowed = ['status_invoice', 'tanggal_kirim_wa', 'tanggal_kirim_email', 'tanggal_bayar', 'catatan', 'catatan_internal', 'diskon', 'total', 'tanggal_jatuh_tempo'];
    const sets = [];
    const values = [];
    for (const key of allowed) {
      if (key in fields) {
        sets.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (sets.length === 0) return;
    values.push(id);
    await pool.query(`UPDATE invoices SET ${sets.join(', ')} WHERE id = ?`, values);
  }

  // Mark invoice as sent via WA
  static async markSentWa(id) {
    await pool.query(
      'UPDATE invoices SET status_invoice = "terkirim", tanggal_kirim_wa = NOW() WHERE id = ?',
      [id]
    );
  }

  // Mark invoice as paid
  static async markPaid(id) {
    await pool.query(
      'UPDATE invoices SET status_invoice = "dibayar", tanggal_bayar = NOW() WHERE id = ?',
      [id]
    );
  }

  // Mark overdue invoices (called by scheduler or manually)
  static async markOverdue() {
    const [result] = await pool.query(
      `UPDATE invoices SET status_invoice = 'overdue'
       WHERE status_invoice IN ('draft', 'terkirim')
         AND tanggal_jatuh_tempo < CURDATE()`
    );
    return result.affectedRows;
  }

  // Update pdf_path after PDF generation
  static async updatePdfPath(id, pdf_path) {
    await pool.query('UPDATE invoices SET pdf_path = ? WHERE id = ?', [pdf_path, id]);
  }

  // Create invoice items (multi-item support)
  static async createItems(invoice_id, items) {
    if (!items || items.length === 0) return;
    const values = items.map(item => [
      invoice_id,
      item.deskripsi || '',
      item.sub_deskripsi || null,
      item.kuantitas || 1,
      item.harga_satuan || 0,
      item.diskon_persen || 0,
      item.subtotal || 0
    ]);
    await pool.query(
      `INSERT INTO invoice_items (invoice_id, deskripsi, sub_deskripsi, kuantitas, harga_satuan, diskon_persen, subtotal) VALUES ?`,
      [values]
    );
  }

  // Get items for an invoice
  static async findItemsByInvoiceId(invoice_id) {
    const [rows] = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC',
      [invoice_id]
    );
    return rows;
  }

  // Delete invoice
  static async delete(id) {
    await pool.query('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
    await pool.query('DELETE FROM invoices WHERE id = ?', [id]);
  }
}

export default InvoiceModel;
