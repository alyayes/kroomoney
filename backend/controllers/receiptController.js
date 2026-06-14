import ReceiptModel from '../models/receiptModel.js';
import InvoiceModel from '../models/invoiceModel.js';
import { pool } from '../config/db.js';

function mapReceipt(r) {
  return {
    id: r.id,
    nomorKwitansi: r.nomor_kwitansi,
    invoiceId: r.invoice_id,
    nomorInvoice: r.nomor_invoice || null,
    pelangganId: r.pelanggan_id,
    namaPelanggan: r.nama_pelanggan || r.nama_manual || 'Manual',
    noWhatsapp: r.no_whatsapp || '-',
    tanggalTerbit: r.tanggal_terbit,
    nominalDiterima: r.nominal_diterima,
    metodePembayaran: r.metode_pembayaran,
    diterimaOleh: r.diterima_oleh,
    keterangan: r.keterangan,
    tanggalKirimWa: r.tanggal_kirim_wa,
    tanggalKirimEmail: r.tanggal_kirim_email,
    statusKirim: r.status_kirim,
    createdAt: r.created_at,
  };
}

// GET /api/receipts — Semua kwitansi
export const getAllReceipts = async (req, res) => {
  try {
    const rows = await ReceiptModel.findAll();
    return res.status(200).json({
      status: 'success',
      data: rows.map(mapReceipt),
      total: rows.length
    });
  } catch (err) {
    console.error('getAllReceipts error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil data kwitansi.' });
  }
};

// GET /api/receipts/:id — Detail kwitansi
export const getReceiptById = async (req, res) => {
  try {
    const r = await ReceiptModel.findById(req.params.id);
    if (!r) return res.status(404).json({ status: 'error', message: 'Kwitansi tidak ditemukan.' });
    return res.status(200).json({ status: 'success', data: mapReceipt(r) });
  } catch (err) {
    console.error('getReceiptById error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil kwitansi.' });
  }
};

// POST /api/receipts/generate/:invoiceId — Generate kwitansi dari invoice (manual)
export const generateReceipt = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const inv = await InvoiceModel.findById(invoiceId);
    if (!inv) return res.status(404).json({ status: 'error', message: 'Invoice tidak ditemukan.' });

    // Kwitansi hanya untuk invoice yang sudah dibayar
    if (inv.status_invoice !== 'dibayar') {
      return res.status(400).json({
        status: 'error',
        message: 'Kwitansi hanya dapat dibuat untuk invoice yang sudah berstatus "dibayar".'
      });
    }

    // Cek duplikat
    const existing = await ReceiptModel.findByInvoiceId(invoiceId);
    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: `Kwitansi sudah ada untuk invoice ini: ${existing.nomor_kwitansi}`
      });
    }

    const { metodePembayaran, diterimaOleh, keterangan } = req.body;

    const [userRow] = await pool.query('SELECT nama_lengkap FROM users WHERE id = ?', [req.user.id]);
    const { insertId, nomor_kwitansi } = await ReceiptModel.create({
      invoice_id: parseInt(invoiceId),
      pelanggan_id: inv.pelanggan_id || null,
      nama_manual: inv.nama_manual || null,
      tanggal_terbit: new Date().toISOString().split('T')[0],
      nominal_diterima: inv.total,
      metode_pembayaran: metodePembayaran || 'Transfer Bank',
      diterima_oleh: diterimaOleh || userRow[0]?.nama_lengkap || 'Bendahara',
      keterangan: keterangan || null,
      created_by: req.user.id,
    });

    await logAudit(req, `Generate Kwitansi ${nomor_kwitansi} dari Invoice ${inv.nomor_invoice}`);

    return res.status(201).json({
      status: 'success',
      message: `Kwitansi ${nomor_kwitansi} berhasil dibuat!`,
      data: { id: insertId, nomor_kwitansi }
    });
  } catch (err) {
    console.error('generateReceipt error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal membuat kwitansi.' });
  }
};

// PATCH /api/receipts/:id/send-wa — Tandai terkirim via WhatsApp
export const markReceiptSentWa = async (req, res) => {
  try {
    const r = await ReceiptModel.findById(req.params.id);
    if (!r) return res.status(404).json({ status: 'error', message: 'Kwitansi tidak ditemukan.' });
    await ReceiptModel.markSentWa(req.params.id);
    await logAudit(req, `Kwitansi ${r.nomor_kwitansi} ditandai terkirim via WhatsApp`);
    return res.status(200).json({ status: 'success', message: 'Kwitansi ditandai terkirim via WhatsApp.' });
  } catch (err) {
    console.error('markReceiptSentWa error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal update status kwitansi.' });
  }
};

// PATCH /api/receipts/:id/send-email — Tandai terkirim via Email
export const markReceiptSentEmail = async (req, res) => {
  try {
    const r = await ReceiptModel.findById(req.params.id);
    if (!r) return res.status(404).json({ status: 'error', message: 'Kwitansi tidak ditemukan.' });
    await ReceiptModel.markSentEmail(req.params.id);
    await logAudit(req, `Kwitansi ${r.nomor_kwitansi} ditandai terkirim via Email`);
    return res.status(200).json({ status: 'success', message: 'Kwitansi ditandai terkirim via Email.' });
  } catch (err) {
    console.error('markReceiptSentEmail error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal update status kwitansi.' });
  }
};

// DELETE /api/receipts/:id — Hapus kwitansi
export const deleteReceipt = async (req, res) => {
  try {
    const r = await ReceiptModel.findById(req.params.id);
    if (!r) return res.status(404).json({ status: 'error', message: 'Kwitansi tidak ditemukan.' });
    await ReceiptModel.delete(req.params.id);
    await logAudit(req, `Hapus Kwitansi ${r.nomor_kwitansi}`);
    return res.status(200).json({ status: 'success', message: 'Kwitansi berhasil dihapus.' });
  } catch (err) {
    console.error('deleteReceipt error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal menghapus kwitansi.' });
  }
};

async function logAudit(req, aktivitas) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await pool.query('INSERT INTO user_audit_trails (user_id, aktivitas, ip_address) VALUES (?, ?, ?)',
      [req.user.id, aktivitas, ip]);
  } catch {}
}
