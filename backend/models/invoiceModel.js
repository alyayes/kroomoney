import { pool } from '../config/db.js';

class InvoiceModel {
  // Generate nomor invoice otomatis: INV-YYYYMM-XXXX
  static async generateNomor() {
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `INV-${yyyymm}-`;
    const [rows] = await pool.query(
      `SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );
    if (rows.length === 0) return `${prefix}0001`;
    const lastNum = parseInt(rows[0].invoice_number.split('-').pop(), 10);
    return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
  }

  // Helper to select invoices with backward compatible aliases
  static get selectFields() {
    return `
      i.id,
      i.invoice_number,
      i.invoice_number AS nomor_invoice,
      i.transaction_id,
      i.transaction_id AS transaksi_id,
      i.customer_id,
      c.customer_code AS pelanggan_id,
      i.nama_manual,
      i.no_wa_manual,
      i.subtotal,
      i.discount,
      i.discount AS diskon,
      i.total,
      i.status,
      i.status AS status_invoice,
      i.issued_date,
      i.issued_date AS tanggal_terbit,
      i.due_date,
      i.due_date AS tanggal_jatuh_tempo,
      i.sent_wa_at,
      i.sent_wa_at AS tanggal_kirim_wa,
      i.sent_email_at,
      i.sent_email_at AS tanggal_kirim_email,
      i.paid_at,
      i.paid_at AS tanggal_bayar,
      i.notes,
      i.notes AS catatan,
      i.internal_notes,
      i.internal_notes AS catatan_internal,
      i.pdf_path,
      i.created_by,
      i.created_at,
      i.updated_at
    `;
  }

  // Get all invoices joined with customer name
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT ${this.selectFields}, 
              c.name AS nama_pelanggan, c.phone AS no_whatsapp, c.hosting_package AS paket_hosting,
              u.nama_lengkap AS dibuat_oleh_nama
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       LEFT JOIN users u ON i.created_by = u.id
       WHERE i.deleted_at IS NULL
       ORDER BY i.created_at DESC`
    );
    return rows;
  }

  // Get single invoice by id
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT ${this.selectFields}, 
              c.name AS nama_pelanggan, c.phone AS no_whatsapp, c.hosting_package AS paket_hosting
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       WHERE i.id = ? AND i.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  // Get invoice by transaksi_id (1:1 relation)
  static async findByTransaksiId(transaksi_id) {
    const [rows] = await pool.query(
      `SELECT * FROM invoices WHERE transaction_id = ? AND deleted_at IS NULL LIMIT 1`,
      [transaksi_id]
    );
    if (rows.length === 0) return null;
    
    // Map status_invoice
    const r = rows[0];
    r.nomor_invoice = r.invoice_number;
    r.transaksi_id = r.transaction_id;
    r.status_invoice = r.status;
    r.tanggal_terbit = r.issued_date;
    r.tanggal_jatuh_tempo = r.due_date;
    r.tanggal_kirim_wa = r.sent_wa_at;
    r.tanggal_kirim_email = r.sent_email_at;
    r.tanggal_bayar = r.paid_at;
    r.catatan = r.notes;
    r.catatan_internal = r.internal_notes;
    return r;
  }

  // Create new invoice
  static async create({
    transaksi_id, pelanggan_id, nama_manual, no_wa_manual,
    subtotal, diskon, total,
    tanggal_terbit, tanggal_jatuh_tempo,
    catatan, catatan_internal, created_by
  }) {
    const invoice_number = await InvoiceModel.generateNomor();
    
    // Resolve customer_id
    let customerId = null;
    if (pelanggan_id) {
      const [cRows] = await pool.query('SELECT id FROM customers WHERE customer_code = ? AND deleted_at IS NULL', [pelanggan_id]);
      customerId = cRows[0]?.id || null;
    }

    const [result] = await pool.query(
      `INSERT INTO invoices 
       (invoice_number, transaction_id, customer_id, nama_manual, no_wa_manual, subtotal, discount, total, status, issued_date, due_date, notes, internal_notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)`,
      [
        invoice_number,
        transaksi_id,
        customerId,
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
    return { insertId: result.insertId, nomor_invoice: invoice_number };
  }

  // Update invoice fields
  static async update(id, fields) {
    const keyMap = {
      status_invoice: 'status',
      tanggal_kirim_wa: 'sent_wa_at',
      tanggal_kirim_email: 'sent_email_at',
      tanggal_bayar: 'paid_at',
      catatan: 'notes',
      catatan_internal: 'internal_notes',
      diskon: 'discount',
      total: 'total',
      tanggal_jatuh_tempo: 'due_date'
    };
    
    const sets = [];
    const values = [];
    
    for (const [key, dbCol] of Object.entries(keyMap)) {
      if (key in fields) {
        sets.push(`${dbCol} = ?`);
        values.push(fields[key]);
      }
    }
    
    if (sets.length === 0) return;
    values.push(id);
    await pool.query(`UPDATE invoices SET ${sets.join(', ')} WHERE id = ? AND deleted_at IS NULL`, values);
  }

  // Mark invoice as sent via WA
  static async markSentWa(id) {
    await pool.query(
      'UPDATE invoices SET status = "terkirim", sent_wa_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
  }

  // Mark invoice as paid
  static async markPaid(id) {
    await pool.query(
      'UPDATE invoices SET status = "dibayar", paid_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
  }

  // Mark overdue invoices (called by scheduler or manually)
  static async markOverdue() {
    const [result] = await pool.query(
      `UPDATE invoices SET status = 'overdue'
       WHERE status IN ('draft', 'terkirim')
         AND due_date < CURDATE() AND deleted_at IS NULL`
    );
    return result.affectedRows;
  }

  // Update pdf_path after PDF generation
  static async updatePdfPath(id, pdf_path) {
    await pool.query('UPDATE invoices SET pdf_path = ? WHERE id = ? AND deleted_at IS NULL', [pdf_path, id]);
  }

  // Create invoice items (multi-item support)
  static async createItems(invoice_id, items) {
    if (!items || items.length === 0) return;
    const values = items.map(item => [
      invoice_id,
      item.deskripsi || item.description || '',
      item.sub_deskripsi || item.sub_description || null,
      item.kuantitas || item.quantity || 1,
      item.harga_satuan || item.unit_price || 0,
      item.diskon_persen || item.discount_percent || 0,
      item.subtotal || 0
    ]);
    await pool.query(
      `INSERT INTO invoice_items (invoice_id, description, sub_description, quantity, unit_price, discount_percent, subtotal) VALUES ?`,
      [values]
    );
  }

  // Get items for an invoice
  static async findItemsByInvoiceId(invoice_id) {
    const [rows] = await pool.query(
      `SELECT id, invoice_id, 
              description AS deskripsi, 
              sub_description AS sub_deskripsi, 
              quantity AS kuantitas, 
              unit_price AS harga_satuan, 
              discount_percent AS diskon_persen, 
              subtotal, created_at 
       FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC`,
      [invoice_id]
    );
    return rows;
  }

  // Soft delete invoice
  static async delete(id) {
    // Note: We soft delete invoice, keep invoice items
    await pool.query('UPDATE invoices SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL', [id]);
  }
}

export default InvoiceModel;
