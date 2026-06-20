import { pool } from '../config/db.js';

class TransactionModel {
  // Helper to construct select query with aliases for backward compatibility
  static get selectFields() {
    return `
      t.id,
      t.customer_id AS pelanggan_id,
      t.nama_manual,
      t.no_whatsapp_manual,
      t.source_type,
      t.external_transaction_id,
      t.api_client_id,
      t.service_name,
      t.description AS notes,
      t.amount AS nominal_transfer,
      t.quantity AS kuantitas,
      t.discount AS diskon,
      t.due_date AS tanggal_bayar,
      t.payment_status AS status_konfirmasi,
      t.document_status AS status_dokumen,
      t.transaction_type AS tipe_transaksi,
      t.include_signature AS sertakan_tanda_tangan,
      t.confirmed_by AS dikonfirmasi_oleh,
      t.notes AS internal_notes,
      t.raw_payload,
      t.items,
      t.callback_sent_at,
      t.created_at,
      t.updated_at
    `;
  }

  // Get all transactions joined with customer details
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT ${this.selectFields},
              c.name AS nama_pelanggan, 
              c.phone AS no_whatsapp, 
              c.hosting_package AS paket_hosting,
              c.customer_code AS id_pelanggan_code
       FROM transactions t
       LEFT JOIN customers c ON t.customer_id = c.id
       WHERE t.deleted_at IS NULL
       ORDER BY t.created_at DESC`
    );
    const transactionIds = rows.map(r => r.id);
    let allItems = [];
    if (transactionIds.length > 0) {
      const [itemsRows] = await pool.query(
        `SELECT * FROM transaction_items WHERE transaction_id IN (?)`,
        [transactionIds]
      );
      allItems = itemsRows;
    }

    // Post-process rows if necessary to map enum values
    return rows.map(r => {
      if (r.status_konfirmasi === 'pending') r.status_konfirmasi = 'pending';
      else if (r.status_konfirmasi === 'lunas') r.status_konfirmasi = 'lunas';
      // Adjust boolean back to numeric if required by controllers
      r.sertakan_tanda_tangan = r.sertakan_tanda_tangan ? 1 : 0;
      
      const items = allItems.filter(item => item.transaction_id === r.id);
      if (items.length > 0) {
        // Map database columns to frontend expected fields
        r.items = items.map(item => ({
          tanggal: item.tanggal,
          tipe: item.tipe,
          statusPembayaran: item.status_pembayaran,
          jumlah: item.jumlah,
          kuantitas: item.kuantitas,
          diskon: item.diskon,
          namaPembeli: item.nama_pembeli,
          noTelepon: item.no_telepon,
          notes: item.notes
        }));
      } else if (r.items && typeof r.items === 'string') {
        try { r.items = JSON.parse(r.items); } catch(e) {}
      }

      return r;
    });
  }

  // Find transaction by ID
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT ${this.selectFields} 
       FROM transactions t 
       WHERE t.id = ? AND t.deleted_at IS NULL`,
      [id]
    );
    if (!rows[0]) return null;
    const r = rows[0];
    r.sertakan_tanda_tangan = r.sertakan_tanda_tangan ? 1 : 0;

    const [itemsRows] = await pool.query(
      `SELECT * FROM transaction_items WHERE transaction_id = ?`,
      [id]
    );
    if (itemsRows.length > 0) {
      r.items = itemsRows.map(item => ({
        tanggal: item.tanggal,
        tipe: item.tipe,
        statusPembayaran: item.status_pembayaran,
        jumlah: item.jumlah,
        kuantitas: item.kuantitas,
        diskon: item.diskon,
        namaPembeli: item.nama_pembeli,
        noTelepon: item.no_telepon,
        notes: item.notes
      }));
    } else if (r.items && typeof r.items === 'string') {
      try { r.items = JSON.parse(r.items); } catch(e) {}
    }

    return r;
  }

  // Find transaction by External ID
  static async findByExternalId(externalId, apiClientId) {
    const [rows] = await pool.query(
      `SELECT ${this.selectFields} 
       FROM transactions t 
       WHERE t.external_transaction_id = ? AND t.api_client_id = ? AND t.deleted_at IS NULL`,
      [externalId, apiClientId]
    );
    if (!rows[0]) return null;
    const r = rows[0];
    r.sertakan_tanda_tangan = r.sertakan_tanda_tangan ? 1 : 0;

    const [itemsRows] = await pool.query(
      `SELECT * FROM transaction_items WHERE transaction_id = ?`,
      [r.id]
    );
    if (itemsRows.length > 0) {
      r.items = itemsRows.map(item => ({
        tanggal: item.tanggal,
        tipe: item.tipe,
        statusPembayaran: item.status_pembayaran,
        jumlah: item.jumlah,
        kuantitas: item.kuantitas,
        diskon: item.diskon,
        namaPembeli: item.nama_pembeli,
        noTelepon: item.no_telepon,
        notes: item.notes
      }));
    } else if (r.items && typeof r.items === 'string') {
      try { r.items = JSON.parse(r.items); } catch(e) {}
    }

    return r;
  }

  // Create a new transaction record
  static async create({ pelanggan_id, nama_manual, no_whatsapp_manual, nominal_transfer, kuantitas, diskon, items, tanggal_bayar, status_konfirmasi, status_dokumen, sertakan_tanda_tangan, tipe_transaksi, notes, dikonfirmasi_oleh, source_type, ext_transaction_id, api_client_id, service_name }) {
    const paymentStatus = status_konfirmasi === 'lunas' ? 'lunas' : 'pending';
    const documentStatus = status_dokumen ? status_dokumen.toLowerCase() : 'draft';
    const transactionType = tipe_transaksi ? tipe_transaksi.toLowerCase() : 'pemasukan';

    const [result] = await pool.query(
      `INSERT INTO transactions (
        customer_id, nama_manual, no_whatsapp_manual, amount, quantity, discount, 
        due_date, payment_status, document_status, include_signature, 
        transaction_type, description, confirmed_by, source_type, 
        external_transaction_id, api_client_id, service_name, items
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pelanggan_id || null,
        nama_manual || null,
        no_whatsapp_manual || null,
        nominal_transfer,
        kuantitas || 1,
        diskon || 0,
        tanggal_bayar,
        paymentStatus,
        documentStatus === 'draft' || documentStatus === 'diproses' || documentStatus === 'disetujui' ? documentStatus : 'draft',
        sertakan_tanda_tangan ? 1 : 0,
        transactionType === 'pemasukan' || transactionType === 'pengeluaran' ? transactionType : 'pemasukan',
        notes || '',
        dikonfirmasi_oleh || null,
        source_type || 'manual',
        ext_transaction_id || null,
        api_client_id || null,
        service_name || null,
        items ? (typeof items === 'string' ? items : JSON.stringify(items)) : null
      ]
    );
    
    const transactionId = result.insertId;

    // INSERT into transaction_items table
    if (items) {
      let parsedItems = items;
      if (typeof items === 'string') {
        try { parsedItems = JSON.parse(items); } catch(e) {}
      }
      
      if (Array.isArray(parsedItems) && parsedItems.length > 0) {
        const values = parsedItems.map(item => [
          transactionId,
          item.tanggal || null,
          item.tipe || null,
          item.statusPembayaran || item.status_pembayaran || null,
          Number(String(item.jumlah || 0).replace(/\D/g, '')) || 0,
          Number(item.kuantitas) || 1,
          Number(String(item.diskon || 0).replace(/\D/g, '')) || 0,
          item.namaPembeli || item.nama_pembeli || null,
          item.noTelepon || item.no_telepon || null,
          item.notes || null
        ]);

        await pool.query(
          `INSERT INTO transaction_items (transaction_id, tanggal, tipe, status_pembayaran, jumlah, kuantitas, diskon, nama_pembeli, no_telepon, notes) VALUES ?`,
          [values]
        );
      }
    }

    return transactionId;
  }

  // Approve a transaction
  static async approve(id, dikonfirmasi_oleh) {
    await pool.query(
      'UPDATE transactions SET payment_status = "lunas", confirmed_by = ? WHERE id = ?',
      [dikonfirmasi_oleh, id]
    );
  }

  // Soft Delete transaction record
  static async delete(id) {
    await pool.query('UPDATE transactions SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  }

  // Update transaction record
  static async update(id, { pelanggan_id, nama_manual, no_whatsapp_manual, nominal_transfer, kuantitas, diskon, items, tanggal_bayar, status_konfirmasi, status_dokumen, sertakan_tanda_tangan, tipe_transaksi, notes, dikonfirmasi_oleh, source_type, ext_transaction_id, api_client_id, service_name }) {
    const paymentStatus = status_konfirmasi === 'lunas' ? 'lunas' : 'pending';
    const documentStatus = status_dokumen ? status_dokumen.toLowerCase() : 'draft';
    const transactionType = tipe_transaksi ? tipe_transaksi.toLowerCase() : 'pemasukan';

    await pool.query(
      `UPDATE transactions 
       SET customer_id = ?, nama_manual = ?, no_whatsapp_manual = ?, amount = ?, quantity = ?, discount = ?, 
           due_date = ?, payment_status = ?, document_status = ?, include_signature = ?, 
           transaction_type = ?, description = ?, confirmed_by = ?, source_type = ?, 
           external_transaction_id = ?, api_client_id = ?, service_name = ?, items = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [
        pelanggan_id || null,
        nama_manual || null,
        no_whatsapp_manual || null,
        nominal_transfer,
        kuantitas || 1,
        diskon || 0,
        tanggal_bayar,
        paymentStatus,
        documentStatus === 'draft' || documentStatus === 'diproses' || documentStatus === 'disetujui' ? documentStatus : 'draft',
        sertakan_tanda_tangan ? 1 : 0,
        transactionType === 'pemasukan' || transactionType === 'pengeluaran' ? transactionType : 'pemasukan',
        notes || '',
        dikonfirmasi_oleh || null,
        source_type || 'manual',
        ext_transaction_id || null,
        api_client_id || null,
        service_name || null,
        items ? (typeof items === 'string' ? items : JSON.stringify(items)) : null,
        id
      ]
    );

    // UPDATE transaction_items table (delete old and insert new)
    await pool.query('DELETE FROM transaction_items WHERE transaction_id = ?', [id]);
    
    if (items) {
      let parsedItems = items;
      if (typeof items === 'string') {
        try { parsedItems = JSON.parse(items); } catch(e) {}
      }
      
      if (Array.isArray(parsedItems) && parsedItems.length > 0) {
        const values = parsedItems.map(item => [
          id,
          item.tanggal || null,
          item.tipe || null,
          item.statusPembayaran || item.status_pembayaran || null,
          Number(String(item.jumlah || 0).replace(/\D/g, '')) || 0,
          Number(item.kuantitas) || 1,
          Number(String(item.diskon || 0).replace(/\D/g, '')) || 0,
          item.namaPembeli || item.nama_pembeli || null,
          item.noTelepon || item.no_telepon || null,
          item.notes || null
        ]);

        await pool.query(
          `INSERT INTO transaction_items (transaction_id, tanggal, tipe, status_pembayaran, jumlah, kuantitas, diskon, nama_pembeli, no_telepon, notes) VALUES ?`,
          [values]
        );
      }
    }

  }
}

export default TransactionModel;
