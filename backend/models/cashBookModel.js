import { pool } from '../config/db.js';

class CashBookModel {
  // Get all cash book entries
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT cb.*,
              u.nama_lengkap AS pembuat_nama,
              t.id AS ref_transaction_id,
              i.invoice_number AS ref_invoice_number,
              r.receipt_number AS ref_receipt_number
       FROM cash_books cb
       LEFT JOIN users u ON cb.created_by = u.id
       LEFT JOIN transactions t ON cb.transaction_id = t.id
       LEFT JOIN invoices i ON cb.invoice_id = i.id
       LEFT JOIN receipts r ON cb.receipt_id = r.id
       ORDER BY cb.entry_date DESC, cb.created_at DESC`
    );
    return rows;
  }

  // Create cash book entry
  static async create({ type, transaction_id = null, invoice_id = null, receipt_id = null, amount, category, description, entry_date, created_by = null }) {
    const [result] = await pool.query(
      `INSERT INTO cash_books (type, transaction_id, invoice_id, receipt_id, amount, category, description, entry_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        type, // 'income' | 'expense'
        transaction_id,
        invoice_id,
        receipt_id,
        amount,
        category || null,
        description || null,
        entry_date || new Date(),
        created_by
      ]
    );
    return result.insertId;
  }

  // Get summary (total income, total expense, balance)
  static async getSummary() {
    const [rows] = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
       FROM cash_books`
    );
    const summary = rows[0] || { total_income: 0, total_expense: 0 };
    summary.balance = Number(summary.total_income) - Number(summary.total_expense);
    return {
      total_income: Number(summary.total_income),
      total_expense: Number(summary.total_expense),
      balance: Number(summary.balance)
    };
  }

  // Delete entry by transaction_id
  static async deleteByTransactionId(transaction_id) {
    await pool.query('DELETE FROM cash_books WHERE transaction_id = ?', [transaction_id]);
  }

  // Delete entry by invoice_id
  static async deleteByInvoiceId(invoice_id) {
    await pool.query('DELETE FROM cash_books WHERE invoice_id = ?', [invoice_id]);
  }

  // Delete entry by receipt_id
  static async deleteByReceiptId(receipt_id) {
    await pool.query('DELETE FROM cash_books WHERE receipt_id = ?', [receipt_id]);
  }
}

export default CashBookModel;
