import InvoiceModel from '../models/invoiceModel.js';
import TransactionModel from '../models/transactionModel.js';
import ReceiptModel from '../models/receiptModel.js';
import { pool } from '../config/db.js';

// Helper untuk format response invoice
function mapInvoice(i) {
  return {
    id: i.id,
    nomorInvoice: i.nomor_invoice,
    transaksiId: i.transaksi_id,
    pelangganId: i.pelanggan_id,
    namaPelanggan: i.nama_pelanggan || i.nama_manual || 'Manual',
    noWhatsapp: i.no_whatsapp || i.no_wa_manual || '-',
    paketHosting: i.paket_hosting || '-',
    subtotal: i.subtotal,
    diskon: i.diskon,
    total: i.total,
    statusInvoice: i.status_invoice,
    tanggalTerbit: i.tanggal_terbit,
    tanggalJatuhTempo: i.tanggal_jatuh_tempo,
    tanggalKirimWa: i.tanggal_kirim_wa,
    tanggalKirimEmail: i.tanggal_kirim_email,
    tanggalBayar: i.tanggal_bayar,
    catatan: i.catatan,
    catatanInternal: i.catatan_internal,
    dibuatOleh: i.dibuat_oleh_nama || null,
    createdAt: i.created_at,
    updatedAt: i.updated_at,
  };
}

// GET /api/invoices — Semua invoice
export const getAllInvoices = async (req, res) => {
  try {
    const rows = await InvoiceModel.findAll();
    return res.status(200).json({
      status: 'success',
      data: rows.map(mapInvoice),
      total: rows.length
    });
  } catch (err) {
    console.error('getAllInvoices error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil data invoice.' });
  }
};

// GET /api/invoices/:id — Detail satu invoice
export const getInvoiceById = async (req, res) => {
  try {
    const inv = await InvoiceModel.findById(req.params.id);
    if (!inv) return res.status(404).json({ status: 'error', message: 'Invoice tidak ditemukan.' });
    return res.status(200).json({ status: 'success', data: mapInvoice(inv) });
  } catch (err) {
    console.error('getInvoiceById error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil invoice.' });
  }
};

// POST /api/invoices/generate/:transaksiId — Generate invoice dari transaksi
export const generateInvoice = async (req, res) => {
  try {
    const { transaksiId } = req.params;

    // Cek transaksi ada
    const trx = await TransactionModel.findById(transaksiId);
    if (!trx) return res.status(404).json({ status: 'error', message: 'Transaksi tidak ditemukan.' });

    // Cek invoice belum ada untuk transaksi ini
    const existing = await InvoiceModel.findByTransaksiId(transaksiId);
    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: `Invoice sudah ada untuk transaksi ini: ${existing.nomor_invoice}`
      });
    }

    const {
      tanggalJatuhTempo,
      diskon = 0,
      catatan,
      catatanInternal
    } = req.body;

    if (!tanggalJatuhTempo) {
      return res.status(400).json({ status: 'error', message: 'Tanggal jatuh tempo wajib diisi.' });
    }

    const subtotal = trx.nominal_transfer * (trx.kuantitas || 1);
    const total = Math.max(0, subtotal - (diskon || 0));
    const today = new Date().toISOString().split('T')[0];

    const { insertId, nomor_invoice } = await InvoiceModel.create({
      transaksi_id: transaksiId,
      pelanggan_id: trx.pelanggan_id || null,
      nama_manual: trx.nama_manual || null,
      no_wa_manual: trx.no_whatsapp_manual || null,
      subtotal,
      diskon: diskon || 0,
      total,
      tanggal_terbit: today,
      tanggal_jatuh_tempo: tanggalJatuhTempo,
      catatan: catatan || null,
      catatan_internal: catatanInternal || null,
      created_by: req.user.id,
    });

    // Audit log
    await logAudit(req, `Menerbitkan Invoice ${nomor_invoice} untuk Transaksi #${transaksiId}`);

    return res.status(201).json({
      status: 'success',
      message: `Invoice ${nomor_invoice} berhasil diterbitkan!`,
      data: { id: insertId, nomor_invoice, total, tanggal_jatuh_tempo: tanggalJatuhTempo }
    });
  } catch (err) {
    console.error('generateInvoice error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal menerbitkan invoice.' });
  }
};

