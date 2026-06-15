import TransactionModel from '../models/transactionModel.js';
import CustomerModel from '../models/customerModel.js';
import ExtTransactionModel from '../models/extTransactionModel.js';
import { onTransactionVerified, onTransactionCancelled } from '../services/callbackService.js';

// Get all transactions
export const getAllTransactions = async (req, res) => {
  try {
    const rows = await TransactionModel.findAll();

    const mapped = rows.map(t => {
      // Safely parse date
      const d = new Date(t.tanggal_bayar);
      const dateString = isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];

      return {
        id: t.id,
        trxId: `TRX-${String(t.id).padStart(4, '0')}`,
        tanggal: dateString,
        userId: t.pelanggan_id || '',
        tipe: t.tipe_transaksi === 'Pengeluaran' ? 'Kredit' : 'Debit',
        statusPembayaran: t.status_konfirmasi === 'lunas' ? 'Lunas' : t.status_konfirmasi === 'dp' ? 'DP' : t.status_konfirmasi === 'belum_lunas' ? 'Belum Lunas' : 'Pending',
        statusDokumen: t.status_dokumen || 'Draft',
        sertakanTandaTangan: t.sertakan_tanda_tangan === 1,
        jumlah: t.nominal_transfer,
        kuantitas: t.kuantitas || 1,
        namaPembeli: t.nama_pelanggan || t.nama_manual || 'Input Manual',
        noTelepon: t.no_whatsapp || t.no_whatsapp_manual || '-',
        notes: t.notes || (t.paket_hosting ? `Paket: ${t.paket_hosting}` : '')
      };
    });

    return res.status(200).json({
      status: 'success',
      data: mapped
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data transaksi.'
    });
  }
};

// Create a transaction
export const createTransaction = async (req, res) => {
  try {
    const { 
      tanggal, 
      userId, // pelanggan_id (optional for manual input)
      jumlah, 
      kuantitas,
      statusPembayaran, 
      statusDokumen,
      sertakanTandaTangan,
      notes,
      namaPembeli,
      noTelepon,
      tipe
    } = req.body;

    if (!tanggal || !jumlah) {
      return res.status(400).json({
        status: 'error',
        message: 'Mohon lengkapi kolom tanggal dan nominal transaksi!'
      });
    }

    // If customer selected, check if valid
    let customer = null;
    if (userId && String(userId).trim() !== "") {
      customer = await CustomerModel.findById(userId);
      if (!customer) {
        return res.status(400).json({
          status: 'error',
          message: 'ID Pelanggan tidak valid atau tidak terdaftar di Master Data!'
        });
      }
    } else {
      // For manual input, require name
      if (!namaPembeli || String(namaPembeli).trim() === "") {
        return res.status(400).json({
          status: 'error',
          message: 'Mohon isi nama pembeli / keterangan untuk transaksi manual!'
        });
      }
    }

    let statusKonfirmasi = 'pending';
    if (statusPembayaran === 'Lunas') statusKonfirmasi = 'lunas';
    else if (statusPembayaran === 'DP') statusKonfirmasi = 'dp';
    else if (statusPembayaran === 'Belum Lunas') statusKonfirmasi = 'belum_lunas';

    const dikonfirmasiOleh = statusKonfirmasi === 'lunas' ? req.user.id : null;

    const insertId = await TransactionModel.create({
      pelanggan_id: (userId && String(userId).trim() !== "") ? userId : null,
      nama_manual: (userId && String(userId).trim() !== "") ? null : namaPembeli,
      no_whatsapp_manual: (userId && String(userId).trim() !== "") ? null : noTelepon,
      nominal_transfer: Number(String(jumlah).replace(/\D/g, "")),
      kuantitas: Number(kuantitas) || 1,
      tanggal_bayar: tanggal,
      status_konfirmasi: statusKonfirmasi,
      status_dokumen: statusDokumen || 'Draft',
      sertakan_tanda_tangan: sertakanTandaTangan ? 1 : 0,
      tipe_transaksi: (tipe === 'Kredit' || tipe === 'Pengeluaran') ? 'Pengeluaran' : 'Pemasukan',
      notes: notes || '',
      dikonfirmasi_oleh: dikonfirmasiOleh
    });

    // Log to Audit Trail
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const activityMsg = `Menerbitkan Invoice ${tipe || 'Pemasukan'} - Keterangan: ${namaPembeli || (customer ? customer.nama_pelanggan : 'Manual')} - Nominal: Rp ${Number(jumlah).toLocaleString('id-ID')}`;
    await TransactionModel.createAuditLog(req.user.id, activityMsg, ipAddress);

    return res.status(201).json({
      status: 'success',
      message: 'Transaksi berhasil disimpan!',
      data: {
        id: insertId,
        trxId: `TRX-${String(insertId).padStart(4, '0')}`,
        tanggal,
        userId: userId || '',
        tipe: (tipe === 'Kredit' || tipe === 'Pengeluaran') ? 'Kredit' : 'Debit',
        statusPembayaran,
        statusDokumen: statusDokumen || 'Draft',
        sertakanTandaTangan: !!sertakanTandaTangan,
        jumlah: Number(jumlah),
        kuantitas: Number(kuantitas) || 1,
        namaPembeli: namaPembeli || (customer ? customer.nama_pelanggan : 'Input Manual'),
        noTelepon: noTelepon || (customer ? customer.no_whatsapp : '-'),
        notes: notes || ''
      }
    });

  } catch (err) {
    console.error('Create transaction error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mencatat transaksi baru.'
    });
  }
};

