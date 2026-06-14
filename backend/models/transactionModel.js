import { pool } from '../config/db.js';

class TransactionModel {
  // Get all transactions joined with customer details
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT t.id, t.pelanggan_id, t.nama_manual, t.no_whatsapp_manual, t.nominal_transfer, t.kuantitas, t.tanggal_bayar, t.status_konfirmasi, t.status_dokumen, t.sertakan_tanda_tangan, t.tipe_transaksi, t.dikonfirmasi_oleh, t.notes, t.created_at,
              c.nama_pelanggan, c.no_whatsapp, c.paket_hosting
       FROM pembayaran_masuk t
       LEFT JOIN master_customers c ON t.pelanggan_id = c.id_pelanggan
       ORDER BY t.created_at DESC`
    );
    return rows;
  }

  // Find transaction by ID
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM pembayaran_masuk WHERE id = ?', [id]);
    return rows[0] || null;
  }

  // Create a new transaction record
  static async create({ pelanggan_id, nama_manual, no_whatsapp_manual, nominal_transfer, kuantitas, tanggal_bayar, status_konfirmasi, status_dokumen, sertakan_tanda_tangan, tipe_transaksi, notes, dikonfirmasi_oleh }) {
    const [result] = await pool.query(
      `INSERT INTO pembayaran_masuk (pelanggan_id, nama_manual, no_whatsapp_manual, nominal_transfer, kuantitas, tanggal_bayar, status_konfirmasi, status_dokumen, sertakan_tanda_tangan, tipe_transaksi, notes, dikonfirmasi_oleh)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pelanggan_id || null, nama_manual || null, no_whatsapp_manual || null, nominal_transfer, kuantitas || 1, tanggal_bayar, status_konfirmasi, status_dokumen || 'Draft', sertakan_tanda_tangan ? 1 : 0, tipe_transaksi || 'Pemasukan', notes || '', dikonfirmasi_oleh]
    );
    return result.insertId;
  }

  // Approve a transaction (set status_konfirmasi = 'lunas')
  static async approve(id, dikonfirmasi_oleh) {
    await pool.query(
      'UPDATE pembayaran_masuk SET status_konfirmasi = "lunas", dikonfirmasi_oleh = ? WHERE id = ?',
      [dikonfirmasi_oleh, id]
    );
  }

  // Delete transaction record
  static async delete(id) {
    await pool.query('DELETE FROM pembayaran_masuk WHERE id = ?', [id]);
  }

  // Update transaction record
  static async update(id, { pelanggan_id, nama_manual, no_whatsapp_manual, nominal_transfer, kuantitas, tanggal_bayar, status_konfirmasi, status_dokumen, sertakan_tanda_tangan, tipe_transaksi, notes, dikonfirmasi_oleh }) {
    await pool.query(
      `UPDATE pembayaran_masuk 
       SET pelanggan_id = ?, nama_manual = ?, no_whatsapp_manual = ?, nominal_transfer = ?, kuantitas = ?, tanggal_bayar = ?, status_konfirmasi = ?, status_dokumen = ?, sertakan_tanda_tangan = ?, tipe_transaksi = ?, notes = ?, dikonfirmasi_oleh = ?
       WHERE id = ?`,
      [
        pelanggan_id || null,
        nama_manual || null,
        no_whatsapp_manual || null,
        nominal_transfer,
        kuantitas || 1,
        tanggal_bayar,
        status_konfirmasi,
        status_dokumen || 'Draft',
        sertakan_tanda_tangan ? 1 : 0,
        tipe_transaksi,
        notes || '',
        dikonfirmasi_oleh || null,
        id
      ]
    );
  }

  // Write audit trail log
  static async createAuditLog(user_id, aktivitas, ip_address) {
    await pool.query(
      'INSERT INTO user_audit_trails (user_id, aktivitas, ip_address) VALUES (?, ?, ?)',
      [user_id, aktivitas, ip_address]
    );
  }

  // Get audit logs joined with user details
  static async findAllAuditLogs() {
    const [rows] = await pool.query(
      `SELECT a.id, a.aktivitas, a.ip_address, a.created_at, u.nama_lengkap AS user 
       FROM user_audit_trails a 
       JOIN users u ON a.user_id = u.id 
       ORDER BY a.created_at DESC`
    );
    return rows;
  }
}

export default TransactionModel;
