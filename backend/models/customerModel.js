import { pool } from '../config/db.js';

class CustomerModel {
  // Get all customers
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM master_customers ORDER BY created_at DESC');
    return rows;
  }

  // Find customer by ID
  static async findById(id_pelanggan) {
    const [rows] = await pool.query('SELECT * FROM master_customers WHERE id_pelanggan = ?', [id_pelanggan]);
    return rows[0] || null;
  }

  // Create a new customer record
  static async create({ id_pelanggan, nama_pelanggan, no_whatsapp, email, paket_hosting, nominal_tagihan, tanggal_jatuh_tempo }) {
    await pool.query(
      'INSERT INTO master_customers (id_pelanggan, nama_pelanggan, no_whatsapp, email, paket_hosting, nominal_tagihan, tanggal_jatuh_tempo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_pelanggan, nama_pelanggan, no_whatsapp, email || null, paket_hosting, Number(nominal_tagihan), tanggal_jatuh_tempo]
    );
  }

  // Update customer record
  static async update(id_pelanggan, { nama_pelanggan, no_whatsapp, email, paket_hosting, nominal_tagihan, tanggal_jatuh_tempo }) {
    await pool.query(
      'UPDATE master_customers SET nama_pelanggan = ?, no_whatsapp = ?, email = ?, paket_hosting = ?, nominal_tagihan = ?, tanggal_jatuh_tempo = ? WHERE id_pelanggan = ?',
      [nama_pelanggan, no_whatsapp, email !== undefined ? email : null, paket_hosting, Number(nominal_tagihan), tanggal_jatuh_tempo, id_pelanggan]
    );
  }

  // Delete customer record
  static async delete(id_pelanggan) {
    await pool.query('DELETE FROM master_customers WHERE id_pelanggan = ?', [id_pelanggan]);
  }
}

export default CustomerModel;