// Update a transaction
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      tanggal, 
      userId, 
      jumlah, 
      kuantitas,
      statusPembayaran, 
      statusDokumen,
      sertakanTandaTangan,
      notes,
      namaPembeli,
      noTelepon,
      tipe
    } = req.body;

    const existing = await TransactionModel.findById(id);
    if (!existing) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaksi tidak ditemukan!'
      });
    }

    if (!tanggal || !jumlah) {
      return res.status(400).json({
        status: 'error',
        message: 'Mohon lengkapi kolom tanggal dan nominal transaksi!'
      });
    }

    let customer = null;
    if (userId && String(userId).trim() !== "") {
      customer = await CustomerModel.findById(userId);
      if (!customer) {
        return res.status(400).json({
          status: 'error',
          message: 'ID Pelanggan tidak valid atau tidak terdaftar di Master Data!'
        });
      }
    } else {
      if (!namaPembeli || String(namaPembeli).trim() === "") {
        return res.status(400).json({
          status: 'error',
          message: 'Mohon isi nama pembeli / keterangan untuk transaksi manual!'
        });
      }
    }

    let statusKonfirmasi = 'pending';
    if (statusPembayaran === 'Lunas') statusKonfirmasi = 'lunas';
    else if (statusPembayaran === 'DP') statusKonfirmasi = 'dp';
    else if (statusPembayaran === 'Belum Lunas') statusKonfirmasi = 'belum_lunas';

    const dikonfirmasiOleh = statusKonfirmasi === 'lunas' ? req.user.id : null;

    await TransactionModel.update(id, {
      pelanggan_id: (userId && String(userId).trim() !== "") ? userId : null,
      nama_manual: (userId && String(userId).trim() !== "") ? null : namaPembeli,
      no_whatsapp_manual: (userId && String(userId).trim() !== "") ? null : noTelepon,
      nominal_transfer: Number(String(jumlah).replace(/\D/g, "")),
      kuantitas: Number(kuantitas) || 1,
      tanggal_bayar: tanggal,
      status_konfirmasi: statusKonfirmasi,
      status_dokumen: statusDokumen || 'Draft',
      sertakan_tanda_tangan: sertakanTandaTangan ? 1 : 0,
      tipe_transaksi: (tipe === 'Kredit' || tipe === 'Pengeluaran') ? 'Pengeluaran' : 'Pemasukan',
      notes: notes || '',
      dikonfirmasi_oleh: dikonfirmasiOleh
    });

    // Log to Audit Trail
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const activityMsg = `Memperbarui Transaksi ID #${id} (${tipe || 'Pemasukan'}) - Keterangan: ${namaPembeli || (customer ? customer.nama_pelanggan : 'Manual')} - Nominal: Rp ${Number(jumlah).toLocaleString('id-ID')}`;
    await TransactionModel.createAuditLog(req.user.id, activityMsg, ipAddress);

    return res.status(200).json({
      status: 'success',
      message: 'Transaksi berhasil diperbarui!',
      data: {
        id,
        trxId: existing.trxId || `TRX-${String(id).padStart(4, '0')}`,
        tanggal,
        userId: userId || '',
        tipe: (tipe === 'Kredit' || tipe === 'Pengeluaran') ? 'Kredit' : 'Debit',
        statusPembayaran,
        statusDokumen: statusDokumen || 'Draft',
        sertakanTandaTangan: !!sertakanTandaTangan,
        jumlah: Number(jumlah),
        kuantitas: Number(kuantitas) || 1,
        namaPembeli: namaPembeli || (customer ? customer.nama_pelanggan : 'Input Manual'),
        noTelepon: noTelepon || (customer ? customer.no_whatsapp : '-'),
        notes: notes || ''
      }
    });

  } catch (err) {
    console.error('Update transaction error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui transaksi.'
    });
  }
};// Approve transaction
export const approveTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await TransactionModel.findById(id);
    if (!existing) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaksi tidak ditemukan!'
      });
    }

    await TransactionModel.approve(id, req.user.id);

    // Log to Audit Trail
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const identifier = existing.pelanggan_id ? `Pelanggan ${existing.pelanggan_id}` : `Transaksi Manual #${id}`;
    const activityMsg = `Menyetujui Pembayaran Masuk ID #${id} untuk ${identifier}`;
    await TransactionModel.createAuditLog(req.user.id, activityMsg, ipAddress);

    // Check if API transaction and trigger callback
    if (existing.source_type === 'api' && existing.ext_transaction_id) {
      try {
        await ExtTransactionModel.updateStatus(existing.ext_transaction_id, 'verified');
        await onTransactionVerified(existing.ext_transaction_id, req.user.nama_lengkap || req.user.email || 'Bendahara');
      } catch (cbErr) {
        console.error('Callback trigger error on approve:', cbErr.message);
      }
    }

    return res.status(200).json({
      status: 'success',
      message: 'Pembayaran telah disetujui! Status diperbarui ke LUNAS.'
    });

  } catch (err) {
    console.error('Approve transaction error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal menyetujui transaksi.'
    });
  }
};