// PATCH /api/invoices/:id/status — Update status invoice
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const valid = ['draft', 'terkirim', 'dibayar', 'overdue', 'dibatalkan'];
    if (!valid.includes(status)) {
      return res.status(400).json({ status: 'error', message: `Status tidak valid. Pilih: ${valid.join(', ')}` });
    }

    const inv = await InvoiceModel.findById(id);
    if (!inv) return res.status(404).json({ status: 'error', message: 'Invoice tidak ditemukan.' });

    await InvoiceModel.update(id, {
      status_invoice: status,
      ...(status === 'dibayar' ? { tanggal_bayar: new Date() } : {}),
    });

    // Jika dibayar → auto-generate kwitansi
    if (status === 'dibayar') {
      const existingReceipt = await ReceiptModel.findByInvoiceId(id);
      if (!existingReceipt) {
        const [userRow] = await pool.query('SELECT nama_lengkap FROM users WHERE id = ?', [req.user.id]);
        const { nomor_kwitansi } = await ReceiptModel.create({
          invoice_id: parseInt(id),
          pelanggan_id: inv.pelanggan_id || null,
          nama_manual: inv.nama_manual || null,
          tanggal_terbit: new Date().toISOString().split('T')[0],
          nominal_diterima: inv.total,
          metode_pembayaran: 'Transfer Bank',
          diterima_oleh: userRow[0]?.nama_lengkap || 'Bendahara',
          created_by: req.user.id,
        });
        await logAudit(req, `Kwitansi ${nomor_kwitansi} auto-generated dari Invoice ${inv.nomor_invoice}`);
      }
    }

    await logAudit(req, `Update status Invoice ${inv.nomor_invoice} → ${status}`);

    return res.status(200).json({
      status: 'success',
      message: `Status invoice berhasil diubah ke "${status}".`
    });
  } catch (err) {
    console.error('updateInvoiceStatus error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal mengubah status invoice.' });
  }
};

// PUT /api/invoices/:id — Update detail invoice
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const inv = await InvoiceModel.findById(id);
    if (!inv) return res.status(404).json({ status: 'error', message: 'Invoice tidak ditemukan.' });
    if (inv.status_invoice === 'dibayar') {
      return res.status(400).json({ status: 'error', message: 'Invoice yang sudah dibayar tidak dapat diedit.' });
    }

    const { diskon, catatan, catatanInternal, tanggalJatuhTempo } = req.body;
    await InvoiceModel.update(id, {
      ...(diskon !== undefined ? { diskon, total: Math.max(0, inv.subtotal - diskon) } : {}),
      ...(catatan !== undefined ? { catatan } : {}),
      ...(catatanInternal !== undefined ? { catatan_internal: catatanInternal } : {}),
      ...(tanggalJatuhTempo ? { tanggal_jatuh_tempo: tanggalJatuhTempo } : {}),
    });

    await logAudit(req, `Edit Invoice ${inv.nomor_invoice}`);
    return res.status(200).json({ status: 'success', message: 'Invoice berhasil diperbarui.' });
  } catch (err) {
    console.error('updateInvoice error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal memperbarui invoice.' });
  }
};

// DELETE /api/invoices/:id — Hapus invoice (hanya jika draft)
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const inv = await InvoiceModel.findById(id);
    if (!inv) return res.status(404).json({ status: 'error', message: 'Invoice tidak ditemukan.' });
    if (inv.status_invoice !== 'draft') {
      return res.status(400).json({ status: 'error', message: 'Hanya invoice berstatus Draft yang dapat dihapus.' });
    }

    await InvoiceModel.delete(id);
    await logAudit(req, `Hapus Invoice ${inv.nomor_invoice}`);
    return res.status(200).json({ status: 'success', message: 'Invoice berhasil dihapus.' });
  } catch (err) {
    console.error('deleteInvoice error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal menghapus invoice.' });
  }
};

// Helper audit log
async function logAudit(req, aktivitas) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await pool.query('INSERT INTO user_audit_trails (user_id, aktivitas, ip_address) VALUES (?, ?, ?)',
      [req.user.id, aktivitas, ip]);
  } catch {}
}
