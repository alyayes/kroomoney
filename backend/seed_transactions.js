import { pool } from './config/db.js';

async function run() {
  try {
    console.log('🔄 Checking existing transactions...');
    const [existing] = await pool.query('SELECT * FROM transactions');
    if (existing.length === 0) {
      console.log('🚀 Seeding demo transactions (Income & Expense)...');
      
      // 1. Insert Income
      const [incomeResult] = await pool.query(
        `INSERT INTO transactions (
          nama_manual, amount, quantity, discount, due_date, 
          payment_status, document_status, transaction_type, 
          include_signature, confirmed_by, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'Pembayaran Hosting Pro',
          10000000, // Rp 10.000.000
          1,
          0,
          '2026-06-23',
          'lunas',
          'disetujui',
          'pemasukan',
          1,
          2, // Confirmed by Bendahara
          'Pembayaran paket cloud hosting pro 12 bulan'
        ]
      );
      const incomeId = incomeResult.insertId;

      await pool.query(
        `INSERT INTO transaction_items (
          transaction_id, tanggal, tipe, status_pembayaran, 
          jumlah, kuantitas, diskon, nama_pembeli, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          incomeId,
          '2026-06-23',
          'Debit',
          'Lunas',
          10000000,
          1,
          0,
          'Pembayaran Hosting Pro',
          'Pembayaran paket cloud hosting pro 12 bulan'
        ]
      );

      // 2. Insert Expense
      const [expenseResult] = await pool.query(
        `INSERT INTO transactions (
          nama_manual, amount, quantity, discount, due_date, 
          payment_status, document_status, transaction_type, 
          include_signature, confirmed_by, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'Sewa Server AWS Cloud',
          15000000, // Rp 15.000.000
          1,
          0,
          '2026-06-24',
          'lunas',
          'disetujui',
          'pengeluaran',
          1,
          2, // Confirmed by Bendahara
          'Biaya berlangganan infrastruktur cloud AWS EC2 & RDS'
        ]
      );
      const expenseId = expenseResult.insertId;

      await pool.query(
        `INSERT INTO transaction_items (
          transaction_id, tanggal, tipe, status_pembayaran, 
          jumlah, kuantitas, diskon, nama_pembeli, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          expenseId,
          '2026-06-24',
          'Kredit',
          'Lunas',
          15000000,
          1,
          0,
          'Sewa Server AWS Cloud',
          'Biaya berlangganan infrastruktur cloud AWS EC2 & RDS'
        ]
      );

      console.log('✅ Demo transactions seeded successfully.');
    } else {
      console.log('ℹ️ Transactions already exist in database.');
    }
  } catch (err) {
    console.error('Error seeding transactions:', err);
  } finally {
    await pool.end();
  }
}

run();