// Delete transaction
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await TransactionModel.findById(id);
    if (!existing) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaksi tidak ditemukan!'
      });
    }

    // Check if API transaction and trigger callback
    if (existing.source_type === 'api' && existing.ext_transaction_id) {
      try {
        await ExtTransactionModel.updateStatus(existing.ext_transaction_id, 'cancelled');
        await onTransactionCancelled(existing.ext_transaction_id, 'Deleted from admin dashboard');
      } catch (cbErr) {
        console.error('Callback trigger error on delete:', cbErr.message);
      }
    }

    await TransactionModel.delete(id);

    // Log to Audit Trail
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const activityMsg = `Menghapus Transaksi Pembayaran Masuk ID #${id}`;
    await TransactionModel.createAuditLog(req.user.id, activityMsg, ipAddress);

    return res.status(200).json({
      status: 'success',
      message: 'Transaksi berhasil dihapus!'
    });

  } catch (err) {
    console.error('Delete transaction error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal menghapus transaksi.'
    });
  }
};

// Get audit logs for admin console
export const getAuditLogs = async (req, res) => {
  try {
    const rows = await TransactionModel.findAllAuditLogs();

    const mapped = rows.map(r => {
      // Parse ISO format to readable datetime string
      const d = new Date(r.created_at);
      const timeStr = d.toISOString().slice(0, 16).replace("T", " ");

      return {
        id: `log-${r.id}`,
        time: timeStr,
        user: r.user,
        action: r.aktivitas,
        ip: r.ip_address,
        severity: r.aktivitas.includes('Hapus') ? 'Danger' : r.aktivitas.includes('Menyetujui') ? 'Success' : 'Info'
      };
    });

    return res.status(200).json({
      status: 'success',
      data: mapped
    });
  } catch (err) {
    console.error('Get audit logs error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data log audit.'
    });
  }
};
